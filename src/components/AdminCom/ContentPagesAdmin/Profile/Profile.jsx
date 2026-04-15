import React from 'react';
import { useAuthContext } from '../../../../../Providers/ClientProvider/AuthProvider';
import AdminProfile from './AdminProfilePage/AdminProfile';
import Unauthorized from './Unauthorized';
import UserDashboard from './UsersDashboard/UsersDashboard';

function Profile() {
  const {dbUser} = useAuthContext();

  // Replace with real admin check later
  // if (dbUser?.id !== "dslhsghioisdisoissssiso") {
  //   return <Unauthorized />;
  // }

  return (
    <div >
        {/* <UserDashboard/> */}
      <AdminProfile/>
    </div>
  )
}

export default Profile
