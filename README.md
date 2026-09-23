# Dr. Meow Meow

A full-stack pet health and behavior tracking app, built with React on the frontend, a Node.js/Express REST API on the backend, and a MySQL database, with Firebase handling authentication.

**Live demo: [drmeowmeow.up.railway.app](https://drmeowmeow.up.railway.app/)**

<img src="frontend-react/public/dr_meow_meow_mascot.png" alt="Dr. Meow Meow mascot: a cartoon kawaii Siamese cat in an old-timey doctor uniform, standing in her office" width="180" />

## About

The idea started with my cat, Sunny (aka Bun-bun) — she began having health problems, and I found myself struggling to piece together a timeline: when did this start, how often is it happening, is there a pattern I'm missing? I built the first version of this app to solve that one problem for myself. Since I also enjoy collecting data, it quickly grew into a much larger app for tracking appointments, medications, vaccines, food, and behavior, all backed by a REST API I designed and built from scratch. The goal is for any pet parent to keep their pet's data organized in one place, instead of relying on faulty memory or scattered notes.

## Features

- Email/password and Google sign-in via Firebase Authentication, with account settings (name, email, password, account deletion) managed from the app
- Full profiles for any number of pets: bio info, physical description, birth/adoption/deceased dates, microchip details, and a primary vet
- Appointment scheduling per pet, or across all of a user's pets at once
- Medication, vaccine, health condition, food, and behavior logs, each with its own history per pet
- A private vet and vet-office address book per account
- Every record is scoped to the signed-in user server-side (verified against their Firebase ID token on every request) — no user can read, edit, or delete another user's data
- In-app "unsaved changes" warnings on every form, instead of the browser's native beforeunload prompt

## Tech Stack

**Frontend** — React 19, React Router, Vite, Firebase Auth (client SDK)

**Backend** — Node.js, Express, MySQL (via `mysql2`), Firebase Admin SDK (verifies ID tokens issued to the frontend)

## Project Structure

```
.
├── frontend-react/   React + Vite single-page app
└── backend-rest/     Express REST API
    └── SQLdb/        MySQL schema and connection setup
```

## Getting Started

### Prerequisites

- Node.js
- A MySQL server
- A Firebase project with Email/Password and Google sign-in enabled under Authentication, plus a service account key for the Admin SDK

### 1. Clone and install

```bash
git clone <this-repo-url>
cd "Doctor Meow Meow - pet health tracker"
cd frontend-react && npm install
cd ../backend-rest && npm install
```

### 2. Set up the database

Run `backend-rest/SQLdb/database.sql` against your MySQL server. It creates the `dr_meow_meow` database and all its tables.

### 3. Configure environment variables

**`backend-rest/.env`**

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=
PORT=
GOOGLE_APPLICATION_CREDENTIALS=   # path to your Firebase service account JSON key
```

**`frontend-react/.env`**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_API_BASE_URL=                # e.g. http://localhost:3000
VITE_DEMO_ACCOUNT_EMAIL=          # optional: locks down account settings for one shared demo login
```

### 4. Run it

```bash
# backend-rest/
npm run dev

# frontend-react/
npm run dev
```

## Author

Built by Alice Barnes — [portfolio](https://alicebarnes.vercel.app/) · alice.m.j.barnes@gmail.com
