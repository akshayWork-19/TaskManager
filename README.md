# Full-Stack Task Management Application

A complete full-stack task management solution with a Node.js/Express backend, PostgreSQL database, and a Next.js (App Router) frontend utilizing custom premium CSS.

## Features
- **User Authentication:** JWT-based signup and login.
- **Task Management:** Create, read, update, and delete tasks.
- **Filtering & Sorting:** Filter tasks by status, search by title, and sort by due date, priority, or creation date.
- **Responsive Design:** Premium, custom-styled frontend that works on all devices.

## Requirements
- Node.js v18+
- PostgreSQL database (e.g., Aiven, Supabase, or local)

## Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file (see `.env.example`).
4. Apply Prisma migrations to sync the schema: `npx prisma db push`
5. Start the backend: `npm run dev`

### Running Backend Tests
1. Ensure your test database is configured.
2. Run `npm test` from the `backend` directory.

## Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Configure the environment variable for the API (if necessary). By default, it connects to `http://localhost:5000/api`.
4. Start the frontend: `npm run dev`
5. Open `http://localhost:3000` in your browser.

## Technologies Used
- **Frontend:** Next.js, React, SWR, React Hook Form, Zod, Vanilla CSS Modules
- **Backend:** Node.js, Express, Prisma, PostgreSQL, jsonwebtoken, bcrypt, zod, jest, supertest
