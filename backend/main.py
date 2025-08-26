from fastapi import FastAPI
from typing import List, Optional
from pydantic import BaseModel
from fastapi import Body
import uvicorn
import logging

app = FastAPI()

# Simple logger so we can see a startup message in stdout
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("techjam")

# Static Data to be moved elsewhere
PORT = 8000
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


# Root endpoint
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

# Starting the server
if __name__ == "__main__":
  logger.info(f"Starting server on port {PORT}")
  uvicorn.run("main:app", host="0.0.0.0", port=PORT)