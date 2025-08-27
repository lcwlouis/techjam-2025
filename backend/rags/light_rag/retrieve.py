from lightrag import QueryParam
from .utils import init_light_rag, close_light_rag

# lightweight native retrieve function for now
# mode helps decide which workspace to query
# enable_rerank helps decide whether to rerank results
async def lightrag_retrieve(query: str, region: str, mode: str = "naive", enable_rerank: bool = False):
    if mode not in {"naive", "local", "global", "hybrid"}:
        raise ValueError("mode must be one of: naive | local | global | hybrid")
    rag = await init_light_rag(region)
    try:
        # in this function call, only_need_context=True means we only want the context, not the full response from the AI
        # we can change it to false if we want a proper LLM answer
        resp = await rag.aquery(
            query,
            param=QueryParam(mode=mode, enable_rerank=enable_rerank, only_need_context=True),
        )
        return resp
    finally:
        await close_light_rag(rag)
