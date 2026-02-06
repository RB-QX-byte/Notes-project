import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Track online users per note
const noteRooms = new Map();

const initializeSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // Authentication middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            // Allow anonymous connections for viewing shared notes
            socket.user = null;
            return next();
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.user?.name || 'Anonymous');

        // User announces they're online
        socket.on('user-online', () => {
            if (socket.user) {
                socket.broadcast.emit('user-status', {
                    userId: socket.user.id,
                    name: socket.user.name,
                    status: 'online'
                });
            }
        });

        // Join a note room for real-time collaboration
        socket.on('join-note', ({ noteId }) => {
            const roomName = `note-${noteId}`;
            socket.join(roomName);

            // Track users in this room
            if (!noteRooms.has(noteId)) {
                noteRooms.set(noteId, new Set());
            }

            if (socket.user) {
                noteRooms.get(noteId).add({
                    id: socket.user.id,
                    name: socket.user.name,
                    socketId: socket.id
                });

                // Notify others in the room
                socket.to(roomName).emit('user-joined', {
                    userId: socket.user.id,
                    userName: socket.user.name
                });

                // Send list of online users to the joining user
                const onlineUsers = Array.from(noteRooms.get(noteId));
                socket.emit('online-users', onlineUsers);
            }

            console.log(`User ${socket.user?.name || 'Anonymous'} joined note ${noteId}`);
        });

        // Leave a note room
        socket.on('leave-note', ({ noteId }) => {
            const roomName = `note-${noteId}`;
            socket.leave(roomName);

            // Remove from tracking
            if (noteRooms.has(noteId) && socket.user) {
                const users = noteRooms.get(noteId);
                users.forEach(user => {
                    if (user.socketId === socket.id) {
                        users.delete(user);
                    }
                });

                // Notify others
                socket.to(roomName).emit('user-left', {
                    userId: socket.user.id
                });
            }

            console.log(`User ${socket.user?.name || 'Anonymous'} left note ${noteId}`);
        });

        // Handle note content updates
        socket.on('note-update', ({ noteId, title, content }) => {
            const roomName = `note-${noteId}`;

            // Broadcast to all other users in the same note room
            socket.to(roomName).emit('note-updated', {
                noteId,
                title,
                content,
                updatedBy: socket.user ? {
                    id: socket.user.id,
                    name: socket.user.name
                } : null,
                timestamp: new Date().toISOString()
            });
        });

        // Handle typing indicator
        socket.on('typing', ({ noteId, isTyping }) => {
            const roomName = `note-${noteId}`;

            if (socket.user) {
                socket.to(roomName).emit('user-typing', {
                    userId: socket.user.id,
                    userName: socket.user.name,
                    isTyping
                });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.user?.name || 'Anonymous');

            // Clean up from all note rooms
            noteRooms.forEach((users, noteId) => {
                users.forEach(user => {
                    if (user.socketId === socket.id) {
                        users.delete(user);

                        // Notify others
                        io.to(`note-${noteId}`).emit('user-left', {
                            userId: user.id
                        });
                    }
                });
            });

            // Broadcast offline status
            if (socket.user) {
                socket.broadcast.emit('user-status', {
                    userId: socket.user.id,
                    name: socket.user.name,
                    status: 'offline'
                });
            }
        });
    });

    return io;
};

export default initializeSocket;
