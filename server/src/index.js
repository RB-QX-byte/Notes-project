import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import db from "./config/database.js";
import authRoutes from "./routes/auth.js";
import notesRoutes from "./routes/notes.js";
import initializeSocket from "./socket/index.js";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

const port = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(
    cors({
        origin: "*",
    })
);

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "Notes API Server is running",
        version: "1.0.0"
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: true,
        message: "Something went wrong!"
    });
});

// Start server
httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Database initialized at ./data/notes.db`);
});
