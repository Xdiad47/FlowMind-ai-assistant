# FlowMind — Your AI Chief of Staff

> Manage your calendar and inbox through natural language. Sign up, connect, and just talk.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| Backend | FastAPI (Python), LangGraph, LangChain |
| Database | Firebase Firestore |
| Auth | NextAuth.js (Google + Microsoft OAuth) |
| AI | OpenAI / Anthropic / Gemini / Groq (BYOK or Hosted) |
| Hosting | Vercel (frontend) + Railway (backend) |

## Architecture

MVVM pattern throughout:
- **View** → Next.js pages + React components
- **ViewModel** → Custom hooks (`useXViewModel`)
- **Model** → TypeScript interfaces + Service layer
- **Backend** → FastAPI routers → Services → LangGraph Agent → Tools

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Firebase project (Firestore enabled)
- Google Cloud project (Calendar + Gmail APIs enabled)

### 1. Clone and install

```bash
cd /Volumes/D_Drive/FlowMind
npm install
```

### 2. Configure environment variables

```bash
# Frontend
cp .env.local.example .env.local
# Fill in: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, Firebase config

# Backend
cp backend/.env.example backend/.env
# Fill in: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, MASTER_ENCRYPTION_KEY
```

### 3. Start development servers

```bash
chmod +x start-all.sh
./start-all.sh
```

### 4. Open browser
→ http://localhost:3000

## Project Structure

```text
FlowMind/
├── src/
│ ├── app/ # Next.js pages (View layer)
│ ├── components/ # UI components (pure presentational)
│ ├── viewmodels/ # Business logic hooks (ViewModel layer)
│ ├── services/ # API + Firestore calls (Model layer)
│ ├── stores/ # Zustand global state
│ ├── models/ # TypeScript interfaces
│ └── lib/ # Utilities, constants, Firebase client
└── backend/
├── routers/ # FastAPI route handlers
├── services/ # Business logic (calendar, gmail, auth)
├── models/ # Pydantic data models
├── middleware/ # Auth + rate limiting
└── agent/ # LangGraph AI agent + tools
```

## Key Features
- 🗣️ Natural language calendar + inbox control
- 🔑 BYOK (Bring Your Own API Key) — zero token markup
- 🔒 AES-256 encrypted key storage
- 📋 Full audit log of every AI action
- ⚡ Real-time SSE streaming responses
- 🛡️ Granular permission controls
