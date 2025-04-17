import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '@/lib/api';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';
import { Calendar, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const DiffusionWorkshops = ({ user, isLoading, onLogout }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    event_date: '',
    event_type: '',
    registration_link: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEventType, setFilterEventType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));
      console.log('Fetching events with token:', token);
      const response = await api.get('/diffusions-workshops', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Events fetched:', response.data);
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: Expected an array');
      }
      setEvents(response.data);
    } catch (error) {
      console.error('Erreur de récupération:', error.message, error.response?.data);
      setError(error.response?.data?.error || t('echec du chargement des evenements'));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));
      const payload = { ...formData };
      console.log('Submitting:', { payload, currentEvent });

      if (currentEvent) {
        const response = await api.put(`/diffusions-workshops/${currentEvent.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Event updated:', currentEvent.id, 'Response:', response.data);
      } else {
        const response = await api.post('/diffusions-workshops', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Event created:', response.data);
      }
      await fetchEvents();
      closeModal();
      setError(null);
      Swal.fire({
        title: t('succes'),
        text: currentEvent ? t('evenement mis a jour') : t('evenement cree'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (error) {
      console.error('Erreur de soumission:', error.message, error.response?.data);
      setError(error.response?.data?.error || t('echec de la sauvegarde de l evenement'));
      Swal.fire({
        title: t('erreur'),
        text: error.response?.data?.error || t('echec de la sauvegarde de l evenement'),
        icon: 'error',
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: t('confirmer la suppression'),
      text: t('confirmation de la suppression de l evenement'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('supprimer'),
      cancelButtonText: t('annuler'),
      customClass: {
        popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        confirmButton: darkMode
          ? 'bg-red-600 text-yellow-100 hover:bg-red-700 px-4 py-2 rounded'
          : 'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded',
        cancelButton: darkMode
          ? 'bg-gray-600 text-yellow-100 hover:bg-gray-500 px-4 py-2 rounded'
          : 'bg-gray-300 text-gray-800 hover:bg-gray-400 px-4 py-2 rounded',
      },
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error(t('aucun jeton trouve'));
        console.log('Deleting event ID:', id);
        const response = await api.delete(`/diffusions-workshops/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Event deleted:', id, 'Response:', response.data);
        await fetchEvents();
        setError(null);
        Swal.fire({
          title: t('supprime'),
          text: t('evenement supprime'),
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      } catch (error) {
        console.error('Erreur de suppression:', error.message, error.response?.data);
        setError(error.response?.data?.error || t('echec de la suppression de l evenement'));
        Swal.fire({
          title: t('erreur'),
          text: error.response?.data?.error || t('echec de la suppression de l evenement'),
          icon: 'error',
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      }
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const eventTypes = [...new Set(events.map(event => event.event_type).filter(type => type))];
  const locations = [...new Set(events.map(event => event.location).filter(loc => loc))];

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEventType = filterEventType ? event.event_type === filterEventType : true;
    const matchesLocation = filterLocation ? event.location === filterLocation : true;
    return matchesSearch && matchesEventType && matchesLocation;
  });

  const showDetails = (event) => {
    Swal.fire({
      title: event.title,
      html: `
        <div class="text-left text-sm">
          <p><strong>${t('description')}:</strong> ${event.description || t('non specifie')}</p>
          <p><strong>${t('lieu')}:</strong> ${event.location || t('non specifie')}</p>
          <p><strong>${t('date de l evenement')}:</strong> ${
            event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR') : t('non specifie')
          }</p>
          <p><strong>${t('type d evenement')}:</strong> ${event.event_type || t('non specifie')}</p>
          <p><strong>${t('lien d inscription')}:</strong> ${
            event.registration_link ? `<a href="${event.registration_link}" target="_blank">${event.registration_link}</a>` : t('non specifie')
          }</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: t('fermer'),
      customClass: {
        popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        confirmButton: darkMode
          ? 'bg-red-600 text-yellow-100 hover:bg-red-700 px-4 py-2 rounded'
          : 'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded',
      },
    });
  };

  const openModal = (event = null) => {
    setCurrentEvent(event);
    setFormData(
      event
        ? {
            title: event.title,
            description: event.description,
            location: event.location,
            event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
            event_type: event.event_type || '',
            registration_link: event.registration_link || '',
          }
        : {
            title: '',
            description: '',
            location: '',
            event_date: '',
            event_type: '',
            registration_link: '',
          }
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEvent(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterEventType('');
    setFilterLocation('');
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex justify-center items-center h-screen',
          darkMode ? 'bg-gray-900 text-yellow-100' : 'bg-gray-50 text-gray-900'
        )}
      >
        {t('chargement')}
      </div>
    );
  }

  return (
     <div className={cn("min-h-screen", darkMode ? "dark bg-elite-black-900" : "bg-elite-yellow-50")}>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          onLogout={onLogout}
        />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1
                className={cn(
                  'text-3xl font-bold',
                  darkMode ? 'text-yellow-400' : 'text-gray-900'
                )}
              >
                {t('diffusions et ateliers')}
              </h1>
              {(user?.role === 'admin' || user?.role === 'entreprise') && (
                <button
                  onClick={() => openModal()}
                  className={cn(
                    'flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200',
                    darkMode ? 'hover:bg-red-500' : 'hover:bg-red-700'
                  )}
                >
                  <PlusCircle className="h-5 w-5" />
                  {t('ajouter un evenement')}
                </button>
              )}
            </div>

            <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label
                  className={cn(
                    'block text-sm font-medium mb-1',
                    darkMode ? 'text-yellow-400' : 'text-gray-700'
                  )}
                >
                  {t('rechercher')}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('rechercher par titre ou description')}
                  className={cn(
                    'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                />
              </div>
              <div>
                <label
                  className={cn(
                    'block text-sm font-medium mb-1',
                    darkMode ? 'text-yellow-400' : 'text-gray-700'
                  )}
                >
                  {t('type d evenement')}
                </label>
                <select
                  value={filterEventType}
                  onChange={(e) => setFilterEventType(e.target.value)}
                  className={cn(
                    'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                >
                  <option value="">{t('tous les types d evenement')}</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={cn(
                    'block text-sm font-medium mb-1',
                    darkMode ? 'text-yellow-400' : 'text-gray-700'
                  )}
                >
                  {t('lieu')}
                </label>
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className={cn(
                    'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                >
                  <option value="">{t('tous les lieux')}</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg transition-all duration-200',
                    darkMode
                      ? 'bg-gray-600 text-yellow-100 hover:bg-gray-500'
                      : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                  )}
                >
                  {t('reinitialiser les filtres')}
                </button>
              </div>
            </div>

            {error && (
              <div
                className={cn(
                  'mb-6 p-4 rounded-lg',
                  darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'
                )}
              >
                {error}
              </div>
            )}

            {loading ? (
              <div
                className={cn(
                  'text-center',
                  darkMode ? 'text-yellow-400' : 'text-gray-600'
                )}
              >
                {t('chargement')}
              </div>
            ) : filteredEvents.length === 0 ? (
              <p
                className={cn(
                  'text-center',
                  darkMode ? 'text-yellow-400' : 'text-gray-600'
                )}
              >
                {t('aucun evenement')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      'rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6',
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    )}
                  >
                    <h2
                      className={cn(
                        'text-xl font-semibold mb-2',
                        darkMode ? 'text-yellow-400' : 'text-gray-900'
                      )}
                    >
                      {event.title}
                    </h2>
                    <p
                      className={cn(
                        'mb-4 line-clamp-3',
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      )}
                    >
                      {event.description}
                    </p>
                    <p
                      className={cn(
                        'text-sm mb-1',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('lieu')}:</span> {event.location || t('non specifie')}
                    </p>
                    <p
                      className={cn(
                        'text-sm mb-4',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('type d evenement')}:</span> {event.event_type || t('non specifie')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => showDetails(event)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                          darkMode
                            ? 'bg-gray-700 text-yellow-100 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        )}
                      >
                        {t('details')}
                      </button>
                      {(user?.role === 'admin' || (user?.role === 'entreprise' && event.user_id === user?.id)) && (
                        <>
                          <button
                            onClick={() => openModal(event)}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                              darkMode
                                ? 'bg-yellow-700 text-gray-900 hover:bg-yellow-600'
                                : 'bg-yellow-500 text-white hover:bg-yellow-600'
                            )}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                              darkMode
                                ? 'bg-red-700 text-yellow-100 hover:bg-red-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Transition show={isModalOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/30" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel
                      className={cn(
                        'w-full max-w-lg rounded-2xl p-6 shadow-xl',
                        darkMode ? 'bg-gray-800 text-yellow-100' : 'bg-white text-gray-900'
                      )}
                    >
                      <Dialog.Title as="h3" className="text-lg font-medium">
                        {currentEvent ? t('modifier un evenement') : t('ajouter un evenement')}
                      </Dialog.Title>
                      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        <div>
                          <label
                            className={cn(
                              'block text-sm font-medium',
                              darkMode ? 'text-yellow-400' : 'text-gray-700'
                            )}
                          >
                            {t('titre')}
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={cn(
                              'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                                : 'border-gray-300 text-gray-900 focus:ring-red-600'
                            )}
                            required
                          />
                        </div>
                        <div>
                          <label
                            className={cn(
                              'block text-sm font-medium',
                              darkMode ? 'text-yellow-400' : 'text-gray-700'
                            )}
                          >
                            {t('description')}
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className={cn(
                              'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                                : 'border-gray-300 text-gray-900 focus:ring-red-600'
                            )}
                            rows="4"
                            required
                          />
                        </div>
                        <div>
                          <label
                            className={cn(
                              'block text-sm font-medium',
                              darkMode ? 'text-yellow-400' : 'text-gray-700'
                            )}
                          >
                            {t('lieu')}
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className={cn(
                              'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                                : 'border-gray-300 text-gray-900 focus:ring-red-600'
                            )}
                            required
                          />
                        </div>
                        <div>
                          <label
                            className={cn(
                              'block text-sm font-medium',
                              darkMode ? 'text-yellow-400' : 'text-gray-700'
                            )}
                          >
                            {t('date de l evenement')}
                          </label>
                          <input
                            type="datetime-local"
                            name="event_date"
                            value={formData.event_date}
                            onChange={handleInputChange}
                            className={cn(
                              'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                                : 'border-gray-300 text-gray-900 focus:ring-red-600'
                            )}
                            required
                          />
                        </div>
                        <div>
                          <label
                            className={cn(
                              'block text-sm font-medium',
                              darkMode ? 'text-yellow-400' : 'text-gray-700'
                            )}
                          >
                            {t('type d evenement')}
                          </label>
                          <input
                            type="text"
                            name="event_type"
                            value={formData.event_type}
                            onChange={handleInputChange}
                            className={cn(
                              'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                                : 'border-gray-300 text-gray-900 focus:ring-red-600'
                            )}
                          />
                        </div>
                        <div>
                          <label
                            className={cn(
                              'block text-sm font-medium',
                              darkMode ? 'text-yellow-400' : 'text-gray-700'
                            )}
                          >
                            {t('lien d inscription')}
                          </label>
                          <input
                            type="url"
                            name="registration_link"
                            value={formData.registration_link}
                            onChange={handleInputChange}
                            className={cn(
                              'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                                : 'border-gray-300 text-gray-900 focus:ring-red-600'
                            )}
                          />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={closeModal}
                            className={cn(
                              'px-4 py-2 rounded-lg transition-all duration-200',
                              darkMode
                                ? 'bg-gray-600 text-yellow-100 hover:bg-gray-500'
                                : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                            )}
                          >
                            {t('annuler')}
                          </button>
                          <button
                            type="submit"
                            className={cn(
                              'px-4 py-2 rounded-lg transition-all duration-200',
                              darkMode
                                ? 'bg-red-600 text-yellow-100 hover:bg-red-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            )}
                          >
                            {currentEvent ? t('mettre a jour') : t('creer')}
                          </button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </main>
      </div>
    </div>
  );
};

export default DiffusionWorkshops;