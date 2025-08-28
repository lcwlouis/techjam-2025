import logging
from langchain_core.tools import tool
from .utils import get_vector_store

logger = logging.getLogger(__name__)

@tool(description="Retrieve legal/regulatory text from NaiveRAG", response_format="content_and_artifact")
def naiverag_retrieve_sync(query: str, region: str, k: int):
    """Retrieve relevant documents from chroma-db related to a query."""
    vector_store = get_vector_store(collection_name=f"chroma_{region}")
    results = vector_store.similarity_search(query, k=k)

    serialized = "\n\n".join(
        f"Source: {doc.metadata}\nContent: {doc.page_content}" for doc in results
    )
    logger.info(f"Retrieved {len(results)} docs for query '{query}' in {region}")
    return serialized, results
