import React, {useState, useEffect, useMemo} from 'react';
import './OurServices.css';

// Custom hook to check screen width
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event) => setMatches(event.matches);

    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

const OurServices = () => {

    const [currentImage, setCurrentImage] = useState(0);
    
    // Detect screen size using multiple queries
    const isLargeScreen = useMediaQuery("(min-width: 1100px)");
    const isMediumScreen = useMediaQuery("(min-width: 500px) and (max-width: 1099px)");
    const isSmallScreen = useMediaQuery("(min-width: 250px) and (max-width: 499px)");

    const largeScreenImages = [
        '/image1.jpeg', '/image2.png'
    ];

    const mediumScreenImages = [
        '/image1.jpeg', '/image2.png'
    ]

    const smallScreenImages = [
        '/image1.jpeg', '/image2.png'
    ]

    // Choose images based on screen size
    const images = useMemo(() => {
            if (isLargeScreen) return largeScreenImages;
            if (isMediumScreen) return mediumScreenImages;
            if (isSmallScreen) return smallScreenImages;
            return [];
    }, [isLargeScreen, isMediumScreen, isSmallScreen]);


    // Preload images
    useEffect(() => {
        images.forEach((src) => {
        const img = new Image();
        img.src = src;
        });
    }, [images]);

    // Change background image every 6 seconds
    useEffect(() => {
        let isMounted = true;

        const changeImage = () => {
            const nextIndex = (currentImage + 1) % images.length;
            const img = new Image();
            img.src = images[nextIndex];

            img.onload = () => {
            if (isMounted) setCurrentImage(nextIndex);
            };
        };

        const interval = setInterval(changeImage, 6000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [currentImage, images]);

  return (
    <section
      id='services'
      className="services-wrapper"
    >
        <div className="paddings innerWidth flexCenter services-container">
            <div className="flexColStart">
                <span className="primaryText">Services</span>
                <span className="secondaryText bold-txt">
                    Our service is designed for every need:
                </span>

                {/* images */}
                <div 
                    className='bg-image'
                    style={{
                        backgroundImage: `url(${images[currentImage]})`,
                    }} 
                />

                {/* Text */}

                {/* Micro Express */}
                <div className="secondaryText">
                    Micro X (Express) - Fast and affordable small package delivery using couriers on foot, bicycles, or scooters. Perfect for documents, food, and light items.
                </div>

                {/* Moto Express */}
                <div className="secondaryText">
                    Moto X (Express) - Quick deliveries with motorcycles and cars for medium-sized packages that need to arrive immediately.
                </div>

                {/* Micro Group */}
                <div className="secondaryText">
                    Micro Group - Cost-effective small package delivery where your parcel is grouped with others. Ideal if you don't mind a flexible delivery time.
                </div>

                {/* Moto Group */}
                <div className="secondaryText">
                    Moto Group - Affordable medium-sized deliveries grouped together. Great for budget-conscious senders.
                </div>

                <div className="secondaryText">
                    Big loads and bulk shipments with vans, trucks, and specialized vehicles.”
                </div>
            </div>
        </div>
    </section>
  );
};

export default OurServices;