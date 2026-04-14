// import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthRoutes from './Routes/HomePageRoutes/AuthRoutes';
import SendRoutes from './Routes/SendRoutes/SendRoutes';
import AdminRoutes from './Routes/AdminRoutes/AdminRoutes';
import AuthProvider from '../Providers/ClientProvider/AuthProvider';
import ProfileProvider from '../Providers/ClientProvider/ProfileProvider';
import LocationProvider from '../Providers/ClientProvider/LocationProvider';
import OrderProvider from '../Providers/ClientProvider/OrderProvider';

function App() {

  return (
    <div className='App'>
      <Router>
        <AuthProvider>
          <ProfileProvider>
            <LocationProvider>
              <OrderProvider>
                <Routes>
                  <Route path="/*" element={<AuthRoutes />} />
                  
                  <Route path="/send/*" element={<SendRoutes />} />

                  <Route path="/admin/*" element={<AdminRoutes />} />
                </Routes>
              </OrderProvider>
            </LocationProvider>
          </ProfileProvider>
        </AuthProvider>
      </Router>
    </div>
  )
}

export default App
