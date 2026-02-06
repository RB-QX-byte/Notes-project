import React from 'react'

const AddEditNotes = () => {
  return (
    <div>
        <div className="flex-flex-col gap-2">
            <label className="input-label">TITLE</label>
            <input 
                type="text"
                className="text-2xl text-slate-950 outline-none"
                placeholder="Go to Gym At 6pm"
                value={title}
                onChange={(e) => setTitle(e.target.value)} />
        </div>
    </div>
  )
}

export default AddEditNotes