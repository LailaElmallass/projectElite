import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import LogoElite from '../assets/LogoElite.png';
import success2 from '../assets/success2.png';
import { cn } from '../lib/utils';

function Home() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center bg-cover bg-center",
        darkMode ? "dark" : ""
      )}
      style={{
        backgroundImage: `url(${success2})`,
        backgroundBlendMode: 'overlay',
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Bouton Mode Clair/Sombre */}
      <button
          onClick={toggleDarkMode}
          className={cn(
            "absolute top-4 right-4 p-2 rounded-full hover:bg-elite-red-500/20 transition-colors",
            darkMode ? "text-elite-yellow-400" : "text-elite-black-700"
          )}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
        </button>
      <div
        className={cn(
          "max-w-2xl mx-auto p-8 text-center rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300 backdrop-blur-md",
          darkMode 
            ? "bg-elite-black-900/90 text-elite-yellow-100" 
            : "bg-elite-yellow-100/90 text-elite-black-900"
        )}
      >
        

        {/* Titre avec Logo */}
        <h1
          className={cn(
            "text-4xl md:text-5xl font-extrabold mb-6 flex items-center justify-center gap-4 animate-fade-in",
            darkMode ? "text-elite-yellow-400" : "text-elite-red-700"
          )}
        >
          <img
            src={LogoElite}
            alt="Logo Elite"
            className="w-16 md:w-20 transition-transform duration-300 hover:scale-110"
          />
          Bienvenue chez ELITE TALENTS !
        </h1>

        {/* Slogan */}
        <p
          className={cn(
            "text-lg md:text-xl mb-10 font-medium",
            darkMode ? "text-elite-yellow-200" : "text-elite-black-700"
          )}
        >
          Éclairez votre avenir avec excellence !
        </p>

        {/* Boutons Connexion/Inscription */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            to="/signin"
            className={cn(
              "inline-block py-4 px-6 border-2 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105",
              darkMode 
                ? "border-elite-red-400 text-elite-red-400 hover:bg-elite-red-800/30 hover:text-elite-red-200" 
                : "border-elite-red-300 text-elite-red-300 hover:bg-elite-red-800 hover:text-white"
            )}
          >
            Connexion
          </Link>
          <Link
            to="/signup"
            className={cn(
              "inline-block py-4 px-6 border-2 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105",
              darkMode 
                ? "border-elite-yellow-400 text-elite-yellow-400 hover:bg-elite-yellow-600/30 hover:text-elite-yellow-200" 
                : "border-elite-yellow-800 text-elite-yellow-900 hover:bg-elite-yellow-600 hover:text-elite-black-900"
            )}
          >
            Inscription
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;