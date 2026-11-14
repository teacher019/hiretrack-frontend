# HireTrack – Frontend

HireTrack is a job application management system built with React. It helps users organize job applications, track application statuses, manage follow-ups, and maintain related documents.

## Technology Stack

- React
- JavaScript (ES Modules)
- Vite
- CSS
- REST API integration
- Browser storage for local data and authentication

## Main Features

- User login and authentication
- Add, view, edit, and delete job applications
- Application status tracking: Applied, Interview, Offer, and Rejected
- Dashboard summary cards
- Candidate information management
- Resume and cover letter management
- Additional attachment management
- Follow-up dates and notes
- Backend API integration with JWT authentication

## Requirements

- Node.js
- npm
- A running HireTrack Django REST Framework backend

## Installation

Open a terminal in the frontend project directory and run:

```bash
npm install
```

## Environment Configuration

The frontend uses the following environment variable:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

If this variable is not configured, the application uses the default local backend API address.

For a different backend server, create a `.env` file in the frontend root directory and set the appropriate API URL.

For production deployment, configure `VITE_API_BASE_URL` with the deployed backend API URL.

## Run Development Server

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

## Production Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Backend

The frontend communicates with the separate HireTrack Django REST Framework backend.

Backend API endpoints include:

- `/api/token/`
- `/api/token/refresh/`
- `/api/applications/`
- `/api/attachments/`
- `/api/followups/`
- `/api/notifications/`

## Deployment – Vercel

The frontend can be deployed using Vercel.

### Deployment Steps

1. Push the frontend project to GitHub.
2. Sign in to Vercel.
3. Import the HireTrack frontend GitHub repository.
4. Configure the project settings:

   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Add the following environment variable:

   - Name: `VITE_API_BASE_URL`
   - Value: The deployed Django backend API URL.

6. Deploy the project.
7. Test login, application management, file uploads, downloads, and API connectivity.

**Note:** The production backend URL and frontend domain will be added after deployment.

## Project Structure

```text
hiretrack-frontend/
├── public/
├── src/
├── package.json
├── vite.config.js
└── README.md
```

## Notes

- Keep backend and frontend running separately during local development.
- Do not commit secret credentials or private environment files.
- Keep backup and safety documentation separate from the application source code.
