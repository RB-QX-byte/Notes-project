import React from 'react'
import { getInitials } from '../../utils/helper.js'

const ProfileInfo = ({ userInfo, onLogout }) => {
    const name = userInfo?.name || 'User';

    return (
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center rounded-full text-slate-950 font-medium bg-slate-100">
                {getInitials(name)}
            </div>

            <div>
                <p className='text-sm font-medium text-black'>{name}</p>
                <button className='text-sm text-slate-700 underline hover:text-primary transition-colors' onClick={onLogout}>
                    Logout
                </button>
            </div>
        </div>
    )
}

export default ProfileInfo