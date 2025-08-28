import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .utils import get_vector_store
from rags.light_rag import build_region_code

# standardises which path we look for input_files for regardless of where we invoke this
NAIVE_RAG_FILE_INGESTION_DIR = os.path.join(os.path.dirname(__file__), "input_files")


def ingest_file_into_naiverag(file_path: str, region: str, overwrite_existing: bool = False):

    vector_store = get_vector_store(collection_name=f"chroma_{region}")

    abs_path = os.path.join(NAIVE_RAG_FILE_INGESTION_DIR, file_path)
    loader = TextLoader(file_path=abs_path, autodetect_encoding=True)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)

    # id is the relative path of the file within this directory so across different machines dupes still get flagged
    file_id = os.path.relpath(abs_path, NAIVE_RAG_FILE_INGESTION_DIR)

    # look within metadata for the file_id and check for dupes
    existing_ids = vector_store.get(where={"file_id": file_id}).get("ids", [])
    if existing_ids and not overwrite_existing:
        print(f"Skipping {abs_path} — already indexed.")
        return
    if existing_ids and overwrite_existing:
        print(f"Overwriting {abs_path} in vector store.")
        vector_store.delete(ids=existing_ids)

    # populate each chunk with metadata so we can use it for identifying dupes later
    for c in chunks:
        c.metadata["file_id"] = file_id
        c.metadata["source"] = file_path  

    vector_store.add_documents(documents=chunks)

    print(f"Ingested {abs_path} into chroma vector store under {region}.")

