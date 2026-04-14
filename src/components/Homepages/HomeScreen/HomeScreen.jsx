import React from 'react';
import Header from '../Header/Header';
import Hero from '../Hero/Hero';
import AboutUs from '../AboutUs/AboutUs';
import OurServices from '../OurServices/OurServices';
import OurMission from '../OurMission/OurMission';
import ContactUs from '../ContactUs/ContactUs';
import Footer from '../Footer/Footer';
import SenderSignIn from '../LoginScreen/SenderSignIn';

function Home (){
    return (
        <>
            <Header/>
            <Hero/>
            <AboutUs/>
            <OurServices/>
            <OurMission/>
            <SenderSignIn/>
            <ContactUs/>
            <Footer/>
        </>
    )
}

export default Home;