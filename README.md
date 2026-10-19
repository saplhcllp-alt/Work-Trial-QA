# Harshwal BRD Portal — QA Work Trial

A deliberately imperfect internal web app used to **evaluate QA engineer
candidates**. Harshwal consultants use it to capture a client's Business
Requirements Document (BRD) for **Audit**, **Tax**, or **Accounting**
engagements, generate a **shareable link**, let the client fill in their
requirements, and export the BRD as a **PDF**.

The application intentionally contains functional and **security** defects.
The candidate's job is to find, document, and prioritise them.

> ⚠️ This app is intentionally vulnerable. Run it **only** on an isolated/local
> machine. Never deploy it to a public network.

## Tech stack

| Layer     | Technology            |
| --------- | --------------------- |
| Frontend  | React (Vite)          |
| Backend   | Python (Flask)        |
| Database  | MongoDB               |
| Packaging | Docker / docker-compose |

## Project layout

```
.
├── backend/            # Flask API (segregated)
│   ├── routes/         # auth, brd, share, pdf blueprints
│   ├── app.py          # app factory + CORS
│   ├── auth.py         # JWT helpers
│   ├── db.py           # pymongo connection
│   ├── init-mongo.js   # seed data (runs on first db boot)
│   └── Dockerfile
├── frontend/           # React SPA (segregated)
│   ├── src/pages/      # Login, TwoFactor, Dashboard, BrdEditor, PublicForm
│   ├── src/api.js
│   └── Dockerfile
├── docker-compose.yml
```

## Run it

```bash
docker compose up --build
```

Then open:

- **App (consultant):** http://localhost:3000
- **API health:** http://localhost:5000/api/health

### Demo accounts

| Role       | Email                     | Password       |
| ---------- | ------------------------- | -------------- |
| Admin      | `admin@sample.com`      | `Sample@123` |
| Consultant | `consultant@sample.com` | `Welcome@1`    |

Login is two-step (password → 6-digit code). For demo convenience the current
build surfaces the code in the UI — that itself is one of the things a sharp
candidate should notice.

### Typical happy path

1. Sign in → enter the 2FA code.
2. On the dashboard, create a BRD (pick Audit / Tax / Accounting).
3. Open the BRD, fill the requirement sections, **Save**.
4. **Generate shareable link** → copy the `/form/<token>` URL.
5. Open that link (incognito / logged out) as "the client", submit requirements.
6. Back in the BRD, view the submission and **Download PDF**.

## Running without Docker (optional)

Backend:

```bash
cd backend
pip install -r requirements.txt
# start a local MongoDB, then seed it:
#   mongosh "mongodb://localhost:27017/harshwal_brd" init-mongo.js
# and set MONGO_URI to point at it (default expects the docker service "db").
export MONGO_URI="mongodb://localhost:27017/harshwal_brd"
python app.py
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```
#   W o r k - T r i a l - _ - Q A 
 
 
