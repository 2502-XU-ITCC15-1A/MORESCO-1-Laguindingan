# Moresco 1 Employee Health Information Tracking and Management System

<div align="center">

  <h3>Employee Health Records, Patient Profiles, and Disease Monitoring</h3>

  ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

</div>

---

## Overview

The **Moresco 1 Employee Health Information Tracking and Management System** helps administrators and company nurses manage employee patient profiles, medical records, uploaded photos, health details, and common disease statistics from one web application.

The system supports:

- Patient creation with required personal details, address, height, weight, sex, and photo
- Patient profile viewing with personal information, address, BMI, health data, and record history
- Health record creation, editing, deletion, filtering, diagnosis tracking, and photo attachments
- Common disease statistics in the dashboard drawer
- Disease dictionary management for HR Admin and Company Nurse
- Role-aware access for patient editing, health record editing, and disease management

---

## Technology Stack

### Frontend

- **React** for the user interface
- **Vite** for local development and builds
- **React Bootstrap** for modals
- **Material UI Drawer** for the side dashboard drawer

### Backend

- **Node.js + Express** for the API server
- **PostgreSQL** for persistent storage
- **pg** for direct database access
- **Multer** for uploaded patient and record photos
- **JWT** for authentication

---

## Project Structure

```text
MORESCO-1-Laguindingan/
|-- README.md
|-- package.json
|-- docker-compose.yml
|-- Dockerfile
|-- server/
|   |-- db-init.js
|   |-- db.js
|   |-- docker-start.js
|   |-- index.js
|   |-- middleware/
|   |-- routes/
|   |-- seed.js
|   `-- utils/
`-- src/
    |-- App.jsx
    |-- api/
    |-- assets/
    |-- components/
    `-- pages/
```

---

## Getting Started

### Prerequisites

- Node.js 18 or newer
- PostgreSQL database
- npm

### Installation

```bash
npm install
```

If `npm install` fails with a temporary network error such as `ECONNRESET`, retry it. Docker can still run the app independently after a successful image build.

Create a `.env` file in the project root and configure your database and authentication secret:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
JWT_SECRET="replace-with-a-secure-secret"
JWT_EXPIRES_IN="8h"
CLIENT_ORIGIN="http://localhost:5173"
PORT=5000
```

Initialize the database schema and seed data:

```bash
npm run db:init
npm run db:seed
```

Start the backend server:

```bash
npm run server
```

Start the frontend in another terminal:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:5173
```

### Docker Setup

Run the full app with Docker:

```bash
docker compose up -d --build
```

This starts:

- PostgreSQL on `localhost:5432`
- The app on `http://localhost:5173`

To stop it:

```bash
docker compose down
```

---

## Default Login

After seeding, use:

```text
Username: admin
Password: admin123
```

```text
Username: nurse1
Password: nurse123
```

---

## How to Operate the System

### Log In

1. Open `http://localhost:5173`.
2. Enter the administrator or nurse credentials.
3. After login, the system redirects to the Patients page.

### Add a Patient

1. Click the `+` action button in the lower-right corner.
2. Select `Add Patient`.
3. Fill in Basic Info.
4. Fill in Permanent and Present Address.
5. Upload the required patient photo.
6. Click `Save Patient`.

### View a Patient Profile

1. Click a patient card on the Patients page.
2. Review the patient's photo, personal information, address, BMI, health details, and records.
3. Company Nurse can edit patient details and records.
4. HR Admin can view only.

### Manage Health Records

1. Open a patient profile.
2. Company Nurse can click `New` to add a health record.
3. Open a record accordion to view details.
4. Company Nurse can edit or delete a record.
5. HR Admin can view records only.
6. Use `Month` and `Year` filters to narrow the displayed records.

### Manage Diseases

1. Open the `Diseases` action from the floating action menu.
2. HR Admin and Company Nurse can add diseases.
3. HR Admin and Company Nurse can delete diseases.

### View Disease Statistics

1. Click the `Patients` badge in the top navigation.
2. Use the month selector in the right drawer to filter common disease counts.

### Log Out

1. Click the profile name in the top-right corner.
2. Click `Logout` in the mini profile menu.

---

## Useful Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite frontend |
| `npm run server` | Start the Express backend |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Run ESLint |
| `npm run db:init` | Initialize PostgreSQL tables |
| `npm run db:seed` | Seed default data |

---

## Notes

- Uploaded patient photos and record photos are served from `/uploads`.
- Uploaded files are stored on disk under `uploads/patients/...` and `uploads/records/...`; the database stores only the file path.
- During local development, Vite proxies `/api` and `/uploads` to the Express backend on port `5000`.
- Keep the backend running while using the frontend so patient data, disease statistics, and uploaded images load correctly.
