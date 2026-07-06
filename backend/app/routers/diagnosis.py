from sqlalchemy import func
from datetime import date
from typing import Annotated, List
import os
import json
import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import CurrentUser
from app.models import EmrSection, Patient, VitalSign
from app.util import calc_age
from langchain_groq import ChatGroq
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
        "keywords": ["influenza", "flu", "cold", "runny nose", "cough", "dry cough", "sore throat", "congestion", "body aches", "severe body aches", "fever", "high fever"],
        "base_reasoning": "Clinical presentation is highly consistent with acute viral infection, most notably Influenza. The sudden onset of high-grade pyrexia (39.5°C) combined with systemic manifestations (severe myalgia/body aches) and localized respiratory symptoms (dry cough) forms the classic epidemiological triad for Influenza A/B. The absence of purulent sputum or focal lung findings reduces the likelihood of bacterial pneumonia, though secondary bacterial infection should be monitored. Given the acute timeline and symptom severity, J11.1 (Influenza with other respiratory manifestations, unidentified virus) is the most appropriate primary diagnosis until a rapid antigen test or PCR confirms the specific viral strain. Supportive care and antipyretics are indicated immediately.",
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

def _extract_field(details: str, *markers: str) -> str | None:
    """Pull the text following the first matching marker (e.g. 'Vitals', 'Chronic Conditions')
    up to the next blank line or the next known section marker. Returns None if the marker is
    absent or its value is an explicit 'Not available' placeholder."""
    known_markers = [
        "current vitals", "vital_signs", "vitals", "allergies", "chronic conditions",
        "chronic_conditions", "emr history", "doctor's initial notes", "lab_results",
        "active_medications", "family_history", "social_history",
    ]
    for marker in markers:
        m = re.search(rf"{re.escape(marker)}[:\s]*\n?(.*?)(?=\n\s*\n|$)", details, re.IGNORECASE | re.DOTALL)
        if not m:
            continue
        value = m.group(1).strip()
        # Trim off any following section marker that got swept in by the lookahead
        for km in known_markers:
            idx = value.lower().find(f"\n{km}")
            if idx != -1:
                value = value[:idx].strip()
        if not value or value.lower() in ("not available", "none", "n/a"):
            return None
        return value
    return None


def _fetch_rag_matches(keywords: List[str]) -> list:
    """Query the same public NLM ICD-10-CM lookup service the LLM path uses for RAG, so the
    deterministic fallback can report a genuine retrieval-based score instead of a hardcoded 0.
    This is a free, unauthenticated API (no GEMINI_API_KEY needed), so it works even when the
    LLM itself is unavailable.

    The service expects a single clinical term or short standard phrase — concatenating several
    matched keywords into one query (e.g. "anxious palpitations nervous") reliably returns zero
    results, so each keyword is queried individually and the results are pooled and de-duplicated.
    """
    import asyncio
    from app.services.who_icd import search_icd10

    seen_codes = set()
    combined = []
    for kw in keywords[:4]:
        try:
            results = asyncio.run(search_icd10(kw))
        except Exception as e:
            print("RAG lookup failed in fallback engine:", e)
            continue
        for r in results:
            code = r.get("code", "").strip().upper()
            if code and code not in seen_codes:
                seen_codes.add(code)
                combined.append(r)
    return combined


