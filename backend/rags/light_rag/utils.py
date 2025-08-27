import os
from typing import Optional
from lightrag.llm.openai import openai_complete_if_cache, openai_embed
from lightrag.utils import EmbeddingFunc
from lightrag import LightRAG, QueryParam
from lightrag.llm.openai import gpt_4o_mini_complete, gpt_4o_complete, openai_embed
from lightrag.kg.shared_storage import initialize_pipeline_status

WORKSPACES_DIR = os.path.join(os.path.dirname(__file__), "workspaces")

# builds region code from country and state so we can identify workspaces
def build_region_code(country: str, state: Optional[str] = None) -> str:
	"""Build a region code like 'USCA' or 'USOVERALL'.

	If state is falsy (None/empty), use 'OVERALL'.
	"""
	c = (country or "").strip().upper()
	if not c or len(c) != 2:
		# Keep simple and strict: expect 2-char country codes
		raise ValueError("country must be a 2-letter code, e.g., 'US', 'EU', 'SG'")
	s = (state or "OVERALL").strip().upper() or "OVERALL"
	return f"{c}{s}"    

# based on country code, find path to the workspace where we would be performing ingestion/retrieval 
def resolve_workspace(region_code: str) -> str:
	"""Map a region code to its workspace directory path.

	Special case: 'HISTORY'.
	"""
	if not region_code:
		raise ValueError("region_code is required")
	code = region_code.strip().upper()
	root = WORKSPACES_DIR
	# HISTORY is a dedicated global workspace for historical feature flagged
	# LightRAG automatically looks for workspace titled HISTORY for global search
	subdir = "HISTORY" if code == "HISTORY" else code
	path = os.path.abspath(os.path.join(root, subdir))
	os.makedirs(path, exist_ok=True)
	return path

"""
    Some explanation about LightRAG to explain what is going on
	LightRAG is a 
"""
# NOTE: some explanation to explain what is going on here 
# LightRAG is a RAG framework and we can call ingestion/retrieval once we pass it the workspace we are working in 
# But it needs stuff like the LLM model we are using as well as the embedding function that we define down here
# https://github.com/HKUDS/LightRAG ==> check this link for more info its q informative


# use LightRAG default embedding function and llm model functions which is wired to OpenAPI
# so it looks for OPENAI_API_KEY in the environment variables by
async def init_light_rag(region_code: str) -> LightRAG:
    workspace = resolve_workspace(region_code)
    rag = LightRAG(
        working_dir=workspace,
        embedding_func=openai_embed,        
        llm_model_func=gpt_4o_mini_complete, 
    )
    await rag.initialize_storages()
    await initialize_pipeline_status()
    return rag

async def close_light_rag(rag: LightRAG):
    if rag:
        await rag.finalize_storages()


