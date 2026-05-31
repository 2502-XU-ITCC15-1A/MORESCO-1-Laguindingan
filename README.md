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
- IT Manager user account creation, role assignment, access status updates, unlock, and delete actions
- Role-aware access for patient editing, health record editing, disease management, and user access management

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
|-- package-lock.json
|-- docker-compose.yml
|-- Dockerfile
|-- scripts/
|   |-- register-daily-backup.ps1
|   |-- register-daily-backup.sh
|   |-- run-backup.ps1
|   |-- run-backup.sh
|   |-- run-restore.ps1
|   `-- run-restore.sh
|-- server/
|   |-- backup.js
|   |-- db-init.js
|   |-- db.js
|   |-- docker-start.js
|   |-- index.js
|   |-- middleware/
|   |-- restore.js
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
- Docker and Docker Compose, if you want to run the full stack in containers

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
CLIENT_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
PORT=5000
```

You can copy `.env.example` and adjust the values for your machine.

Initialize the database schema and seed data:

```bash
npm run db:init
npm run db:seed
```

This step is for local non-Docker setup. The Docker app container runs `npm run docker:start`, which initializes the schema and seeds default data automatically before starting the server.

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

### Local Setup Without Docker

Docker is optional for the application, but PostgreSQL is still required. If you do not want to use Docker, install PostgreSQL on the machine and create a database that matches `.env`.

Required local PostgreSQL settings:

```text
Host: localhost
Port: 5432
Database: moresco_health
Username: moresco
Password: moresco_password
```

The matching `.env` value is:

```env
DATABASE_URL="postgresql://moresco:moresco_password@localhost:5432/moresco_health"
```

After PostgreSQL is running locally, initialize and seed the database:

```bash
npm run db:init
npm run db:seed
```

Then run the app manually:

```bash
npm run server
npm run dev
```

Run those commands in separate terminals. If `npm run server` shows `ECONNREFUSED 127.0.0.1:5432`, PostgreSQL is not running or is not listening on port `5432`.

### Local Development With Docker Database Only

For development, you can run only the database in Docker while keeping the backend and frontend manual:

```bash
docker compose up -d db
npm run server
npm run dev
```

In this mode:

- PostgreSQL runs in Docker on `localhost:5432`
- Express runs manually on `localhost:5000`
- Vite runs manually on the URL shown in the terminal

### Docker Setup

Run the full app with Docker:

```bash
docker compose up -d --build
```

This starts:

- PostgreSQL on `localhost:5432`
- The built app on `http://localhost:5173`

On container startup, the app service will:

- build and serve the production frontend
- initialize the database schema
- seed the default users and diseases

If you change environment variables such as `CLIENT_ORIGIN`, rebuild the app container so the new values are applied:

```bash
docker compose down
docker compose up -d --build
```

To stop it:

```bash
docker compose down
```

---

## CORS Troubleshooting

If the backend logs an error like `CORS blocked: http://127.0.0.1:5173`, the frontend URL opening in the browser does not exactly match the URLs allowed by the backend.

This is a common issue on Linux because some browsers or dev tools open the site as `http://127.0.0.1:5173` instead of `http://localhost:5173`.

### Recommended Local Origins

Allow both common local development origins:

```env
CLIENT_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
```

If you also use ngrok or another public tunnel, include those URLs in the same comma-separated value:

```env
CLIENT_ORIGIN="http://localhost:5173,http://127.0.0.1:5173,https://*.ngrok-free.app,https://*.ngrok-free.dev"
```

### Where to Update It

If you want the fix to apply across the project, check these files:

- `.env` for your current machine's runtime configuration
- `.env.example` as the shared template for other developers
- `docker-compose.yml` for containerized runs
- `server/index.js` for the backend fallback default when `CLIENT_ORIGIN` is missing

### Example Changes

In `.env`:

```env
CLIENT_ORIGIN="http://localhost:5173,http://127.0.0.1:5173,https://your-domain.example"
```

In `docker-compose.yml`:

```yaml
environment:
  CLIENT_ORIGIN: ${CLIENT_ORIGIN:-http://localhost:5173,http://127.0.0.1:5173,https://*.ngrok-free.app,https://*.ngrok-free.dev}
```

In `server/index.js`:

```js
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map(o => o.trim());
```

### Adding Your Own URL

If your frontend runs on a different host, IP, port, or domain, add that exact origin to `CLIENT_ORIGIN`.

Examples:

- `http://192.168.1.20:5173`
- `http://10.0.0.5:4173`
- `https://demo.yourcompany.com`

Use a comma-separated list:

```env
CLIENT_ORIGIN="http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.20:5173,https://demo.yourcompany.com"
```

Important:

