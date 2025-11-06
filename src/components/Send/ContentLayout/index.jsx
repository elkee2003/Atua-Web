// components/Layout.jsx
import React, {useState, useEffect} from "react";
import { Outlet } from "react-router-dom"; 
import ContentTabsClient from "../ContentTabsClient";
import './ContentLayout.css';
import {FaBell} from 'react-icons/fa';
// import { useAuthContext } from "../../../../Providers/ClientProvider/AuthProvider";
import { ToastContainer, toast } from 'react-toastify';
// import { DataStore } from 'aws-amplify/datastore';
// import { Notification } from "../../../models";

const Layout = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  // const { dbUser } = useAuthContext();

  // useEffect(() => {
  //   if (!dbUser?.id) return;
  
  //   const fetchUnreadCount = async () => {
  //     const all = await DataStore.query(Notification, n =>
  //       n.recipientID.eq(dbUser.id)
  //     );
  //     const unread = all.filter(n => !n.read);
  //     setUnreadCount(unread.length);
  //   };
  
  //   fetchUnreadCount();
  
  //   const subscription = DataStore.observe(Notification).subscribe(async msg => {
  //     const { opType, element } = msg;
  
  //     if (element.recipientID !== dbUser.id) return;
  
  //     if (opType === 'INSERT') {
  //       toast.info(
  //         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  //           <FaBell />  {element.message}
  //         </div>
  //       );
  //     }
  
  //     // Recalculate count for any relevant change
  //     await fetchUnreadCount();
  //   });
  
  //   return () => subscription.unsubscribe();
  // }, [dbUser]);

  return (
    <div className="client-layoutCon">
      {/* Sidebar */}
      <ContentTabsClient unreadCount={unreadCount}/>
      
      {/* Main Content */}
      <div className="client-main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;