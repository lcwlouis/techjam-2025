import os
import logging
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_core.tools import tool
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY")

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
)

vector_store = Chroma(
    collection_name="chroma_USOVERALL",
    embedding_function=embeddings,
    persist_directory="./chroma_db",
)

@tool(
    description="Retrieve information related to a query. For the region",
    response_format="content_and_artifact"
)
def naiverag_retrieve_sync(query: str):
    """Retrieve information related to a query."""
    retrieved_docs = vector_store.similarity_search(query, k=2)
    logger.info(f"Retrieved {len(retrieved_docs)} documents for query '{query}'")
    serialized = "\n\n".join(
        (f"Source: {doc.metadata}\nContent: {doc.page_content}")
        for doc in retrieved_docs
    )
    logger.info(f"Retrieved documents for query '{query}': {serialized}")
    return serialized, retrieved_docs
