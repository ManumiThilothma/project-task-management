# TaskFlow Pro: Project & Team Task Management Platform

TaskFlow Pro is a highly responsive, modern, secure, and role-based full-stack project management dashboard. Built on Next.js 14 and powered by Prisma ORM with PostgreSQL, it implements robust access controls for Admins, Project Managers, and Team Members.

---

## 🚀 Repository
- **GitHub Repository**:https://github.com/ManumiThilothma/project-task-management

---

## 🛠️ Tech Stack & Architecture
- **Frontend Framework**: Next.js 14 (App Router)
- **Backend Runtime**: Node.js API Route Handlers
- **Styling Engine**: Premium Vanilla CSS Modules (featuring a custom glow theme & glassmorphic indicators)
- **Database Layer**: PostgreSQL (local or hosted, via Prisma ORM)
- **Authentication**: Secure custom JWT-based authentication in HTTP-only, SameSite cookies
- **Route Authorization**: Next.js Middleware Guard (Edge runtime)
- **CI/CD**: GitHub Actions

---

## 🗄️ System Diagrams

### 1. Entity Relationship Diagram (ERD)
GitHub natively renders this Mermaid diagram:

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        string role "ADMIN | PROJECT_MANAGER | TEAM_MEMBER"
        datetime createdAt
    }
    PROJECT {
        string id PK
        string name
        string description
        string status "PLANNED | IN_PROGRESS | COMPLETED | ON_HOLD"
        string managerId FK
        datetime startDate
        datetime endDate
        datetime createdAt
    }
    PROJECT_MEMBER {
        string projectId PK, FK
        string userId PK, FK
        string roleInProject
        datetime assignedAt
    }
    TASK {
        string id PK
        string title
        string description
        string status "TODO | IN_PROGRESS | IN_REVIEW | DONE"
        string priority "LOW | MEDIUM | HIGH | URGENT"
        string projectId FK
        string assigneeId FK
        string creatorId FK
        datetime dueDate
        datetime createdAt
    }
    ACTIVITY_LOG {
        string id PK
        string taskId FK
        string userId FK
        string actionType
        string message
        datetime createdAt
    }

    USER ||--o{ PROJECT : "manages"
    USER ||--o{ PROJECT_MEMBER : "belongs to"
    PROJECT ||--o{ PROJECT_MEMBER : "has members"
    PROJECT ||--o{ TASK : "contains"
    USER ||--o{ TASK : "assigned to"
    USER ||--o{ TASK : "creates"
    TASK ||--o{ ACTIVITY_LOG : "logs activities for"
    USER ||--o{ ACTIVITY_LOG : "performs actions"
```

### 2. Use Case Diagram

```mermaid
flowchart TD
    subgraph Users
        Admin([Administrator])
        PM([Project Manager])
        TM([Team Member])
    end

    subgraph Platform Actions
        A1(Manage Users & System Roles)
        A2(System Overview Dashboard)
        
        P1(Create Projects)
        P2(Assign Team Members to Projects)
        P3(Create & Assign Tasks)
        
        T1(View Assigned Projects)
        T2(View Assigned Tasks)
        T3(Update Task Status/Progress)
        T4(Log Comments/Activities)
      
        L1(Secure Login / JWT Authentication)
    end

    Admin --> A1
    Admin --> A2
    Admin --> P1
    Admin --> P3
    Admin --> L1

    PM --> A2
    PM --> P1
    PM --> P2
    PM --> P3
    PM --> L1

    TM --> T1
    TM --> T2
    TM --> T3
    TM --> T4
    TM --> L1
```

### 3. System Architecture Diagram

```mermaid
graph TD
    subgraph Client (Browser)
        UI[Next.js Frontend / React Components]
        CSS[Vanilla CSS / CSS Modules]
    end

    subgraph Server (Node.js)
        MW[Next.js Middleware - Secure Route Guard]
        AUTH[JWT Session Verification]
        API[Next.js API Routes / Route Handlers]
        ORM[Prisma Client]
    end

    subgraph Database
        DB[(PostgreSQL Database)]
    end

    UI <-->|HTTPS Requests / REST APIs| MW
    MW <-->|Validates Session Cookie| AUTH
    MW --> API
    API <--> ORM
    ORM <--> DB
```

---

## ⚡ Setup & Run Instructions

### Prerequisites
- Node.js 18+ installed on your computer.
- PostgreSQL database (or Docker installed).
- *Alternatively, a free database from [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) works instantly.*

### Step 1: Clone and Install
```bash
git clone https://github.com/ManumiThilothma/project-task-management.git
cd project-task-management
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/task_management?schema=public"
JWT_SECRET="generate_a_secure_random_string_here_at_least_32_characters"
PORT=3000
```

### Step 3: Run Database Migrations & Seeding
Start your PostgreSQL server (or spin it up via Docker Compose: `docker-compose up -d`). Then, execute:
```bash
# Generate Prisma Client
npx prisma generate

# Run Database Migrations to create tables
npx prisma migrate dev --name init

# Run database seeder to add initial demo accounts and tasks
npx prisma db seed
```

### Step 4: Run Locally
Start the development server:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🔑 Demo Login Accounts

To make evaluation simple, the database seeder creates standard logins. You can log in using:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@taskflow.com` | `admin123` |
| **Project Manager** | `pm@taskflow.com` | `pm123` |
| **Team Member (Dev)** | `dev@taskflow.com` | `dev123` |
| **Team Member (QA)** | `qa@taskflow.com` | `qa123` |

---

## 📑 Feature Completion Report

| Feature | Scope / Behavior | Status |
| :--- | :--- | :--- |
| **Secure Authentication** | Custom JWTs in HTTP-only, secure cookies with middleware protection | **Completed** |
| **Role-based Redirection** | Middleware guards route access by user role (e.g. PM/Admin only for creating) | **Completed** |
| **Admin Panel** | Full user management dashboard (List, Create, Edit Roles, Delete users) | **Completed** |
| **Project Management** | Create, Update, and Delete projects with timelines and manager fields | **Completed** |
| **Team Assignment** | Project Managers and Admins can assign and remove members from projects | **Completed** |
| **Kanban Workspace** | Unified Kanban board displaying Todo, In Progress, In Review, and Done tasks | **Completed** |
| **Task Assignment** | Create and assign tasks to members in projects; set priority and due dates | **Completed** |
| **Status Updates** | Team members can change task status and post updates with comments | **Completed** |
| **Activity Logging** | Auto-logs all status changes, task creations, and assignments into a timeline | **Completed** |
| **Stats Dashboard** | Dynamic metrics charts customized by role (Projects, Completed vs. Pending) | **Completed** |

---

## 🛡️ Secure API Documentation

All API requests (except `/api/auth/login` and `/api/auth/register`) must have a valid JWT cookie set.

### 1. Authentication Endpoints
- **`POST /api/auth/register`**: Register a new user. Default role is `TEAM_MEMBER`.
- **`POST /api/auth/login`**: Authenticate credentials. Sets `token` HTTP-only cookie.
- **`POST /api/auth/logout`**: Clears the authentication token cookie.
- **`GET /api/auth/me`**: Fetches the authenticated user profile.

### 2. User Administration (Admin Only)
- **`GET /api/users`**: List all users in the system.
- **`POST /api/users`**: Create a user with specified role (`ADMIN`, `PROJECT_MANAGER`, `TEAM_MEMBER`).
- **`PUT /api/users/[id]`**: Update details or change the security role of a user.
- **`DELETE /api/users/[id]`**: Remove a user from the system. (Self-deletion is blocked).

### 3. Project Management
- **`GET /api/projects`**: Lists projects (Admins see all; PMs/Members see their associated projects).
- **`POST /api/projects`**: Create a project (Admins can select any manager; PMs default to creator).
- **`GET /api/projects/[id]`**: Fetch full project timeline details, members list, and tasks.
- **`PUT /api/projects/[id]`**: Modify name, dates, status, or manager (PM/Admin only).
- **`DELETE /api/projects/[id]`**: Delete project and all its tasks (PM/Admin only).

### 4. Project Membership
- **`GET /api/projects/[id]/members`**: List project members.
- **`POST /api/projects/[id]/members`**: Assign a developer/QA user with a project role (PM/Admin only).
- **`DELETE /api/projects/[id]/members?userId=[userId]`**: Remove member and unassign project tasks.

### 5. Task Management
- **`GET /api/tasks`**: Lists tasks (Filters: `projectId`, `assignedOnly`).
- **`POST /api/tasks`**: Create a project task (PM/Admin only).
- **`GET /api/tasks/[id]`**: Fetch task details and its activity log timeline.
- **`PUT /api/tasks/[id]`**: Modify task title, description, priority, assignee, due date (PM/Admin only).
- **`DELETE /api/tasks/[id]`**: Remove task from project (PM/Admin only).
- **`PATCH /api/tasks/[id]/status`**: Update task status and append comment into the log (All permitted roles).

---

## 🔗 CI/CD Pipeline Explanation
The GitHub Actions workflow defined in `.github/workflows/ci.yml` automates verification for quality control:
1. **Linter Check (`next lint`)**: Validates code style conventions and React best practices.
2. **Prisma Generation (`npx prisma generate`)**: Validates compilation of types matching the database schema.
3. **Build Validation (`next build`)**: Validates compilation of Next.js production bundles, resolving import and type safety errors.

---

## 🤖 AI Tools & Assistance
This project was developed in partnership with **Antigravity**, Google's agentic AI coding companion, assisting in:
- High-level system architecture and Mermaid ERD/Use Case flow planning.
- Structuring Next.js directory schemas, API routes, and Tailwind-free custom CSS modules.
- Implementing Edge-friendly JWT signing and role-based middleware access controls.
