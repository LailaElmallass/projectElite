import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const SimulationGames = ({ user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          onLogout={onLogout}
        />
        <div className="container mx-auto py-10 px-6 max-w-7xl">
          <h1 className="text-3xl font-bold text-elite-red-500">Jeux de Simulations</h1>
          <p>Contenu des jeux de simulations à venir...</p>
        </div>
      </div>
    </div>
  );
};

export default SimulationGames;