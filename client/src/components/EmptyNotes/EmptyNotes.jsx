import React from 'react';
import { MdNoteAdd } from 'react-icons/md';

const EmptyNotes = ({ onAddNote }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <MdNoteAdd className="text-5xl text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-700 mb-2">No Notes Yet</h3>
            <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">
                Start capturing your thoughts, ideas, and tasks. Click the + button to create your first note.
            </p>
            {onAddNote && (
                <button
                    onClick={onAddNote}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <MdNoteAdd className="text-xl" />
                    Create Your First Note
                </button>
            )}
        </div>
    );
};

export default EmptyNotes;
