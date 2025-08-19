import React, {useState, useEffect, useMemo} from 'react';
import './AboutUs.css';

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

const AboutUs = () => {

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
      id='aboutUs'
      className="aboutUs-wrapper"
    >
        <div className="paddings innerWidth flexCenter aboutUs-container">
            <div className="flexColStart">
                <span className="primaryText">About Us</span>

                <span className="secondaryText bold-txt">
                    Atua is a logistics platform built to move parcels and goods with speed, safety, and reliability across Nigeria, Africa, and beyond.
                </span>

                {/* images */}
                <div 
                    className='bg-image'
                    style={{
                        backgroundImage: `url(${images[currentImage]})`,
                    }} 
                />

                {/* text */}
                <span className="secondaryText">
                    Atua is a logistics platform built to make delivery faster, safer, and more accessible for everyone. We connect people, businesses, and couriers through smart technology and a trusted ecosystem. Whether its a small package,, or bulk shipments, Atua ensures your delivery gets there on time — every time.
                </span>
            </div>
        </div>
    </section>
  );
};

export default AboutUs;