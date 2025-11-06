import React, { useState, useEffect, useRef } from 'react';
import '../SendStyles/HomeScreen.css';
import { FaSearchLocation } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { DataStore } from 'aws-amplify/datastore';
import {Courier} from '../../../../../models';

function HomeScreen() {

  const [map, setMap] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [couriers, setCouriers] = useState([]);
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
          setCurrentPosition({ lat: 6.5244, lng: 3.3792 }); 
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  console.log({currentPosition})

  // ✅ Fetch couriers from Amplify DataStore
  const fetchCouriers = async () => {
    try {
      const onlineCouriers = await DataStore.query(Courier, (c) =>
        c.isOnline.eq(true)
      );
      setCouriers(onlineCouriers);
      console.log('couriers:',couriers)
    } catch (error) {
      console.error('Failed to fetch couriers:', error);
    }
  };

  useEffect(() => {
    fetchCouriers();

    const subscription = DataStore.observe(Courier).subscribe(({ opType }) => {
      if (['INSERT', 'UPDATE', 'DELETE'].includes(opType)) {
        fetchCouriers();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ Get marker icon image based on courier type
  const getImage = (type) => {
    switch (type) {
      case 'Micro X':
        return '/atuaImages/Bicycle.png';
      case 'Moto X':
        return '/atuaImages/Bike.jpg';
      case 'Maxi Batch':
        return '/atuaImages/top-UberXL.png';
      case 'Maxi':
        return '/atuaImages/Deliverybicycle.png';
      default:
        return '/atuaImages/Walk.png';
    }
  };


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

          {/* Courier markers */}
          {couriers
            .filter((c) => c.lat && c.lng)
            .map((courier) => (
              <Marker
                key={courier.id}
                position={{ lat: courier.lat, lng: courier.lng }}
                icon={{
                  url: getImage(courier.transportationType),
                  scaledSize: new window.google.maps.Size(50, 70),
                }}
              />
            ))}
        </GoogleMap>
      ) : (
        <p>Loading map...</p>
      )}

      {/* Home Search */}
      <div className="homesearchCon">
        <div 
          className='inputBox'
          onClick={() => navigate('/send/destination_search')}
        >
          <p className='inputText'>What's the destination?</p>
          <FaSearchLocation className='searchIconHome'/>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen
