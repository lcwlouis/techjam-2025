# ⚖️ JurAI - Automating Geo-Regulation with LLM

## 🌍 Problem
Building products for a global audience means every new **feature** might trigger region-specific regulations (e.g., California SB-976, EU DSA, GDPR).  
- Manual compliance checks = **slow, expensive, inconsistent**  
- Laws are constantly changing → high risk of **missing obligations**  
- Teams need a way to **screen features early** with **traceable evidence**  

-
## 🚀 Our Solution
We built a **multi-agent AI pipeline** that acts like a **Judge + Jury for compliance**.  
Given a **feature description** and a **region**, it produces a **structured JSON report** with:  
- Whether geo-specific compliance logic is required  
- Relevant law **clauses & citations**  
- Clear reasoning that’s **human-auditable**  
---

## 🔑 Key Features
- **Dual Rag Retrieval**  
  - *Past Verdicts*: broad coverage with vector similarity search  
  - *Relevant Legislature*: sharp precision via structured entity retrieval  
  
- **Multi-Agent Consensus Architecture**  
  - *Jury Agents*: independently analyze the feature for a region  
  - *Critics*: each Jury has a personal Critic Agent that reviews its draft, highlights flaws, and forces an iterative self-improvement loop  
  - *Judge (Final Response Agent)*: merges Jury outputs, resolves conflicts, deduplicates citations, and gives a final verdict  
  👉 Result: **robust, bias-resistant outputs**  

- **Diversity via Different LLMs**  
  - Jury 1 may run on **DeepSeek**  
  - Jury 2 may run on **GPT-5-mini**  
  - Critics and Judge can mix models  
  👉 This ensures no single LLM’s blind spots dominate the outcome  

- **Structured & Auditable Outputs**  
  - Reports are pure JSON (not free text)  
  - Every claim is backed with **citations** from retrieved laws  
  - Easy for both **legal reviewers** and **CI/CD pipelines** to consume  

---

## 🛠️ Workflow
```mermaid
flowchart TD
  A[User submits feature + region] --> B[Root Agent]
  B --> C[NaiveRAG retrieval]
  B --> D[LightRAG retrieval]

  C --> E1[Jury Agent 1]
  D --> E1
  E1 --> F1[Critic Agent 1]
  F1 --> E1
  E1 --> G

  C --> E2[Jury Agent 2]
  D --> E2
  E2 --> F2[Critic Agent 2]
  F2 --> E2
  E2 --> G

  G[Final Response Agent (Judge)] --> H[Consolidated JSON Report w/ citations]
  H --> I[Frontend display]
```

**Step-by-step**  
1. **Retrieval:** Both NaiveRAG and LightRAG fetch legal text for the region  
2. **Juries:** Each Jury Agent analyzes with its assigned LLM  
3. **Critics:** Review Jury drafts, force corrections until quality is high  
4. **Judge:** Merges Jury outputs, resolves conflicts, deduplicates evidence  
5. **Result:** One auditable, clause-backed compliance report  

---

## 📂 Repo Structure
```
.
├── frontend/      # Next.js UI (feature input + report display)
├── backend/       # Google ADK agents (Jury, Critics, Judge, RAG tools)
└── README.md      # This file
```

Each subfolder has its own README with setup instructions.

---

## 🎯 Hackathon Advantages
- ⚡ **Speed** → First-pass compliance check in minutes, not weeks  
- 🧩 **Modular agents** → Easy to add new regions/laws  
- 🔍 **Transparency** → Every verdict is clause-backed  
- 🧠 **Robust AI** → Jury + Critic loops across different LLMs  
- 💡 **Wow factor** → Judges literally watch AI “reason” like a courtroom  

---

## 🚦 Next Steps
- Expand to more jurisdictions (APAC, LATAM)  
- Integrate live legal update feeds  
- Benchmark against human lawyers  

---

✨ With Judge/Jury, compliance isn’t a bottleneck — it’s **automated, diverse, and auditable**.
