import logging
from langchain_core.tools import tool
from .utils import get_vector_store

logger = logging.getLogger(__name__)

@tool(description="Retrieve legal/regulatory text from NaiveRAG", response_format="content_and_artifact")
def naiverag_retrieve_sync(query: str, region_code: str, k: int):
    """Retrieve relevant documents from chroma-db related to a query."""
    if region_code == "NOTA":
        return f"Region NOTA has no documents. Please use Searxng tool instead.", []
    try:
        vector_store = get_vector_store(collection_name=f"chroma_{region_code}")
        results = vector_store.similarity_search(query, k=k)

        serialized = "\n\n".join(
            f"Source: {doc.metadata}\nContent: {doc.page_content}" for doc in results
        )
        logger.info(f"[NaiveRAG] Retrieved {len(results)} docs for query '{query}' in {region_code}")
        return serialized, results
    except Exception as e:
        return f"Error during retrieval: {str(e)}", []
