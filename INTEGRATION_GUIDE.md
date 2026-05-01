# MORESCO-1 Integrated System Guide

This project now runs as one integrated system. The easiest setup is Docker:

- App URL: `http://localhost:5173`
- API inside the same app: `http://localhost:5173/api`
- PostgreSQL container managed by Docker Compose

## Docker Setup

Install Docker Desktop, then run this from the project root:

```bash
docker compose up --build
```

Open:

```text
http://localhost:5173
```

The app container automatically:

- installs dependencies during image build
- generates Prisma Client
- builds the React frontend
- waits for Postgres to be healthy
- applies Prisma migrations
- seeds default users
- starts the Express server
- serves both the frontend and API

Seeded login accounts:

- `andrei.valdez` / `moresco2024`
- `admin` / `admin123`
- `nurse1` / `nurse123`

To stop the system:

```bash
docker compose down
```

To stop and delete the database/upload volumes:

```bash
docker compose down -v
```

## Manual Local Setup

Use this only if you do not want Docker.

This project can also run locally as:

- React/Vite frontend on `http://localhost:5173`
- Express API backend on `http://localhost:5000`
- PostgreSQL database managed by Prisma
- Uploaded patient and record photos stored in `uploads/`

### 1. Prepare PostgreSQL

Create a PostgreSQL database named `moresco_health`.

Example using `psql`:

```bash
createdb moresco_health
```

### 2. Configure Environment

Copy `.env.example` to `.env` in the project root.

```bash
copy .env.example .env
```

Edit `.env` and update `DATABASE_URL` with your PostgreSQL username, password, host, port, and database name.

### 3. Install Dependencies

```bash
npm install
```

### 4. Create Database Tables

```bash
npm run db:migrate
```

This applies the Prisma migration in `prisma/migrations`.

### 5. Seed Login Accounts and Sample Data

```bash
npm run db:seed
```

### 6. Start the Backend API

Open one terminal in the project root and run:

```bash
npm run server
```

Check the API at:

```text
http://localhost:5000/api/health
```

### 7. Start the Frontend

Open a second terminal in the project root and run:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Features Connected

- Login uses backend JWT authentication.
- Patients load from PostgreSQL.
- Add Patient saves to the database.
- Patient photos upload to `uploads/patients`.
- Health tab blood type, allergies, and chronic conditions save to the database.
- Health records load per patient.
- New health records save to the database.
- Health record edits and photo uploads persist.
- Health record delete removes the database row.
- Disease statistics API is available at `GET /api/records/stats/diseases`.

## Verification Commands

```bash
npm run lint
npm run build
```

Both commands should pass before deployment.
