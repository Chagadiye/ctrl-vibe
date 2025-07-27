# Kannadagotta (Know Kannada)
- This is a language learning platform, which currently offers Kannada

## Pre run config
- Fill out `frontend/.env.local` and `backend/.env`

## Run
### Backend
#### Web server
```
cd backend
uv run app.py
```
#### Voice Agents
```
cd backend
uv run run_agent.py download-files
uv run run_agent.py dev
```

### Frontend
```
cd frontend
npm run i
npm run dev
```
