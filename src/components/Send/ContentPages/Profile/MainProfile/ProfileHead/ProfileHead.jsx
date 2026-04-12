import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Placeholder from '/placeholder.png';
import './ProfileHead.css'; 
import { FaPhone } from 'react-icons/fa';
import { IoPerson } from 'react-icons/io5';
import { MdLocationOn } from 'react-icons/md'; 
import { BsThreeDotsVertical } from "react-icons/bs";
import { useProfileContext } from '../../../../../../../Providers/ClientProvider/ProfileProvider';
import { useAuthContext } from '../../../../../../../Providers/ClientProvider/AuthProvider';
import { DataStore } from "aws-amplify/datastore";
import { User } from '../../../../../../models';
import { getUrl } from 'aws-amplify/storage';

const ProfileHead = () => {
  const navigate = useNavigate();
  const { firstName, lastName, username, profilePic, setProfilePic, address, phoneNumber } = useProfileContext();
  const { dbUser, userMail } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  // ✅ Automatically save user email if missing
  useEffect(() => {
    const saveEmailIfMissing = async () => {
      try {
        // Only run if dbUser exists and has no email yet
        if (dbUser && !dbUser.email && userMail) {
          console.log("Saving missing user email:", userMail);

          await DataStore.save(
            User.copyOf(dbUser, (updated) => {
              updated.email = userMail;
            })
          );

          console.log("✅ Email successfully saved to DataStore:", userMail);
        }
      } catch (error) {
        console.error("❌ Error saving user email:", error);
      }
    };

    saveEmailIfMissing();
  }, [dbUser, userMail]);

  // Fetch signed URL for profile picture
  const fetchImageUrl = async () => {
    setLoading(true);
    if (!dbUser?.profilePic) {
      setProfilePic(null);
      setLoading(false);
      return;
    }
    try {
      const result = await getUrl({
        path: dbUser.profilePic,
        options: { validateObjectExistence: true, expiresIn: null },
      });
      setProfilePic(result?.url || null);
    } catch (error) {
      console.error('Error fetching profile pic URL:', error);
      setProfilePic(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dbUser?.profilePic) return;

    fetchImageUrl();
    const subscription = DataStore.observe(User).subscribe(({ opType }) => {
      if (['INSERT', 'UPDATE', 'DELETE'].includes(opType)) fetchImageUrl();
    });

    return () => subscription.unsubscribe();
  }, [dbUser?.profilePic]);


  return (
    <div className='clientProfileHeadCon'>

      <button
        className="clientDotCon"
        onClick={() => navigate('/send/profile_options')}
      >
          <BsThreeDotsVertical className='clientDotIcon' />
      </button>
      <div 
        className='mainProfilePicContainer' 
        // onClick={() => navigate('/clientcontent/editprofile')}
      >
        {loading || !profilePic ? (
          <img 
            src={Placeholder} 
            alt="Placeholder" 
            className='img' 
            onClick={() => navigate('/send/editprofile')}
          />
        ) : (
          <img 
            src={profilePic} 
            alt="Profile" 
            className='img' 
            onClick={() => setShowOverlay(true)}
          />
        )}
      </div>
      <div className='pRow'>
        {/* <IoPerson size={24} /> */}
        <p className='pName'>{firstName}</p>
      </div>

      <div className='userProUsernameCon'>
        <p className='userProUsername'>@{username ? username : 'unknown'}</p>
      </div>
      
      <div className='pRow'>
        {/* <FaPhone size={24} /> */}
        <p className='pTxt'>{phoneNumber}</p>
      </div>
      <div className='pRow'>
        {/* <MdLocationOn size={24} /> */}
        <p className='pTxt'>{address}</p>
      </div>
      <div className='profileSubrow'>
        <button onClick={() => navigate('/send/edit_profile')} className='mainSubHeader'>
          Edit Profile
        </button>
        {/* <button onClick={() => navigate('/send/reviewprofile')} className='mainSubHeader'>
          View Info
        </button> */}
      </div>

      {/* Show full image overlay */}
      {showOverlay && profilePic && (
          <div
          className="fullscreen-overlay"
          onClick={() => setShowOverlay(false)}
          >
          <img
              src={profilePic}
              alt="Full screen view"
              className='fullscreen-image'
          />
          </div>
      )}
    </div>
  );
};

export default ProfileHead;