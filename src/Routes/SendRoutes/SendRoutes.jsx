// import Layout and Sidebar for client
import React from 'react';
import {Routes, Route, Navigate } from 'react-router-dom';
import "./SendRoutes.css"
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import SendLayout from '../../components/Send/ContentLayout';
import HomeScreen from '../../../src/components/Send/ContentPages/Home/HomeScreen/HomeScreen';
import DestinationSearch from '../../../src/components/Send/ContentPages/Home/DestinationSearch/Destination';
import ParcelNote from '../../../src/components/Send/ContentPages/Home/ParcelNote/ParcelNotes';
import ReviewOrder from '../../../src/components/Send/ContentPages/Home/ParcelNote/ParcelReview';
import GoogleMapsProvider from '../../../Provider/GoogleMapsProvider';
import SearchResult from '../../components/Send/ContentPages/Home/SearchResult/SearchResult';


const SendRoutes = () => (
    <GoogleMapsProvider>
        <Routes>
            {/* Layout wrapper */}
            <Route path="/" element={<SendLayout />}>

                {/* Redirect /send → /send/home */}
                <Route index element={<Navigate to="home" replace />} />
                
                {/* Home */}
                <Route path="home" element={<HomeScreen />} />

                {/* Destination Search */}
                <Route path="destination_search" element={<DestinationSearch />} />

                {/* Parcel Notes */}
                <Route path="parcel_notes" element={<ParcelNote />} />

                {/* Review Order*/}
                <Route path="review_order" element={<ReviewOrder />} />

                {/* Search Result*/}
                <Route path="search_results" element={<SearchResult />} />

                {/* 404 */}
                <Route
                path="*"
                element={
                    <div className='error404Con'>
                        {/* <p>404 Not Found</p> */}
                        <DotLottieReact
                            src="https://lottie.host/ce256115-23fd-4107-bf6b-c962f7ca030a/p1k0hD4Rgc.lottie"
                            loop
                            autoplay
                            className='errorLottie'
                        />
                    </div>
                }
                />

            </Route>

        </Routes>
    </GoogleMapsProvider>
);

export default SendRoutes;