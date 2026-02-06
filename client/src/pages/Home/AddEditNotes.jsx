import React, { useState, useEffect } from 'react'
import { MdClose } from 'react-icons/md'
import { notesAPI } from '../../services/api.js'
import { joinNote, leaveNote, sendNoteUpdate } from '../../services/socket.js'

const AddEditNotes = ({ type, noteData, onClose, onSave, showToast }) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Debounce timer for real-time updates
    const [debounceTimer, setDebounceTimer] = useState(null);

    // Populate form when editing
    useEffect(() => {
        if (type === "edit" && noteData) {
            setTitle(noteData.title || "");
            setContent(noteData.content || "");
            setTags(noteData.tags || "");

            // Join note room for real-time collaboration
            joinNote(noteData.id);
        }

        return () => {
            // Leave note room when closing
            if (noteData?.id) {
                leaveNote(noteData.id);
            }
            // Clear debounce timer
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [type, noteData]);

    // Broadcast changes for real-time collaboration (with debounce)
    const broadcastChanges = (newTitle, newContent) => {
        if (type === "edit" && noteData?.id) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            const timer = setTimeout(() => {
                sendNoteUpdate(noteData.id, newTitle, newContent);
            }, 500);
            setDebounceTimer(timer);
        }
    };

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        broadcastChanges(newTitle, content);
    };

    const handleContentChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        broadcastChanges(title, newContent);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        setError("");
        setLoading(true);

        try {
            let response;
            const data = { title: title.trim(), content, tags };

            if (type === "edit" && noteData) {
                response = await notesAPI.update(noteData.id, data);
            } else {
                response = await notesAPI.create(data);
            }

            if (response.data.error === false) {
                onSave(response.data.note, type === "add");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to save note';
            setError(errorMessage);
            showToast?.(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={onClose}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
                <MdClose className="text-xl text-slate-400" />
            </button>

            <h3 className="text-lg font-medium text-slate-800 mb-4">
                {type === "edit" ? "Edit Note" : "Add New Note"}
            </h3>

            <div className="flex flex-col gap-2">
                <label className="input-label">TITLE</label>
                <input
                    type="text"
                    className="text-xl text-slate-950 outline-none border-b border-slate-200 pb-2 focus:border-primary transition-colors"
                    placeholder="Go to Gym At 6pm"
                    value={title}
                    onChange={handleTitleChange}
                />
            </div>

            <div className="flex flex-col gap-2 mt-4">
                <label className="input-label">CONTENT</label>
                <textarea
                    className="text-sm text-slate-950 outline-none bg-slate-50 p-3 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all"
                    placeholder="Write your note content here..."
                    rows={10}
                    value={content}
                    onChange={handleContentChange}
                />
            </div>

            <div className="mt-4">
                <label className="input-label">TAGS</label>
                <input
                    type="text"
                    className="w-full text-sm bg-slate-50 outline-none p-3 rounded-lg mt-1 focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all"
                    placeholder="#work #personal #ideas"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />
            </div>

            {error && (
                <p className="text-red-500 text-sm mt-3">{error}</p>
            )}

            <button
                className="btn-primary font-medium mt-5 flex items-center justify-center"
                onClick={handleSave}
                disabled={loading}
            >
                {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    type === "edit" ? "Update Note" : "Add Note"
                )}
            </button>
        </div>
    )
}

export default AddEditNotes