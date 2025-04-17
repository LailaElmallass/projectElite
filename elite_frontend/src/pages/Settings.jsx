
import React from 'react';
import Sidebar from '../components/Sidebar';

const Settings = ({ user, isLoading, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
        <div className="bg-white dark:bg-elite-black-900 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Paramètres de l'entreprise</h2>
          <p>Contenu des paramètres à venir...</p>
          <button 
            onClick={onLogout}
            className="mt-4 bg-elite-red-500 text-white px-4 py-2 rounded hover:bg-elite-red-600"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;