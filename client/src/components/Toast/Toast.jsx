import React, { useEffect } from 'react';
import { MdCheck, MdClose, MdInfo, MdWarning } from 'react-icons/md';

const Toast = ({ message, type = 'info', isOpen, onClose, duration = 3000 }) => {
    useEffect(() => {
        if (isOpen && duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    const typeStyles = {
        success: {
            bg: 'bg-green-50 border-green-500',
            icon: <MdCheck className="text-green-500 text-xl" />,
            text: 'text-green-700',
        },
        error: {
            bg: 'bg-red-50 border-red-500',
            icon: <MdClose className="text-red-500 text-xl" />,
            text: 'text-red-700',
        },
        warning: {
            bg: 'bg-yellow-50 border-yellow-500',
            icon: <MdWarning className="text-yellow-500 text-xl" />,
            text: 'text-yellow-700',
        },
        info: {
            bg: 'bg-blue-50 border-blue-500',
            icon: <MdInfo className="text-blue-500 text-xl" />,
            text: 'text-blue-700',
        },
    };

    const style = typeStyles[type] || typeStyles.info;

    return (
        <div className="fixed top-5 right-5 z-50 animate-slide-in">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg ${style.bg}`}>
                {style.icon}
                <p className={`text-sm font-medium ${style.text}`}>{message}</p>
                <button
                    onClick={onClose}
                    className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <MdClose className="text-lg" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
