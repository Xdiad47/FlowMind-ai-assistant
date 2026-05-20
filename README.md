# FlowMind AI Assistant

FlowMind is an AI Chief-of-Staff style assistant for email and calendar operations.
It combines a FastAPI backend agent layer with a Next.js frontend experience.

## What Is In This Repository

- `backend/` - FastAPI API, auth middleware, integrations, LangGraph agent tools.
- `frontend/` - dedicated frontend codebase (Next.js 14 + TypeScript + Tailwind).

## Core Capabilities

- Natural language assistant for inbox and calendar actions
- Gmail + Google Calendar integration
- Microsoft Calendar + Outlook integration
- Streaming chat responses (SSE)
- User integration state and token persistence in Firebase Firestore

## Tech Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS, NextAuth
- Backend: FastAPI, LangGraph, LangChain
- Data/Auth: Firebase Admin + Firestore, OAuth (Google + Microsoft)

## Run Locally (2 Terminals)

## 1) Backend Terminal

```bash
cd /Volumes/D_Drive/FlowMind
source backend/venv/bin/activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend health URL:

```text
http://localhost:8000/health
```

## 2) Frontend Terminal

```bash
cd /Volumes/D_Drive/FlowMind/frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

## Required Environment Files

## Localhost Files You Must Create

1. `backend/.env`
2. `frontend/.env.local`

## Backend Env (`backend/.env`)

Use `backend/.env.example` as the starting template.

```env
# Server
PORT=8000
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Encryption
MASTER_ENCRYPTION_KEY=your-32-byte-hex-key-here

# Hosted AI (optional, for hosted/pro mode)
PLATFORM_GROQ_API_KEY=
PLATFORM_GEMINI_API_KEY=

# Google OAuth (token refresh)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Shared secret between frontend proxy and backend middleware
INTERNAL_API_SECRET=

# NextAuth secret parity (recommended to keep consistent with frontend)
NEXTAUTH_SECRET=

# Microsoft OAuth
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:8000/auth/microsoft/callback
```

## Frontend Env (`frontend/.env.local`)

Use `frontend/.env.local.example` as the starting template.

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Microsoft OAuth
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=common

# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side use in Next)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Backend routing
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
API_BASE_URL=http://localhost:8000
INTERNAL_API_SECRET=
```

## Production / Server Deployment

Set env values in your hosting provider for each service.
Do not commit real `.env` files.

- Backend server must receive all required values from `backend/.env` list.
- Frontend server must receive all required values from `frontend/.env.local` list.
- Ensure these secrets match across backend and frontend:
  - `INTERNAL_API_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `AZURE_AD_CLIENT_ID`
  - `AZURE_AD_CLIENT_SECRET`
  - `AZURE_AD_TENANT_ID`

Recommended deployment shape:

- Frontend host: Vercel (or any Node host)
- Backend host: Railway/Render/VM with Python 3.11+
- Firestore: shared managed project

## Important Note About `frontend/`

`frontend/` is maintained as a dedicated frontend codebase. If your checkout shows frontend pointer behavior instead of full files, pull/clone the frontend repo into the `frontend` folder and run from there.

## Quick Verification Checklist

1. `http://localhost:8000/health` returns `{"status":"ok"...}`
2. `http://localhost:3000` loads landing page
3. Google sign-in completes
4. Calendar page loads events
5. Chat stream endpoint returns SSE without proxy errors

## Security Basics

- Never commit `.env`, service account keys, or OAuth secrets
- Rotate `NEXTAUTH_SECRET` and `INTERNAL_API_SECRET` for production
- Limit `ALLOWED_ORIGINS` to known domains in production
