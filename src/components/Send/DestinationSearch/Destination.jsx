import React, { useState, useEffect, useRef } from 'react';
import '../SendStyles/Destination.css';
import { MdNavigateNext } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';

const libraries = ["places"];

function DestinationSearch() {
  const originRef = useRef(null);
  const destinationRef = useRef(null);

  const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  // Load the Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey,
    libraries, // Use the consistent libraries array
  });

    const [originPlace, setOriginPlace] = useState(null);
    const [originPlaceLat, setOriginPlaceLat] = useState(null);
    const [originPlaceLng, setOriginPlaceLng] = useState(null);
    const [destinationPlace, setDestinationPlace]= useState(null)
    const [destinationPlaceLat, setDestinationPlaceLat]= useState(null)
    const [destinationPlaceLng, setDestinationPlaceLng]= useState(null)
    const [lastDestination, setLastDestination] = useState(null);
    const navigate = useNavigate();

    const handlePlacesChanged = (ref, type) => {
    if (ref.current) {
      const places = ref.current.getPlaces();
      if (places?.length > 0) {
        const place = places[0];
        const address = place.formatted_address;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        if (type === "origin") {
          setOriginPlace(address);
          setOriginPlaceLat(lat);
          setOriginPlaceLng(lng);
        } else {
          setDestinationPlace(address);
          setDestinationPlaceLat(lat);
          setDestinationPlaceLng(lng);
        }

        console.log(`${type} selected:`, { address, lat, lng });
      }
    }
  };

  return (
    <div className='destinationCon'>
        {/* Google Places Autocomplete */}
        {isLoaded ? (
            <>
                {/* Origin Input */}
                <div className="autocompleteContainer" style={{ marginBottom: "15px" }}>
                    <StandaloneSearchBox
                    onLoad={(ref) => (originRef.current = ref)}
                    onPlacesChanged={() => handlePlacesChanged(originRef, "origin")}
                    options={{
                        componentRestrictions: { country: ["ng", "gh", "us"] },
                    }}
                    >
                    <input
                        type="text"
                        placeholder="Enter Origin"
                        className="inputAutoComplete"
                        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
                    />
                    </StandaloneSearchBox>
                </div>

                {/* Destination Input */}
                <div className="autocompleteContainer">
                    <StandaloneSearchBox
                    onLoad={(ref) => (destinationRef.current = ref)}
                    onPlacesChanged={() => handlePlacesChanged(destinationRef, "destination")}
                    options={{
                        componentRestrictions: { country: ["ng", "gh", "us"] },
                    }}
                    >
                    <input
                        type="text"
                        placeholder="Enter Destination"
                        className="inputAutoComplete"
                        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
                    />
                    </StandaloneSearchBox>
                </div>

                {/* Debug Display */}
                <div style={{ marginTop: "20px" }}>
                    <p><strong>Origin:</strong> {originPlace} ({originPlaceLat}, {originPlaceLng})</p>
                    <p><strong>Destination:</strong> {destinationPlace} ({destinationPlaceLat}, {destinationPlaceLng})</p>
                </div>
            </>
        ) : (
            <p>Loading...</p>
        )}

        {/* Button */}
        <div 
            className='locationNxtBtnCon'
            onClick={()=> navigate('/send/parcel-notes')}
        >
            <MdNavigateNext 
                className='locationNxtBtn' 
            />
        </div>
        
    </div>
  )
}

export default DestinationSearch;