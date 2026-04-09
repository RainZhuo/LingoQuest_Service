# LingoQuest Service

Backend service for LingoQuest.

## Run locally

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env`
3. Set Firebase Admin and Gemini credentials
4. Start dev server:
   `npm run dev`

## API

- `GET /api/health`
- `GET /api/users/me`
- `POST /api/lessons/generate`
- `POST /api/chat/tutor`
- `POST /api/progress/lessons/complete`
