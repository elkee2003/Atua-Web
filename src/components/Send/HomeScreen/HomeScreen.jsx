import React, { useState, useEffect, useRef } from 'react';
import '../SendStyles/HomeScreen.css';
import { FaSearchLocation } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker } from '@react-google-maps/api';

function HomeScreen() {

  const [map, setMap] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
        (err) => {
          console.error(err);
          setCurrentPosition({ lat: 6.5244, lng: 3.3792 }); // Example: Lagos fallback
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);


  return (
    <div className='homeScreenCon'>
      {currentPosition ? (
        <GoogleMap
          mapContainerClassName="map-container"
          center={currentPosition}
          zoom={14}
          onLoad={setMap}
          onUnmount={() => setMap(null)}
        >
          <Marker position={currentPosition} />
        </GoogleMap>
      ) : (
        <p>Loading map...</p>
      )}

      {/* Home Search */}
      <div className="homesearchCon">
        <div 
          className='inputBox'
          onClick={() => navigate('/send/destination-search')}
        >
          <p className='inputText'>What's the destination?</p>
          <FaSearchLocation className='searchIconHome'/>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen
