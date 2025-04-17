import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Tests from '@/pages/Tests';
import TestGeneral from '@/pages/TestGeneral';
import Formations from './pages/Formation';
import JobOffers from './pages/JobOffers';
import DiffusionWorkshops from './pages/DiffusionWorkshops'; // Added
import Dashboard from './layout/Dashboard';
import DashboardEntreprise from './layout/DashboardEntreprise';
import Home from './layout/Home';
import { DarkModeProvider } from './DarkModeContext';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import './i18n';
import api from '@/lib/api';
import Profile from './pages/Profile';
import UserList from './pages/UserList';
import Capsules from './pages/Capsules';
import SimulationGames from './pages/SimulationGames';
import CollaboratorsEnterprises from './pages/CollaboratorsEnterprises';
import Interviews from './pages/Interviews';
import FicheTechnique from './pages/FicheTechnique';

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
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async (forceFetch = false) => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token) {
      if (forceFetch || !storedUser) {
        try {
          const response = await api.get('/user', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('fetchUser failed:', error.response?.data || error.message);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } else {
        setUser(JSON.parse(storedUser));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsLoading(false);
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
      localStorage.clear();
    }
  };

  const router = createBrowserRouter([
    { path: '/signin', element: <SignIn onLogin={handleLogin} /> },
    { path: '/signup', element: <SignUp /> },
    { path: '/', element: <Home /> },
    { path: '/ficheTechnique', element: <FicheTechnique user={user} onSave={setUser} /> },
    { path: '/test_general', element: <TestGeneral user={user} isLoading={isLoading} onLogout={handleLogout} setUser={setUser} /> },
    { path: '/profile', element: <Profile user={user} isLoading={isLoading} setUser={setUser} fetchUser={fetchUser} onLogout={handleLogout} /> },
    { path: '/interviews', element: <Interviews user={user} isLoading={isLoading} onLogout={handleLogout} /> },
    { path: '/userList', element: <UserList user={user} isLoading={isLoading} onLogout={handleLogout} /> },
    { path: '/tests', element: <Tests user={user} isLoading={isLoading} onLogout={handleLogout} /> },
    { path: '/formations', element: <Formations user={user} isLoading={isLoading} onLogout={handleLogout} /> },
    { path: '/job-offers', element: <JobOffers user={user} isLoading={isLoading} onLogout={handleLogout} /> },
    { path: '/diffusions-workshops', element: <DiffusionWorkshops user={user} isLoading={isLoading} onLogout={handleLogout} /> }, // Added
    { path: '/capsules', element: <Capsules user={user} isLoading={isLoading} onLogout={handleLogout} /> },
    { path: '/simulation-games', element: <SimulationGames user={user} isLoading={isLoading} onLogout={handleLogout} /> },
    { path: '/dashboard', element: <Dashboard user={user} isLoading={isLoading} setUser={setUser} onLogout={handleLogout} /> },
    { path: '/coach_dashboard', element: <Dashboard user={user} isLoading={isLoading} setUser={setUser} onLogout={handleLogout} /> },
    { path: '/entreprise_dashboard', element: <DashboardEntreprise user={user} isLoading={isLoading} setUser={setUser} onLogout={handleLogout} /> },
    { path: '/admin_dashboard', element: <Dashboard user={user} isLoading={isLoading} setUser={setUser} onLogout={handleLogout} /> },
    { path: '/collaborators-enterprises', element: <CollaboratorsEnterprises user={user} isLoading={isLoading} onLogout={handleLogout} /> },
    { path: '*', element: <NotFound /> },
  ]);

  return (
    <DarkModeProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </DarkModeProvider>
  );
};

export default App;
