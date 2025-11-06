import React, {useState} from 'react';
import '../SendStyles/ParcelNotes.css';
import { useNavigate } from "react-router-dom";
import {useAuthContext} from '../../../../../../Provider/AuthProvider';
import {useOrderContext} from '../../../../../../Provider/OrderProvider';

function ParcelNote() {
  const navigate = useNavigate();
  
  const {recipientName, recipientNumber, recipientNumber2, orderDetails, setRecipientName, setRecipientNumber, setRecipientNumber2, setOrderDetails, orders, setOrders,} = useOrderContext();

  const {dbuser, sub}= useAuthContext();


  const [recipientNameError, setRecipientNameError] = useState('');
  const [recipientNumberError, setRecipientNumberError] = useState('');
  const [recipientNumberError2, setRecipientNumberError2] = useState('');

  const validateAndContinue = () => {
    let hasError = false;

    if (!recipientName.trim() || recipientName.length < 2) {
      setRecipientNameError("Kindly input the name of recipient.");
      hasError = true;
    } else {
      setRecipientNameError("");
    }

    if (recipientNumber.length < 11) {
      setRecipientNumberError("Phone number must be at least 11 characters.");
      hasError = true;
    } else {
      setRecipientNumberError("");
    }

    if (!hasError) {
      navigate("/send/review_order");
    }

  };

  return (
    <div className='parcelNotesCon'>
      <p className='parcelTxt'>Parcel Note</p>

      {/* Recipient Name */}
      <input
        type="text"
        className="parcelInput"
        value={recipientName}
        onChange={(e) => setRecipientName(e.target.value)}
        placeholder="Sending to e.g. Opus"
      />
      {recipientNameError && <p className="errorText">{recipientNameError}</p>}

      {/* Recipient Number */}
      <input
        type="text"
        className="parcelInput"
        value={recipientNumber}
        onChange={(e) => {
          // allow only digits
          const value = e.target.value.replace(/\D/g, "");
          setRecipientNumber(value);
        }}
        placeholder="e.g. 08030000000"
      />
      {recipientNumberError && (
        <p className="errorText">{recipientNumberError}</p>
      )}

      {/* Recipient Number 2 */}
      <input
        type="text"
        className="parcelInput"
        value={recipientNumber2}
        onChange={(e) => {
          // allow only digits
          const value = e.target.value.replace(/\D/g, "");
          setRecipientNumber2(value);
        }}
        placeholder="Backup number eg:07090000"
      />
      {recipientNumberError && (
        <p className="errorText">{recipientNumberError2}</p>
      )}

       {/* Parcel Description / Note */}
      <textarea
        className="parcelNoteInput"
        value={orderDetails}
        onInput={(e) => {
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        onChange={(e) => setOrderDetails(e.target.value)}
        placeholder="e.g. Letter, food, clothes, fragile items, etc."
        rows={4}
      />

      {/* Button */}
      <button onClick={validateAndContinue} className="parcelSubmitBtn">
        Review
      </button>
    </div>
  )
}

export default ParcelNote;