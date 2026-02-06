import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register a new user
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                error: true,
                message: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({
                error: true,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user into database
        const result = db.prepare(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
        ).run(name, email, passwordHash);

        // Get the created user
        const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

        // Generate JWT token
        const token = generateToken(user);

        // Log activity
        db.prepare(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
        ).run(user.id, 'signup', JSON.stringify({ email: user.email }));

        res.status(201).json({
            error: false,
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: true,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({
                error: true,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                error: true,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user);

        // Log activity
        db.prepare(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)'
        ).run(user.id, 'login', JSON.stringify({ email: user.email }));

        res.json({
            error: false,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Get current user info
router.get('/user', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found'
            });
        }

        res.json({
            error: false,
            user
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

export default router;
