from fastapi import FastAPI
from typing import List, Optional
from pydantic import BaseModel
from fastapi import Body
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from rags.light_rag.ingest import ingest
from rags.light_rag.retrieve import lightrag_retrieve
from rags.light_rag.utils import build_region_code
from rags.naive_rag.ingest import ingest_file_into_naiverag
from rags.naive_rag.retrieve import naiverag_retrieve_sync
from agents.agent import make_jury_pipeline 

app = FastAPI()

ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "http://localhost",        # backend base
    "https://techjam-2025-techpb.onrender.com",
    "https://techjam-2025-ckm34yt24-lcwlouis-projects.vercel.app",
    "https://techjam-2025.vercel.app",

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,      # if you use cookies/auth
    allow_methods=["*"],         # or ["GET","POST","OPTIONS"]
    allow_headers=["*"],         # or ["Content-Type","Authorization"]
)

# Simple logger so we can see a startup message in stdout
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("techjam")

# logger.info("Starting TechJam backend...")
# logger.info("Ingesting sample files into NaiveRAG...")
# ingest_files_to_region(ingest_directory="/Users/louisliu/Projects/Personal/techjam-2025/backend/input_files", country="US")
# logger.info("Ingestion complete.")

# Static Data to be moved elsewhere
PORT = 80
class Region(BaseModel):
  country: str
  state: Optional[str] = None


class FeatureRequest(BaseModel):
  feature: str
  feature_description: str
  regions: Optional[List[Region]] = None

LIST_OF_AVAILABLE_REGIONS = [
    {"country": "EU", "state": ""},
    {"country": "US", "state": "CA"},
    {"country": "US", "state": "FL"},
    {"country": "US", "state": "UT"},
    {"country": "US", "state": ""}
]


# ------------------------------ SANITY CHECKS --------------------------------
@app.get("/")
async def root():
  return {"message": "Hello World from TechJam"}

# Health checker
@app.get("/health")
async def health_check():
  return {"status": "healthy"}




# Get Endpoint Stand-ins
@app.get("/reasoning_models")
async def get_reasoning_models():
  return {"models": ["model1", "model2", "model3"]}


@app.get("/embedding_models")
async def get_embedding_models():
  return {"models": ["modelA", "modelB", "modelC"]}


@app.get("/instruct_models")
async def get_instruct_models():
  return {"models": ["modelX", "modelY", "modelZ"]}





# POST Endpoint: define request models and accept a single Pydantic body
@app.post("/process_feature")
async def process_feature(payload: FeatureRequest = Body(...)):
  """
  Process a feature with an optional list of regions to check.

  Example body:
  {
    "feature": "f1",
    "feature_description": "desc",
    "regions": [{"country": "US", "state": "CA"}, {"country": "CA"}] # optional if not provided will search all regions
  }
  """
  feature = payload.feature
  feature_description = payload.feature_description
  regions = payload.regions

  if not regions:
    regions = LIST_OF_AVAILABLE_REGIONS

  regions_checked = []
  for r in (regions or []):
    # r may be a dict (from LIST_OF_AVAILABLE_REGIONS or raw JSON) or a Pydantic Region model.
    # Only call .dict() on Pydantic models; copy dicts so we don't mutate the originals.
    if isinstance(r, dict):
      rd = r.copy()
    else:
      rd = r.dict()
    country = rd.get("country")
    state = rd.get("state") or ""  # normalize None -> ""
    # verify if region is within available list (compare normalized country/state)
    is_available = any(
      (item.get("country") == country and (item.get("state") or "") == state)
      for item in LIST_OF_AVAILABLE_REGIONS
    )
    if is_available:
      rd["available"] = True
      rd["reasoning"] = (
        f"Stand-in reasoning for feature '{feature}' in {country}"
        + (f"/{state}" if state else "")
      )
    else:
      rd["available"] = False
      rd["reasoning"] = (
        f"Region {country}" + (f"/{state}" if state else "") + " is not available"
      )
    regions_checked.append(rd)

  return {
    "status": "feature processed",
    "uuid": "some-unique-identifier",
    "report": {
      "feature": feature,
      "description": feature_description,
      "regions_flagged": regions_checked,
    },
  }