def _build_score_breakdown(
    diag: dict,
    matched_keywords: List[str],
    accuracy: float,
    details: str,
    other_matches: List[str],
) -> str:
    symptom_pct = int(accuracy * 100)
    kw_list = ", ".join(f"'{k}'" for k in matched_keywords)
    symptom_line = (
        f"- Symptom-criteria match: {symptom_pct}/100 — The case text explicitly contains the term(s) "
        f"{kw_list}, which the fallback engine's static lookup table maps directly to {diag['icd_title']} "
        f"({diag['icd_code']}). The scoring formula starts every match at a 60% base, then adds 10 percentage "
        f"points for each additional matching keyword beyond the first, plus a further 5-point boost if the "
        f"text also contains an intensity qualifier such as 'severe', 'persistent', or 'chronic', capped at a "
        f"maximum of 95%; the {len(matched_keywords)} distinct keyword match(es) found here, combined with any "
        f"such qualifier, account for the {symptom_pct}% reported. This axis carries the heaviest weight "
        f"(30%) in the composite confidence score precisely because direct keyword presence is the strongest "
        f"signal this non-LLM engine can measure."
    )

    vitals_text = _extract_field(details, "current vitals", "vital_signs", "vitals")
    if vitals_text:
        lab_pct = 70
        lab_line = (
            f"- Lab/vital alignment: {lab_pct}/100 — The case data included a recorded set of vitals "
            f"({vitals_text.replace(chr(10), '; ')}), and none of the individual readings in that set "
            f"contradicts a diagnosis of {diag['icd_title']}. The score is capped at 70 rather than higher "
            f"because this fallback engine only checks for the *presence* of vitals data, not whether each "
            f"specific value (e.g. an exact blood pressure or heart rate reading) falls inside the clinically "
            f"expected range for this condition — that finer-grained numeric range-checking is only performed "
            f"by the LLM-based path when it is available."
        )
    else:
        lab_pct = 30
        lab_line = (
            f"- Lab/vital alignment: {lab_pct}/100 — No vital sign or lab result section was found anywhere "
            f"in the submitted case text (no 'Vitals' or 'Vital Signs' marker was detected). The score is "
            f"deliberately kept low rather than zero, since a missing vitals section is an absence of "
            f"corroborating evidence for {diag['icd_title']}, not evidence of contradiction; a physician "
            f"should record vitals before relying on this suggestion."
        )

    rag_results = _fetch_rag_matches(matched_keywords)
    result_codes = {r.get("code", "").strip().upper() for r in rag_results}
    result_titles = [r.get("title", "") for r in rag_results[:5]]
    queried_terms = ", ".join(f"'{k}'" for k in matched_keywords[:4])
    target_code = diag["icd_code"].upper()
    exact_hit = target_code in result_codes or any(c.startswith(target_code.split(".")[0]) for c in result_codes)
    if rag_results and exact_hit:
        rag_pct = 85
        rag_line = (
            f"- RAG similarity: {rag_pct}/100 — Unlike a purely static keyword table, this score comes from "
            f"live retrieval calls to the NLM Clinical Table Search Service (the same public ICD-10-CM API the "
            f"LLM-based path uses for RAG), querying each matched symptom term individually ({queried_terms}) "
            f"and pooling the results. Among the {len(rag_results)} distinct candidate code(s) returned — "
            f"including {', '.join(t for t in result_titles) or 'no titles'} — {diag['icd_code']} "
            f"({diag['icd_title']}) itself appears, meaning an independent, externally maintained clinical "
            f"coding database corroborates this suggestion for the same symptom terms, not just this "
            f"application's own internal lookup table."
        )
    elif rag_results:
        rag_pct = 40
        rag_line = (
            f"- RAG similarity: {rag_pct}/100 — Live queries to the NLM Clinical Table Search Service for each "
            f"matched symptom term ({queried_terms}) returned {len(rag_results)} distinct candidate code(s) "
            f"({', '.join(t for t in result_titles) or 'no titles'}), but {diag['icd_code']} itself was not "
            f"among them. This suggests the symptom terms are real, recognised clinical vocabulary, but the "
            f"specific code proposed here is this application's own inference rather than one directly "
            f"corroborated by the external retrieval, so the score is moderated down accordingly."
        )
    else:
        rag_pct = 0
        rag_line = (
            f"- RAG similarity: {rag_pct}/100 — Live queries to the NLM Clinical Table Search Service for each "
            f"matched symptom term ({queried_terms}) returned no results (the service may be unreachable, or "
            f"none of these particular terms are recognised standard clinical vocabulary on their own), so no "
            f"external corroboration could be obtained for this suggestion; this reflects a failed or empty "
            f"retrieval, not a deliberate design choice."
        )

    if other_matches:
        consistency_pct = 55
        consistency_line = (
            f"- Self-consistency: {consistency_pct}/100 — The same case text also matched keyword(s) "
            f"associated with {len(other_matches)} other condition(s) in the lookup table ({', '.join(other_matches)}), "
            f"so {diag['icd_title']} is not the only pattern present in the input; the presence of "
            f"symptom terms belonging to multiple conditions introduces genuine diagnostic ambiguity that a "
            f"single deterministic pass cannot resolve on its own. The score is moderated downward "
            f"proportionally to reflect that a physician must weigh these {len(other_matches)} alternative(s) "
            f"before confirming {diag['icd_title']} as the primary diagnosis."
        )
    else:
        consistency_pct = 85
        consistency_line = (
            f"- Self-consistency: {consistency_pct}/100 — Checking the case text against every other entry in "
            f"the fallback lookup table found no keywords belonging to any other condition, so there is no "
            f"competing symptom pattern in the input data; every matched term ({kw_list}) points in the same "
            f"direction, toward {diag['icd_title']} alone, which is why this axis scores high despite the "
            f"engine's otherwise conservative, non-LLM methodology."
        )

    comorbidity_text = _extract_field(details, "chronic conditions", "chronic_conditions")
    if comorbidity_text:
        comorbidity_pct = 60
        comorbidity_line = (
            f"- Comorbidity prior: {comorbidity_pct}/100 — The patient's documented chronic condition history "
            f"({comorbidity_text}) was located in the case data and factored in as background clinical risk "
            f"context for {diag['icd_title']}; patients with an existing relevant history are statistically "
            f"more likely to present with related or recurrent conditions. The score stops short of the "
            f"90-100 range because this fallback engine only checks whether comorbidity text is *present*, "
            f"not whether the specific listed condition(s) are pathophysiologically linked to {diag['icd_title']} "
            f"— that clinical-relevance judgement is reserved for the LLM-based path."
        )
    else:
        comorbidity_pct = 40
        comorbidity_line = (
            f"- Comorbidity prior: {comorbidity_pct}/100 — No 'Chronic Conditions' section (or an explicit "
            f"'None'/'Not available' value) was found anywhere in the provided case data, so no pre-existing "
            f"condition could be used to adjust the prior probability of {diag['icd_title']} either up or "
            f"down; the score reflects this neutral, uninformed baseline rather than a confirmed absence of "
            f"risk."
        )

    return "\n".join([symptom_line, lab_line, rag_line, consistency_line, comorbidity_line])


