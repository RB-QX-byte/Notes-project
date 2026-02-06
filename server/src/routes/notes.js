import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all notes for logged-in user (owned + collaborated)
router.get('/', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;

        // Get notes owned by user or shared with user
        const notes = db.prepare(`
            SELECT DISTINCT 
                n.id, n.title, n.content, n.tags, n.owner_id, 
                n.is_pinned, n.share_token, n.created_at, n.updated_at,
                u.name as owner_name,
                CASE 
                    WHEN n.owner_id = ? THEN 'owner'
                    ELSE COALESCE(c.permission, 'viewer')
                END as user_permission
            FROM notes n
            LEFT JOIN users u ON n.owner_id = u.id
            LEFT JOIN collaborators c ON n.id = c.note_id AND c.user_id = ?
            WHERE n.owner_id = ? OR c.user_id = ?
            ORDER BY n.is_pinned DESC, n.updated_at DESC
        `).all(userId, userId, userId, userId);

        res.json({
            error: false,
            notes
        });
    } catch (err) {
        console.error('Get notes error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Search notes
router.get('/search', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const query = req.query.q || '';

        if (!query.trim()) {
            return res.json({ error: false, notes: [] });
        }

        const searchTerm = `%${query}%`;

        const notes = db.prepare(`
            SELECT DISTINCT 
                n.id, n.title, n.content, n.tags, n.owner_id, 
                n.is_pinned, n.share_token, n.created_at, n.updated_at,
                u.name as owner_name
            FROM notes n
            LEFT JOIN users u ON n.owner_id = u.id
            LEFT JOIN collaborators c ON n.id = c.note_id AND c.user_id = ?
            WHERE (n.owner_id = ? OR c.user_id = ?)
                AND (n.title LIKE ? OR n.content LIKE ? OR n.tags LIKE ?)
            ORDER BY n.is_pinned DESC, n.updated_at DESC
        `).all(userId, userId, userId, searchTerm, searchTerm, searchTerm);

        res.json({
            error: false,
            notes
        });
    } catch (err) {
        console.error('Search notes error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Get shared note by token (public)
router.get('/shared/:token', (req, res) => {
    try {
        const { token } = req.params;

        const note = db.prepare(`
            SELECT n.id, n.title, n.content, n.tags, n.created_at, n.updated_at,
                   u.name as owner_name
            FROM notes n
            LEFT JOIN users u ON n.owner_id = u.id
            WHERE n.share_token = ?
        `).get(token);

        if (!note) {
            return res.status(404).json({
                error: true,
                message: 'Note not found or link expired'
            });
        }

        res.json({
            error: false,
            note
        });
    } catch (err) {
        console.error('Get shared note error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Get single note
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;

        const note = db.prepare(`
            SELECT n.*, u.name as owner_name,
                CASE 
                    WHEN n.owner_id = ? THEN 'owner'
                    ELSE COALESCE(c.permission, NULL)
                END as user_permission
            FROM notes n
            LEFT JOIN users u ON n.owner_id = u.id
            LEFT JOIN collaborators c ON n.id = c.note_id AND c.user_id = ?
            WHERE n.id = ?
        `).get(userId, userId, noteId);

        if (!note) {
            return res.status(404).json({
                error: true,
                message: 'Note not found'
            });
        }

        // Check if user has access
        if (note.owner_id !== userId && !note.user_permission) {
            return res.status(403).json({
                error: true,
                message: 'You do not have access to this note'
            });
        }

        // Get collaborators
        const collaborators = db.prepare(`
            SELECT c.user_id, c.permission, u.name, u.email
            FROM collaborators c
            JOIN users u ON c.user_id = u.id
            WHERE c.note_id = ?
        `).all(noteId);

        res.json({
            error: false,
            note: { ...note, collaborators }
        });
    } catch (err) {
        console.error('Get note error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Create new note
router.post('/', authenticateToken, (req, res) => {
    try {
        const { title, content, tags } = req.body;
        const userId = req.user.id;

        if (!title) {
            return res.status(400).json({
                error: true,
                message: 'Title is required'
            });
        }

        const result = db.prepare(
            'INSERT INTO notes (title, content, tags, owner_id) VALUES (?, ?, ?, ?)'
        ).run(title, content || '', tags || '', userId);

        const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);

        // Log activity
        db.prepare(
            'INSERT INTO activity_logs (user_id, note_id, action, details) VALUES (?, ?, ?, ?)'
        ).run(userId, note.id, 'create', JSON.stringify({ title }));

        res.status(201).json({
            error: false,
            message: 'Note created successfully',
            note
        });
    } catch (err) {
        console.error('Create note error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Update note
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;
        const { title, content, tags } = req.body;

        // Check if note exists and user has permission
        const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
        if (!note) {
            return res.status(404).json({
                error: true,
                message: 'Note not found'
            });
        }

        // Check permission (owner or editor)
        const collaborator = db.prepare(
            'SELECT permission FROM collaborators WHERE note_id = ? AND user_id = ?'
        ).get(noteId, userId);

        const canEdit = note.owner_id === userId ||
            (collaborator && collaborator.permission === 'editor');

        if (!canEdit) {
            return res.status(403).json({
                error: true,
                message: 'You do not have permission to edit this note'
            });
        }

        // Update note
        db.prepare(`
            UPDATE notes 
            SET title = ?, content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(title || note.title, content ?? note.content, tags ?? note.tags, noteId);

        const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);

        // Log activity
        db.prepare(
            'INSERT INTO activity_logs (user_id, note_id, action, details) VALUES (?, ?, ?, ?)'
        ).run(userId, noteId, 'update', JSON.stringify({ title: updatedNote.title }));

        res.json({
            error: false,
            message: 'Note updated successfully',
            note: updatedNote
        });
    } catch (err) {
        console.error('Update note error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Delete note (owner only)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;

        const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
        if (!note) {
            return res.status(404).json({
                error: true,
                message: 'Note not found'
            });
        }

        // Only owner can delete
        if (note.owner_id !== userId) {
            return res.status(403).json({
                error: true,
                message: 'Only the owner can delete this note'
            });
        }

        // Log activity before deletion
        db.prepare(
            'INSERT INTO activity_logs (user_id, note_id, action, details) VALUES (?, ?, ?, ?)'
        ).run(userId, noteId, 'delete', JSON.stringify({ title: note.title }));

        // Delete note (collaborators will be cascade deleted)
        db.prepare('DELETE FROM notes WHERE id = ?').run(noteId);

        res.json({
            error: false,
            message: 'Note deleted successfully'
        });
    } catch (err) {
        console.error('Delete note error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Toggle pin status
router.put('/:id/pin', authenticateToken, (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;

        const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
        if (!note) {
            return res.status(404).json({
                error: true,
                message: 'Note not found'
            });
        }

        // Check if user owns the note
        if (note.owner_id !== userId) {
            return res.status(403).json({
                error: true,
                message: 'Only the owner can pin/unpin this note'
            });
        }

        const newPinStatus = note.is_pinned ? 0 : 1;
        db.prepare('UPDATE notes SET is_pinned = ? WHERE id = ?').run(newPinStatus, noteId);

        res.json({
            error: false,
            message: newPinStatus ? 'Note pinned' : 'Note unpinned',
            is_pinned: !!newPinStatus
        });
    } catch (err) {
        console.error('Toggle pin error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Generate shareable link
router.post('/:id/share', authenticateToken, (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;

        const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
        if (!note) {
            return res.status(404).json({
                error: true,
                message: 'Note not found'
            });
        }

        // Only owner can generate share link
        if (note.owner_id !== userId) {
            return res.status(403).json({
                error: true,
                message: 'Only the owner can share this note'
            });
        }

        // Generate or return existing token
        let shareToken = note.share_token;
        if (!shareToken) {
            shareToken = uuidv4();
            db.prepare('UPDATE notes SET share_token = ? WHERE id = ?').run(shareToken, noteId);

            // Log activity
            db.prepare(
                'INSERT INTO activity_logs (user_id, note_id, action, details) VALUES (?, ?, ?, ?)'
            ).run(userId, noteId, 'share', JSON.stringify({ type: 'link' }));
        }

        res.json({
            error: false,
            message: 'Share link generated',
            share_token: shareToken
        });
    } catch (err) {
        console.error('Generate share link error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Add collaborator
router.post('/:id/collaborators', authenticateToken, (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;
        const { email, permission } = req.body;

        if (!email || !permission) {
            return res.status(400).json({
                error: true,
                message: 'Email and permission are required'
            });
        }

        if (!['editor', 'viewer'].includes(permission)) {
            return res.status(400).json({
                error: true,
                message: 'Permission must be "editor" or "viewer"'
            });
        }

        // Check if note exists and user is owner
        const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
        if (!note || note.owner_id !== userId) {
            return res.status(403).json({
                error: true,
                message: 'Only the owner can add collaborators'
            });
        }

        // Find user to add
        const collaboratorUser = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
        if (!collaboratorUser) {
            return res.status(404).json({
                error: true,
                message: 'User not found with this email'
            });
        }

        // Can't add yourself
        if (collaboratorUser.id === userId) {
            return res.status(400).json({
                error: true,
                message: 'You cannot add yourself as a collaborator'
            });
        }

        // Add or update collaborator
        db.prepare(`
            INSERT INTO collaborators (note_id, user_id, permission) 
            VALUES (?, ?, ?)
            ON CONFLICT(note_id, user_id) DO UPDATE SET permission = ?
        `).run(noteId, collaboratorUser.id, permission, permission);

        // Log activity
        db.prepare(
            'INSERT INTO activity_logs (user_id, note_id, action, details) VALUES (?, ?, ?, ?)'
        ).run(userId, noteId, 'add_collaborator', JSON.stringify({
            collaborator_email: email,
            permission
        }));

        res.json({
            error: false,
            message: 'Collaborator added successfully',
            collaborator: {
                user_id: collaboratorUser.id,
                name: collaboratorUser.name,
                email: collaboratorUser.email,
                permission
            }
        });
    } catch (err) {
        console.error('Add collaborator error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Remove collaborator
router.delete('/:id/collaborators/:collaboratorId', authenticateToken, (req, res) => {
    try {
        const noteId = req.params.id;
        const collaboratorId = req.params.collaboratorId;
        const userId = req.user.id;

        // Check if note exists and user is owner
        const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
        if (!note || note.owner_id !== userId) {
            return res.status(403).json({
                error: true,
                message: 'Only the owner can remove collaborators'
            });
        }

        db.prepare('DELETE FROM collaborators WHERE note_id = ? AND user_id = ?').run(noteId, collaboratorId);

        res.json({
            error: false,
            message: 'Collaborator removed successfully'
        });
    } catch (err) {
        console.error('Remove collaborator error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Get activity log for a note
router.get('/:id/activity', authenticateToken, (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;

        // Check if user has access to this note
        const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
        if (!note) {
            return res.status(404).json({
                error: true,
                message: 'Note not found'
            });
        }

        const collaborator = db.prepare(
            'SELECT permission FROM collaborators WHERE note_id = ? AND user_id = ?'
        ).get(noteId, userId);

        if (note.owner_id !== userId && !collaborator) {
            return res.status(403).json({
                error: true,
                message: 'You do not have access to this note'
            });
        }

        const activities = db.prepare(`
            SELECT a.*, u.name as user_name
            FROM activity_logs a
            JOIN users u ON a.user_id = u.id
            WHERE a.note_id = ?
            ORDER BY a.created_at DESC
            LIMIT 50
        `).all(noteId);

        res.json({
            error: false,
            activities
        });
    } catch (err) {
        console.error('Get activity log error:', err);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

export default router;
