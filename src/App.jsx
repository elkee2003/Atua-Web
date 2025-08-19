// import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthRoutes from './Routes/HomePageRoutes/AuthRoutes';
import SendRoutes from './Routes/SendRoutes/SendRoutes';

function App() {

  return (
    <div className='App'>
      <Router>
        <Routes>
          <Route path="/*" element={<AuthRoutes />} />
          
          <Route path="/send/*" element={<SendRoutes />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