- `http://localhost:5173` and `http://127.0.0.1:5173` are different origins
- the protocol, host, and port must match exactly unless you intentionally use a wildcard pattern such as `https://*.ngrok-free.app`
- after changing `.env` or `docker-compose.yml`, restart the backend or rebuild the Docker container

### After Updating Config

For local Node development:

```bash
npm run server
```

For Docker:

```bash
docker compose down
docker compose up -d --build
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

```text
Username: itmanager
Password: itmanager123
```

---

## How to Operate the System

### Log In

1. Open `http://localhost:5173`.
2. Enter your assigned credentials.
3. HR Admin and Company Nurse are redirected to the Patients page.
4. IT Manager is redirected to the User Access page.

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

### Manage User Access

1. Sign in as the `IT Manager`.
2. Open the `User Access` page from the top navigation.
3. Create accounts for HR Admin, Company Nurse, or IT Manager.
4. Edit usernames, company IDs, emails, roles, and access status.
5. Unlock locked accounts when needed.
6. Delete accounts that are no longer needed.

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

1. Sign in as `Company Nurse`.
2. Open the profile menu in the top-right corner.
3. Click `Common Disease Stats`.
4. Use the month range filters in the right drawer to filter common disease counts.

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
| `npm run backup` | Create a PostgreSQL backup under `backups/YYYY/MM/` |
| `npm run restore -- "<file>"` | Restore a PostgreSQL backup file into the configured database |

---

## Automatic Backup

The project includes a backup script that creates PostgreSQL dumps in:

```text
backups/YYYY/MM/moresco_health_YYYY-MM-DD_HH-mm-ss.backup
```

Run a manual backup anytime with:

```bash
npm run backup
```

The backup script will:

- use `docker exec` against the `moresco-db` container when Docker is running
- fall back to local `pg_dump` using `DATABASE_URL` when Docker is not available
- remove old backups after the retention period

Optional environment variables:

```env
BACKUP_DIR="C:/Backups/MORESCO"
BACKUP_RETENTION_DAYS="365"
BACKUP_DOCKER_CONTAINER="moresco-db"
```

### Windows Daily Schedule

To register an automatic daily backup task on Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register-daily-backup.ps1
```

Default behavior:

- runs every day
- runs at `00:00`
- executes `scripts/run-backup.ps1`, which logs output to `backups/logs/backup.log`

Example with a custom time:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register-daily-backup.ps1 -Time 14:30
```

### Linux Daily Schedule

Make the shell scripts executable:

```bash
chmod +x ./scripts/run-backup.sh ./scripts/run-restore.sh ./scripts/register-daily-backup.sh
```

To register an automatic daily backup cron job on Linux:

```bash
./scripts/register-daily-backup.sh
```

Default behavior:

- runs every day
- runs at `00:00`
- executes `scripts/run-backup.sh`, which logs output to `backups/logs/backup.log`

Example with a custom time:

```bash
./scripts/register-daily-backup.sh 14:30
```

To test the backup immediately after setup:

```powershell
npm run backup
```

---

## Restore From Backup

The project also includes a restore command for PostgreSQL custom-format backups.

Important:

- restore can overwrite the current database contents
- use it during maintenance windows
- if possible, make a fresh backup before restoring

Restore a backup file with:

```powershell
npm run restore -- ".\backups\2026\05\moresco_health_2026-05-18_02-00-00.backup"
```

The restore script will:

- use `docker exec` with `pg_restore` against the `moresco-db` container when Docker is running
- fall back to local `pg_restore` using `DATABASE_URL` when Docker is not available
- restore with `--clean --if-exists` so existing objects are replaced

For a logged restore through PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-restore.ps1 -BackupFile ".\backups\2026\05\moresco_health_2026-05-18_02-00-00.backup"
```

For a logged restore through Linux shell:

```bash
./scripts/run-restore.sh "./backups/2026/05/moresco_health_2026-05-18_02-00-00.backup"
```

Restore logs are written to:

```text
backups/logs/restore.log
```

Operational recommendation:

- stop users from editing data while restore is running
- if you are using Docker, stop the app container first if you want a quieter restore window
- uploaded files in `uploads/` are not included in the database backup and should be restored separately if needed

---

## Notes

- Uploaded patient photos and record photos are served from `/uploads`.
- Uploaded files are stored on disk under `uploads/patients/...` and `uploads/records/...`; the database stores only the file path.
- PostgreSQL backups include database rows and photo paths, but not the actual image files. Keep a copy of the `uploads/` folder when moving, backing up, or restoring the system.
- If Docker is used, uploaded files live in the Docker volume mounted at `/app/uploads`; if the app is run manually, uploaded files live in the project `uploads/` folder.
- During local development, Vite proxies `/api` and `/uploads` to the Express backend on port `5000`.
- Keep the backend running while using the frontend so patient data, disease statistics, and uploaded images load correctly.
