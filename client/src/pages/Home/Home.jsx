import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '../../components/Navbar/Navbar.jsx'
import NoteCard from '../../components/Cards/NoteCard.jsx'
import { MdAdd } from 'react-icons/md'
import AddEditNotes from './AddEditNotes.jsx'
import Modal from 'react-modal'
import { useNavigate } from 'react-router-dom'
import { notesAPI } from '../../services/api.js'
import { initSocket, disconnectSocket, onNoteUpdated, removeListener } from '../../services/socket.js'
import Toast from '../../components/Toast/Toast.jsx'
import EmptyNotes from '../../components/EmptyNotes/EmptyNotes.jsx'

// Set app element for react-modal accessibility
Modal.setAppElement('#root');

const Home = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' });

    const [openAddEditModal, setOpenAddEditModal] = useState({
        isShown: false,
        type: "add",
        data: null
    });

    const navigate = useNavigate();

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        if (user) {
            setUserInfo(JSON.parse(user));
        }

        // Initialize socket connection
        initSocket(token);

        // Listen for real-time note updates
        onNoteUpdated((data) => {
            setNotes(prevNotes =>
                prevNotes.map(note =>
                    note.id === data.noteId
                        ? { ...note, title: data.title, content: data.content }
                        : note
                )
            );
        });

        return () => {
            removeListener('note-updated');
            disconnectSocket();
        };
    }, [navigate]);

    // Fetch notes
    const fetchNotes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await notesAPI.getAll();
            if (response.data.error === false) {
                setNotes(response.data.notes);
            }
        } catch (err) {
            console.error('Failed to fetch notes:', err);
            showToast('Failed to load notes', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchNotes();
        }
    }, [fetchNotes]);

    // Search notes
    const handleSearch = async (query) => {
        if (!query.trim()) {
            setIsSearching(false);
            fetchNotes();
            return;
        }

        try {
            setIsSearching(true);
            const response = await notesAPI.search(query);
            if (response.data.error === false) {
                setNotes(response.data.notes);
            }
        } catch (err) {
            console.error('Search failed:', err);
            showToast('Search failed', 'error');
        }
    };

    const onClearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        fetchNotes();
    };

    // Show toast helper
    const showToast = (message, type = 'info') => {
        setToast({ isOpen: true, message, type });
    };

    // Handle edit note
    const handleEdit = (note) => {
        setOpenAddEditModal({
            isShown: true,
            type: "edit",
            data: note
        });
    };

    // Handle delete note
    const handleDelete = async (noteId) => {
        try {
            const response = await notesAPI.delete(noteId);
            if (response.data.error === false) {
                setNotes(notes.filter(n => n.id !== noteId));
                showToast('Note deleted successfully', 'success');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            showToast(err.response?.data?.message || 'Failed to delete note', 'error');
        }
    };

    // Handle pin/unpin note
    const handlePinNote = async (noteId) => {
        try {
            const response = await notesAPI.togglePin(noteId);
            if (response.data.error === false) {
                setNotes(notes.map(n =>
                    n.id === noteId ? { ...n, is_pinned: response.data.is_pinned ? 1 : 0 } : n
                ));
                showToast(response.data.message, 'success');
            }
        } catch (err) {
            console.error('Pin toggle failed:', err);
            showToast(err.response?.data?.message || 'Failed to update pin status', 'error');
        }
    };

    // Handle add note click
    const handleAddNote = () => {
        setOpenAddEditModal({
            isShown: true,
            type: "add",
            data: null
        });
    };

    // Handle close modal
    const handleCloseModal = () => {
        setOpenAddEditModal({
            isShown: false,
            type: "add",
            data: null
        });
    };

    // Handle note saved (add or edit)
    const handleNoteSaved = (savedNote, isNew) => {
        if (isNew) {
            setNotes([savedNote, ...notes]);
        } else {
            setNotes(notes.map(n => n.id === savedNote.id ? savedNote : n));
        }
        handleCloseModal();
        showToast(isNew ? 'Note created successfully' : 'Note updated successfully', 'success');
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <>
            <Navbar
                userInfo={userInfo}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={handleSearch}
                onClearSearch={onClearSearch}
            />

            <div className="container mx-auto px-4">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : notes.length === 0 ? (
                    <EmptyNotes onAddNote={handleAddNote} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                        {notes.map((note) => (
                            <NoteCard
                                key={note.id}
                                title={note.title}
                                date={formatDate(note.created_at)}
                                content={note.content}
                                tags={note.tags}
                                isPinned={note.is_pinned === 1}
                                onEdit={() => handleEdit(note)}
                                onDelete={() => handleDelete(note.id)}
                                onPinNote={() => handlePinNote(note.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <button
                className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 fixed right-10 bottom-10 shadow-lg transition-all hover:scale-105"
                onClick={handleAddNote}
            >
                <MdAdd className="text-[32px] text-white" />
            </button>

            <Modal
                isOpen={openAddEditModal.isShown}
                onRequestClose={handleCloseModal}
                style={{
                    overlay: {
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    },
                }}
                contentLabel=""
                className="w-[95%] max-w-xl bg-white rounded-lg mx-auto mt-20 p-6 outline-none"
            >
                <AddEditNotes
                    type={openAddEditModal.type}
                    noteData={openAddEditModal.data}
                    onClose={handleCloseModal}
                    onSave={handleNoteSaved}
                    showToast={showToast}
                />
            </Modal>

            <Toast
                message={toast.message}
                type={toast.type}
                isOpen={toast.isOpen}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
        </>
    )
}

export default Home