# TechJam — Judge Jury Analysis Backend

This README documents the backend for the TechJam project (Judge / Jury framework + RAG helpers). It is focused on the backend API only — the repository contains a minimal, hard-coded `main.py` that provides stub endpoints so the frontend can integrate and iterate while agents and retrieval components are implemented.

## Quick plan / what this README contains
- Short overview of the problem and intended pipeline
- Available endpoints (what the frontend can call today)
- Data models used by the API
- Startup and development instructions (Python + uvicorn)
- Status checklist mapping user requirements to current implementation

## Problem summary (high level)
The goal is to build a Judge / Jury pipeline where multiple LLMs produce reports on whether a proposed feature or scenario meets geo-specific requirements. A consolidator (judge) model summarizes multiple reports into a consolidated result that the user can accept or reject. If rejected, jurors are re-instructed and the loop continues.

Other important pieces:
- Custom terminology/jargon replacement support via a terminology table or hash table
- RAG (retrieval-augmented generation) for legal documents / past cases (LightRAG is a candidate)
- A store of past case studies to enable similarity-based retrieval

## Pipeline (concept)
1. User submits a feature scenario (text input)
2. Juror models (multiple LLMs) generate individual reports
3. Consolidator model summarizes reports into a consolidated report
4. User accepts/rejects consolidated report
   - If rejected: consolidator formats a re-query to jurors and repeat
5. Optionally enrich juror queries with custom terminology and past-case context (RAG)

## What is implemented
- A minimal FastAPI application (`main.py`) with hard-coded behaviour so the frontend can send requests and see plausible responses.
- Endpoints implemented as stubs / stand-ins for full agent behaviour.

**Note: The actual agents (jurors, consolidator, RAG retrieval, LightRAG integrations, etc.) are not implemented yet — these are planned next steps.**

## Endpoints (available now)
Base URL: http://localhost:5000 (default when running locally)

- GET / => Basic hello message
  - Response: {"message": "Hello World from TechJam"}

- GET /health => Health check
  - Response: {"status": "healthy"}

- GET /reasoning_models => Returns a list of placeholder reasoning models
  - Response: {"models": ["model1", "model2", "model3"]}

- GET /embedding_models => Returns a list of placeholder embedding models
  - Response: {"models": ["modelA", "modelB", "modelC"]}

- GET /instruct_models => Returns a list of placeholder instruct models
  - Response: {"models": ["modelX", "modelY", "modelZ"]}

- POST /process_feature => Main feature processing endpoint (stub)
  - Accepts a JSON body matching the `FeatureRequest` model (see Data models below)
  - Behaviour: If `regions` is omitted, the server checks the feature against a small hard-coded list of regions and returns stand-in reasoning per region.
  - Example request body:

```json
{
  "feature": "example_feature",
  "feature_description": "This feature does X and may collect personal data",
  "regions": [{"country": "US", "state": "CA"}, {"country": "EU"}]
}
```

  - Example response (trimmed):

```json
{
  "status": "feature processed",
  "uuid": "some-unique-identifier",
  "report": {
    "feature": "example_feature",
    "description": "This feature does X and may collect personal data",
    "regions_flagged": [
      {"country":"US","state":"CA","available":true,"reasoning":"Stand-in reasoning..."},
      {"country":"EU","state":"","available":true,"reasoning":"Stand-in reasoning..."}
    ]
  }
}
```

- POST /human_feedback => Accepts human feedback for a processed report
  - Example body:

```json
{
  "uuid": "some-unique-identifier",
  "region": "US/CA",
  "feedback": "The reasoning for region US/CA is incomplete because..."
}
```

  - Response: acknowledgement with the received payload.

## Data models (in `main.py`)
- Region: { country: string, state?: string }
- FeatureRequest: { feature: string, feature_description: string, regions?: Region[] }

There is a small in-file constant `LIST_OF_AVAILABLE_REGIONS` used by the stub logic. The endpoint accepts either Pydantic `Region` models or plain dicts in requests.

## Startup / development (macOS, zsh)
Prerequisites:
- Python 3.12+ (pyproject specifies >=3.12)
- git (optional)

Recommended quickstart:

```bash
# create and activate venv
python3 -m venv .venv
source .venv/bin/activate

# install dependencies
pip install -r requirements.txt

# run the server (option A: direct via python)
python main.py

# or (option B: run via uvicorn directly for reload options)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# or (option C: run using the `uv` CLI if you prefer a shorter alias)
If you have the `uv` command installed (a short wrapper/alias for `uvicorn`), you can also run:

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
```

The server prints a startup logger line and will listen on port 8000 by default (see `PORT` in `main.py`). The frontend can call the endpoints above while the agents are being developed.

## Development notes / where to add agents
- `main.py` is intentionally minimal. The flow to implement next:
  1. Replace the per-region placeholder logic in `/process_feature` with orchestration that:
     - Calls multiple juror LLMs (or local wrappers) to produce individual reports
     - Runs a consolidator LLM (judge) to summarise the juror outputs
     - Stores intermediate reports and a uuid for re-querying
  2. Add persistence for reports and human feedback (DB or local store)
  3. Implement RAG retrieval for past cases (consider LightRAG / graph retrieval)
  4. Add endpoints to manage terminology table (create/update/list) and past-case ingestion

## Good-to-have features (next milestones)
- Terminology management endpoints (add/replace jargon entries)
- Parent-document retrieval for RAG (see links below)
- Integrate LightRAG for graph retrieval of past cases
- Support multiple LLM backends (OpenAI, Anthropic, local LLMs) via adapter layer
- Add unit tests around orchestration and retrieval components

Helpful references:
- LangChain RAG tutorial: https://python.langchain.com/docs/tutorials/rag/#setup
- Parent document retriever: https://python.langchain.com/docs/how_to/parent_document_retriever/
- LightRAG: https://github.com/HKUDS/LightRAG
- Round Table Debate: https://arxiv.org/html/2504.13079v1

## Requirements coverage
- Judge / Jury Framework: Planned — stubs in place to integrate jurors & consolidator (POST `/process_feature`) — Status: Planned
- Custom terminology / jargon replacement: Planned — no endpoints yet — Status: Planned
- RAG / past-case store: Planned — references and design notes included — Status: Planned
