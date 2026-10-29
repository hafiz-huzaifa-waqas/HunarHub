import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx'; // 👈 Naya Landing Page import kiya
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import AgentDashboard from './pages/AgentDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import SellerProfile from './pages/SellerProfile.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      {/* 👇 Root (/) par ab Landing Page chalega */}
      <Route path="/" element={<LandingPage />} />
      
      {/* 👇 Purana Home ab /home par chala gaya */}
      <Route path="/home" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/seller/:id" element={<SellerProfile />} />

      <Route
        path="/customer"
        element={
          <ProtectedRoute roles={['Customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agent"
        element={
          <ProtectedRoute roles={['Agent']}>
            <AgentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<p className="p-10 text-center">Page not found.</p>} />
    </Routes>
  );
}