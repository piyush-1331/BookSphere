# BookSphere — Online Book Management System

**BookSphere** is an enterprise-grade, full-stack library catalog, circulation management, and AI-powered recommendation platform designed for academic institutions, metropolitan libraries, and digital research repositories.

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [System Architecture](#-system-architecture)
4. [Technology Stack](#-technology-stack)
5. [Folder Structure](#-folder-structure)
6. [MongoDB Atlas Setup](#-mongodb-atlas-setup)
7. [Environment Variables](#-environment-variables)
8. [Installation & Setup](#-installation--setup)
9. [Running the Application](#-running-the-application)
10. [REST API Endpoints](#-rest-api-endpoints)
11. [Testing & Verification Commands](#-testing--verification-commands)
12. [Security Architecture](#-security-architecture)
13. [Known Limitations](#-known-limitations)

---

## 🌟 Project Overview

BookSphere provides a complete bibliographic operating environment featuring:
- A responsive, neomorphic Single-Page Application (SPA) built with React 19, Redux Toolkit, and React Router 7.
- A hardened, modular Node.js/Express 5 REST API communicating with a multi-tenant MongoDB Atlas cloud database.
- An intelligent, explainable recommendation microservice built on Python FastAPI with content-based filtering algorithms.
- Full circulation lifecycle management: instant checkout, atomic inventory decrementing, return processing, overdue loan audits, and patron favorite shelves.
- Zero-trust security boundaries: HttpOnly cookies, bcryptjs password hashing, role-based access control, Zod schema validation, API rate limiting, and server-side secret isolation.

---

## 🚀 Key Features

### 1. Catalog Exploration & Discovery
- **Global Search:** Case-insensitive search across title, author, description, category, and ISBN with regex ReDoS sanitization.
- **Multidimensional Filters:** Filter by literary genre, institutional category, author, and availability status (in-stock vs on loan).
- **Sorting & Pagination:** Stable multi-field sorting by publication year, rating, available copies, or title with configurable page sizing.
- **Rich Bibliographic Details:** Complete volume metadata including ISBN-10/13, publisher, language, shelf location, page count, and formats (EPUB, Audiobook, Hardcover, PDF).

### 2. Patron Membership & Circulation Lifecycle
- **Self-Service Lending:** Instant checkout for available titles with atomic MongoDB `$inc` operations preventing race conditions.
- **Due Date Automation:** Dynamic calculation of return deadlines (default 14-day loan duration) with virtual overdue detection.
- **Return & Restocking:** One-click returns that instantly increment available copies, restore catalog status, and record return timestamps.
- **Circulation History:** Dedicated patron dashboard displaying active loans, past loans, renewal status, and overdue flags.
- **Favorites Shelf:** Custom reading lists with duplicate prevention enforced via unique compound database indexes (`{ user: 1, book: 1 }`).

### 3. AI-Powered Recommendation Engine
- **Explainable Content-Based Filtering:** Analyzes user borrowing history, favorited titles, and declared reading preferences.
- **Hybrid Cold-Start Strategy:** Automatically provides curated, high-rated catalog highlights when a patron has zero historical loans.
- **Stock-Aware Scoring:** Prioritizes in-stock titles over exhausted copies.
- **Fault-Tolerant Resilience:** Express validates microservice payloads with Zod; on service failure, gracefully falls back to transparent database highlights if permitted without fabricating synthetic data.
- **Secret Isolation:** Internal microservice tokens (`AI_SERVICE_TOKEN`) and URLs are strictly server-side and never exposed to client browsers.

### 4. Administrative Control Center
- **System Metrics & Analytics:** Real-time counts for catalog volumes, registered patrons, active borrowings, and overdue items.
- **Volume Management:** Register new titles, modify metadata and inventory copies, and safely retire or deactivate volumes.
- **Circulation Overdue Audits:** On-demand audit service (`/api/admin/books/audit-overdue`) that transitions past-due loans to `overdue`.
- **Loan Approvals & Rejections:** Review and manage pending loan requests with copy recovery.
- **Patron Directory:** Browse institutional rosters with membership tier, card ID, and borrow quota tracking.

---

## 🏗 System Architecture

BookSphere uses a 3-tier decoupled microservice architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Tier (Browser)                    │
│      React 19 + Vite 8 + Redux Toolkit + React Router       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON (Port 5173)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API Gateway Tier                  │
│       Node.js + Express 5 + Mongoose + JWT + Zod + Helmet   │
│                         (Port 5000)                         │
└──────────────┬───────────────────────────────┬──────────────┘
               │ Internal Token                │ Mongoose ODM
               │ (AI_SERVICE_TOKEN)            │ SSL / TLS
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      AI Microservice Tier    │ │    Cloud Database Tier     │
│   Python FastAPI + Uvicorn   │ │     MongoDB Atlas Cloud    │
│         (Port 8000)          │ │      (Replica Cluster)     │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Redux Toolkit 2.13, React Router 7.18, Axios 1.20, Tailwind CSS 4, Google Material Symbols |
| **Backend** | Node.js (v20+), Express.js 5.3, Mongoose 9.11, Zod 4.6, jsonwebtoken 9.0, bcryptjs 3.0, cookie-parser, cors, helmet, express-rate-limit |
| **Database** | MongoDB Atlas (Multi-node replica cluster with compound and text search indexes) |
| **AI Microservice** | Python 3.13, FastAPI, Uvicorn, Pydantic Settings, Starlette TestClient, pytest |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert/strict`), Supertest, pytest |

---

## 📁 Folder Structure

```
BookSphere/
├── frontend/                                   # React Single Page Application
│   ├── .env.example                            # Frontend environment variables template
│   ├── index.html                              # Root HTML5 template
│   ├── vite.config.js                          # Vite bundler configuration
│   └── src/
│       ├── api/axiosClient.js                  # Axios instance with JWT interceptor & normalizer
│       ├── components/
│       │   ├── books/                          # BookCard, BookGrid, FilterPanel, SearchBar
│       │   └── common/                         # Navbar, Footer, Sidebar, Modal, Button, Inputs
│       ├── pages/                              # 16 Routed Pages (Landing, Books, Admin, Auth, etc.)
│       └── store/                              # Redux Toolkit store and feature slices
├── backend/                                    # Express REST API
│   ├── .env                                    # Backend server environment variables
│   ├── src/
│   │   ├── app.js                              # Express application setup & middleware stack
│   │   ├── server.js                           # Server bootstrap & MongoDB Atlas connection
│   │   ├── config/db.js                        # Reusable MongoDB Atlas connector & status probe
│   │   ├── controllers/                        # Domain controllers (auth, book, borrow, etc.)
│   │   ├── middleware/                         # JWT auth, validation, rate limiter, error handlers
│   │   ├── models/                             # Mongoose schemas: Book, User, Borrow, Favorite
│   │   ├── routes/                             # Express route modules
│   │   ├── schemas/                            # Zod input validation schemas
│   │   ├── seed/                               # Database initial seed runner & sample catalog
│   │   └── services/                           # AI client adapter & overdue audit services
│   └── tests/                                  # Automated Node.js integration tests
├── ai-service/                                 # Python FastAPI Recommendation Engine
│   ├── app/
│   │   ├── main.py                             # FastAPI application & route endpoints
│   │   ├── auth.py                             # Constant-time service token authorization
│   │   ├── config.py                           # Pydantic environment settings
│   │   ├── models.py                           # Pydantic schemas for request/response payloads
│   │   └── recommender.py                      # Content-based scoring and recommendation algorithm
│   └── tests/                                  # Pytest suite for FastAPI engine
└── README.md                                   # Root project documentation
```

---

## 🗄 MongoDB Atlas Setup

1. **Create an Atlas Cluster:**
   - Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a free `M0` or dedicated cluster in your preferred region.

2. **Configure Database User:**
   - Navigate to **Security → Database Access**.
   - Create a database user with `Read and write to any database` privileges.
   - Choose username and password authentication.

3. **Configure Network Access:**
   - Navigate to **Security → Network Access**.
   - Add your current IP address or allow global access (`0.0.0.0/0`) for development.

4. **Obtain Connection String:**
   - Click **Connect → Drivers → Node.js**.
   - Copy the SRV URI format:
     ```text
     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
     ```
   - Paste into `backend/.env` under `MONGODB_URI`.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```ini
PORT=5000
NODE_ENV=development

# Web client URL for CORS origin validation
FRONTEND_URL=http://localhost:5173

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
MONGODB_DB_NAME=booksphere

# JWT Authentication
JWT_SECRET=your_super_secret_high_entropy_256bit_token
JWT_EXPIRES_IN=1h

# Python FastAPI AI Service Integration
FASTAPI_BASE_URL=http://127.0.0.1:8000
FASTAPI_TIMEOUT_MS=5000
AI_SERVICE_TOKEN=your_secure_internal_service_bearer_token
```

### AI Service (`ai-service/.env`)
```ini
PORT=8000
HOST=127.0.0.1
AI_SERVICE_TOKEN=your_secure_internal_service_bearer_token
ENVIRONMENT=development
```

### Frontend (`frontend/.env`)
```ini
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:5000
```

---

## 📦 Installation & Setup

Clone the repository and install all dependencies:

```bash
# Clone repository
git clone https://github.com/piyush-1331/QuaiProject.git
cd BookSphere

# 1. Install Backend Dependencies
cd backend
npm install
cd ..

# 2. Install Frontend Dependencies
cd frontend
npm install
cd ..

# 3. Setup Python Virtual Environment for AI Service
cd ai-service
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

## 🚀 Running the Application

### 1. Seed Database Catalog (Optional First Run)
```bash
cd backend
npm run seed
cd ..
```

### 2. Start Express Backend (Port 5000)
```bash
cd backend
npm start
# Or development mode with nodemon:
# npm run dev
```

### 3. Start FastAPI AI Service (Port 8000)
```bash
cd ai-service
# On Windows:
.\.venv\Scripts\python -m uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload
# On Linux/macOS:
# .venv/bin/uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload
```

### 4. Start React Frontend (Port 5173)
```bash
cd frontend
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🌐 REST API Endpoints

### Health & Diagnostics
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Real-time system health, uptime, and Atlas ping |
| `GET` | `/` | Public | API root discovery welcome probe |

### Authentication & Profiles
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (Rate-limited) | Register patron account (prevents admin escalation) |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Sign in; returns JWT and sets HttpOnly cookie |
| `POST` | `/api/auth/logout` | Public | Clears HttpOnly cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieve session for authenticated patron |
| `GET` | `/api/auth/admin-check` | Admin | Validate administrative privilege |
| `GET` | `/api/users/profile` | Authenticated | Patron profile with loan and favorite stats |
| `PUT` | `/api/users/profile` | Authenticated | Update patron profile or change password |
| `GET` | `/api/users` | Admin | Search, filter, and paginate patron directory |

### Book Catalog
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books` | Public | List, search, filter by genre/category/author, sort |
| `GET` | `/api/books/:id` | Public | Detailed book volume record |

### Favorites Shelf
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/favorites` | Authenticated | List all favorited books for user |
| `POST` | `/api/favorites/:bookId` | Authenticated | Add book to favorites (duplicate protected) |
| `DELETE` | `/api/favorites/:bookId`| Authenticated | Remove book from favorites |

### Circulation & Borrowing
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/borrows` | Authenticated | Checkout book; atomically decrements copies |
| `GET` | `/api/borrows/my` | Authenticated | List active, overdue, and returned user loans |
| `GET` | `/api/borrows/:id` | Owner / Admin | View specific loan record |
| `PATCH`| `/api/borrows/:id/return`| Owner / Admin | Return book; atomically increments copies |
| `GET` | `/api/borrows` | Admin | List all institutional loans |
| `PATCH`| `/api/borrows/:id/approve`| Admin | Approve pending borrow request |
| `PATCH`| `/api/borrows/:id/reject` | Admin | Reject borrow request with reason |

### Admin Catalog Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/books` | Admin | Catalog new book (validates unique ISBN) |
| `PATCH`| `/api/admin/books/:id` | Admin | Update metadata, copy quantities, or status |
| `DELETE`| `/api/admin/books/:id`| Admin | Delete volume (blocked if active loans exist) |
| `POST` | `/api/admin/books/audit-overdue` | Admin | Sync overdue loans |
| `GET` | `/api/admin/books/dashboard/stats`| Admin | Aggregate dashboard circulation statistics |

### Recommendations (FastAPI Bridge)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/recommendations` | Authenticated | AI recommendations using user history |

---

## 🧪 Testing & Verification Commands

All test suites execute against the live system and mock external dependencies cleanly.

### 1. Run Complete Backend Test Suite (75 Tests)
```bash
cd backend
npm test
```
*Covers authentication, duplicate prevention, password security, JWT expiry, role checks, public catalog, favorites, circulation lifecycle, overdue audits, admin permissions, and FastAPI recommendation pipeline.*

### 2. Run Database Atlas Audit Script
```bash
cd backend
node tests/databaseAudit.js
```
*Verifies active MongoDB connection, presence of collections, schema indexes, persistence roundtrip, and credential protection.*

### 3. Run AI Service Tests (15 Pytest Tests)
```bash
cd ai-service
.\.venv\Scripts\pytest -v tests/test_recommendations.py
```
*Covers health probe, authentication token validation, cold-start fallback, history-based scoring, preference affinity, and response schemas.*

### 4. Build Frontend for Production
```bash
cd frontend
npm run build
```
*Executes Vite production bundling and verifies 0 syntax or module errors.*

### 5. Run Frontend ESLint
```bash
cd frontend
npm run lint
```
*Verifies standard code quality and React best practices.*

---

## 🛡 Security Architecture

- **JWT Session Security:** Uses 256-bit signed tokens stored in `HttpOnly`, `SameSite`, and `Secure` (production) cookies, supplemented by Bearer authorization headers.
- **Password Protection:** Irreversible bcryptjs hashing with salt factor 10. Password hashes are excluded from Mongoose queries by default (`select: false`).
- **Strict Role-Based Authorization:** Endpoints verify `req.user.role === 'admin'`. Non-admins receive `403 FORBIDDEN`. Users cannot self-escalate to admin during registration.
- **Object-Level Ownership:** Users can only view or return their own borrowed books.
- **Input Validation:** Every endpoint parameter, query string, and body payload is validated using strict Zod schemas.
- **Database Injection Defense:** Regex search inputs are escaped with special character sanitization. All ObjectIds are verified before query execution.
- **Rate Limiting:** Authentication routes are protected with `authLimiter` (30 requests/15m); general API routes are protected with `apiLimiter` (300 requests/15m).
- **HTTP Security Headers:** Helmet sets industry-standard headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, etc.).
- **Zero Secret Exposure:** Credentials, database passwords, and internal microservice tokens are masked in logs and strictly isolated from the frontend.

---

## ⚠️ Known Limitations

1. **Digital Reader Integration:** The platform manages format records (EPUB, Audiobook, PDF), but does not embed an in-browser streaming player or EPUB reader; download links and physical stacks are prioritized.
2. **Payment & Fines Gateway:** Fines and late penalties are tracked with a restorative zero-fee policy; payment gateway processing (e.g. Stripe) is not included.
3. **SMS Notifications:** Overdue alerts and return reminders are processed via in-app dashboard badges and audit services rather than direct SMS gateways (Twilio).
4. **Offline Mode:** The single-page application requires an active internet/network connection to sync with the Express backend and MongoDB Atlas.
