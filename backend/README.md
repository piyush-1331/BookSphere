# BookSphere Backend — Express & MongoDB Atlas Integration

This service provides the core RESTful API for **BookSphere — Online Book Management System**, supporting database connectivity, catalog search, pagination, filtering, models with validation, and system diagnostics.

---

## 🛠 Technology Stack

- **Runtime:** Node.js (v20+)
- **Framework:** Express.js (v5.3+)
- **Database:** MongoDB Atlas (Cloud Cluster)
- **ODM:** Mongoose (v9.11+)
- **Schema Validation:** Zod (v4.6+)
- **Security:** Helmet, CORS, Cookie-Parser, Bcrypt.js, JsonWebToken
- **Development:** Nodemon, Dotenv

---

## 📂 Project Architecture

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Reusable MongoDB connection module with credential sanitization
│   ├── models/
│   │   ├── User.js               # User schema (profile info, roles, safe toJSON without passwordHash)
│   │   ├── Book.js               # Book schema with text indexes, stock checks, and catalog tags
│   │   ├── Favorite.js           # Favorite schema with unique compound index
│   │   └── Borrow.js             # Borrow ledger with status enums and due date tracking
│   ├── schemas/
│   │   └── bookSchemas.js        # Zod schemas for query parameters and ObjectId validation
│   ├── middleware/
│   │   ├── validate.js           # Reusable Zod validation middleware
│   │   ├── errorHandler.js       # Centralized error handler (Mongoose & Zod mapping)
│   │   └── notFoundHandler.js    # 404 Route Not Found handler
│   ├── controllers/
│   │   ├── healthController.js   # Diagnostics & MongoDB ping
│   │   └── bookController.js     # Catalog search, filter, pagination, details
│   ├── routes/
│   │   ├── healthRoutes.js       # GET /api/health
│   │   └── bookRoutes.js         # GET /api/books, GET /api/books/:id
│   ├── seed/
│   │   ├── sampleBooks.js        # 12 high-fidelity fictional books
│   │   └── seedRunner.js         # Idempotent database seeder (books + admin + patron)
│   ├── app.js                    # Express app middleware and route mounting
│   └── server.js                 # Server entrypoint (connects DB before listening)
├── .env                          # Environment variables
├── package.json
└── README.md
```

---

## ⚙️ Environment Configuration (`.env`)

```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
MONGODB_DB_NAME=booksphere

# JWT Authentication (for future auth module)
JWT_SECRET=your_secure_256_bit_secret
JWT_EXPIRES_IN=1h

# AI Recommendation Service (FastAPI)
FASTAPI_BASE_URL=http://127.0.0.1:8000
AI_SERVICE_TOKEN=your_internal_service_bearer_token
```

---

## 🚀 Available Commands

Run these commands inside the `backend/` directory:

```bash
# 1. Install dependencies
npm install

# 2. Seed database with demonstration catalog and demo users
npm run seed

# 3. Start production server
npm start

# 4. Start development server with auto-reload
npm run dev

