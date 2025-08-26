"""
LightRAG and NaiveRAG retrieval helpers with region-based workspaces.

Region/workspace scheme:
- Region codes are uppercase strings like "USCA" (country+state) or "USOVERALL" (no state).
- Special region "HISTORY" maps to a dedicated workspace for global history.

Environment variables (optional overrides):
- LIGHTRAG_WORKSPACES_DIR: base directory for workspaces (default: "./lightrag_workspaces")
- LLM_MODEL, LLM_BINDING_API_KEY|OPENAI_API_KEY, LLM_BINDING_HOST
- EMBEDDING_MODEL, EMBEDDING_BINDING_HOST, EMBEDDING_DIM, MAX_EMBED_TOKENS
"""

from __future__ import annotations

import asyncio
import inspect
import os
from typing import AsyncGenerator, Optional, Union

from dotenv import load_dotenv
from lightrag import LightRAG, QueryParam
from lightrag.llm.openai import openai_complete_if_cache, openai_embed
from lightrag.utils import EmbeddingFunc
from lightrag.kg.shared_storage import initialize_pipeline_status

from langchain_core.tools import tool


# Load .env if present (safe no-op if not found)
load_dotenv(dotenv_path=os.getenv("DOTENV_PATH", ".env"), override=False)


# ---------- Workspace helpers ----------
def get_workspaces_root() -> str:
	"""Return the base directory for LightRAG workspaces."""
	return os.getenv("LIGHTRAG_WORKSPACES_DIR", "./lightrag_workspaces")

def get_input_workspaces_root() -> str:
    """Return the base directory for LightRAG input workspaces."""
    return os.path.join(get_workspaces_root(), "./input_files")


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


def resolve_workspace(region_code: str) -> str:
	"""Map a region code to its workspace directory path.

	Special case: 'HISTORY'.
	"""
	if not region_code:
		raise ValueError("region_code is required")
	code = region_code.strip().upper()
	root = get_workspaces_root()
	# HISTORY is a dedicated global workspace for historical feature flagged
	subdir = "HISTORY" if code == "HISTORY" else code
	path = os.path.abspath(os.path.join(root, subdir))
	os.makedirs(path, exist_ok=True)
	return path

def resolve_input_workspace(region_code: str) -> str:
	"""Map a region code to its input workspace directory path."""
	if not region_code:
		raise ValueError("region_code is required")
	code = region_code.strip().upper()
	root = get_input_workspaces_root()
	# HISTORY is a dedicated global workspace for historical feature flagged
	subdir = "HISTORY" if code == "HISTORY" else code
	path = os.path.abspath(os.path.join(root, subdir))
	os.makedirs(path, exist_ok=True)
	return path


# ---------- LLM and embedding adapters ----------
async def _llm_model_func(
	prompt: str,
	system_prompt: Optional[str] = None,
	history_messages: list = [],
	keyword_extraction: bool = False,
	**kwargs,
) -> str:
	"""LLM function for LightRAG with OpenAI-compatible APIs (DeepSeek, etc.)."""
	return await openai_complete_if_cache(
		os.getenv("LLM_MODEL", "deepseek-chat"),
		prompt,
		system_prompt=system_prompt,
		history_messages=history_messages,
		api_key=os.getenv("LLM_BINDING_API_KEY") or os.getenv("OPENAI_API_KEY"),
		base_url=os.getenv("LLM_BINDING_HOST", "https://api.deepseek.com"),
		**kwargs,
	)


def _embedding_func() -> EmbeddingFunc:
	return EmbeddingFunc(
		embedding_dim=int(os.getenv("EMBEDDING_DIM", "1536")),
		max_token_size=int(os.getenv("MAX_EMBED_TOKENS", "8192")),
		func=lambda texts: openai_embed(
			texts,
			model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
		),
	)


# ---------- LightRAG factory ----------
async def _get_rag(working_dir: str) -> LightRAG:
	rag = LightRAG(
		working_dir=working_dir,
		llm_model_func=_llm_model_func,
		embedding_func=_embedding_func(),
	)
	await rag.initialize_storages()
	await initialize_pipeline_status()
	return rag


# ---------- Retrieval: LightRAG (local/global/hybrid) ----------
async def lightrag_retrieve(
	query: str,
	region: str,
	*,
	mode: str = "hybrid",
	stream: bool = False,
	enable_rerank: bool = False,
) -> Union[str, AsyncGenerator[str, None]]:
	"""Run a LightRAG query for a given region.

	mode: one of 'naive' | 'local' | 'global' | 'hybrid'
	If stream=True, returns an async generator yielding string chunks; else returns a string.
	"""
	if mode not in {"naive", "local", "global", "hybrid"}:
		raise ValueError("mode must be one of: naive | local | global | hybrid")

	workspace = resolve_workspace(region)
	rag = await _get_rag(workspace)

	try:
		resp = await rag.aquery(query, param=QueryParam(mode=mode, stream=stream, enable_rerank=enable_rerank, only_need_context=True))
		# If stream requested, return the async generator as-is
		if stream and inspect.isasyncgen(resp):
			async def _gen():
				async for chunk in resp:
					if chunk:
						yield chunk
			return _gen()
		# Otherwise return the string response
		return resp  # type: ignore[return-value]
	finally:
		await rag.finalize_storages()

@tool(description="This is a graph query tool that let's you search the historical records other features that has been flagged. You can use this as reference for where to direct your attention in your research." ,response_format="content_and_artifact")
def lightrag_retrieve_sync(
	query: str,
	# region: str,
	*,
	mode: str = "hybrid",
	enable_rerank: bool = False,
) -> str:
	"""Synchronous wrapper for lightrag_retrieve (non-streaming)."""
	region = "OVERALL"
	return asyncio.run(
		lightrag_retrieve(query, region, mode=mode, stream=False, enable_rerank=enable_rerank)  # type: ignore[arg-type]
	)


# ---------- Retrieval: NaiveRAG (LightRAG in 'naive' mode) ----------
async def naive_rag_retrieve(
	query: str,
	region: str,
	*,
	stream: bool = False,
) -> Union[str, AsyncGenerator[str, None]]:
	"""Run a minimal retrieval by delegating to LightRAG in 'naive' mode for the region."""
	return await lightrag_retrieve(query, region, mode="naive", stream=stream)


def naive_rag_retrieve_sync(query: str, region: str) -> str:
	"""Synchronous wrapper for naive retrieval (non-streaming)."""
	return asyncio.run(naive_rag_retrieve(query, region, stream=False))


__all__ = [
	"build_region_code",
	"resolve_workspace",
    "resolve_input_workspace",
	"lightrag_retrieve",
	"lightrag_retrieve_sync",
	"naive_rag_retrieve",
	"naive_rag_retrieve_sync",
]