@app.post("/process_feature_demo")
async def process_feature(payload: FeatureRequest = Body(...)):
  """
  Process a feature with an optional list of regions to check.

  Example body:
  {
    "feature": "f1",
    "feature_description": "desc",
    "regions": [{"country": "US", "state": "CA"}, {"country": "CA"}] # optional if not provided will search all regions
  }
  """
  feature = payload.feature
  feature_description = payload.feature_description
  regions = payload.regions

  if not regions:
    regions = LIST_OF_AVAILABLE_REGIONS

  regions_checked = []
  for r in (regions or []):
    # r may be a dict (from LIST_OF_AVAILABLE_REGIONS or raw JSON) or a Pydantic Region model.
    # Only call .dict() on Pydantic models; copy dicts so we don't mutate the originals.
    if isinstance(r, dict):
      rd = r.copy()
    else:
      rd = r.dict()
    country = rd.get("country")
    state = rd.get("state") or ""  # normalize None -> ""
    # verify if region is within available list (compare normalized country/state)
    is_available = any(
      (item.get("country") == country and (item.get("state") or "") == state)
      for item in LIST_OF_AVAILABLE_REGIONS
    )
    if is_available:
      rd["available"] = True
      rd["reasoning"] = (
        f"Stand-in reasoning for feature '{feature}' in {country}"
        + (f"/{state}" if state else "")
      )
    else:
      rd["available"] = False
      rd["reasoning"] = (
        f"Region {country}" + (f"/{state}" if state else "") + " is not available"
      )
    regions_checked.append(rd)

  return {
    "status": "feature processed",
    "uuid": "some-unique-identifier",
    "report": {
      "feature": "test feature from demo",
      "description": "test description from demo",
      "regions_flagged": "regions_checked",
    },
  }

@app.post("/human_feedback")
async def human_feedback(feedback: dict = Body(...)):
  """
  Accept human feedback on the processed features.

  Example body:
  {
    "uuid": "some-unique-identifier",
    "region": "US/CA",
    "feedback": "The reasoning for region US/CA is incorrect because..."
  }
  """
  # Here we would process/store the feedback as needed.
  return {
    "status": "feedback received",
    "details": {
      "received_feedback": feedback
    },
  }



# ------------------------------ DEMOS AND TESTING OF INDIVIDUAL FEATURES --------------------------------

@app.get("/demo_lightrag_test")
async def demo_lightrag_test():
    """
    Demo LightRAG usage:
    - Ingest a dummy past conclusion
    - Retrieve similar conclusions for a new query
    """

    region = build_region_code("US", "CA")

    # Step 1: Ingest a past conclusion/decision
    await ingest(
        text=("By default, PF will be turned off for all uses browsing in guest mode."),
        region_code=region
    )
    

    # Step 2: Query back
    resp = await lightrag_retrieve(
        query="Has TikTok violated California privacy law for minors before?",
        region=region,
        mode="hybrid",      # use both local region + HISTORY if available
        enable_rerank=True
    )

    return {
        "region": region,
        "query": "Has TikTok violated California privacy law for minors before?",
        "retrieval_result": resp
    }

# ------------------------------ INGESTION / RETRIEVAL --------------------------------

@app.get("/naiverag_ingest_EU")
async def inject_naiverag(): 
  file_name = "digital_services_act_wiki.txt"   
  ingest_file_into_naiverag(file_name, region="EUOVERALL")

@app.get("/naiverag_ingest_USCA")
async def inject_naiverag(): 
  file_name = "USCA_SB976.txt"   
  ingest_file_into_naiverag(file_name, region="USCA")

@app.get("/naiverag_ingest_USFL")
async def inject_naiverag(): 
  file_name = "florida_state_law.txt"   
  ingest_file_into_naiverag(file_name, region="USFL")

@app.get("/naiverag_ingest_USUT")
async def inject_naiverag(): 
  file_name = "Utah Social Media Regulation Act - Wikipedia.html"   
  ingest_file_into_naiverag(file_name, region="USUT")

@app.get("/naiverag_ingest_US")
async def inject_naiverag(): 
  file_name = "US law on reporting child sexual abuse content to NCMEC.txt"   
  ingest_file_into_naiverag(file_name, region="USOVERALL")

@app.get("/naiverag_ingest_all")
async def injest_naiverag_all():
  file_name = "digital_services_act_wiki.txt"   
  ingest_file_into_naiverag(file_name, region="EUOVERALL")
  file_name = "USCA_SB976.txt"   
  ingest_file_into_naiverag(file_name, region="USCA")
  file_name = "florida_state_law.txt"   
  ingest_file_into_naiverag(file_name, region="USFL")
  file_name = "Utah Social Media Regulation Act - Wikipedia.html"   
  ingest_file_into_naiverag(file_name, region="USUT")
  file_name = "US law on reporting child sexual abuse content to NCMEC.txt"   
  ingest_file_into_naiverag(file_name, region="USOVERALL")


