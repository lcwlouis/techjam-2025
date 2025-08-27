"""
Document ingestion utilities for LightRAG workspaces.

- Accepts a path to ingest files, plus country and optional state.
- Derives region code using the same scheme as retrieval tools: 'USCA' or 'USOVERALL'.
- Sends extracted text to LightRAG for indexing in the region-specific workspace.


Environment variables (optional):
- LIGHTRAG_WORKSPACES_DIR: overrides base workspace root
- Refer to lightrag_tools for LLM and embedding overrides
"""
from dotenv import load_dotenv
load_dotenv()


## LIGHTRAG INGESTION

# from __future__ import annotations
from typing import  Optional, Tuple
from .lightrag_tools import build_region_code, resolve_input_workspace, resolve_workspace, _get_rag

def ingest_into_history_into_lightrag(
    text: str,
    country: str,
    state: Optional[str] = None,
) -> Tuple[str, int]:
    """Ingest the individual reports of each region into LightRAG
    """
    region_code = build_region_code(country, state)
    workspace = resolve_workspace(region_code)
    input_workspace = resolve_input_workspace(region_code)

    # To actually use input_workspace
    
    # Temp testing
    rag = _get_rag(working_dir=workspace)
    # Load and split the document
    report_with_region = f"[Region: {region_code}]\n" + text
    rag.ainsert(input=report_with_region, file_paths=[f"{input_workspace}/report_{region_code}.txt"])


## NAIVERAG Ingestion
import os
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

class ingestion():
    def __init__(self, 
                ingest_directory: str = "",
                chroma_db_path: str = "./chroma_db",
                chroma_collection_name: str = "test_collection",
                embedding_model: str = "text-embedding-3-small",
                overwrite_existing: bool = False
                ):
        # Set up environment variables
        os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY")

        # Initialize embeddings and vector store
        self.embeddings = OpenAIEmbeddings(
            model=embedding_model,
        )

        self.vector_store = Chroma(
            collection_name=chroma_collection_name,
            embedding_function=self.embeddings,
            persist_directory=chroma_db_path,
        )
        self.ingest_directory = ingest_directory
        self.overwrite_existing = overwrite_existing

    def process_files(self, dir_path: str = None):
        """
        Ingest a file or all files in the ingest directory.
        If file_path is provided, it will ingest that specific file.
        If not, it will ingest all files in the ingest_directory.
        """
        if dir_path:
            if dir_path.endswith(".txt"):
                self._ingest_file(dir_path)
        else:
            for root, _, files in os.walk(self.ingest_directory):
                for file in files:
                    if file.endswith(".txt"):
                        full_path = os.path.join(root, file)
                        self._ingest_file(full_path)
                        
    def _ingest_file(self, file_path: str):
        """
        Ingest a single file, splitting it into chunks and adding to the vector store.
        """
        # Load and split the document
        loader = TextLoader(
            file_path=file_path,
            autodetect_encoding=True
        )

        docs = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )

        all_splits = text_splitter.split_documents(docs)

        # Indexing the chunks into the vector store
        if self.vector_store:
            # Checking if Document is already indexed
            existing_docs = self.vector_store.get(where={"source": file_path}).get("ids", [])
            print(f"Found {len(existing_docs)} existing chunks for {file_path} in the vector store.")
            if existing_docs and not self.overwrite_existing:
                print(f"Document {file_path} is already indexed.")
            elif existing_docs and self.overwrite_existing:
                print(f"Deleting existing chunks from {file_path} in the vector store...")
                _ = self.vector_store.delete(where={"source": file_path})
                
                print(f"Adding new chunks from {file_path} to the vector store...")
                _ = self.vector_store.add_documents(documents=all_splits)
            else:
                print(f"Adding new chunks from {file_path} to the vector store...")
                _ = self.vector_store.add_documents(documents=all_splits)

def ingest_files_to_region(ingest_directory: str, country: str, state: Optional[str] = None):
    region = build_region_code(country, state)
    ingestor = ingestion(ingest_directory=ingest_directory, chroma_collection_name=f"chroma_{region}", overwrite_existing=True)
    ingestor.process_files()
    print(f"Finished ingesting files from {ingest_directory} to {region}.")

# ingest_files_to_region(ingest_directory="/Users/louisliu/Projects/Personal/techjam-2025/backend/input_files/USCA_SB976.txt", country="US", state="CA")

__all__ = ["ingest_files_to_region", "ingest_into_history_into_lightrag"]