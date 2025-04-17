import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Settings,
  User,
  LogOut,
  Menu,
  Languages,
  PlusCircle,
  BellPlus,
  CheckCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { useDarkMode } from '../DarkModeContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';

const Navbar = ({ isSidebarOpen, setSidebarOpen, user, onLogout, onSearch }) => {
  const { t, i18n } = useTranslation();
  const { darkMode, setDarkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({ title: '', message: '', recipient_id: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const languageRef = useRef(null);

  useEffect(() => {
    if (i18n.language !== 'fr') {
      i18n.changeLanguage('fr');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'fr';
    }
  }, [i18n]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setNotifications(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications :', error.response?.data || error.message);
        setError(t('errorLoadingNotifications'));
      }
    };
    if (user) fetchNotifications();
  }, [user, t]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (typeof onSearch === 'function') {
      onSearch(query);
    }
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSearchResults(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la recherche :', error.response?.data || error.message);
      setSearchResults([]);
      setError(t('errorSearching'));
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const toggleSidebar = () => {
    if (typeof setSidebarOpen === 'function') {
      setSidebarOpen((prev) => !prev);
    } else {
      console.warn('setSidebarOpen is not a function');
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsLanguageOpen(false);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  const handleLogoutClick = async () => {
    try {
      if (typeof onLogout === 'function') {
        onLogout();
      } else {
        await api.post('/logout', {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('first_test_completed');
      }
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      setError(t('errorLoggingOut'));
      navigate('/signin');
    }
  };

  const handleAddNotification = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') {
      setError(t('adminOnlyNotification'));
      return;
    }
    try {
      const response = await api.post('/notifications', newNotification, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotifications([...notifications, response.data]);
      setNewNotification({ title: '', message: '', recipient_id: '' });
      setIsProfileOpen(false);
      setError(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error('Erreur lors de l\'ajout de la notification :', errorMsg);
      setError(`Erreur : ${errorMsg}`);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage comme lu :', error.response?.data || error.message);
      setError(t('errorMarkingNotification'));
    }
  };

  const getInitials = (name) => (name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'JD');

  const getAudienceLabel = (audience) => {
    const audienceLabels = {
      etudiant_maroc: t('studentMorocco'),
      etudiant_etranger: t('studentAbroad'),
      entrepreneur: t('entrepreneur'),
      salarie_etat: t('stateEmployee'),
      salarie_prive: t('privateEmployee'),
    };
    return audienceLabels[audience] || t('user');
  };

  return (
    <header
      className={cn(
        'h-16 flex items-center justify-between px-4 border-b sticky top-0 z-10 transition-all duration-300',
        darkMode ? 'bg-elite-black-900/70 border-elite-black-700 text-elite-yellow-100' : 'bg-elite-yellow-50/70 border-elite-black-200 text-elite-black-900',
        'backdrop-blur-md'
      )}
    >
      <button
        onClick={toggleSidebar}
        className={cn('p-2 rounded-full hover:bg-elite-red-500/20 transition-colors', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')}
        aria-label={t('openSidebar')}
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-4 flex-1 max-w-md mx-4 relative">
        <div className="relative w-full">
          <Search
            className={cn(
              'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4',
              darkMode ? 'text-elite-yellow-400' : 'text-elite-black-400'
            )}
          />
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className={cn(
              'pl-10 pr-4 py-2 w-full rounded-full text-sm focus:outline-none focus:ring-2 transition-all',
              darkMode ? 'bg-elite-black-800 text-elite-yellow-100 focus:ring-elite-yellow-400' : 'bg-elite-yellow-100 text-elite-black-900 focus:ring-elite-yellow-300'
            )}
          />
          {isSearchFocused && searchResults.length > 0 && (
            <div
              className={cn(
                'absolute left-0 mt-2 w-full shadow-lg rounded-lg border max-h-64 overflow-y-auto animate-fade-in',
                darkMode ? 'bg-elite-black-800 border-elite-black-700 text-elite-yellow-100' : 'bg-elite-yellow-50 border-elite-black-200 text-elite-black-900'
              )}
            >
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="px-4 py-2 hover:bg-elite-red-500/20 transition-colors cursor-pointer"
                  onClick={() => {
                    navigate(`/users/${result.id}`);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <p className="text-sm font-medium">{result.nomComplet || result.company_name || 'Utilisateur'}</p>
                  <p className="text-xs text-elite-yellow-400">{result.email}</p>
                </div>
              ))}
            </div>
          )}
          {isSearchFocused && searchQuery && searchResults.length === 0 && (
            <div
              className={cn(
                'absolute left-0 mt-2 w-full shadow-lg rounded-lg border p-2 animate-fade-in',
                darkMode ? 'bg-elite-black-800 border-elite-black-700 text-elite-yellow-100' : 'bg-elite-yellow-50 border-elite-black-200 text-elite-black-900'
              )}
            >
              <p className="text-sm">{t('noResults')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleDarkMode}
          className={cn('p-2 rounded-full hover:bg-elite-red-500/20 transition-colors', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')}
          aria-label={t('toggleDarkMode')}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="relative" ref={languageRef}>
          <button
            onClick={() => {
              setIsLanguageOpen(!isLanguageOpen);
              setIsNotificationsOpen(false);
              setIsProfileOpen(false);
            }}
            className={cn('p-2 rounded-full hover:bg-elite-red-500/20 transition-colors', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')}
            aria-label={t('language')}
          >
            <Languages className="h-5 w-5" />
          </button>
          {isLanguageOpen && (
            <div
              className={cn(
                'absolute right-0 mt-2 w-32 shadow-lg rounded-lg border overflow-hidden animate-fade-in',
                darkMode ? 'bg-elite-black-800 border-elite-black-700 text-elite-yellow-100' : 'bg-elite-yellow-50 border-elite-black-200 text-elite-black-900'
              )}
            >
              <button onClick={() => changeLanguage('en')} className="w-full text-left px-4 py-2 text-sm hover:bg-elite-red-500/20 transition-colors">
                English
              </button>
              <button onClick={() => changeLanguage('fr')} className="w-full text-left px-4 py-2 text-sm hover:bg-elite-red-500/20 transition-colors">
                Français
              </button>
              <button onClick={() => changeLanguage('ar')} className="w-full text-left px-4 py-2 text-sm hover:bg-elite-red-500/20 transition-colors">
                العربية
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
              setIsLanguageOpen(false);
            }}
            className={cn('p-2 rounded-full hover:bg-elite-red-500/20 transition-colors relative', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')}
            aria-label={t('notifications')}
          >
            <Bell className="h-5 w-5" />
            {notifications.filter((n) => !n.is_read).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-elite-red-500 rounded-full ring-2 ring-elite-black-900" />
            )}
          </button>
          {isNotificationsOpen && (
            <div
              className={cn(
                'absolute right-0 mt-2 w-80 shadow-lg rounded-lg border p-2 animate-fade-in',
                darkMode ? 'bg-elite-black-800 border-elite-black-700 text-elite-yellow-100' : 'bg-elite-yellow-50 border-elite-black-200 text-elite-black-900'
              )}
            >
              <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="font-medium">{t('notifications')}</h3>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <p className="text-sm p-2">{t('noNotifications')}</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-2 rounded-md mb-1 transition-colors hover:bg-elite-red-500/10 flex items-start gap-3',
                        notification.is_read ? 'opacity-50' : ''
                      )}
                    >
                      <div className="mt-1 w-2 h-2 rounded-full bg-elite-red-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-sm">{notification.message}</p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className={cn(
                            'p-1 rounded-full hover:bg-elite-yellow-400/20 transition-colors',
                            darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700'
                          )}
                          aria-label="Marquer comme lu"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          {user ? (
            <>
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                  setIsLanguageOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 p-1 hover:bg-elite-red-500/20 rounded-full transition-colors',
                  darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700'
                )}
              >
                {user.image && user.image !== '' ? (
                  <img
                    src={`${api.defaults.baseURL.replace('/api', '')}${user.image}?t=${new Date().getTime()}`}
                    alt="Photo de profil"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load image:', e.target.src);
                      e.target.src = '/default-profile.jpg';
                    }}
                  />
                ) : (
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-medium',
                      darkMode ? 'bg-elite-yellow-400 text-elite-black-900' : 'bg-elite-yellow-100 text-elite-black-900'
                    )}
                  >
                    {getInitials(user.nomComplet || user.name)}
                  </div>
                )}
                <ChevronDown className="h-4 w-4" />
              </button>
              {isProfileOpen && (
                <div
                  className={cn(
                    'absolute right-0 mt-2 w-56 shadow-lg rounded-lg border overflow-hidden animate-fade-in',
                    darkMode ? 'bg-elite-black-800 border-elite-black-700 text-elite-yellow-100' : 'bg-elite-yellow-50 border-elite-black-200 text-elite-black-900'
                  )}
                >
                  <div className="p-3 border-b border-elite-black-600">
                    <p className="font-medium">{user.nomComplet || user.name || t('johnDoe')}</p>
                    <p className={cn('text-sm', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-600')}>
                      {user.email || 'john.doe@example.com'}
                    </p>
                    <p className={cn('text-xs mt-1', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-600')}>
                      {user.role === 'admin' ? t('administrator') : getAudienceLabel(user.target_audience)}
                    </p>
                    {user.goal && (
                      <p className={cn('text-xs mt-1', darkMode ? 'text-elite-red-400' : 'text-elite-red-600')}>
                        {t('goal')}: {user.goal}
                      </p>
                    )}
                  </div>
                  <nav className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-elite-red-500/20 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>{t('profile')}</span>
                    </Link>
                    <Link
                      to="/parametres"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-elite-red-500/20 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>{t('settings')}</span>
                    </Link>
                    {user.role === 'admin' && (
                      <div className="px-4 py-2 border-t border-elite-black-600">
                        <form onSubmit={handleAddNotification} className="space-y-2">
                          <input
                            type="text"
                            placeholder={t('title')}
                            value={newNotification.title}
                            onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                            className={cn(
                              'w-full p-1 text-sm bg-transparent border-b',
                              darkMode ? 'border-elite-yellow-400 text-elite-yellow-100' : 'border-elite-black-600 text-elite-black-900'
                            )}
                            required
                          />
                          <textarea
                            placeholder={t('message')}
                            value={newNotification.message}
                            onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                            className={cn(
                              'w-full p-1 text-sm bg-transparent border-b resize-none',
                              darkMode ? 'border-elite-yellow-400 text-elite-yellow-100' : 'border-elite-black-600 text-elite-black-900'
                            )}
                            rows="2"
                            required
                          />
                          <input
                            type="text"
                            placeholder={t('recipientIdOptional')}
                            value={newNotification.recipient_id}
                            onChange={(e) => setNewNotification({ ...newNotification, recipient_id: e.target.value })}
                            className={cn(
                              'w-full p-1 text-sm bg-transparent border-b',
                              darkMode ? 'border-elite-yellow-400 text-elite-yellow-100' : 'border-elite-black-600 text-elite-black-900'
                            )}
                          />
                          <button
                            type="submit"
                            className="flex items-center gap-2 text-sm hover:bg-elite-red-500/20 transition-colors w-full text-left"
                          >
                            <BellPlus className="h-4 w-4" />
                            <span>{t('addNotification')}</span>
                          </button>
                        </form>
                        {error && <p className="text-xs text-elite-red-500 mt-2">{error}</p>}
                      </div>
                    )}
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left hover:bg-elite-red-500/20 transition-colors border-t border-elite-black-600 mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('logout')}</span>
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <Link
              to="/signin"
              className={cn(
                'flex items-center gap-2 p-2 hover:bg-elite-red-500/20 rounded-full transition-colors',
                darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700'
              )}
            >
              <User className="h-5 w-5" />
              <span>{t('login')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;