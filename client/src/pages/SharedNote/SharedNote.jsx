import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar.jsx'
import { notesAPI } from '../../services/api.js'

const SharedNote = () => {
    const { token } = useParams();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSharedNote = async () => {
            try {
                setLoading(true);
                const response = await notesAPI.getShared(token);
                if (response.data.error === false) {
                    setNote(response.data.note);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load shared note');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchSharedNote();
        }
    }, [token]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="max-w-2xl mx-auto text-center py-20">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">❌</span>
                        </div>
                        <h2 className="text-2xl font-medium text-slate-800 mb-2">Note Not Found</h2>
                        <p className="text-slate-500">{error}</p>
                    </div>
                ) : note ? (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="border-b pb-4 mb-6">
                                <h1 className="text-2xl font-semibold text-slate-800 mb-2">{note.title}</h1>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <span>By {note.owner_name}</span>
                                    <span>•</span>
                                    <span>{formatDate(note.created_at)}</span>
                                </div>
                            </div>

                            <div className="prose prose-slate max-w-none">
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {note.content || 'No content'}
                                </p>
                            </div>

                            {note.tags && (
                                <div className="mt-8 pt-4 border-t">
                                    <p className="text-sm text-slate-500">
                                        <span className="font-medium">Tags:</span> {note.tags}
                                    </p>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-sm text-slate-400 mt-6">
                            This is a shared note from Notes App
                        </p>
                    </div>
                ) : null}
            </div>
        </>
    )
}

export default SharedNote
