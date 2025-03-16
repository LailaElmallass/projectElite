import React from 'react';
import { Home, BookOpen, Lightbulb, User, X, BookCheck, Menu } from 'lucide-react'; 
import LogoElite from '../assets/LogoElite.png';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { darkMode } = useDarkMode();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 h-full w-64 shadow-xl transform transition-transform duration-300 ease-in-out z-20",
        darkMode 
          ? "bg-gradient-to-b from-elite-black-900 to-elite-black-700 text-elite-yellow-100" 
          : "bg-elite-yellow-50 text-elite-black-900",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "xl:w-72 xl:translate-x-0" 
      )}
    >
      <div 
        className={cn(
          "flex items-center justify-between p-6 border-b",
          darkMode ? "border-elite-black-600" : "border-elite-black-200"
        )}
      >
        <div className="flex items-center space-x-2">
          <img 
            src={LogoElite} 
            alt="Logo Elite Talents" 
            className="w-12 h-10 transition-transform duration-300 hover:scale-110" 
          />
          <h2 
            className={cn(
              "text-xl font-extrabold tracking-wide drop-shadow-md transition-colors duration-200",
              darkMode 
                ? "text-elite-yellow-400 hover:text-elite-yellow-300" 
                : "text-elite-black-900 hover:text-elite-black-700"
            )}
          >
            ELITE TALENTS
          </h2>
        </div>
        <button 
          onClick={toggleSidebar} 
          className={cn(
            "focus:outline-none",
            darkMode ? "text-elite-red-500 hover:text-elite-red-400" : "text-elite-black-700 hover:text-elite-black-900"
          )}
          aria-label={isOpen ? "Fermer la barre latérale" : "Ouvrir la barre latérale"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          <li>
            <Link 
              to="/dashboard" 
              className={cn(
                "flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group",
                darkMode 
                  ? "text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400" 
                  : "text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700"
              )}
            >
              <Home 
                className={cn(
                  "w-6 h-6 mr-3 transition-colors duration-300",
                  darkMode ? "group-hover:text-elite-red-400" : "group-hover:text-elite-black-700"
                )} 
              />
              <span className="text-base font-medium">Tableau de bord</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/formations" 
              className={cn(
                "flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group",
                darkMode 
                  ? "text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400" 
                  : "text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700"
              )}
            >
              <BookOpen 
                className={cn(
                  "w-6 h-6 mr-3 transition-colors duration-300",
                  darkMode ? "group-hover:text-elite-red-400" : "group-hover:text-elite-black-700"
                )} 
              />
              <span className="text-base font-medium">Formations</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/tests" 
              className={cn(
                "flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group",
                darkMode 
                  ? "text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400" 
                  : "text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700"
              )}
            >
              <BookCheck 
                className={cn(
                  "w-6 h-6 mr-3 transition-colors duration-300",
                  darkMode ? "group-hover:text-elite-red-400" : "group-hover:text-elite-black-700"
                )} 
              />
              <span className="text-base font-medium">Tests</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/conseils" 
              className={cn(
                "flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group",
                darkMode 
                  ? "text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400" 
                  : "text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700"
              )}
            >
              <Lightbulb 
                className={cn(
                  "w-6 h-6 mr-3 transition-colors duration-300",
                  darkMode ? "group-hover:text-elite-red-400" : "group-hover:text-elite-black-700"
                )} 
              />
              <span className="text-base font-medium">Conseils</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/profil" 
              className={cn(
                "flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group",
                darkMode 
                  ? "text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400" 
                  : "text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700"
              )}
            >
              <User 
                className={cn(
                  "w-6 h-6 mr-3 transition-colors duration-300",
                  darkMode ? "group-hover:text-elite-red-400" : "group-hover:text-elite-black-700"
                )} 
              />
              <span className="text-base font-medium">Profil</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;