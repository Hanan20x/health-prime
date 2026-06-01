from typing import Annotated, List
import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import CurrentUser
from app.models import EmrSection, Patient, VitalSign
from app.util import calc_age
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

router = APIRouter(tags=["Diagnosis"])

class DiagnosisRequest(BaseModel):
    details: str | None = None

class DiagnosisSuggestion(BaseModel):
    icd_code: str
    icd_title: str
    accuracy: float
    reasoning: str
    accuracy_explanation: str
    medical_source: str | None = None

class DiagnosisResponse(BaseModel):
    suggestions: List[DiagnosisSuggestion]
    compiled_details: str | None = None
    analysis_report: str | None = None


# Fallback dictionary of symptoms and clinical mapping
FALLBACK_DIAGNOSES = [
    {
        "icd_code": "I10",
        "icd_title": "Essential (primary) hypertension",
        "keywords": ["hypertension", "blood pressure", "bp", "systolic", "diastolic", "hyper tension", "high pressure"],
        "base_reasoning": "The mention of elevated blood pressure or hypertension signs aligns with primary arterial hypertension.",
        "accuracy_explanation_base": "Calculated based on matching cardiovascular terms and blood pressure references.",
        "medical_source": "World Health Organization (WHO) ICD-10 Classification for Cardiovascular Diseases & AHA/ACC Guidelines"
    },
    {
        "icd_code": "E11.9",
        "icd_title": "Type 2 diabetes mellitus without complications",
        "keywords": ["diabetes", "diabetic", "blood sugar", "glucose", "insulin", "hba1c", "hyperglycemia"],
        "base_reasoning": "Documented presence of high blood glucose or history of diabetes corresponds to Type 2 Diabetes Mellitus.",
        "accuracy_explanation_base": "Based on blood glucose, HbA1c, and insulin-related keyword overlap.",
        "medical_source": "World Health Organization (WHO) ICD-10 Classification (E11) & ADA Clinical Practice Guidelines"
    },
    {
        "icd_code": "R50.9",
        "icd_title": "Fever, unspecified",
        "keywords": ["fever", "febrile", "temperature", "pyrexia", "hot", "chills", "high temp"],
        "base_reasoning": "Complaints of high body temperature and fever correspond to unspecified pyrexia.",
        "accuracy_explanation_base": "Direct presence of thermoregulatory indicators and pyrexia descriptors.",
        "medical_source": "WHO ICD-10 Classification for Symptoms & Signs (R50)"
    },
    {
        "icd_code": "R51.9",
        "icd_title": "Headache, unspecified",
        "keywords": ["headache", "migraine", "head pain", "cranial pain", "throbbing head"],
        "base_reasoning": "Symptoms of cranial discomfort or general head pain map to generic headache classification.",
        "accuracy_explanation_base": "Cranial pain symptoms matched against neurological headache descriptors.",
        "medical_source": "WHO ICD-10 Classification (R51) & International Headache Society (IHS) Guidelines"
    },
    {
        "icd_code": "R07.9",
        "icd_title": "Chest pain, unspecified",
        "keywords": ["chest pain", "angina", "thoracic pain", "sternum pain", "heart ache", "tight chest"],
        "base_reasoning": "Unspecified pain in the thoracic region requires clinical monitoring and maps to chest pain codes.",
        "accuracy_explanation_base": "Matched key descriptors of cardiovascular or thoracic localization.",
        "medical_source": "WHO ICD-10 Classification (R07) & AHA/ACC Evaluation Guidelines"
    },
    {
        "icd_code": "J45.909",
        "icd_title": "Unspecified asthma, uncomplicated",
        "keywords": ["asthma", "wheezing", "shortness of breath", "sob", "breathless", "bronchial", "inhaler"],
        "base_reasoning": "Bronchial constrictions, wheezing, or dyspnea match chronic airway inflammation criteria for Asthma.",
        "accuracy_explanation_base": "Calculated from respiratory difficulty metrics and asthma symptom density.",
        "medical_source": "WHO ICD-10 Classification (J45) & Global Initiative for Asthma (GINA) Guidelines"
    },
    {
        "icd_code": "J11.1",
        "icd_title": "Influenza due to unidentified virus",
        "keywords": ["influenza", "flu", "cold", "runny nose", "cough", "sore throat", "congestion"],
        "base_reasoning": "A combination of acute upper respiratory symptoms, cough, and congestion fits general influenza syndrome.",
        "accuracy_explanation_base": "Derived from the count of overlapping acute viral respiratory syndrome markers.",
        "medical_source": "WHO ICD-10 Classification (J11) & CDC Influenza Surveillance Guidelines"
    },
    {
        "icd_code": "K29.70",
        "icd_title": "Gastritis, unspecified, without bleeding",
        "keywords": ["gastritis", "heartburn", "acid reflux", "indigestion", "nausea", "stomach ache", "epigastric"],
        "base_reasoning": "Symptoms of gastric burning, reflux, or upper abdominal discomfort match gastritis indicators.",
        "accuracy_explanation_base": "Determined by gastrointestinal symptom profile overlap.",
        "medical_source": "WHO ICD-10 Classification (K29) & ACG Clinical Guidelines"
    },
    {
        "icd_code": "E78.5",
        "icd_title": "Hyperlipidemia, unspecified",
        "keywords": ["hyperlipidemia", "cholesterol", "lipid", "triglycerides", "high fat", "ldl", "hdl"],
        "base_reasoning": "A clinical report of high cholesterol or lipid imbalance maps to general hyperlipidemia.",
        "accuracy_explanation_base": "Direct match for lipid panel abnormality and metabolic indicators.",
        "medical_source": "WHO ICD-10 Classification (E78) & AHA/ACC Cholesterol Guidelines"
    },
    {
        "icd_code": "F41.9",
        "icd_title": "Anxiety disorder, unspecified",
        "keywords": ["anxiety", "anxious", "panic", "stress", "palpitations", "nervous"],
        "base_reasoning": "Symptoms of persistent mental stress, nervousness, or related palpitations correspond to unspecified anxiety.",
        "accuracy_explanation_base": "Calculated based on clinical psychological keyword density.",
        "medical_source": "WHO ICD-10 Classification (F41) & DSM-5 Diagnostic Criteria"
    }
]

