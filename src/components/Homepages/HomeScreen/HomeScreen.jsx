import React from 'react';
import Header from '../Header/Header';
import Hero from '../Hero/Hero';
import AboutUs from '../AboutUs/AboutUs';
import OurServices from '../OurServices/OurServices';
import OurMission from '../OurMission/OurMission';
// import Signin from '../Signin/Signin';
// import Contact from '../Contact/Contact';
import Footer from '../Footer/Footer';

function Home (){
    return (
        <>
            <Header/>
            <Hero/>
            <AboutUs/>
            <OurServices/>
            <OurMission/>
            {/* <Signin/> */}
            {/* <Contact/> */}
            <Footer/>
        </>
    )
}

export default Home;