from lightrag import QueryParam
from .utils import init_light_rag, close_light_rag

async def lightrag_retrieve(query: str, region: str, mode: str = "naive", enable_rerank: bool = False):
    if mode not in {"naive", "local", "global", "hybrid"}:
        raise ValueError("mode must be one of: naive | local | global | hybrid")
    rag = await init_light_rag(region)
    try:
        resp = await rag.aquery(
            query,
            param=QueryParam(mode=mode, enable_rerank=enable_rerank, only_need_context=True),
        )
        return resp
    finally:
        await close_light_rag(rag)
