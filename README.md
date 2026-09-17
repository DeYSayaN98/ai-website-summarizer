# AI Website Summariser

Enter any public URL, the app fetches the page's visible text and uses **Groq's LLM API**
(`llama-3.3-70b-versatile`) to generate a short summary.

## Folder structure

```
ai-website-summariser/
├── client/          # React app (Vite)
│   └── src/
│       ├── App.jsx      # UI: URL input, loading state, result display
│       ├── App.css
│       └── main.jsx
├── server/           # Express API
│   └── index.js       # /api/summarize — fetches page, extracts text, calls Groq
└── README.md
```

## Tech stack

- **Frontend:** React 19 + Vite
- **Backend:** Node.js + Express
- **Scraping:** Axios + Cheerio (fetches HTML, strips scripts/styles/nav, extracts visible text)
- **AI:** Groq API (`groq-sdk`), model `llama-3.3-70b-versatile`

A backend is required because browsers block cross-origin fetches of arbitrary websites
(CORS) and the Groq API key must never be exposed client-side.

## Setup

### 1. Get a free Groq API key
Sign up at [console.groq.com](https://console.groq.com) → API Keys → create a new key.

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env and paste your GROQ_API_KEY
npm start
```
Server runs on `http://localhost:5000`.

### 3. Frontend

In a new terminal:
```bash
cd client
npm install
npm run dev
```
Open the printed local URL (usually `http://localhost:5173`). Vite proxies `/api/*` calls
to the backend automatically in dev mode, so no extra config is needed locally.

For a production build:
```bash
npm run build
```
If you deploy the frontend and backend on different domains, set `VITE_API_BASE_URL` in
`client/.env` to your backend's URL (see `client/.env.example`).

## How AI was used in this project

- Groq's `llama-3.3-70b-versatile` model is called server-side in `server/index.js` to
  generate the summary from the extracted page text (system prompt instructs it to
  produce a concise, factual 4-6 sentence summary).
- The extracted text is truncated to ~15,000 characters before being sent to the model to
  stay within context/token limits.
- Claude (Anthropic) was used as a coding assistant to scaffold this project — the React
  UI, Express API, scraping logic, and this README were generated with its help.

## API

`POST /api/summarize`
```json
{ "url": "https://example.com/article" }
```
Response:
```json
{ "title": "Page Title", "summary": "…", "sourceLength": 4213 }
```

## Notes / limitations

- Only works on publicly accessible pages that don't require login or heavy JS rendering
  (content rendered purely client-side via JS won't be captured by the basic HTML fetch).
- No database — this is stateless; each request is summarised fresh.
