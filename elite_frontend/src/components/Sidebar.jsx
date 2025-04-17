import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, User, X, BookCheck, Menu, Users, Video, Gamepad2, 
  Building, Calendar, FileText, Briefcase, Megaphone
} from 'lucide-react';
import LogoElite from '../assets/LogoElite.png';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';
import Swal from 'sweetalert2';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { darkMode } = useDarkMode();
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  const matchRoleToDashboard = (role) => {
    if (!role) return '/dashboard';
    switch (String(role).toLowerCase().trim()) {
      case 'coach': return '/coach_dashboard';
      case 'entreprise': return '/entreprise_dashboard';
      case 'admin': return '/admin_dashboard';
      default: return '/dashboard';
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  const showCompanyInfo = () => {
    if (user?.role === 'entreprise') {
      Swal.fire({
        title: user.company_name || 'Fiche Entreprise',
        html: `
          <div class="text-left text-sm">
            <p><strong>Adresse:</strong> ${user.address || '<span class="text-gray-500 italic">À compléter</span>'}</p>
            <p><strong>Technologies:</strong> ${user.software_technologies || '<span class="text-gray-500 italic">À compléter</span>'}</p>
            <p><strong>Téléphone:</strong> ${user.numero_de_telephone || '<span class="text-gray-500 italic">À compléter</span>'}</p>
            <p><strong>CEF:</strong> ${user.cef || '<span class="text-gray-500 italic">À compléter</span>'}</p>
            <p><strong>Création:</strong> ${user.creation_date || '<span class="text-gray-500 italic">À compléter</span>'}</p>
            <p><strong>Compétences:</strong> ${user.required_skills || '<span class="text-gray-500 italic">À compléter</span>'}</p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Modifier',
        showCancelButton: true,
        cancelButtonText: 'Fermer',
        customClass: {
          popup: darkMode ? 'dark-swal bg-elite-black-800 text-elite-yellow-100' : 'bg-white text-elite-black-900',
          confirmButton: 'bg-elite-green-500 hover:bg-elite-green-600 text-white px-4 py-2 rounded transition-all duration-300',
          cancelButton: 'bg-elite-red-500 hover:bg-elite-red-600 text-white px-4 py-2 rounded transition-all duration-300'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/ficheTechnique');
        }
      });
    }
  };

  const handleQuickAction = (action) => {
    Swal.fire({
      title: `Action rapide: ${action}`,
      text: `Voulez-vous ${action.toLowerCase()} maintenant ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      customClass: {
        popup: darkMode ? 'dark-swal bg-elite-black-800 text-elite-yellow-100' : 'bg-white text-elite-black-900',
        confirmButton: 'bg-elite-green-500 hover:bg-elite-green-600 text-white px-4 py-2 rounded transition-all duration-300',
        cancelButton: 'bg-elite-red-500 hover:bg-elite-red-600 text-white px-4 py-2 rounded transition-all duration-300'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Succès',
          text: `${action} effectué avec succès !`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: darkMode ? 'dark-swal bg-elite-black-800 text-elite-yellow-100' : 'bg-white text-elite-black-900'
          }
        });
      }
    });
  };

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen w-64 shadow-xl transform transition-transform duration-300 ease-in-out z-20',
        darkMode
          ? 'bg-gradient-to-b from-elite-black-900 to-elite-black-700 text-elite-yellow-100'
          : 'bg-elite-yellow-50 text-elite-black-900',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'xl:w-72 xl:translate-x-0'
      )}
    >
      <div className={cn(
        'flex items-center justify-between p-6 border-b',
        darkMode ? 'border-elite-black-600' : 'border-elite-black-200'
      )}>
        <div className="flex items-center space-x-2">
          <img src={LogoElite} alt="Logo Elite Talents" className="w-12 h-10 transition-transform duration-300 hover:scale-110" />
          <h2 className={cn(
            'text-xl font-extrabold tracking-wide drop-shadow-md transition-colors duration-200',
            darkMode ? 'text-elite-yellow-400 hover:text-elite-yellow-300' : 'text-elite-black-900 hover:text-elite-black-700'
          )}>
            ELITE TALENTS
          </h2>
        </div>
        <button onClick={toggleSidebar} className={cn(
          'focus:outline-none xl:hidden',
          darkMode ? 'text-elite-red-500 hover:text-elite-red-400' : 'text-elite-black-700 hover:text-elite-black-900'
        )} aria-label={isOpen ? 'Fermer la barre latérale' : 'Ouvrir la barre latérale'}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <nav className="mt-6 h-[calc(100vh-88px)] overflow-y-auto">
        <ul className="space-y-2 px-4">
          <li>
            <Link to={user ? matchRoleToDashboard(user.role) : '/dashboard'} className={cn(
              'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
              darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
              location.pathname === matchRoleToDashboard(user?.role) && 'bg-elite-red-500 text-white'
            )}>
              <Home className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
              <span className="text-base font-medium">Tableau de bord</span>
            </Link>
          </li>

          {user?.role === 'entreprise' && (
            <>
              <li>
                <button onClick={showCompanyInfo} className={cn(
                  'w-full flex items-center p-3 rounded-lg transition-all duration-300 transform hover:scale-105 group',
                  darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/50 hover:text-elite-yellow-300' : 'text-elite-black-900 hover:bg-elite-yellow-200/50 hover:text-elite-black-700'
                )}>
                  <FileText className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                    darkMode ? 'group-hover:text-elite-yellow-300' : 'group-hover:text-elite-black-700')} />
                  <span className="text-base font-medium">Fiche Technique</span>
                </button>
              </li>
              <li>
                <Link to="/ficheTechnique" className={cn(
                  'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:scale-105 group',
                  darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/50 hover:text-elite-yellow-300' : 'text-elite-black-900 hover:bg-elite-yellow-200/50 hover:text-elite-black-700',
                  location.pathname === '/ficheTechnique' && 'bg-elite-red-500 text-white'
                )}>
                  <FileText className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                    darkMode ? 'group-hover:text-elite-yellow-300' : 'group-hover:text-elite-black-700')} />
                  <span className="text-base font-medium">Ajouter Fiche Technique</span>
                </Link>
              </li>
            </>
          )}

          <li>
            <Link to="/job-offers" className={cn(
              'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
              darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
              location.pathname === '/job-offers' && 'bg-elite-red-500 text-white'
            )}>
              <Briefcase className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
              <span className="text-base font-medium">Offres d'emploi</span>
            </Link>
          </li>

          <li>
          </li>

          <li>
              <Link to="/diffusions-workshops" className={cn(
                'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
                darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
                location.pathname === '/diffusions-workshops' && 'bg-elite-red-500 text-white'
              )}>
                <Megaphone className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                  darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
                <span className="text-base font-medium">Diffusions et Ateliers</span>
              </Link>
            </li>

          {user && (user.role === 'utilisateur' || user.role === 'admin') && (
            <li>
              <Link to="/tests" className={cn(
                'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
                darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
                location.pathname === '/tests' && 'bg-elite-red-500 text-white'
              )}>
                <BookCheck className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                  darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
                <span className="text-base font-medium">Tests</span>
              </Link>

              <Link to="/formations" className={cn(
                'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
                darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
                location.pathname === '/formations' && 'bg-elite-red-500 text-white'
              )}>
                <BookOpen className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                  darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
                <span className="text-base font-medium">Formations</span>
              </Link>

              <Link to="/capsules" className={cn(
                'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
                darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
                location.pathname === '/capsules' && 'bg-elite-red-500 text-white'
              )}>
                <Video className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                  darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
                <span className="text-base font-medium">Capsules</span>
              </Link>
              <Link to="/simulation-games" className={cn(
                'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
                darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
                location.pathname === '/simulation-games' && 'bg-elite-red-500 text-white'
              )}>
                <Gamepad2 className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                  darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
                <span className="text-base font-medium">Jeux de Simulations</span>
              </Link>
              
            </li>
          )}


          {user && (user.role === 'utilisateur' || user.role === 'admin' || user.role === 'entreprise') && (
            <li>
              <Link to="/interviews" className={cn(
                'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
                darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
                location.pathname === '/interviews' && 'bg-elite-red-500 text-white'
              )}>
                <Calendar className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                  darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
                <span className="text-base font-medium">Entretiens</span>
              </Link>
              <Link to="/profile" className={cn(
                'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
                darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
                location.pathname === '/profile' && 'bg-elite-red-500 text-white'
              )}>
                <User className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                  darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
                <span className="text-base font-medium">Profil</span>
              </Link>
            </li>
          )}

          {user && user.role === 'admin' && (
            <>
              <li>
                <Link to="/collaborators-enterprises" className={cn(
                  'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
                  darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
                  location.pathname === '/collaborators-enterprises' && 'bg-elite-red-500 text-white'
                )}>
                  <Building className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                    darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
                  <span className="text-base font-medium">Collaborateurs et entreprises</span>
                </Link>
              </li>
              <li>
                <Link to="/userList" className={cn(
                  'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
                  darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
                  location.pathname === '/userList' && 'bg-elite-red-500 text-white'
                )}>
                  <Users className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                    darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
                  <span className="text-base font-medium">Liste des utilisateurs</span>
                </Link>
              </li>
              <li>
                <Link to="/userList" className={cn(
                  'flex items-center p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 group',
                  darkMode ? 'text-elite-yellow-100 hover:bg-elite-red-900/30 hover:text-elite-red-400' : 'text-elite-black-900 hover:bg-elite-black-200/30 hover:text-elite-black-700',
                  location.pathname === '/userList' && 'bg-elite-red-500 text-white'
                )}>
                  <Users className={cn('w-6 h-6 mr-3 transition-colors duration-300',
                    darkMode ? 'group-hover:text-elite-red-400' : 'group-hover:text-elite-black-700')} />
                  <span className="text-base font-medium">Liste des utilisateurs</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;