@app.get("/naiverag_retrieve")
async def retrieve_naiverag(): 
    query = "parental consent"
    region = "USCA"  
    k = 3 
    serialized = naiverag_retrieve_sync({"query": query, "region": region, "k": k})
    return {
        "content": serialized
    }

from fastapi import Body, HTTPException
import json

@app.post("/lightrag_ingestion")
async def lightrag_ingestion(payload: dict = Body(...)):
    final_report = payload.get("final_report")
    region_code = (payload.get("region_code") or "").strip()
    if not region_code:
        raise HTTPException(status_code=400, detail="region_code is required")
    if final_report is None:
        raise HTTPException(status_code=400, detail="final_report is required")

    # ensure text string
    if isinstance(final_report, (dict, list)):
        text = json.dumps(final_report, ensure_ascii=False)
    else:
        text = str(final_report)

    try:
        await ingest(text, region_code)  # <-- must await
        return {"status": "ok", "ingested_into": region_code}
    except Exception as e:
        # surface a clean 500 instead of crashing the server
        raise HTTPException(status_code=500, detail=f"Ingest failed: {e}")

# ------------------------------ TERMINOLOGY EXPANSION --------------------------------
from helper_functions import populate
@app.get("/terminology_table")
async def get_terminology_table():
    return populate.TERMINOLOGY_TABLE

@app.post("/update_terminology_table")
async def update_terminology_table(new_terms: dict = Body(...)):
    """
    Update the terminology table with new terms.

    Example body:
    {
      "NEW_TERM": "Definition of the new term",
      "ANOTHER_TERM": "Another definition"
    }
    """
    populate.add_new_terms(new_terms)
    return {"status": "terminology table updated", "updated_terms": new_terms}
  
import uuid
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
# from agents.agent import root_agent
from google.genai import types
from helper_functions.populate import expand
session_service = InMemorySessionService()


# ------------------------------ AGENT.PY TESTER --------------------------------
# @app.post("/demo_agent")
# async def run_jury_pipeline(payload: dict = Body(...)):
#     """
#     a JSON body
#     {
#       "feature_name": "Chat UI Overhaul",
#       "feature_description": "A new chat layout will be tested in the following regions: CA, US, BR, ID. GH will ensure location targeting and ShadowMode will collect usage metrics without user impact.",
#       "region": "USCA"
#     }
#     """
#     feature = expand(payload["feature_name"])
#     description = expand(payload["feature_description"])
    
#     region = payload["region"]

#     naiverag_context = naiverag_retrieve_sync({ "query":description, "region":"US/UT", "k":5})
#     print(naiverag_context)
#     session_id = str(uuid.uuid4())
#     user_id = "demo-user"
#     app_name = "jury-demo"

#     print("happening")
#     await session_service.create_session(
#         app_name=app_name,
#         user_id=user_id,
#         session_id=session_id,
#         state={},  # optional initial state
#     )
    

#     user_query = types.Content(
#         role="user",
#         parts=[
#             types.Part(
#                 text=f"Feature: {feature}\nDescription: {description}\nTarget Region: {region}, Relevant legislation: {naiverag_context}"
#             )
#         ],
#     )

#     # 
#     # runner = Runner(agent=root_agent, session_service=session_service, app_name=app_name)

#     final_output = {"jurors": {}, "final_report": {}}
#     # async for event in runner.run_async(
#     #     user_id=user_id,
#     #     session_id=session_id,
#     #     new_message=user_query,
#     # ):
#         if event.is_final_response():
#             logger.info(f"**Hi I am in IF {event.author}")
#         else:
#             logger.info(f"##Hi I am in else {event.author}")
            
#     session = await session_service.get_session(
#         app_name=app_name,
#         user_id=user_id,
#         session_id=session_id,
#     )
                
#     final_output = {
#         "jurors": {
#             "JuryAgent1": session.state.get("jury_report_1"),
#             "JuryAgent2": session.state.get("jury_report_2"),
#             "JuryAgent3": session.state.get("jury_report_3"),
#             "JuryAgent4": session.state.get("jury_report_4"),
#         },
#         "final_report": session.state.get("final_report"),
#     }

