import React, {useState} from 'react';
import '../SendStyles/ParcelNotes.css';

function ParcelNote() {
  const [note, setNote] = useState('')
  return (
    <div className='parcelNotesCon'>
      <p className='parcelTxt'>Parcel Note</p>
      <textarea
          className="parcelNoteInput"
          value={note}
          onInput={(e) => {
            e.target.style.height = "auto"; // reset height
            e.target.style.height = e.target.scrollHeight + "px"; // grow if needed
          }}
          onChange={(e) => setNote(e.target.value)}
          placeholder='Write notes you want the courier to have, or use as a manifest'
          rows={4}
      />
    </div>
  )
}

export default ParcelNote;