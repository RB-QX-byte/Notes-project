import { io } from 'socket.io-client';

// Socket URL - uses env variable in production, localhost in development
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

let socket = null;

// Initialize socket connection
export const initSocket = (token) => {
    if (socket?.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        socket.emit('user-online');
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket;
};

// Get current socket instance
export const getSocket = () => socket;

// Disconnect socket
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// Join a note room for collaboration
export const joinNote = (noteId) => {
    if (socket?.connected) {
        socket.emit('join-note', { noteId });
    }
};

// Leave a note room
export const leaveNote = (noteId) => {
    if (socket?.connected) {
        socket.emit('leave-note', { noteId });
    }
};

// Send note update
export const sendNoteUpdate = (noteId, title, content) => {
    if (socket?.connected) {
        socket.emit('note-update', { noteId, title, content });
    }
};

// Send typing indicator
export const sendTypingIndicator = (noteId, isTyping) => {
    if (socket?.connected) {
        socket.emit('typing', { noteId, isTyping });
    }
};

// Subscribe to note updates
export const onNoteUpdated = (callback) => {
    if (socket) {
        socket.on('note-updated', callback);
    }
};

// Subscribe to user joined
export const onUserJoined = (callback) => {
    if (socket) {
        socket.on('user-joined', callback);
    }
};

// Subscribe to user left
export const onUserLeft = (callback) => {
    if (socket) {
        socket.on('user-left', callback);
    }
};

// Subscribe to online users list
export const onOnlineUsers = (callback) => {
    if (socket) {
        socket.on('online-users', callback);
    }
};

// Subscribe to typing indicator
export const onUserTyping = (callback) => {
    if (socket) {
        socket.on('user-typing', callback);
    }
};

// Remove all listeners for a specific event
export const removeListener = (event) => {
    if (socket) {
        socket.off(event);
    }
};

// Remove all socket listeners
export const removeAllListeners = () => {
    if (socket) {
        socket.removeAllListeners();
    }
};

export default {
    initSocket,
    getSocket,
    disconnectSocket,
    joinNote,
    leaveNote,
    sendNoteUpdate,
    sendTypingIndicator,
    onNoteUpdated,
    onUserJoined,
    onUserLeft,
    onOnlineUsers,
    onUserTyping,
    removeListener,
    removeAllListeners,
};
