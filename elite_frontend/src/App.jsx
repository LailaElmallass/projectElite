import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, useNavigate } from 'react-router-dom'; // Add useNavigate here
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Tests from '@/pages/Tests';
import Formations from './pages/Formation';
import Dashboard from './layout/Dashboard';
import Home from './layout/Home';
import { DarkModeProvider } from './DarkModeContext';
import './i18n';
import api from '@/lib/api';

// ProtectedRoute: Enforce authentication
const ProtectedRoute = ({ children, user }) => {
  const navigate = useNavigate(); // Now valid with import

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  return user ? children : null;
};

// Match role to dashboard (used as a fallback)
const matchRoleToDashboard = (role) => {
  switch (role) {
    case 'coach':
      return '/coach_dashboard';
    case 'entreprise':
      return '/entreprise_dashboard';
    case 'admin':
      return '/admin_dashboard';
    default:
      return '/dashboard';
  }
};

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    // Navigation handled by SignIn.jsx
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin'; // Fallback navigation
    }
  };

  const router = createBrowserRouter([
    { path: "/signin", element: <SignIn onLogin={handleLogin} /> },
    { path: "/signup", element: <SignUp /> },
    { 
      path: "/tests", 
      element: (
        <ProtectedRoute user={user}>
          <Tests user={user} />
        </ProtectedRoute>
      ),
    },
    { 
      path: "/formations", 
      element: (
        <ProtectedRoute user={user}>
          <Formations />
        </ProtectedRoute>
      ),
    },
    { 
      path: "/dashboard", 
      element: (
        <ProtectedRoute user={user}>
          <Dashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      ),
    },
    { 
      path: "/coach_dashboard", 
      element: (
        <ProtectedRoute user={user}>
          <Dashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      ),
    },
    { 
      path: "/entreprise_dashboard", 
      element: (
        <ProtectedRoute user={user}>
          <Dashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      ),
    },
    { 
      path: "/admin_dashboard", 
      element: (
        <ProtectedRoute user={user}>
          <Dashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      ),
    },
    { path: "/", element: <Home /> },
  ], {
    future: {
      v7_startTransition: true,
    },
  });

  return (
    <DarkModeProvider>
      <RouterProvider router={router} />
    </DarkModeProvider>
  );
};

export default App;