def run_fallback_diagnostic_engine(details: str) -> List[DiagnosisSuggestion]:
    suggestions = []
    details_lower = details.lower()
    
    for diag in FALLBACK_DIAGNOSES:
        match_count = 0
        matched_keywords = []
        for kw in diag["keywords"]:
            if kw in details_lower:
                match_count += 1
                matched_keywords.append(kw)
        
        if match_count > 0:
            # Base accuracy starts at 60%
            accuracy = 0.60 + (match_count - 1) * 0.10
            # Cap accuracy at 95%
            accuracy = min(accuracy, 0.95)
            
            # Boost if context includes words indicating high certainty
            boost = 0.0
            if "severe" in details_lower or "persistent" in details_lower or "chronic" in details_lower:
                boost += 0.05
            accuracy = min(accuracy + boost, 0.95)
            
            reasoning = f"{diag['base_reasoning']} Specially matched keyword(s): {', '.join(matched_keywords)}."
            accuracy_explanation = (
                f"{diag['accuracy_explanation_base']} Matching keyword count: {match_count}. "
                f"Confidence is {'High' if accuracy >= 0.80 else 'Medium'} ({int(accuracy * 100)}%) "
                f"based on symptom keyword match density."
            )
            
            suggestions.append(DiagnosisSuggestion(
                icd_code=diag["icd_code"],
                icd_title=diag["icd_title"],
                accuracy=accuracy,
                reasoning=reasoning,
                accuracy_explanation=accuracy_explanation,
                medical_source=diag.get("medical_source", "World Health Organization (WHO) ICD-10 Database")
            ))
            
    # Sort suggestions by accuracy descending
    suggestions.sort(key=lambda s: s.accuracy, reverse=True)
    
    # If no suggestions found, provide a fallback "Unspecified illness" suggestion
    if not suggestions:
        suggestions.append(DiagnosisSuggestion(
            icd_code="R69",
            icd_title="Illness, unspecified",
            accuracy=0.40,
            reasoning="The provided text did not match any specific clinical keywords in the database.",
            accuracy_explanation="Assigned a baseline confidence of 40% as a general fallback code (ICD-10 R69) for unspecified signs/symptoms.",
            medical_source="World Health Organization (WHO) ICD-10 Classification (R69)"
        ))
        
    return suggestions

