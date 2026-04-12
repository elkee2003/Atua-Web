import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Placeholder from '/placeholder.png';
import './MainProfile.css'; 
import {useAuthContext} from '../../../../../../Providers/ClientProvider/AuthProvider';
import './ProfileOptionBtns/ProfileOptionsBtn'
import ProfileHead from './ProfileHead/ProfileHead';

const ProfilePage = () => {
  const navigate = useNavigate();

  const { dbUser, authUser } = useAuthContext();

  if (!authUser) {
    return (
      <div className='mainContainer'>
        <div className='profilePicContainer'>
          <img src={Placeholder} alt="Placeholder" className='img' />
        </div>
        <p className='emptyText'>Sign In</p>
        <div className='emptyBtnCon'>
          <button className='emptyBtnTxt' onClick={() => navigate('/?section=signin')}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='mainContainer'>
      <ProfileHead/>
    </div>
  );
};

export default ProfilePage;