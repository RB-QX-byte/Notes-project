import React from 'react'
import Navbar from '../../components/Navbar/Navbar.jsx'
import NoteCard from '../../components/Cards/NoteCard.jsx'
import { MdAdd } from 'react-icons/md'
import AddEditNotes from './AddEditNotes.jsx'
const Home = () => {
    return (
        <>
            <Navbar />

            <div className="container mx-auto ">
                <div className="grid grid-cols-3 gap-4 mt-8">
                <NoteCard title="Meeting on 7th April"
                    date="2026-02-06"
                    content="Meeting on 7th April"
                    tags="#meeting"
                    isPinned={true}
                    onEdit={() => { }}
                    onDelete={() => { }}
                    onPinNote={() => { }}
                />
                </div>
            </div>

            <button className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10" onClick={() => { }}>
                <MdAdd className="text-[32px] text-white "/>
            </button>

            <AddEditNotes/>
        </>
    )
}

export default Home