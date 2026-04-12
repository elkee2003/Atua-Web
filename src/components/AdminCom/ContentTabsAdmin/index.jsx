import React from 'react';
import { FaHome, FaBell, FaCompass, FaSearch, FaUser, FaUsers } from 'react-icons/fa';
import { NavLink, useNavigate } from "react-router-dom";
import './Sidebar.css';

function ContentTabsClient ({ unreadCount }){

    const navigate = useNavigate();

    return (
        <>
            {/* Sidebar for larger screens */}
            <div className="client-sidebar">
                {/* <h2>Atua</h2> */}
                <div 
                    className='client-logoClickClient'
                    onClick={() => navigate('/')}
                >
                    <img 
                        src={'/AtuaSoloLogoTrans.png'}
                        alt="logo" 
                        width={150} 
                    />
                </div>
                <nav>
                    <ul>
                        <li>
                            {/* Approved */}
                            <NavLink 
                                to="/admin/home"
                                className={({ isActive }) => isActive ? 'active-link' : ''}
                            >
                                <div className='client-nav-container'>
                                    <FaHome /> Home
                                </div>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink 
                                to="/admin/alert"
                                className={({ isActive }) => isActive ? 'active-link' : ''}
                            >
                                <div className='client-nav-container'>
                                    <FaBell /> Alerts
                                    {unreadCount > 0 && (
                                        <span className="clientNotification-badge">{unreadCount}</span>
                                    )}
                                </div>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink 
                                to="/admin/profile"
                                className={({ isActive }) => isActive ? 'active-link' : ''}
                            >
                                <div className='client-nav-container'>
                                    <FaUser /> Profile
                                </div>
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Bottom tab navigator for smaller screens */}
            <div className="client-bottom-nav">
                {/* Approved */}
                <NavLink 
                    to="/admin/home"
                    className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                    <FaHome /> Home
                </NavLink>

                <NavLink 
                    to="/admin/alert"
                    className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                    <div className='clientBottomNavBellCon'>
                    <FaBell /> Alerts
                        {unreadCount > 0 && (
                            <span className="clientNotification-badge">{unreadCount}</span>
                        )}
                    </div>
                </NavLink>

                <NavLink Link 
                    to="/admin/profile"
                    className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                    <FaUser /> Profile
                </NavLink>
            </div>
        </>
    )
}

export default ContentTabsClient;