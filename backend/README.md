## Endpoints
Base URL: http://localhost:5000 (default when running locally)

### **POST** `/demo_agent_stream`
Main Judge & Jury pipeline (streaming).

- Accepts a JSON body with feature details and parameters.  
- Streams juror, critic, and judge messages via **SSE** until a final report is returned.  

**Example request**
```json
{
  "feature_name": "profile_sharing",
  "feature_description": "Allows teens to share profiles publicly",
  "region": { "country": "US", "state": "CA" },
  "iterations": 3,
  "k": 5,
  "run_id": "uuid-12345"
}
```

**Example streamed responses**
```
event: message
data: {"author": "Juror1", "text": "Flagged CA SB-976 requirements..."}

event: message
data: {"author": "Critic1", "text": "Juror1 missed COPPA obligations..."}

event: done
data: {
  "final_report": {
    "feature": "profile_sharing",
    "region_code": "USCA",
    "citations": [
      {"law": "California SB-976", "clause": "Section 2(a)"}
    ],
    "requires_compliance": true
  }
}
```

---

### **POST** `/update_terminology_table`
Add or update terminology mappings.

**Example request**
```json
{
  "terms": {
    "SB-976": "California Age-Appropriate Design Code",
    "DSA": "EU Digital Services Act"
  }
}
```

**Example response**
```json
{
  "status": "terminology table updated",
  "updated_terms": {
    "SB-976": "California Age-Appropriate Design Code",
    "DSA": "EU Digital Services Act"
  }
}
```

---

### **GET** `/terminology_table`
Retrieve the current terminology mappings.

**Example response**
```json
{
  "terms": {
    "SB-976": "California Age-Appropriate Design Code",
    "DSA": "EU Digital Services Act",
    "COPPA": "Children's Online Privacy Protection Act"
  }
}