# 5. Run authentication and integration tests
npm test
```

---

## 📡 API Reference

### 1. Health Diagnostics
- **`GET /api/health`**  
  Returns server uptime, environment, and real-time MongoDB Atlas ping latency.  
  *Response Sample:*
  ```json
  {
    "success": true,
    "data": {
      "service": "BookSphere Backend API",
      "status": "healthy",
      "timestamp": "2026-10-18T15:01:20.525Z",
      "uptimeSeconds": 67,
      "environment": "development",
      "database": {
        "status": "connected",
        "readyState": 1,
        "databaseName": "booksphere",
        "host": "ac-npjk4li-shard-00-00.8ht0fux.mongodb.net",
        "pingMs": 149
      }
    }
  }
  ```

---

### 2. Book Catalog
- **`GET /api/books`**  
  Retrieve paginated list of books with optional keyword search, filtering, and sorting.

  **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `search` | String | - | Searches across `title`, `author`, `description`, `genre`, `category`, and `ISBN` |
  | `genre` | String | - | Filter by genre (e.g. `Architecture & Design`, `Speculative Fiction`) |
  | `category` | String | - | Filter by category (e.g. `Architecture`, `Literary Fiction`, `Science & Technology`) |
  | `author` | String | - | Filter by author name |
  | `availability` | String | `all` | `true`/`available` (copies > 0) or `false`/`unavailable` (copies = 0) |
  | `page` | Integer | `1` | Page number |
  | `limit` | Integer | `10` | Records per page (max 100) |
  | `sortBy` | String | `createdAt` | Field to sort by: `title`, `author`, `publicationYear`, `availableCopies`, `rating`, `createdAt` |
  | `order` | String | `desc` | Sort direction: `asc` or `desc` |

- **`GET /api/books/:id`**  
  Retrieve full details of a specific book by its 24-character hexadecimal MongoDB ObjectId.
  - Returns `200 OK` with book details when found.
  - Returns `400 Bad Request` if `:id` format is invalid.
  - Returns `404 Not Found` if book does not exist.

---

### 3. Authentication & Sessions (`/api/auth`)
- **`POST /api/auth/register`**  
  Registers a new library patron account. Enforces that registered users cannot elevate themselves to admin (`role: "user"` is strictly assigned). Sets secure HttpOnly cookie and returns user + token.  
  *Rate Limited:* 30 requests per 15 minutes window.  
  *Body:* `{ name, email, password, confirmPassword, branch?, phone?, bio? }`

- **`POST /api/auth/login`**  
  Authenticates user via email and bcrypt password comparison. Sets secure HttpOnly session cookie and returns user + token.  
  *Rate Limited:* 30 requests per 15 minutes window.  
  *Body:* `{ email, password }`

- **`POST /api/auth/logout`**  
  Clears the HttpOnly authentication cookie.

- **`GET /api/auth/me`**  
  Returns the currently authenticated user session. Requires HttpOnly cookie or `Authorization: Bearer <token>`.

- **`GET /api/auth/admin-check`**  
  Administrative verification probe. Returns `200 OK` for administrators; returns `403 Forbidden` for standard patrons.

---

### 4. User Profile (`/api/users`)
- **`GET /api/users/profile`**  
  Retrieves full patron profile including card ID, standing, and real-time statistics (`activeLoansCount`, `totalLoansCount`, `favoritesCount`). Requires authentication.

- **`PUT /api/users/profile`**  
  Updates authenticated patron profile (`name`, `phone`, `branch`, `bio`, `avatar`) or updates password with current password verification. Requires authentication.

---

### 5. Favorites Shelf (`/api/favorites`)
All favorites routes require user authentication (`authenticate` middleware). Patron ownership is strictly enforced.

- **`GET /api/favorites`**  
  Fetches the authenticated patron's favorited volumes with populated book metadata and rating.

- **`POST /api/favorites/:bookId`**  
  Adds a book to the authenticated patron's favorites shelf.
  - Validates `:bookId` format (24-char ObjectId).
  - Verifies that the book exists (`404` if not found).
  - Prevents duplicate favoriting via compound unique index and duplicate check (`409 Conflict`).
  - Returns `201 Created` with populated book details.

- **`DELETE /api/favorites/:bookId`**  
  Safely removes a volume from the authenticated patron's favorites shelf (`200 OK` on success, `404 Not Found` if not in shelf).

---

### 6. Circulation & Borrowing Lifecycle (`/api/borrows`)
All borrow endpoints require authentication. Ownership is strictly verified on all operations.

- **`POST /api/borrows`**  
  Checks out a book volume.
  - Validates `bookId` and lending parameters (`durationDays` 1-30, `format`: `epub`, `audiobook`, `hardcover`, `pdf`).
  - Atomically verifies `availableCopies > 0` and decrements `availableCopies` via `{ $inc: { availableCopies: -1 } }`.
  - Rejects if all copies are on loan (`400 Bad Request`).
  - Records `borrowedAt` timestamp and calculates `dueDate` from configurable `durationDays`.
  - Returns `201 Created` with clear loan details.

- **`GET /api/borrows/my`**  
  Retrieves authenticated patron's loan ledger with pagination, sorting, and status filtering (`borrowed`, `returned`, `overdue`). Computes virtual `isOverdue` flag without mutating database during `GET` operations.

- **`GET /api/borrows/:id`**  
  Fetches loan record details. Enforces ownership: only the borrower or an administrator can inspect the loan (`403 Forbidden` for other patrons).

- **`PATCH /api/borrows/:id/return`**  
  Returns a borrowed book volume.
  - Verifies ownership (borrower or administrator).
  - Verifies the loan is currently active (`status !== 'returned'`). Prevents double returns (`400 Bad Request`).
  - Marks borrow record `status = 'returned'` and sets `returnedAt`.
  - Atomically increments book `availableCopies` via `{ $inc: { availableCopies: 1 } }`.
  - Returns `200 OK` with updated circulation count.

---

### 7. Overdue Processing Service
- **Service (`overdueService.js`):**  
  Provides `syncOverdueLoans()` for automated, idempotent batch auditing of loans past their `dueDate`, safely transitioning them from `borrowed` to `overdue`.
- **Virtual Evaluator (`isLoanOverdue()`):**  
  Calculates real-time overdue status without writing mutations during read operations.
- **Admin Endpoint:**  
  `POST /api/admin/books/audit-overdue` triggers immediate catalog-wide loan audit and returns count of transitioned records.

---

### 8. Administrator Book Management (`/api/admin/books`)
All admin endpoints require authentication and administrator authorization (`authenticate, requireAdmin`).

- **`POST /api/admin/books`**  
  Registers a new book in the catalog.
  - Validates all book metadata via Zod (`createBookSchema`).
  - Validates ISBN-10 or ISBN-13 format and enforces catalog uniqueness (`409 Conflict` on duplicate ISBN).
  - Enforces `availableCopies <= totalCopies`.
  - Returns `201 Created` with new book record.

- **`PATCH /api/admin/books/:id`**  
  Updates book metadata or stock quantities.
  - Validates update payload via Zod (`updateBookSchema`).
  - Prevents collision if ISBN is being altered.
  - Enforces copy count integrity (`availableCopies <= totalCopies`).
  - Returns `200 OK` with updated book details.

- **`DELETE /api/admin/books/:id`**  
  Safely removes a book from the catalog.
  - Guards active loans: rejects deletion if active or overdue loans are in circulation (`400 Bad Request`).
  - Cleans up associated favorites upon deletion.
  - Returns `200 OK` with deleted book metadata.

- **`POST /api/admin/books/audit-overdue`**  
  Executes overdue circulation audit and synchronizes overdue statuses.

---

### 7. Recommendations (`/api/recommendations`)
Endpoints for content-based literary recommendations powered by the FastAPI AI microservice.

- **`POST /api/recommendations`**  
  Generates personalized or cold-start book recommendations.
  - **Access:** Private (Authenticated Patron or Admin via JWT Bearer or HttpOnly cookie).
  - **Body Parameters (Optional):**
    - `limit` (integer, 1-20, default 5)
    - `preferAvailable` (boolean, default true)
    - `allowFallback` (boolean, default false - strictly opt-in database popular books fallback)
    - `preferences` (object with `favorite_genres`, `favorite_categories`, `favorite_authors`)
  - **Backend Pipeline:**
    1. Fetches patron's favorites and loans in parallel from MongoDB Atlas.
    2. Merges user profile reading taste with request body overrides.
    3. Fetches catalog candidate books.
    4. Forwards unified payload to FastAPI (`FASTAPI_BASE_URL/api/recommendations`) authenticated with `AI_SERVICE_TOKEN`.
    5. Validates microservice response structure via Zod (`fastApiResponseSchema`).
    6. Enforces request timeout (504 Gateway Timeout) and service unavailability handling (503 Service Unavailable).
    7. Transparently falls back to database catalog popular books only if `allowFallback: true`.

---

## 🧪 Automated Test Suite

BookSphere backend includes comprehensive end-to-end and integration tests written using Node.js native test runner (`node:test`) and `supertest`:

```bash
npm test
```

### Test Coverage (69 Tests, 27 Test Suites, 100% Pass Rate):
1. **Authentication Flow (19 tests):** Registration, duplicate email rejection, password validation, case-insensitive login, invalid credentials, HttpOnly cookie & Bearer token sessions, invalid/tampered JWT, expired JWT handling, role-based authorization, logout cookie clearing.
2. **Public Book Catalog (11 tests):** Pagination metadata, keyword search (title, author, ISBN, category, genre), author filter, genre filter, category filter, availability filters (copies > 0 vs copies = 0), publication year sorting, single book retrieval, 404 for non-existent IDs, 400 for malformed ObjectIds.
3. **Favorites Shelf (7 tests):** 401 unauthenticated guard, adding favorites, 409 duplicate rejection, 404 for non-existent book, user shelf isolation (patron A cannot see patron B's favorites), safe deletion (200), 404 on deleting non-existent favorite.
4. **Borrowing Flow (8 tests):** 401 unauthenticated guard, checkout with atomic stock decrement & due date calculation, 400 rejection when availableCopies = 0, 404 on non-existent book, listing personal loans at `/api/borrows/my`, owner access to loan details, admin inspection of loan details, 403 Forbidden for unauthorized patrons.
5. **Return Flow (3 tests):** 403 Forbidden when returning another patron's book, successful return with atomic stock increment and `returnedAt` timestamp, 400 rejection on returning an already returned book.
6. **Overdue Processing (3 tests):** `isLoanOverdue` pure helper validation, `syncOverdueLoans` background service execution, `POST /api/admin/books/audit-overdue` endpoint execution.
7. **Admin Book Management (7 tests):** 403 Forbidden for non-admin patrons, cataloging new book (201), 409 duplicate ISBN rejection, 400 rejection when availableCopies > totalCopies, updating book metadata (200), 400 rejection when attempting to delete a book with active loans in circulation, safe deletion when no active loans exist (200).
8. **Recommendation Pipeline (11 tests in `tests/recommendation.test.js`):**
   - Unauthenticated request rejection (401)
   - Forged / invalid Bearer token rejection (401)
   - Authenticated user history gathering, service token dispatch, and validated response
   - HttpOnly session cookie authentication
   - Empty user history handling (cold-start fallback)
   - FastAPI slow response timeout handling (504 Gateway Timeout)
   - Invalid FastAPI payload structure rejection (502 Bad Gateway)
   - Missing required book fields rejection (502 Bad Gateway)
   - FastAPI microservice connection failure (503 Service Unavailable)
   - Documented database-based popular fallback (`allowFallback: true`)
   - Security verification (zero leakage of `AI_SERVICE_TOKEN` or `FASTAPI_BASE_URL`)



