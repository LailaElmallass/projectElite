import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Sun, Moon } from 'lucide-react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';

const SignIn = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [loginResponse, setLoginResponse] = useState(null);
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useDarkMode();

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez remplir tous les champs.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const response = await api.post('/login', { email, password });
      const { token, user, redirect } = response.data;
      onLogin(user, token, redirect); // Pass redirect to App.jsx
      setLoginResponse({ user, token, redirect });

      Swal.fire({
        icon: 'success',
        title: 'Connexion réussie !',
        text: 'Bienvenue dans votre espace.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      let errorMessage = 'Email ou mot de passe incorrect.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  useEffect(() => {
    if (loginResponse) {
      const { redirect } = loginResponse;
      const redirectPath = redirect || '/dashboard';
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
        setLoginResponse(null);
      }, 1000);
    }
  }, [loginResponse, navigate]);

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-gradient-to-br relative",
      darkMode 
        ? "from-elite-black-900 to-elite-black-700" 
        : "from-elite-yellow-50 to-white-100"
    )}>
      <button
        onClick={toggleDarkMode}
        className={cn(
          "absolute top-4 right-4 p-2 rounded-full hover:bg-elite-red-500/20 transition-colors z-50",
          darkMode ? "text-elite-yellow-400" : "text-elite-black-700"
        )}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </button>
      <div className={cn(
        "w-full max-w-md p-8 mt-20 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300 backdrop-blur-md z-10",
        darkMode ? "bg-elite-black-800/90 text-elite-yellow-100" : "bg-elite-yellow-50 text-elite-black-900"
      )}>
        <h2 className={cn(
          "text-3xl font-extrabold flex items-center justify-center mb-6",
          darkMode ? "text-elite-red-400" : "text-elite-red-400"
        )}>
          <User className="h-7 w-7 mr-3" /> Connexion
        </h2>

        {error && (
          <p className={cn(
            "text-sm text-center font-medium p-2 rounded mb-4",
            darkMode ? "text-elite-red-400 bg-elite-red-900/30" : "text-elite-red-600 bg-red-100"
          )}>
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all",
                darkMode ? "bg-elite-black-700 border-elite-black-600 text-elite-yellow-100" : "bg-elite-yellow-50 border-elite-black-300 text-elite-black-900"
              )}
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all",
                darkMode ? "bg-elite-black-700 border-elite-black-600 text-elite-yellow-100" : "bg-elite-yellow-50 border-elite-black-300 text-elite-black-900"
              )}
              required
            />
          </div>

          <button
            type="submit"
            className={cn(
              "w-full py-3 rounded-md font-semibold transition-all duration-300 transform hover:scale-105",
              darkMode ? "bg-elite-red-400 text-white hover:bg-elite-red-600" : "bg-elite-red-400 text-white hover:bg-elite-red-600"
            )}
          >
            Se connecter
          </button>
        </form>

        <p className={cn(
          "mt-4 text-center text-sm",
          darkMode ? "text-elite-black-300" : "text-elite-black-600"
        )}>
          Pas encore de compte ?{' '}
          <Link
            to="/signup"
            className={cn(
              "font-semibold hover:underline",
              darkMode ? "text-elite-yellow-400" : "text-elite-yellow-600"
            )}
          >
            S'inscrire
          </Link>
        </p>
        <p className={cn(
          "mt-2 text-center text-sm",
          darkMode ? "text-elite-black-300" : "text-elite-black-600"
        )}>
          <Link
            to="/"
            className={cn(
              "font-semibold hover:underline",
              darkMode ? "text-elite-yellow-400" : "text-elite-yellow-600"
            )}
          >
            Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;