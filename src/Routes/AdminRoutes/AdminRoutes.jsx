// import Layout and Sidebar for client
import React from 'react';
import {Routes, Route } from 'react-router-dom';
import "./AdminRoutes.css"
import AdminLayout from '../../components/AdminCom/ContentLayout'
import HomeAdmin from '../../components/AdminCom/ContentPagesAdmin/Home/AdminDashboard';
import Alerts from '../../components/AdminCom/ContentPagesAdmin/Alerts/Alerts';
import Profile from '../../components/AdminCom/ContentPagesAdmin/Profile/Profile';
import UsersDashboard from '../../components/AdminCom/ContentPagesAdmin/Profile/UsersDashboard/UsersDashboard';
import CourierDashboard from '../../components/AdminCom/ContentPagesAdmin/Profile/UsersDashboard/Courier/CourierDashboard';
import UserDashboard from '../../components/AdminCom/ContentPagesAdmin/Profile/UsersDashboard/User/UserDashboard';
import CourierFullProfile from '../../components/AdminCom/ContentPagesAdmin/Profile/UsersDashboard/Courier/FullDetails.jsx/CourierFullProfile';
import CourierOrders from '../../components/AdminCom/ContentPagesAdmin/Profile/UsersDashboard/Courier/FullDetails.jsx/CourierOrders/CourierOrders';
import CourierAnalytics from '../../components/AdminCom/ContentPagesAdmin/Profile/UsersDashboard/Courier/FullDetails.jsx/Analytics/Analytics';
import CourierLiveTrackingPage from '../../components/AdminCom/ContentPagesAdmin/Profile/UsersDashboard/Courier/FullDetails.jsx/LiveTracking/CourierLiveTrackingPage';
import UserFullProfile from '../../components/AdminCom/ContentPagesAdmin/Profile/UsersDashboard/User/FullDetails.jsx/UserFullProfile';



const AdminRoutes = () => (
    <Routes>
        <Route path="/" element={<AdminLayout />}>
            {/* Admin Home */}
            <Route path="home" element={<HomeAdmin />} />

            {/* Alerts */}
            <Route path="alert" element={<Alerts />} />

            {/* Profile */}
            <Route path="profile" element={<Profile />} />

            {/* Users Dashboard */}
            <Route path="users_dashboard" element={<UsersDashboard />} />


            {/* Courier Dashboard */}
            <Route path="courier_dashboard" element={<CourierDashboard />} />
            {/* User Dashboard */}
            <Route path="user_dashboard" element={<UserDashboard/>} />

            {/* Full Courier Profile */}
            <Route path="courier_full_profile/:id" element={<CourierFullProfile />} />
            {/* Courier Orders Specific */}
            <Route path="courier_orders/:id" element={<CourierOrders/>} />
            {/* Courier Analytics */}
            <Route path="courier_analytics/:id" element={<CourierAnalytics/>} />
            {/* Courier Live Update*/}
            <Route path="courier_live_tracking/:id" element={<CourierLiveTrackingPage/>} />


            {/* Full User Profile */}
            <Route path="user_full_profile/:id" element={<UserFullProfile />} />


            {/* for invalid route */}
            <Route 
                path='*' 
                element={
                    <div className='adminError404Con'>
                        <p>404 Not Found</p>
                    </div>
                }
            />
        </Route>
    </Routes>
);

export default AdminRoutes;