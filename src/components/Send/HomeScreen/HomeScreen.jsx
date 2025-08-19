import React, { useState, useEffect, useRef } from 'react';
import '../SendStyles/HomeScreen.css';
import { FaSearchLocation } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';

const center = {
  lat: 6.5244, // Example: Lagos
  lng: 3.3792,
};

function HomeScreen() {
  const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  // Load the Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey,
  });

  const [map, setMap] = useState(null);
  const navigate = useNavigate();

  const onLoad = React.useCallback(function callback(map) {
    // Fit bounds to center
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);


  return (
    <div className='homeScreenCon'>
      {isLoaded ? (
        <GoogleMap
          mapContainerClassName="map-container"
          center={center}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {/* Add markers or other features */}
        </GoogleMap>
      ) : (
        <p>Loading...</p>
      )}

      {/* Home Search */}
      <div className="homesearchCon">
        <div 
          className='inputBox'
          onClick={()=> navigate('/send/destination-search')}
        >
          <p className='inputText'>What's the destination?</p>
          <FaSearchLocation className='searchIconHome'/>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen
