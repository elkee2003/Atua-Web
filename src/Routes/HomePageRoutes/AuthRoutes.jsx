import { Routes, Route } from 'react-router-dom';
import Home from '../../components/Homepages/HomeScreen/HomeScreen';

const AuthRoutes = () => (
    <Routes>
        <Route path="/" element={<Home />} />

        {/* for invalid route */}
        <Route path='*' element={<div style={{marginTop:'200px',textAlign:'center', fontSize:'30px', fontWeight:'bold', color:'rgb(192, 191, 191)'}}>404 Not Found</div>}/>
    </Routes>
);


export default AuthRoutes;