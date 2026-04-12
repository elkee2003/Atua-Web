import React from 'react';
import { useAuthContext } from '../../../../../Providers/ClientProvider/AuthProvider';
// import EditProfile from './EditProfile/index';
// import MainProfile from './MainProfile/MainProfile';
import UserDashboard from './UsersDashboard/UsersDashboard';

function Profile() {
  const {dbUser} = useAuthContext();

  return (
    <div >
        <UserDashboard/>
      {/* {dbUser ?
        <MainProfile/>
      :
        <EditProfile/>
      } */}
    </div>
  )
}

export default Profile
