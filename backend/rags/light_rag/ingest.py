from typing import Optional
from .utils import init_light_rag, close_light_rag
import openai
async def ingest(text: str, region_code:str):
    """Ingest new text into a region workspace."""
    try:
        rag = await init_light_rag(region_code=region_code)
        await rag.ainsert(input=text)
    except openai.RateLimitError as e:
        # Handle insufficient quota error
        print(f"OpenAI API quota exceeded: {e}")
        # Optionally, re-raise or handle as needed
    finally:
        await close_light_rag(rag)

