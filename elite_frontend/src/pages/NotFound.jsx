import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
     <div className={cn("min-h-screen", darkMode ? "dark bg-elite-black-900" : "bg-elite-yellow-50")}>
      <div className="text-center bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-elite-red-500 dark:text-elite-red-400 mb-4">
          404 - Page Non Trouvée
        </h1>
        <p className="text-elite-black-600 dark:text-elite-black-300 mb-6">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 transition-colors"
        >
          Retour à l'Accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;