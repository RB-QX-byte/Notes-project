import React from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileInfo from '../Cards/ProfileInfo.jsx'
import SearchBar from '../SearchBar/SearchBar.jsx'
import { disconnectSocket } from '../../services/socket.js'

const Navbar = ({ userInfo, searchQuery, setSearchQuery, onSearch, onClearSearch }) => {

    const navigate = useNavigate();

    const onLogout = () => {
        // Clear token and user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Disconnect socket
        disconnectSocket();

        // Navigate to login
        navigate('/login');
    };

    const handleSearch = () => {
        if (onSearch && searchQuery !== undefined) {
            onSearch(searchQuery);
        }
    };

    const handleClearSearch = () => {
        if (setSearchQuery) {
            setSearchQuery('');
        }
        if (onClearSearch) {
            onClearSearch();
        }
    };

    const handleSearchChange = (e) => {
        if (setSearchQuery) {
            setSearchQuery(e.target.value);
        }
    };

    // Handle Enter key for search
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="bg-white flex items-center justify-between px-6 py-2 drop-shadow-lg sticky top-0 z-40">
            <h2
                className="text-xl font-medium text-black py-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate('/dashboard')}
            >
                Notes
            </h2>

            {/* Only show search when logged in */}
            {userInfo && (
                <SearchBar
                    value={searchQuery || ''}
                    onChange={handleSearchChange}
                    handleSearch={handleSearch}
                    onClearSearch={handleClearSearch}
                    onKeyPress={handleKeyPress}
                />
            )}

            {userInfo ? (
                <ProfileInfo userInfo={userInfo} onLogout={onLogout} />
            ) : (
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm text-slate-700 hover:text-primary transition-colors"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => navigate('/signup')}
                        className="text-sm bg-primary text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Sign Up
                    </button>
                </div>
            )}
        </div>
    )
}

export default Navbar