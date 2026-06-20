import os
import argparse
import pickle
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def main():
    parser = argparse.ArgumentParser(description="Ingest ICD-10 Manual PDF using BM25")
    parser.add_argument("--pdf-path", type=str, default="data/icd10_manual.pdf.pdf", help="Path to the PDF file")
    parser.add_argument("--index-path", type=str, default="data/bm25_docs.pkl", help="Output path for the parsed chunks")
    args = parser.parse_args()

    pdf_path = args.pdf_path
    index_path = args.index_path

    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
        return

    print(f"Loading PDF from {pdf_path}...")
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    print(f"Loaded {len(documents)} pages.")

    print("Splitting text into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Created {len(chunks)} text chunks.")

    print("Saving BM25 chunks... (Bypassing DLL restrictions by avoiding FAISS)")
    os.makedirs(os.path.dirname(index_path), exist_ok=True)
    with open(index_path, "wb") as f:
        pickle.dump(chunks, f)

    print("Ingestion complete! The BM25 Retrieval Pipeline is ready for use.")

if __name__ == "__main__":
    main()