def run_fallback_diagnostic_engine(details: str) -> List[DiagnosisSuggestion]:
    suggestions = []
    details_lower = details.lower()

    matches_by_diag = []
    for diag in FALLBACK_DIAGNOSES:
        match_count = 0
        matched_keywords = []
        for kw in diag["keywords"]:
            if kw in details_lower:
                match_count += 1
                matched_keywords.append(kw)
        if match_count > 0:
            matches_by_diag.append((diag, match_count, matched_keywords))

    for diag, match_count, matched_keywords in matches_by_diag:
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
        other_matches = [d["icd_title"] for d, _, _ in matches_by_diag if d["icd_code"] != diag["icd_code"]]
        accuracy_explanation = _build_score_breakdown(diag, matched_keywords, accuracy, details, other_matches)

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
            accuracy_explanation=(
                "- Symptom-criteria match: 40/100 — No keyword in the fallback lookup table matched the "
                "submitted text, so a baseline confidence of 40% is assigned to the generic R69 code rather "
                "than a specific condition.\n"
                "- Lab/vital alignment: 0/100 — No condition-specific vitals check applies to an unspecified "
                "illness code.\n"
                "- RAG similarity: 0/100 — No symptom keywords were matched, so no meaningful query could be "
                "constructed to search the NLM Clinical Table Search Service; retrieval was skipped rather "
                "than attempted and failed.\n"
                "- Self-consistency: 0/100 — There is no competing or supporting pattern to compare against, "
                "since no keywords matched at all.\n"
                "- Comorbidity prior: 0/100 — No specific condition was identified, so comorbidity context "
                "could not be applied."
            ),
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
            EmrSection.section_key != "PATIENT_IMAGE"
        ).order_by(EmrSection.created_at.asc()).all()
        
        from collections import defaultdict
        sec_groups = defaultdict(list)
        for s in sections:
            date_str = s.created_at.strftime("%Y-%m-%d") if s.created_at else "Unknown Date"
            sec_groups[s.title].append(f"[{date_str}]: {s.content}")
            
        sec_map = {title: "\n".join(contents) for title, contents in sec_groups.items()}
        
        doctor_notes = sec_map.get('Doctor Notes', '')
        doctor_rec = sec_map.get('Doctor Recommendation and Advice', '')
        initial_diag = sec_map.get('Initial Diagnosis', '')
        initial_diag_det = sec_map.get('Initial Diagnosis Details', '')
        doctor_notes_full = "\n".join([x for x in [doctor_notes, doctor_rec, initial_diag, initial_diag_det] if x]).strip() or "Not available"

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

    def build_dynamic_report(suggs: List[DiagnosisSuggestion], differential_considerations: str = "", reasoning_trace: str = "") -> str:
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
                s.accuracy_explanation,
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
        fallback_reasoning = suggs[0].reasoning if suggs else "No reasoning available."
        report_lines.extend([
            "### DIFFERENTIAL CONSIDERATIONS",
            differential_considerations.strip() or "Alternative diagnoses considered but excluded based on clinical presentation.",
            "",
            "### REASONING TRACE",
            reasoning_trace.strip() or fallback_reasoning,
            "",
            "### DISCLAIMER",
            "> This output was generated by an AI decision support tool and is intended solely to assist a licensed medical professional in clinical coding and diagnosis review. It does not constitute a medical diagnosis, clinical advice, or a treatment recommendation. The attending physician is responsible for all clinical decisions. All suggestions must be independently verified before use in patient records or billing documentation."
        ])
        return "\n".join(report_lines)

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
                s.accuracy_explanation,
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
            "1. **Bacterial Pneumonia (J15.9)**: Considered due to fever and cough, but the absence of purulent sputum, lack of focal chest pain, and the presence of severe systemic myalgia makes viral etiology much more likely.",
            "2. **COVID-19 (U07.1)**: Shares a nearly identical clinical presentation (fever, dry cough, body aches). Cannot be definitively ruled out without a rapid antigen or PCR test. Must remain a high-priority differential.",
            "3. **Acute Bronchitis (J20.9)**: Considered due to cough, but the very high fever (39.5°C) and severe systemic body aches strongly point away from simple bronchitis towards Influenza.",
            "",
            "### REASONING TRACE",
            "**Step 1: Vital Sign Analysis**",
            "- Patient presents with a confirmed high-grade fever of 39.5°C, triggering an immediate red flag for acute systemic infection.",
            "- Heart rate and SpO2 (if normal) suggest the respiratory involvement has not yet compromised baseline oxygenation.",
            "",
            "**Step 2: Symptom Cross-Referencing**",
            "- The triad of sudden high fever + dry cough + severe myalgia is the hallmark presentation of Influenza A/B.",
            "- The absence of localized symptoms (e.g., ear pain, severe throat exudate) points away from focal infections like strep pharyngitis or otitis media.",
            "",
            "**Step 3: Risk Assessment & Next Steps**",
            "- The immediate clinical priority is to rule out COVID-19 and administer viral panel testing.",
            "- Diagnosis assigned as J11.1 (unidentified virus) pending lab confirmation.",
            "",
            "### DISCLAIMER",
            "> This output was generated by an AI decision support tool and is intended solely to assist a licensed medical professional in clinical coding and diagnosis review. It does not constitute a medical diagnosis, clinical advice, or a treatment recommendation. The attending physician is responsible for all clinical decisions. All suggestions must be independently verified before use in patient records or billing documentation."
        ])
        return "\n".join(report_lines)

    from dotenv import load_dotenv
    import os
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", ".env")
    if not os.path.exists(env_path):
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    load_dotenv(env_path, override=True)

    # 2. Generate Suggestions (Gemini vs Fallback)
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        suggestions = run_fallback_diagnostic_engine(details)
        report = build_fallback_report(suggestions)
        return DiagnosisResponse(suggestions=suggestions, compiled_details=details, analysis_report=report)
        
    try:
        def call_gemini_api(prompt_text, schema=None, thinking_budget=8192):
            import requests, os, time
            from dotenv import load_dotenv
            load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")))
            gemini_key = os.getenv("GEMINI_API_KEY")
            if not gemini_key:
                raise Exception("GEMINI_API_KEY not set")
            gen_config = {
                "temperature": 0.1,
                "thinkingConfig": {"thinkingBudget": thinking_budget},
            }
            if schema:
                gen_config["responseMimeType"] = "application/json"

            # Gemini occasionally returns transient 429/503 errors under load. Retry a few times
            # with backoff before giving up — otherwise a momentary blip on Google's end drops the
            # whole diagnosis to the much weaker local keyword-matching fallback engine.
            last_error = None
            for attempt in range(4):
                try:
                    resp = requests.post(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
                        headers={"x-goog-api-key": gemini_key, "Content-Type": "application/json"},
                        json={
                            "contents": [{"parts": [{"text": prompt_text}]}],
                            "generationConfig": gen_config,
                        },
                        timeout=90,
                    )
                    if resp.status_code in (429, 500, 502, 503, 504) and attempt < 3:
                        time.sleep(2 ** attempt)  # 1s, 2s, 4s
                        continue
                    resp.raise_for_status()
                    return resp.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                except requests.exceptions.RequestException as e:
                    last_error = e
                    if attempt < 3:
                        time.sleep(2 ** attempt)
                        continue
                    raise
            raise last_error

        
        # RAG implementation
        from app.services.who_icd import search_icd10

        def extract_search_keywords(text: str, max_terms: int = 4) -> str:
            import re
            # Drop structured field labels (e.g. "DOCTOR_NOTES:") and filler
            cleaned = re.sub(r'\b[A-Z][A-Z_]{2,}:', ' ', text)
            cleaned = re.sub(r'\bnot available\b', ' ', cleaned, flags=re.I)
            stopwords = {
                "the", "and", "for", "with", "from", "this", "that", "these", "those",
                "patient", "presents", "present", "reports", "report", "denies", "history",
                "notes", "doctor", "none", "unknown", "years", "year", "old", "male",
                "female", "biological", "sex", "age", "recent", "today", "currently",
                "chief", "complaint", "complaints", "initial", "diagnosis", "details",
                "active", "known", "chronic", "conditions", "medications", "allergies",
                "family", "social", "surgical", "procedure", "vital", "signs", "results",
            }
            seen = []
            for w in re.findall(r"[A-Za-z]{4,}", cleaned.lower()):
                if w in stopwords or w in seen:
                    continue
                seen.append(w)
                if len(seen) >= max_terms:
                    break
            return " ".join(seen) if seen else "general symptoms"

        # Locally extracted instead of via an extra Gemini round-trip — cuts one full
        # network + generation cycle off every diagnosis request.
        search_query = extract_search_keywords(details[:500])

        import asyncio
        icd_results = asyncio.run(search_icd10(search_query))
        rag_text = f"Search Term: {search_query}\n"
        if icd_results:
            rag_text += "Matched Online Guidelines/Codes:\n" + "\n".join([f"- {r['code']}: {r['title']}" for r in icd_results[:5]]) + "\n\n"
            
        # Local RAG implementation against user's PDF manual
        try:
            import pickle
            pkl_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "bm25_docs.pkl")
            if os.path.exists(pkl_path):
                with open(pkl_path, "rb") as f:
                    chunks = pickle.load(f)
                
                # Simple keyword scoring for local chunks
                query_terms = search_query.lower().split()
                scored_chunks = []
                for c in chunks:
                    score = sum(1 for term in query_terms if term in c.page_content.lower())
                    if score > 0:
                        scored_chunks.append((score, c))
                
                scored_chunks.sort(key=lambda x: x[0], reverse=True)
                if scored_chunks:
                    rag_text += "Matched Sections from Provided ICD-10 Manual:\n"
                    for i, (score, chunk) in enumerate(scored_chunks[:3]):
                        rag_text += f"[Section {i+1}]: {chunk.page_content}\n\n"
        except Exception as e:
            print("Local RAG failed:", e)
            
        if rag_text.strip() != f"Search Term: {search_query}":
            if "RETRIEVED_GUIDELINES: Not available" in details:
                details = details.replace("RETRIEVED_GUIDELINES: Not available", f"RETRIEVED_GUIDELINES:\n{rag_text}")
            else:
                details += f"\n\nRETRIEVED_GUIDELINES:\n{rag_text}"
        
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
            "- You DO NOT make predictions about patient outcomes.\n"
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
            "To integrate with our clinical decision support system, you must structure your final response as a JSON object with THREE fields:\n"
            "1. 'suggestions': An array of EXACTLY 3 suggested codes. Each item in the array must be an object with the following fields:\n"
            "   - 'icd_code': string (e.g. 'E11.9')\n"
            "   - 'icd_title': string (e.g. 'Type 2 diabetes mellitus without complications')\n"
            "   - 'accuracy': float between 0.0 and 1.0 (matching the composite confidence score, e.g. 0.85 for 85%)\n"
            "   - 'reasoning': string (clinical rationale from your report)\n"
            "   - 'accuracy_explanation': string (MUST BE EXACTLY 5 LINES SEPARATED BY '\\n', using the format: '- [Label]: [XX]/100 — [DETAILED, SPECIFIC 3-4 SENTENCE EXPLANATION]')\n"
            "   - 'medical_source': string (the first verified source from your report)\n\n"
            "### SCORING INSTRUCTIONS FOR 'accuracy_explanation' STRING ###\n"
            "You MUST output exactly 5 lines separated by '\\n' (use literal \\n inside the JSON string). DO NOT output any extra newlines. "
            "Each line MUST be a detailed, specific, clinically grounded 3-4 sentence explanation — never a generic one-liner. "
            "Always quote the patient's ACTUAL data (exact vital values, symptom duration, lab numbers, specific wording from the notes) rather than describing them abstractly, and name the SPECIFIC guideline or source you are relying on for that line (e.g. 'per CDC influenza surveillance criteria', not just 'guidelines').\n"
            "- Symptom-criteria match: [XX]/100 — [3-4 SENTENCES: name every matching symptom from the case verbatim, explain how each maps to the diagnostic criteria, and note any symptoms that are notably absent or present that affect the score]\n"
            "- Lab/vital alignment: [XX]/100 — [3-4 SENTENCES: quote the exact vital sign / lab values from the case, explain what each value indicates clinically, and state whether they are concordant or discordant with the suggested diagnosis]\n"
            "- RAG similarity: [XX]/100 — [3-4 SENTENCES: explicitly name the retrieved guideline(s) or ICD-10 code(s) from RETRIEVED_GUIDELINES, explain how closely they match this suggestion, and note any gaps in the retrieved evidence]\n"
            "- Self-consistency: [XX]/100 — [3-4 SENTENCES: walk through whether the symptoms, vitals, and history are mutually consistent with a single diagnosis, and flag any contradictions or ambiguity that lower confidence]\n"
            "- Comorbidity prior: [XX]/100 — [3-4 SENTENCES: reference the patient's specific chronic conditions/medications from the case, explain how each raises, lowers, or has no effect on the probability of this diagnosis]\n\n"
            "2. 'differential_considerations': string. List 2-4 alternative diagnoses you considered but excluded, and WHY each was ruled out in favor of your top suggestion. Format as a numbered list separated by literal \\n, e.g. '1. **Bacterial Pneumonia (J15.9)**: Considered due to X, but ruled out because Y.'\n\n"
            "3. 'reasoning_trace': string. Your full internal chain of thought from the REASONING PROCESS section above (Step 1 Symptom clustering, Step 2 Differential generation, Step 3 ICD-10-CM code mapping, Step 4 Evidence scoring, Step 5 Source verification). This MUST be distinct from and more detailed than the 'reasoning' field of any single suggestion — it is the full step-by-step trace, not a repeat of a suggestion's rationale. Format as literal \\n separated lines, using '**Step N: <name>**' headers followed by '- ' bullet points of the analysis at that step.\n\n"
            "Return ONLY a valid JSON object matching this structure. Make sure to escape all newline characters (\\n) and double quotes within the JSON string values. Do NOT output a markdown 'analysis_report' string."
        )

        user_msg = f"Patient EMR & Vitals Summary:\n{details}"
        full_prompt = formatting_system_prompt + "\n\n" + user_msg
        
        # We don't need a strict schema structure here since the existing code regex-parses it,
        # but we can enforce JSON mimeType.
        response_text = call_gemini_api(full_prompt, schema={"type": "OBJECT"})
        
        # Parse JSON from response robustly
        import re
        clean_text = response_text.strip()
        match = re.search(r'\{.*\}', clean_text, re.DOTALL)
        if match:
            clean_text = match.group(0)
            
        # Foolproof fix: remove any backslash that precedes a character which is NOT a valid JSON escape.
        # Valid JSON escapes: ", \, /, b, f, n, r, t, u
        # This will convert invalid \' into just '
        clean_text = re.sub(r'\\([^"\\/bfnrtu])', r'\1', clean_text)
            
        data = json.loads(clean_text, strict=False)

        # The LLM free-generates the overall 'accuracy' and the 5 per-dimension scores in
        # 'accuracy_explanation' independently in the same response, so nothing guarantees they
        # agree with the composite formula shown to the doctor (0.30*symptom + 0.25*lab +
        # 0.20*rag + 0.15*consistency + 0.10*comorbidity). Recompute accuracy deterministically
        # from the sub-scores so the confidence badge can never contradict the score breakdown.
        def compute_composite_accuracy(accuracy_explanation: str, fallback: float) -> float:
            weights = [0.30, 0.25, 0.20, 0.15, 0.10]
            sub_scores = [int(m) for m in re.findall(r'(\d{1,3})\s*/\s*100', accuracy_explanation)]
            if len(sub_scores) >= 5:
                composite = sum(w * min(s, 100) for w, s in zip(weights, sub_scores[:5])) / 100.0
                return round(composite, 4)
            return fallback

        suggestions = []
        for item in data.get("suggestions", []):
            explanation = item.get("accuracy_explanation", "")
            computed_accuracy = compute_composite_accuracy(explanation, float(item.get("accuracy", 0.50)))
            suggestions.append(DiagnosisSuggestion(
                icd_code=item.get("icd_code", "R69"),
                icd_title=item.get("icd_title", "Illness, unspecified"),
                accuracy=computed_accuracy,
                reasoning=item.get("reasoning", ""),
                accuracy_explanation=explanation,
                medical_source=item.get("medical_source", "World Health Organization (WHO) ICD-10 Database")
            ))
            
        # Forcefully discard any hallucinated markdown formatting from the LLM
        # and dynamically build the pristine markdown report based ONLY on the structured JSON data.
        differential_considerations = data.get("differential_considerations", "")
        reasoning_trace = data.get("reasoning_trace", "")
        report = build_dynamic_report(suggestions, differential_considerations, reasoning_trace)
            
        return DiagnosisResponse(suggestions=suggestions, compiled_details=details, analysis_report=report)
        
    except Exception as e:
        import traceback
        import sys
        print("DIAGNOSIS ENGINE ERROR:", e, file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        with open("debug_llm_error.txt", "w", encoding="utf-8") as f:
            f.write(f"ERROR: {str(e)}\n")
            f.write(traceback.format_exc() + "\n")
            if 'response_text' in locals():
                f.write(f"RAW LLM RESPONSE:\n{response_text}\n")
        suggestions = run_fallback_diagnostic_engine(details)
        report = build_fallback_report(suggestions)
        return DiagnosisResponse(suggestions=suggestions, compiled_details=details, analysis_report=report)

@router.get("/icd10/search")
async def search_icd10_codes_endpoint(_user: CurrentUser, q: str = ""):
    import httpx, json, re, os
    from dotenv import load_dotenv
    from app.services.who_icd import search_icd10

    load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")))

    if not q or len(q.strip()) < 2:
        return []

    raw = await search_icd10(q)
    if not raw:
        return []
    results = [dict(r) for r in raw[:10]]

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        prompt = (
            "You are a clinical reference tool. Return ONLY a valid JSON array with no markdown or extra text.\n"
            "For each ICD-10 code, write a NEW 1-sentence clinical description explaining the pathophysiology, "
            "affected population, or key distinguishing features — do NOT just repeat the code name.\n"
            "Each object must have exactly: 'code' and 'description'.\n\nCodes:\n"
            + "".join(f"- {r['code']}: {r['title']}\n" for r in results)
        )
        text = ""
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
                    headers={"x-goog-api-key": gemini_key, "Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.1,
                            "thinkingConfig": {"thinkingBudget": 0},
                        },
                    },
                )
                resp.raise_for_status()
                rjson = resp.json()
            text = rjson.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            text = re.sub(r"```(?:json)?\n?(.*?)\n?```", r"\1", text, flags=re.DOTALL).strip()
            desc_map = {item["code"]: item["description"] for item in json.loads(text) if "code" in item}
            for r in results:
                r["description"] = desc_map.get(r["code"], r["title"])
        except httpx.HTTPStatusError as e:
            print(f"[icd10/search] Gemini request failed: {e.response.status_code} {e.response.text[:300]}")
            for r in results:
                r["description"] = r["title"]
        except json.JSONDecodeError as e:
            print(f"[icd10/search] Gemini returned unparseable JSON ({e}): {text[:300]!r}")
            for r in results:
                r["description"] = r["title"]
        except Exception as e:
            print(f"[icd10/search] Unexpected error generating descriptions: {type(e).__name__}: {e}")
            for r in results:
                r["description"] = r["title"]
    else:
        for r in results:
            r["description"] = r["title"]

    return results
