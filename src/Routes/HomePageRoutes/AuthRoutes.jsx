import { Routes, Route } from 'react-router-dom';
import Home from '../../components/Homepages/HomeScreen/HomeScreen';
import SenderSignup from '../../components/Homepages/LoginScreen/SenderSignUp';
import SenderConfirmEmail from '../../components/Homepages/LoginScreen/SenderConfirmEmail/ConfrimEmail';
import SenderForgotPassword from '../../components/Homepages/LoginScreen/SenderForgotPassword/ForgotPassword';
import SenderConfirmCode from '../../components/Homepages/LoginScreen/SenderForgotPassword/ConfirmCode'

const AuthRoutes = () => (
    <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/sender_signup" element={<SenderSignup />} />

        <Route path="/sender_confirm_email" element={<SenderConfirmEmail />} />

        <Route path="/sender_forgot_password" element={<SenderForgotPassword />} />

        <Route path="/sender_confirm_code" element={<SenderConfirmCode />} />

        {/* for invalid route */}
        <Route path='*' element={<div style={{marginTop:'200px',textAlign:'center', fontSize:'30px', fontWeight:'bold', color:'rgb(192, 191, 191)'}}>404 Not Found</div>}/>
    </Routes>
);


export default AuthRoutes;