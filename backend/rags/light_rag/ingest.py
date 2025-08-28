from typing import Optional

import tenacity

from helper_functions.populate import expand
from .utils import init_light_rag, close_light_rag
import openai

## This is just a simple naive ingest function for now, to integrate Louis' ingestion logic
async def ingest(text: str, region_code:str):
    """Ingest new text into a region workspace."""
    try:
        text = expand(text)
        print(text)
        rag = await init_light_rag(region_code=region_code)
        await rag.ainsert(input=text)

    except tenacity.RetryError as e:
        inner = e.last_attempt.exception()
        return {"status": "error", "reason": "retry_failed during ingestion, likely API error", "detail": str(inner)}

    except Exception as e:
        return {"status": "error","reason": "unexpected error during data ingestion", "detail": str(e)}

    finally:
        await close_light_rag(rag)

