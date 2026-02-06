# Real-Time Collaborative Notes Application
## Product Requirements Document (PRD)

---

## Overview

A production-quality full-stack web application that enables multiple users to collaborate on notes in real-time, featuring secure authentication, role-based access control (RBAC), and activity tracking.

---

## Current Implementation Status

### What's Already Built ✅

#### Frontend (React + Vite + Tailwind CSS v4)
- **Authentication Pages**
  - `Login.jsx` - Email/password form with validation
  - `SignUp.jsx` - Registration form with name, email, password
- **Home Dashboard**
  - `Home.jsx` - Notes grid layout with modal for add/edit
  - `AddEditNotes.jsx` - Form for creating/editing notes (title, content, tags)
- **Shared Components**
  - `Navbar.jsx` - Navigation with search bar and profile info
  - `SearchBar.jsx` - Search input with clear button
  - `NoteCard.jsx` - Individual note display with pin, edit, delete actions
  - `ProfileInfo.jsx` - User avatar with initials and logout button
  - `PasswordInput.jsx` - Password field with show/hide toggle
- **Utilities**
  - `helper.js` - Email validation, getInitials functions
- **Styling**
  - Custom Tailwind theme with primary/secondary colors
  - Component classes: `.input-box`, `.btn-primary`, `.icon-btn`, `.input-label`

#### Backend (Express.js)
- Basic Express server with CORS and JSON parsing
- Environment variable support via dotenv
- Running on port 8000

### What Needs to Be Built 🔨

#### Backend
1. **Database Layer (SQLite)**
   - Users table (id, name, email, password_hash, role, created_at)
   - Notes table (id, title, content, owner_id, is_pinned, share_token, created_at, updated_at)
   - Collaborators table (note_id, user_id, permission_level)
   - ActivityLogs table (id, user_id, note_id, action, timestamp)

2. **Authentication System**
   - POST `/api/auth/signup` - User registration
   - POST `/api/auth/login` - User login with JWT
   - GET `/api/auth/user` - Get current user info
   - JWT middleware for protected routes

3. **Notes API**
   - GET `/api/notes` - List user's notes (owned + collaborated)
   - GET `/api/notes/:id` - Get single note
   - POST `/api/notes` - Create new note
   - PUT `/api/notes/:id` - Update note
   - DELETE `/api/notes/:id` - Delete note (owner only)
   - PUT `/api/notes/:id/pin` - Toggle pin status
   - POST `/api/notes/:id/share` - Generate shareable link
   - GET `/api/notes/shared/:token` - View shared note (public)

4. **Collaboration API**
   - POST `/api/notes/:id/collaborators` - Add collaborator
   - DELETE `/api/notes/:id/collaborators/:userId` - Remove collaborator
   - PUT `/api/notes/:id/collaborators/:userId` - Update permission

5. **Search API**
   - GET `/api/notes/search?q=` - Search notes by title/content

6. **Activity Log API**
   - GET `/api/notes/:id/activity` - Get note activity history

7. **Real-Time (Socket.IO)**
   - `join-note` - Join note editing room
   - `leave-note` - Leave note room
   - `note-update` - Broadcast content changes
   - `online-users` - Track active collaborators

#### Frontend
1. **API Integration**
   - Axios instance with JWT interceptor
   - API service functions for all endpoints

2. **State Management**
   - User authentication state
   - Notes list state
   - Real-time sync state

3. **Missing Features**
   - Connect Login/SignUp to backend API
   - Fetch and display notes from API
   - Add/Edit/Delete notes via API
   - Search functionality
   - Real-time editing with Socket.IO
   - Collaborator management UI
   - Activity log display
   - Shareable link generation
   - Toast notifications

---

## Technical Specifications

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express.js |
| Database | SQLite (better-sqlite3) |
| Real-time | Socket.IO |
| Auth | JWT (jsonwebtoken) |
| Password | bcryptjs |

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Owner** | Full CRUD, manage collaborators, share note |
| **Editor** | Read, Edit content |
| **Viewer** | Read only |

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notes table
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    owner_id INTEGER NOT NULL,
    is_pinned INTEGER DEFAULT 0,
    share_token TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Collaborators table
