import React from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileInfo from '../Cards/ProfileInfo.jsx'
import SearchBar from '../SearchBar/SearchBar.jsx';

const Navbar = () => {

    const [searchQuery, setSearchQuery] = React.useState("");

    const navigate = useNavigate();

    const onLogout = () => {
        navigate("/login");
    };

    const handleSearch = () => { };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    return (
        <div className="bg-white flex items-center justify-between px-6 py-2 drop-shadow-lg">
            <h2 className="text-xl font-medium text-black py-2">Notes</h2>

            <SearchBar
                value={searchQuery}
                onChange={({ target }) => {
                    setSearchQuery(target.value);
                }}
                handleSearch={handleSearch}
                onClearSearch={handleClearSearch}
            />

            <ProfileInfo onLogout={onLogout} />
        </div>
    )
}

export default Navbar