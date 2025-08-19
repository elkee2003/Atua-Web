// import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthRoutes from './Routes/HomePageRoutes/AuthRoutes';
import SendRoutes from './Routes/SendRoutes/SendRoutes';
// import AuthProvider from '../Provider/AuthProvider';
import ProfileProvider from '../Provider/ProfileProvider';
import LocationProvider from '../Provider/LocationProvider';
import OrderProvider from '../Provider/OrderProvider';

function App() {

  return (
    <div className='App'>
      <Router>
        {/* <AuthProvider> */}
          <ProfileProvider>
            <LocationProvider>
              <OrderProvider>
                <Routes>
                  <Route path="/*" element={<AuthRoutes />} />
                  
                  <Route path="/send/*" element={<SendRoutes />} />
                </Routes>
              </OrderProvider>
            </LocationProvider>
          </ProfileProvider>
        {/* </AuthProvider> */}
      </Router>
    </div>
  )
}

export default App
