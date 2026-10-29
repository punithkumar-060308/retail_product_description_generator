# Descripto AI — Retail Product Description Generator

> **TCS Technology Day Project**  
> An enterprise-grade, grounded Generative AI studio that transforms structured retail product attributes into high-converting, tone-calibrated, and SEO-optimized product copy at scale.

---

## 🌟 Key Features

1. **Strict Factual Grounding (Zero Hallucination Policy):**
   - Incorporates verified product facts only (materials, specifications, battery life, features).
   - Prohibits fabricated certifications, warranties, or medical/performance claims.
   - Automated post-generation audit flagging any unverified phrases.

2. **Multi-Tone Brand Voice Calibration:**
   - **Friendly:** Warm, conversational, welcoming, and lifestyle-oriented.
   - **Professional:** Authoritative, informative, precise, and utilitarian.
   - **Premium:** Luxurious, evocative, curated, and elevated vocabulary.
   - **Minimal:** Direct, punchy, essential benefits with zero filler.
   - **Urgent / Persuasive:** Action-driven, energetic, and high-conversion.

3. **Complete SEO Suite:**
   - 1-2 sentence short customer summary hooks.
   - Multi-paragraph detailed merchandising copy.
   - Google SERP search snippet preview with dynamic character counter (enforces $\le 160$ chars).
   - High-intent SEO keyword extraction.

4. **Bulk CSV Processing (50+ Products Tested):**
   - Ingests catalogs of 50+ items in seconds.
   - Bundled **55-product e-commerce sample catalog** (`data/sample_products.csv`) for instant 1-click testing.
   - Robust column mapping (`name`, `category`, `features`, `price`, `tone`, etc.).
   - Full CSV export with one click.

5. **Human Quality Evaluation & Rubric:**
   - Six-dimension evaluation rubric (Factual Accuracy, Relevance, Creativity, Readability, SEO Quality, Tone Consistency).
   - Interactive 1–5 star rating system with live composite percentage calculation.
   - Meets and exceeds the TCS quality benchmark target of **≥ 85%** (Observed average: **97.7%**).

6. **Transparent Provenance:**
   - Clearly differentiates real **Google Gemini LLM** outputs (`gemini-llm`) from the **Deterministic Grounded Fallback Engine** (`grounded-fallback`).

---

## 🏗️ Repository Architecture

```text
retail-product-description-generator/
├── frontend/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── SingleProductStudio.jsx
│   │   │   ├── BulkBatchProcessor.jsx
│   │   │   ├── QualityRubricView.jsx
│   │   │   ├── DocsArchitectureView.jsx
│   │   │   └── SettingsModal.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css             # Vanilla CSS design system & micro-interactions
│   ├── package.json
│   └── index.html
├── backend/                      # Python + FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py         # REST endpoints
│   │   ├── schemas/
│   │   │   └── product.py        # Pydantic validation models
│   │   ├── services/
│   │   │   ├── generation.py     # Gemini LLM & Grounded fallback engine
│   │   │   ├── prompt_builder.py # Strict grounding & tone prompts
│   │   │   └── csv_service.py    # CSV batch processing & export
│   │   └── main.py               # FastAPI entrypoint & CORS
│   ├── tests/
│   │   └── test_api.py           # Automated Pytest suite (15 tests)
│   ├── requirements.txt
│   └── .env.example
├── data/
│   ├── sample_products.csv       # 55 diverse retail products benchmark
│   └── README.md
├── docs/
│   └── evaluation.md             # Quality rubric & benchmark report
├── .gitignore
├── implementation (1).md
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.10+** (Python 3.14 tested)
- **Node.js v18+** (Node v24 tested) & npm

---

### Step 1: Start the Backend (FastAPI)

1. Open a terminal in `backend/`:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Configure backend environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
     On Windows PowerShell, use `Copy-Item .env.example .env`.
   - In `backend/.env`, replace the `USERNAME`, `PASSWORD`, and `YOUR_CLUSTER` placeholders in `MONGODB_URI` with your MongoDB Atlas database user credentials and cluster hostname. Set `MONGODB_DB_NAME` to the database you want to use (the default is `retail_generator`). Keep `.env` local and never commit it. Ensure your Atlas network access rules allow connections from the machine running the backend.
   - Optionally add your Google Gemini API key:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     GEMINI_MODEL=gemini-2.0-flash
     ```
   - MongoDB is required for retailer accounts and evaluation feedback; the backend will not start without a working `MONGODB_URI`.
   - Existing accounts in `backend/retail_generator.db` are imported into MongoDB during startup. The legacy SQLite database is only read for this one-time migration; all new and updated data is stored in MongoDB.
   > **Note:** If no API key is provided, the system runs automatically in **Grounded Fallback Mode** with 100% functionality and transparent provenance labeling.

3. Launch the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   Backend will be running at: `http://127.0.0.1:8000`  
   Interactive Swagger docs: `http://127.0.0.1:8000/docs`

   Check `http://127.0.0.1:8000/health` and confirm `database.connected` is `true`. The response includes the active database name; new accounts are stored in that database's `users` collection (by default, `retail_generator.users`).

   If the frontend is deployed, it sends requests to the backend URL configured by `VITE_API_BASE_URL` at build time. Set the backend's `MONGODB_URI` and `MONGODB_DB_NAME` in that backend host's environment settings as well; configuring a local `.env` does not change where a deployed frontend's registrations are stored.

---

### Step 2: Start the Frontend (React + Vite)

1. Open a new terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open your browser at:
   ```
   http://localhost:5173
   ```

---

## 🧪 Running Automated Tests

Run the full automated pytest suite verifying schema validation, 50+ row CSV batch processing, tone generation, and feedback storage:

```bash
cd backend
python -m pytest tests -v
```

All 15 tests execute and pass in ~1 second.

---

## 📊 Quality Evaluation Rubric (TCS Target: ≥ 85%)

| Criterion | Target | Observed Benchmark Score |
| :--- | :---: | :---: |
| **1. Factual Accuracy** | High | **5.0 / 5.0** |
| **2. Product Relevance** | High | **5.0 / 5.0** |
| **3. Copy Creativity** | Standard | **4.8 / 5.0** |
| **4. Prose Readability** | Standard | **5.0 / 5.0** |
| **5. SEO & Meta Length ($\le$ 160)** | High | **4.8 / 5.0** |
| **6. Tone Consistency** | High | **5.0 / 5.0** |
| **Composite Percentage** | **$\ge$ 85%** | **97.7%** |

Refer to [docs/evaluation.md](docs/evaluation.md) for detailed scoring criteria, conversion formulas, and benchmark records.

---

## 🔒 Security & Privacy Notes

- API keys remain strictly on the backend in environment variables.
- Untrusted user input is treated as data, preventing prompt injection attacks.
- File uploads are validated with 10MB limits, type checks, and row validations.
- No confidential, personal, or proprietary retail data is collected.
