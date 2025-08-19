// import Layout and Sidebar for client
import React from 'react';
import {Routes, Route } from 'react-router-dom';
import HomeScreen from '../../components/Send/HomeScreen/HomeScreen';
import DestinationSearch from '../../components/Send/DestinationSearch/Destination';
import ParcelNote from '../../components/Send/ParcelNote/ParcelNotes';


const SendRoutes = () => (
    <Routes>
        <Route path="/" element={<HomeScreen />} />
        {/* Home */}
        <Route path="home" element={<HomeScreen />} />

        {/* Destination Search */}
        <Route path="destination-search" element={<DestinationSearch />} />

        {/* Notes */}
        <Route path="parcel-notes" element={<ParcelNote />} />


        {/* for invalid route */}
        <Route path='*' element={<div style={{display: 'flex', width:'100vw', marginTop:'200px', paddingLeft:'20%',textAlign:'center', fontSize:'30px', fontWeight:'bold', color:'rgb(192, 191, 191)'}}>404 Not Found</div>}/>

    </Routes>
);

export default SendRoutes;