#     return final_output
  
# ------------------------------ FRONT-END TESTER --------------------------------
@app.post("/demo_front")
async def run_jury_pipeline(payload: dict = Body(...)):
    """
    a JSON body
    {
      "feature_name": "Content visibility lock with NSP for EU DSA",
      "feature_description": "To meet the transparency expectations of the EU Digital Services Act",
      "region": { "country": "US", "state": "CA" }
    }
    """
    feature = expand(payload["feature_name"])
    description = expand(payload["feature_description"])
    
    region = payload["region"]
    country = region.get("country")
    state = region.get("state", None)
    
                
    final_output = {
        "jurors": {
            "JuryAgent1": str(description),
            "JuryAgent2": str(country),
            "JuryAgent3": "good",
            "JuryAgent4": str(state),
        },
        "final_report": str(feature),
    }

    return final_output
  
# ------------------------------ CHAT TESTER --------------------------------
from sse_starlette.sse import EventSourceResponse
import json

# ------------------------------ CHAT TESTER --------------------------------
from sse_starlette.sse import EventSourceResponse
import json

from rags.light_rag.utils import build_region_code  # you already import this above

@app.post("/demo_agent_stream")
async def run_jury_pipeline_stream(payload: dict = Body(...)):
    feature = expand(payload["feature_name"])
    description = expand(payload["feature_description"])

    # region in payload is a dict like {"country": "US", "state": "CA"}
    region = payload.get("region") or {}
    country = (region.get("country") or "").strip()
    state = (region.get("state") or "").strip()  # normalize None -> ""

    # Build region code (e.g. "USCA", "EU")
    region_code = build_region_code(country, state) if country else None

    # NEW: get iterations and k from payload (with defaults)
    iterations = int(payload.get("iterations", 3))
    k = int(payload.get("k", 5))

    session_id = str(uuid.uuid4())
    user_id = "demo-user"
    app_name = "jury-demo"

    await session_service.create_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
        state={},
    )

    # Retrieve context from NaiveRAG if region_code is valid
    naive_ctx = ""
    if region_code:
        naive_ctx = naiverag_retrieve_sync({
            "query": description,
            "region": region_code,
            "k": k,   # ✅ dynamic k now
        }) or ""

    naive_ctx = expand(naive_ctx)

    # Build user query content
    user_query = types.Content(
        role="user",
        parts=[types.Part(
            text=(
                f"Feature: {feature}\n"
                f"Description: {description}\n"
                f"Target country: {country or 'N/A'}\n"
                f"Target state: {state or 'N/A'}\n"
                f"{'Relevant legislation:\n' + naive_ctx if naive_ctx else ''}"
            )
        )],
    )

    # ✅ build pipeline with user-chosen iterations
    runner = Runner(
        agent=make_jury_pipeline(iterations),
        session_service=session_service,
        app_name=app_name,
    )

    async def event_generator():
        # Yield retrieval message
        if region_code:
            yield {"event": "message", "data": json.dumps({
                "author": "Context Retriever",
                "final": False,
                "text": f"Retrieved {len(naive_ctx)} characters for {region_code} (k={k})."
            })}

        last_text = None
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_query,
        ):
            text = ""
            if event.content and event.content.parts:
                part = event.content.parts[0]
                if hasattr(part, "text") and part.text is not None:
                    text = str(part.text)

            if not text or not text.strip():
                continue
            if text == last_text:
                continue
            last_text = text

            yield {"event": "message", "data": json.dumps({
                "author": event.author,
                "final": event.is_final_response(),
                "text": text,
            })}

        # After loop, gather final state
        session = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id,
        )
        final_output = {
            "jurors": {
                "JuryAgent1": session.state.get("jury_report_1"),
                "JuryAgent2": session.state.get("jury_report_2"),
                "JuryAgent3": session.state.get("jury_report_3"),
                "JuryAgent4": session.state.get("jury_report_4"),
            },
            "final_report": session.state.get("final_report"),
            "rag": {"region_code": region_code, "naive_count": len(naive_ctx), "k": k},
        }
        yield {"event": "done", "data": json.dumps(final_output)}

    return EventSourceResponse(event_generator())


# Starting the server
if __name__ == "__main__":
  logger.info(f"Starting server on port {PORT}")
  uvicorn.run("main:app", host="0.0.0.0", port=PORT)