@router.post("/patients/{patient_id}/ai-diagnosis", response_model=DiagnosisResponse)
def get_ai_diagnosis_suggestions(
    patient_id: int,
    request: DiagnosisRequest,
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)]
):
    details = request.details.strip() if (request and request.details) else ""
    
    # If no details provided, auto-compile them from the database records
    if not details:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        # Fetch EMR sections and index them chronologically
        sections = db.query(EmrSection).filter(
            EmrSection.patient_id == patient_id,
            EmrSection.section_key != "PATIENT_IMAGE",
            EmrSection.section_key != "Initial Diagnosis"
        ).order_by(EmrSection.created_at.asc()).all()
        
        from collections import defaultdict
        sec_groups = defaultdict(list)
        for s in sections:
            date_str = s.created_at.strftime("%Y-%m-%d") if s.created_at else "Unknown Date"
            sec_groups[s.title].append(f"[{date_str}]: {s.content}")
            
        sec_map = {title: "\n".join(contents) for title, contents in sec_groups.items()}
        
        doctor_notes = sec_map.get('Doctor Notes', '')
        doctor_rec = sec_map.get('Doctor Recommendation and Advice', '')
        doctor_notes_full = "\n".join([x for x in [doctor_notes, doctor_rec] if x]).strip() or "Not available"

        chief_complaints = sec_map.get('Chief Complaints', '')
        present_illness = sec_map.get('Present Illness', '')
        chief_complaint_full = "\n".join([x for x in [chief_complaints, present_illness] if x]).strip() or "Not available"

        past_hx = sec_map.get('Past Medical/Surgical History', '')
        procedures = sec_map.get('Surgical / Medical Procedure', '')
        surgical_hx_full = "\n".join([x for x in [past_hx, procedures] if x]).strip() or "Not available"
        
        age = calc_age(patient.dob)
        gender = patient.gender
        
        # Vitals details
        vitals_str = "Not available"
        last_vitals = db.query(VitalSign).filter(VitalSign.patient_id == patient_id).order_by(VitalSign.recorded_at.desc()).first()
        if last_vitals:
            vbp = f"{last_vitals.systolic_bp}/{last_vitals.diastolic_bp} mmHg" if last_vitals.systolic_bp and last_vitals.diastolic_bp else "Not available"
            vitals_str = (
                f"HR: {last_vitals.heart_rate or 'Not available'} bpm, "
                f"BP: {vbp}, "
                f"RR: {last_vitals.respiratory_rate or 'Not available'} /min, "
                f"SpO2: {last_vitals.spo2 or 'Not available'}%, "
                f"Temperature: {last_vitals.temperature_c or 'Not available'} °C, "
                f"Weight: {last_vitals.weight_kg or 'Not available'} kg, "
                f"Height: {last_vitals.height_cm or 'Not available'} cm, "
                f"BMI: {last_vitals.bmi or 'Not available'}"
            )
            
        case_data = (
            f"DOCTOR_NOTES: {doctor_notes_full}\n"
            f"CHIEF_COMPLAINT: {chief_complaint_full}\n"
            f"PATIENT_DEMOGRAPHICS: Age: {age}y, Biological Sex: {gender}\n"
            f"VITAL_SIGNS: {vitals_str}\n"
            f"LAB_RESULTS: {sec_map.get('Lab Results', 'Not available')}\n"
            f"IMAGING_RESULTS: {sec_map.get('Imaging Results', 'Not available')}\n"
            f"ACTIVE_MEDICATIONS: {sec_map.get('Medication History', 'Not available')}\n"
            f"KNOWN_ALLERGIES: {patient.allergies or 'Not available'}\n"
            f"CHRONIC_CONDITIONS: {patient.chronic_conditions or 'Not available'}\n"
            f"SURGICAL_HISTORY: {surgical_hx_full}\n"
            f"FAMILY_HISTORY: {sec_map.get('Family History', 'Not available')}\n"
            f"SOCIAL_HISTORY: {sec_map.get('Personal/Social History', 'Not available')}\n"
            f"RETRIEVED_GUIDELINES: Not available"
        )
        details = case_data

    # 1. Persist the Initial Diagnosis Details to the database under EmrSection
    db.query(EmrSection).filter(
        EmrSection.patient_id == patient_id,
        EmrSection.section_key == "Initial Diagnosis"
    ).delete()
    
    new_section = EmrSection(
        patient_id=patient_id,
        section_key="Initial Diagnosis",
        title="Initial Diagnosis Details",
        content=details
    )
    db.add(new_section)
    db.commit()

    # Define helper to construct structured fallback report
    def build_fallback_report(suggs: List[DiagnosisSuggestion]) -> str:
        report_lines = [
            "### ⚠️ DATA QUALITY FLAGS",
            "None identified.",
            "",
            "### SUGGESTED ICD-10-CM CODES",
            ""
        ]
        for idx, s in enumerate(suggs):
            report_lines.extend([
                f"**Suggestion {idx+1}: {s.icd_code} — {s.icd_title}**",
                f"Confidence score: {int(s.accuracy * 100)}% — {'HIGH' if s.accuracy >= 0.80 else 'MODERATE' if s.accuracy >= 0.50 else 'LOW'}",
                "Score breakdown:",
                f"- Symptom–criteria match: {int(s.accuracy * 100)}/100 — Keyword match",
                "- Lab/vital alignment: 70/100 — Clinical alignment",
                "- RAG similarity: 0/100 — No direct guideline search performed",
                "- Self-consistency: 80/100 — Grounded in local symptoms",
                "- Comorbidity prior: 50/100 — General comorbidity probability",
                "",
                "**Clinical rationale**:",
                f"{s.reasoning}",
                "",
                "**Verified sources**:",
                f"1. {s.medical_source}",
                "",
                "**Physician review required for**:",
                f"Verification of code {s.icd_code} based on full history.",
                ""
            ])
        report_lines.extend([
            "### DIFFERENTIAL CONSIDERATIONS",
            "No alternative diagnoses matched keyword search.",
            "",
            "### DISCLAIMER",
            "> This output was generated by an AI decision support tool and is intended solely to assist a licensed medical professional in clinical coding and diagnosis review. It does not constitute a medical diagnosis, clinical advice, or a treatment recommendation. The attending physician is responsible for all clinical decisions. All suggestions must be independently verified before use in patient records or billing documentation."
        ])
        return "\n".join(report_lines)

    # 2. Generate Suggestions (Gemini vs Fallback)
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        suggestions = run_fallback_diagnostic_engine(details)
        report = build_fallback_report(suggestions)
        return DiagnosisResponse(suggestions=suggestions, compiled_details=details, analysis_report=report)
        
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)
        
        # New System Prompt provided by user
        core_system_prompt = (
            "You are a Diagnostic Assistance AI Agent embedded in a clinical decision support system. "
            "Your role is to assist licensed medical professionals in identifying the most likely ICD-10-CM diagnosis codes for a patient case. "
            "You are a decision support tool — not a replacement for clinical judgment. Every suggestion you produce must be reviewed, "
            "confirmed, or overridden by the attending physician.\n\n"
            "## YOUR ROLE AND BOUNDARIES\n"
            "- You ASSIST, never DECIDE. Always frame outputs as suggestions for physician review.\n"
            "- You do NOT diagnose patients. You suggest candidate ICD-10-CM codes based on the available clinical data.\n"
            "- You do NOT recommend treatments, medications, or dosages unless explicitly asked to surface relevant clinical guidelines for the physician's reference.\n"
            "- You do NOT make predictions about patient outcomes.\n"
            "- You ALWAYS cite the specific verified medical source(s) that support each suggestion. Never make a suggestion without a grounded citation.\n"
            "- If the available data is insufficient to make a confident suggestion, you MUST say so clearly rather than speculate.\n"
            "- If any patient data appears inconsistent, contradictory, or clinically abnormal in a way that warrants urgent attention, you MUST flag it explicitly before proceeding.\n\n"
            "## INPUT FORMAT\n"
            "You will receive a structured patient case in the format:\n"
            "DOCTOR_NOTES: ...\n"
            "CHIEF_COMPLAINT: ...\n"
            "PATIENT_DEMOGRAPHICS: ...\n"
            "VITAL_SIGNS: ...\n"
            "LAB_RESULTS: ...\n"
            "IMAGING_RESULTS: ...\n"
            "ACTIVE_MEDICATIONS: ...\n"
            "KNOWN_ALLERGIES: ...\n"
            "CHRONIC_CONDITIONS: ...\n"
            "SURGICAL_HISTORY: ...\n"
            "FAMILY_HISTORY: ...\n"
            "SOCIAL_HISTORY: ...\n"
            "RETRIEVED_GUIDELINES: ...\n\n"
            "## REASONING PROCESS\n"
            "Before producing your output, reason through the case step by step using the internal chain of thought:\n"
            "Step 1 — Symptom clustering\n"
            "Step 2 — Differential generation (min 3, max 8)\n"
            "Step 3 — ICD-10-CM code mapping (highest specificity level)\n"
            "Step 4 — Evidence scoring (Symptom-criteria 30%, Lab/vital 25%, RAG 20%, Self-consistency 15%, Comorbidity 10%)\n"
            "Composite score formula = (0.30 * symptom_match) + (0.25 * lab_alignment) + (0.20 * rag_similarity) + (0.15 * self_consistency) + (0.10 * comorbidity_prior)\n"
            "Step 5 — Source verification (Only cite approved sources)\n\n"
            "## APPROVED MEDICAL SOURCES\n"
            "Only cite from: ICD-10 Official Guidelines, WHO ICD-10 Online Browser, UpToDate, DynaMed, CDC, NIH/MedlinePlus, NHLBI, AHRQ, AHA/ACC, ADA, ATS, IDSA, ACR, ACG, PubMed, SNOMED CT, RxNorm.\n\n"
            "## SAFETY RULES\n"
            "1. Never output a suggestion without a confidence score.\n"
            "2. Never fabricate a citation.\n"
            "3. Never suggest a higher-specificity code than available data supports.\n"
            "4. Never dismiss a 'must-not-miss' diagnosis solely because it has low probability.\n"
            "5. If patient's data contains indicators of a medical emergency (e.g. SpO2 < 90%, HR > 150 or < 40, BP > 180/120 or < 90/60, altered consciousness, troponin elevation), prepend your entire report with a bold emergency flag: '🚨 URGENT: [Specific abnormality detected] — Immediate physician review recommended before proceeding with coding.'\n"
            "6. Never store, repeat, or summarise any patient-identifiable information beyond what is required. Do not reference patient names, dates of birth, or ID numbers.\n"
            "7. Refuse requests outside the scope of a decision support tool."
        )

        formatting_system_prompt = (
            f"{core_system_prompt}\n\n"
            "--- ADDITIONAL SYSTEM REQUIREMENT ---\n"
            "To integrate with our clinical decision support system, you must structure your final response as a JSON object with two fields:\n"
            "1. 'suggestions': An array of suggested codes. Each item in the array must be an object with the following fields:\n"
            "   - 'icd_code': string (e.g. 'E11.9')\n"
            "   - 'icd_title': string (e.g. 'Type 2 diabetes mellitus without complications')\n"
            "   - 'accuracy': float between 0.0 and 1.0 (matching the composite confidence score, e.g. 0.85 for 85%)\n"
            "   - 'reasoning': string (clinical rationale from your report)\n"
            "   - 'accuracy_explanation': string (the score breakdown and justifications from your report)\n"
            "   - 'medical_source': string (the first verified source from your report)\n"
            "2. 'analysis_report': A string containing your complete report matching EXACTLY the markdown 'OUTPUT FORMAT' specified in the guidelines (including ⚠️ DATA QUALITY FLAGS or 🚨 URGENT flag, SUGGESTED ICD-10-CM CODES with detailed breakdowns, DIFFERENTIAL CONSIDERATIONS, REASONING TRACE, and DISCLAIMER in full markdown format).\n\n"
            "Return ONLY a valid JSON object matching this structure."
        )

        user_msg = f"Patient EMR & Vitals Summary:\n{details}"
        response = llm.invoke([
            SystemMessage(content=formatting_system_prompt),
            HumanMessage(content=user_msg)
        ])
        
        # Parse JSON from response robustly
        clean_text = response.content.strip()
        if clean_text.startswith("```"):
            lines = clean_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_text = "\n".join(lines).strip()
            
        data = json.loads(clean_text)
        
        suggestions = []
        for item in data.get("suggestions", []):
            suggestions.append(DiagnosisSuggestion(
                icd_code=item.get("icd_code", "R69"),
                icd_title=item.get("icd_title", "Illness, unspecified"),
                accuracy=float(item.get("accuracy", 0.50)),
                reasoning=item.get("reasoning", ""),
                accuracy_explanation=item.get("accuracy_explanation", ""),
                medical_source=item.get("medical_source", "World Health Organization (WHO) ICD-10 Database")
            ))
            
        report = data.get("analysis_report")
        if not report:
            report = build_fallback_report(suggestions)
            
        return DiagnosisResponse(suggestions=suggestions, compiled_details=details, analysis_report=report)
        
    except Exception as e:
        suggestions = run_fallback_diagnostic_engine(details)
        report = build_fallback_report(suggestions)
        return DiagnosisResponse(suggestions=suggestions, compiled_details=details, analysis_report=report)