CREATE TABLE collaborators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    permission TEXT NOT NULL, -- 'editor' or 'viewer'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(note_id, user_id)
);

-- Activity logs table
CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    note_id INTEGER,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'share', 'add_collaborator'
    details TEXT, -- JSON string with additional info
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
);
```

---

## API Endpoints Specification

### Authentication

```
POST /api/auth/signup
Body: { name, email, password }
Response: { user: {...}, token }

POST /api/auth/login
Body: { email, password }
Response: { user: {...}, token }

GET /api/auth/user
Headers: Authorization: Bearer <token>
Response: { user: {...} }
```

### Notes

```
GET /api/notes
Headers: Authorization: Bearer <token>
Response: { notes: [...] }

POST /api/notes
Headers: Authorization: Bearer <token>
Body: { title, content, tags }
Response: { note: {...} }

PUT /api/notes/:id
Headers: Authorization: Bearer <token>
Body: { title, content, tags }
Response: { note: {...} }

DELETE /api/notes/:id
Headers: Authorization: Bearer <token>
Response: { message: "Note deleted" }

GET /api/notes/search?q=query
Headers: Authorization: Bearer <token>
Response: { notes: [...] }

GET /api/notes/shared/:token
Response: { note: {...} } // Public endpoint
```

### Socket.IO Events

```javascript
// Client -> Server
socket.emit('join-note', { noteId, userId });
socket.emit('leave-note', { noteId, userId });
socket.emit('note-update', { noteId, content, title });

// Server -> Client
socket.on('note-updated', { noteId, content, title, updatedBy });
socket.on('user-joined', { userId, userName });
socket.on('user-left', { userId });
socket.on('online-users', [{ userId, userName }]);
```

---

## File Structure (After Implementation)

```
Notes/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Cards/
│   │   │   │   ├── NoteCard.jsx
│   │   │   │   └── ProfileInfo.jsx
│   │   │   ├── Input/
│   │   │   │   └── PasswordInput.jsx
│   │   │   ├── Navbar/
│   │   │   │   └── Navbar.jsx
│   │   │   ├── SearchBar/
│   │   │   │   └── SearchBar.jsx
│   │   │   └── Toast/
│   │   │       └── Toast.jsx (NEW)
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   │   ├── Home.jsx
│   │   │   │   └── AddEditNotes.jsx
│   │   │   ├── Login/
│   │   │   │   └── Login.jsx
│   │   │   ├── SignUp/
│   │   │   │   └── SignUp.jsx
│   │   │   └── SharedNote/
│   │   │       └── SharedNote.jsx (NEW)
│   │   ├── services/
│   │   │   ├── api.js (NEW)
│   │   │   └── socket.js (NEW)
│   │   ├── utils/
│   │   │   └── helper.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js (NEW)
│   │   ├── middleware/
│   │   │   └── auth.js (NEW)
│   │   ├── routes/
│   │   │   ├── auth.js (NEW)
│   │   │   └── notes.js (NEW)
│   │   ├── socket/
│   │   │   └── index.js (NEW)
│   │   └── index.js
│   ├── data/
│   │   └── notes.db (NEW - SQLite database file)
│   └── package.json
└── PRD.md
```

---

## Deployment Requirements

| Component | Platform | Environment Variables |
|-----------|----------|----------------------|
| Frontend | Vercel/Netlify | `VITE_API_URL`, `VITE_SOCKET_URL` |
| Backend | Railway/Render | `PORT`, `JWT_SECRET`, `NODE_ENV` |

---

## Success Metrics

- [ ] User can register and login
- [ ] User can create, read, update, delete notes
- [ ] Notes sync in real-time across multiple tabs/users
- [ ] Search works across title and content
- [ ] Shareable links work without authentication
- [ ] Activity log tracks all user actions
- [ ] Role-based permissions enforced at API level
