# Real-Time Collaborative Notes Application

A production-quality full-stack web application that enables multiple users to collaborate on notes in real-time, featuring secure authentication, role-based access control (RBAC), and activity tracking.

## 🚀 Live Demo
- **Frontend:** [Coming Soon]
- **Backend API:** [Coming Soon]

## ✨ Features
- 🔐 **Secure Authentication** - JWT-based login/signup
- 📝 **Notes CRUD** - Create, edit, delete, pin notes
- 👥 **Real-Time Collaboration** - Live editing with Socket.IO
- 🔍 **Search** - Search notes by title and content
- 🔗 **Shareable Links** - Public read-only note sharing
- 📊 **Activity Logs** - Track all user actions
- 🎨 **Role-Based Access** - Owner, Editor, Viewer permissions

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express.js |
| Database | SQLite (better-sqlite3) |
| Real-time | Socket.IO |
| Auth | JWT (jsonwebtoken) |
| Password | bcryptjs |

## 📁 Project Structure
```
Notes/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API and Socket services
│   │   └── utils/          # Helper functions
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   └── socket/         # Socket.IO handlers
│   ├── data/               # SQLite database
│   └── package.json
└── README.md
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd server
npm install

# Create .env file
echo "PORT=8000" > .env
echo "JWT_SECRET=your-secret-key-here" >> .env

# Start server
npm run dev
```

### Frontend Setup
```bash
cd client
npm install

# Start development server
npm run dev
```

## 🌍 Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8000 |
| `JWT_SECRET` | Secret key for JWT | Required |
| `NODE_ENV` | Environment | development |

### Frontend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:8000/api |
| `VITE_SOCKET_URL` | Socket.IO URL | http://localhost:8000 |

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/user` | Get current user |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all user notes |
| GET | `/api/notes/:id` | Get single note |
| POST | `/api/notes` | Create note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |
| PUT | `/api/notes/:id/pin` | Toggle pin |
| POST | `/api/notes/:id/share` | Generate share link |
| GET | `/api/notes/shared/:token` | View shared note |
| GET | `/api/notes/search?q=` | Search notes |

### Collaborators
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notes/:id/collaborators` | Add collaborator |
| DELETE | `/api/notes/:id/collaborators/:userId` | Remove collaborator |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes/:id/activity` | Get activity log |

## 🗄 Database Schema

```sql
-- Users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notes
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT,
    owner_id INTEGER NOT NULL,
    is_pinned INTEGER DEFAULT 0,
    share_token TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Collaborators
CREATE TABLE collaborators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    permission TEXT NOT NULL DEFAULT 'viewer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(note_id, user_id)
);

-- Activity Logs
CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    note_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
);
```

## 🔌 Socket.IO Events

### Client → Server
- `join-note` - Join a note room
- `leave-note` - Leave a note room
- `note-update` - Send content update
- `typing` - Typing indicator

### Server → Client
- `note-updated` - Receive content update
- `user-joined` - User joined room
- `user-left` - User left room
- `online-users` - List of online users
- `user-typing` - Typing indicator

## 🏗 Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Express   │────▶│   SQLite    │
│   Client    │     │   Server    │     │   Database  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │    Socket.IO      │
       └───────────────────┘
              (WebSocket)
```

## 📄 License
MIT
