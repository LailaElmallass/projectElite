import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import { Search, Clock, Video, Edit, Trash2, Upload, PlayCircle } from 'lucide-react';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';
import Swal from 'sweetalert2';

const CapsuleForm = ({ editCapsule, onSubmit, onCancel, darkMode }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    target_audience: '',
    video: null,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (editCapsule) {
      setFormData({
        title: editCapsule.title || '',
        description: editCapsule.description || '',
        duration: editCapsule.duration || '',
        target_audience: editCapsule.target_audience || '',
        video: null,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        duration: '',
        target_audience: '',
        video: null,
      });
    }
    setFormErrors({});
  }, [editCapsule]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/mp4')) {
        setFormErrors((prev) => ({ ...prev, video: t('fichier mp4 requis') }));
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setFormErrors((prev) => ({ ...prev, video: t('taille maximale 100mo') }));
        return;
      }
      setFormData((prev) => ({ ...prev, video: file }));
      setFormErrors((prev) => ({ ...prev, video: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title || '');
    data.append('description', formData.description || '');
    data.append('duration', formData.duration || '');
    data.append('target_audience', formData.target_audience || '');
    if (formData.video) {
      data.append('video', formData.video);
    }
    try {
      await onSubmit(data, editCapsule, setFormErrors);
    } catch (error) {
      setFormErrors({ general: t('erreur soumission') });
    }
  };

  return (
    <Dialog.Panel
      className={cn(
        'w-full max-w-lg rounded-2xl p-6 shadow-xl',
        darkMode ? 'bg-gray-800 text-yellow-100' : 'bg-white text-gray-900'
      )}
    >
      <Dialog.Title as="h3" className="text-lg font-medium">
        {editCapsule ? t('modifier capsule') : t('ajouter capsule')}
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
          {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
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
          {formErrors.description && (
            <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
          )}
        </div>
        <div>
          <label
            className={cn(
              'block text-sm font-medium',
              darkMode ? 'text-yellow-400' : 'text-gray-700'
            )}
          >
            {t('duree')}
          </label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            className={cn(
              'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
              darkMode
                ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                : 'border-gray-300 text-gray-900 focus:ring-red-600'
            )}
            required
          />
          {formErrors.duration && (
            <p className="text-red-500 text-sm mt-1">{formErrors.duration}</p>
          )}
        </div>
        <div>
          <label
            className={cn(
              'block text-sm font-medium',
              darkMode ? 'text-yellow-400' : 'text-gray-700'
            )}
          >
            {t('public cible')}
          </label>
          <select
            name="target_audience"
            value={formData.target_audience}
            onChange={handleInputChange}
            className={cn(
              'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
              darkMode
                ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                : 'border-gray-300 text-gray-900 focus:ring-red-600'
            )}
            required
          >
            <option value="">{t('selectionner public')}</option>
            <option value="etudiant_maroc">{t('etudiants maroc')}</option>
            <option value="etudiant_etranger">{t('etudiants etranger')}</option>
            <option value="entrepreneur">{t('entrepreneur')}</option>
            <option value="salarie_etat">{t('salarie public')}</option>
            <option value="salarie_prive">{t('salarie prive')}</option>
          </select>
          {formErrors.target_audience && (
            <p className="text-red-500 text-sm mt-1">{formErrors.target_audience}</p>
          )}
        </div>
        <div>
          <label
            className={cn(
              'block text-sm font-medium',
              darkMode ? 'text-yellow-400' : 'text-gray-700'
            )}
          >
            {t('video')}
          </label>
          <input
            type="file"
            accept="video/mp4"
            onChange={handleFileChange}
            className={cn(
              'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
              darkMode
                ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                : 'border-gray-300 text-gray-900 focus:ring-red-600'
            )}
          />
          {formErrors.video && <p className="text-red-500 text-sm mt-1">{formErrors.video}</p>}
        </div>
        {formErrors.general && (
          <p className="text-red-500 text-sm mt-1">{formErrors.general}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
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
            {editCapsule ? t('mettre a jour') : t('creer')}
          </button>
        </div>
      </form>
    </Dialog.Panel>
  );
};

const Capsules = ({ user: propUser, isLoading, onLogout }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [capsules, setCapsules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeCapsule, setActiveCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCapsule, setEditCapsule] = useState(null);
  const [user, setUser] = useState(propUser);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const response = await api.get('/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUser(response.data);
    } catch (error) {
      setError(t('echec chargement utilisateur'));
      setUser(null);
    }
  };

  const fetchCapsules = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));
      const endpoint = user?.role === 'admin' ? '/capsules/admin' : '/capsules';
      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: { sort: sortOrder },
      });
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: Expected an array');
      }
      setCapsules(response.data);
    } catch (error) {
      setError(error.response?.data?.error || t('echec chargement capsules'));
      setCapsules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchCapsules();
  }, [sortOrder]);

  const audiences = [
    ...new Set(capsules.map((capsule) => capsule.target_audience).filter((aud) => aud)),
  ];

  const filteredCapsules = capsules.filter((capsule) => {
    const matchesSearch =
      capsule.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capsule.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAudience = filterAudience
      ? capsule.target_audience === filterAudience
      : true;
    return matchesSearch && matchesAudience;
  });

  const handleAddOrUpdateCapsule = async (data, editCapsule, setFormErrors) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));
      let response;
      if (editCapsule) {
        response = await api.put(`/capsules/${editCapsule.id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await api.post('/capsules', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await fetchCapsules();
      closeModal();
      setError(null);
      Swal.fire({
        title: t('succes'),
        text: editCapsule ? t('capsule mise a jour') : t('capsule cree'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (error) {
      const errorData = error.response?.data;
      if (error.response?.status === 422) {
        const errors = errorData.errors || {};
        setFormErrors(errors);
        const errorMessages = Object.values(errors).flat().join(' ');
        setError(`${t('erreur sauvegarde')}: ${errorMessages || t('erreur validation')}`);
      } else if (error.response?.status === 413) {
        setError(t('fichier trop volumineux'));
      } else {
        setError(error.response?.data?.error || t('echec sauvegarde capsule'));
      }
      Swal.fire({
        title: t('erreur'),
        text: error.response?.data?.error || t('echec sauvegarde capsule'),
        icon: 'error',
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    }
  };

  const handleDeleteCapsule = async (id) => {
    const result = await Swal.fire({
      title: t('confirmer suppression'),
      text: t('confirmation suppression capsule'),
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
        await api.delete(`/capsules/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchCapsules();
        setError(null);
        Swal.fire({
          title: t('supprime'),
          text: t('capsule supprimee'),
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      } catch (error) {
        setError(error.response?.data?.error || t('echec suppression capsule'));
        Swal.fire({
          title: t('erreur'),
          text: error.response?.data?.error || t('echec suppression capsule'),
          icon: 'error',
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      }
    }
  };

  const openModal = (capsule = null) => {
    setEditCapsule(capsule);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditCapsule(null);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterAudience('');
    setSortOrder('desc');
  };

  const showDetails = (capsule) => {
    Swal.fire({
      title: capsule.title,
      html: `
        <div class="text-left text-sm">
          <p><strong>${t('description')}:</strong> ${capsule.description || t('non specifie')}</p>
          <p><strong>${t('duree')}:</strong> ${capsule.duration || t('non specifie')}</p>
          <p><strong>${t('public cible')}:</strong> ${capsule.target_audience || t('non specifie')}</p>
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

  if (activeCapsule) {
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
          <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 sm:px-0">
              <button
                onClick={() => setActiveCapsule(null)}
                className={cn(
                  'flex items-center text-sm mb-6',
                  darkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-red-600 hover:text-red-700'
                )}
              >
                <PlayCircle className="h-5 w-5 mr-2 rotate-180" /> {t('retour')}
              </button>
              <div
                className={cn(
                  'rounded-xl shadow-md p-6',
                  darkMode ? 'bg-gray-800' : 'bg-white'
                )}
              >
                <div className="flex justify-between items-center mb-6">
                  <h1
                    className={cn(
                      'text-3xl font-bold',
                      darkMode ? 'text-yellow-400' : 'text-gray-900'
                    )}
                  >
                    {activeCapsule.title}
                  </h1>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => openModal(activeCapsule)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                        darkMode
                          ? 'bg-yellow-700 text-gray-900 hover:bg-yellow-600'
                          : 'bg-yellow-500 text-white hover:bg-yellow-600'
                      )}
                    >
                      <Edit className="h-4 w-4" /> {t('modifier')}
                    </button>
                  )}
                </div>
                <p
                  className={cn(
                    'mb-6',
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  )}
                >
                  {activeCapsule.description}
                </p>
                {activeCapsule.video && (
                  <video
                    controls
                    src={activeCapsule.video}
                    type="video/mp4"
                    className="w-full rounded-xl mb-6 shadow-md"
                  >
                    {t('navigateur non supporte')}
                  </video>
                )}
                <div
                  className={cn(
                    'flex items-center gap-6 text-sm',
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  )}
                >
                  <span className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" /> {activeCapsule.duration}
                  </span>
                  <span className="flex items-center">
                    <Video className="h-5 w-5 mr-2" /> {activeCapsule.target_audience}
                  </span>
                </div>
              </div>
            </div>
          </main>
        </div>
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
                {t('capsules video')}
              </h1>
              {user?.role === 'admin' && (
                <button
                  onClick={() => openModal()}
                  className={cn(
                    'flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200',
                    darkMode ? 'hover:bg-red-500' : 'hover:bg-red-700'
                  )}
                >
                  <Upload className="h-5 w-5" />
                  {t('ajouter capsule')}
                </button>
              )}
            </div>

            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  className={cn(
                    'block text-sm font-medium mb-1',
                    darkMode ? 'text-yellow-400' : 'text-gray-700'
                  )}
                >
                  {t('rechercher')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('rechercher par titre ou description')}
                    className={cn(
                      'w-full pl-10 rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                        : 'border-gray-300 text-gray-900 focus:ring-red-600'
                    )}
                  />
                </div>
              </div>
              <div>
                <label
                  className={cn(
                    'block text-sm font-medium mb-1',
                    darkMode ? 'text-yellow-400' : 'text-gray-700'
                  )}
                >
                  {t('public cible')}
                </label>
                <select
                  value={filterAudience}
                  onChange={(e) => setFilterAudience(e.target.value)}
                  className={cn(
                    'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                >
                  <option value="">{t('tous les publics')}</option>
                  {audiences.map((aud) => (
                    <option key={aud} value={aud}>
                      {aud}
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
                  {t('reinitialiser filtres')}
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
            ) : filteredCapsules.length === 0 ? (
              <p
                className={cn(
                  'text-center',
                  darkMode ? 'text-yellow-400' : 'text-gray-600'
                )}
              >
                {t('aucune capsule')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCapsules.map((capsule) => (
                  <div
                    key={capsule.id}
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
                      {capsule.title}
                    </h2>
                    <p
                      className={cn(
                        'mb-4 line-clamp-3',
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      )}
                    >
                      {capsule.description}
                    </p>
                    <p
                      className={cn(
                        'text-sm mb-1',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('duree')}:</span>{' '}
                      {capsule.duration || t('non specifie')}
                    </p>
                    <p
                      className={cn(
                        'text-sm mb-4',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('public cible')}:</span>{' '}
                      {capsule.target_audience || t('non specifie')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => showDetails(capsule)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                          darkMode
                            ? 'bg-gray-700 text-yellow-100 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        )}
                      >
                        {t('details')}
                      </button>
                      <button
                        onClick={() => setActiveCapsule(capsule)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                          darkMode
                            ? 'bg-red-600 text-yellow-100 hover:bg-red-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        )}
                      >
                        <PlayCircle className="h-4 w-4" /> {t('visionner')}
                      </button>
                      {user?.role === 'admin' && (
                        <>
                          <button
                            onClick={() => openModal(capsule)}
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
                            onClick={() => handleDeleteCapsule(capsule.id)}
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
                      <CapsuleForm
                        editCapsule={editCapsule}
                        onSubmit={handleAddOrUpdateCapsule}
                        onCancel={closeModal}
                        darkMode={darkMode}
                      />
                    </Transition.Child>
                  </div>
                </div>
              </Dialog>
            </Transition>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Capsules;