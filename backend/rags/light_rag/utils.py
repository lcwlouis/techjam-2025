import os
from typing import Optional
from lightrag.llm.openai import openai_complete_if_cache, openai_embed
from lightrag.utils import EmbeddingFunc
from lightrag import LightRAG, QueryParam
from lightrag.llm.openai import gpt_4o_mini_complete, gpt_4o_complete, openai_embed
from lightrag.kg.shared_storage import initialize_pipeline_status

# ensures that all vectors are stored in workspaces dir relative to this file
WORKSPACES_DIR = os.path.join(os.path.dirname(__file__), "workspaces")

# builds region code from country and state so we can identify which workspace to retrieve/ingest data from/to
def build_region_code(country: str, state: Optional[str] = None) -> str:
	c = (country or "").strip().upper()
	if not c or len(c) != 2:
		raise ValueError("country must be a 2-letter code, e.g., 'US', 'EU', 'SG'")
	s = (state or "OVERALL").strip().upper() or "OVERALL"
	return f"{c}{s}"    

# based on region code, find path to the workspace where we would be performing ingestion/retrieval 
def resolve_workspace(region_code: str) -> str:
	"""Map a region code to its workspace directory path.

	Special case: 'HISTORY'.
	"""
	if not region_code:
		raise ValueError("region_code is required")
	code = region_code.strip().upper()
	root = WORKSPACES_DIR
	# NOTE: HISTORY is a pre-coded dedicated global workspace for historical feature flagged
	# LightRAG automatically looks for workspaces titled HISTORY for global search 
	subdir = "HISTORY" if code == "HISTORY" else code
	path = os.path.abspath(os.path.join(root, subdir))
	os.makedirs(path, exist_ok=True)
	return path

"""
    Some explanation about LightRAG to explain what is going on
	LightRAG is a RAG framework that makes calling ingestion/retreival very abstracted. But when we spin up an instance of lightRAG 
	we have to pass in the embedding function, which is how we store vector embedding in our workspaces, the path to the workspace and also the 
	LLM model used to query the workspace. 

	(1) the vector embedding and llm_model_func we can just use pre-set ones from the framework for simplicity but if we want to customise it we can refer to the
	    commented out code at the bottom
	(2) when using the preset llm_model_func, it looks for OPENAI_API_KEY in the environment variables, so it must exist there for this to work
	https://github.com/HKUDS/LightRAG ==> check this link for more info its q informative

"""

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



# # ---------- LLM and embedding adapters ----------
# async def _llm_model_func(
# 	prompt: str,
# 	system_prompt: Optional[str] = None,
# 	history_messages: list = [],
# 	keyword_extraction: bool = False,
# 	**kwargs,
# ) -> str:
# 	"""LLM function for LightRAG with OpenAI-compatible APIs (DeepSeek, etc.)."""
# 	return await openai_complete_if_cache(
# 		os.getenv("LLM_MODEL", "deepseek-chat"),
# 		prompt,
# 		system_prompt=system_prompt,
# 		history_messages=history_messages,
# 		api_key=os.getenv("LLM_BINDING_API_KEY") or os.getenv("OPENAI_API_KEY"),
# 		base_url=os.getenv("LLM_BINDING_HOST", "https://api.deepseek.com"),
# 		**kwargs,
# 	)


# def _embedding_func() -> EmbeddingFunc:
# 	return EmbeddingFunc(
# 		embedding_dim=int(os.getenv("EMBEDDING_DIM", "1536")),
# 		max_token_size=int(os.getenv("MAX_EMBED_TOKENS", "8192")),
# 		func=lambda texts: openai_embed(
# 			texts,
# 			model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
# 		),
# 	)


# # ---------- LightRAG factory ----------
# async def _get_rag(working_dir: str) -> LightRAG:
# 	rag = LightRAG(
# 		working_dir=working_dir,
# 		llm_model_func=_llm_model_func,
# 		embedding_func=_embedding_func(),
# 	)
# 	await rag.initialize_storages()
# 	await initialize_pipeline_status()
# 	return rag