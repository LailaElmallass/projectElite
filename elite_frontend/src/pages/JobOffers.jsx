import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '@/lib/api';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';
import { Briefcase, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const OffresEmploi = ({ user, isLoading, onLogout, onSearch }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salaryRange: '',
    contractType: '',
    closingDate: '',
  });
  const [applyData, setApplyData] = useState({
    coverLetter: '',
    cv: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterContractType, setFilterContractType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const fetchJobOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));
      const response = await api.get('/job-offers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mappedOffers = Array.isArray(response.data)
        ? response.data.map(offer => ({
            ...offer,
            contractType: offer.contract_type,
            salaryRange: offer.salary_range,
            closingDate: offer.closing_date,
          }))
        : [];
      setJobOffers(mappedOffers);
    } catch (error) {
      console.error('Erreur de récupération:', error.message, error.response?.data);
      setError(error.response?.data?.error || t('echec du chargement des offres d emploi'));
      setJobOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobOffers();
  }, []);

  const contractTypes = [...new Set(jobOffers.map(offer => offer.contractType).filter(type => type))];
  const locations = [...new Set(jobOffers.map(offer => offer.location).filter(loc => loc))];

  const filteredJobOffers = jobOffers.filter(offer => {
    const matchesSearch =
      offer.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesContractType = filterContractType ? offer.contractType === filterContractType : true;
    const matchesLocation = filterLocation ? offer.location === filterLocation : true;
    return matchesSearch && matchesContractType && matchesLocation;
  });

  const showDetails = (offer) => {
    Swal.fire({
      title: offer.title,
      html: `
        <div class="text-left text-sm">
          <p><strong>${t('description')}:</strong> ${offer.description || t('non specifie')}</p>
          <p><strong>${t('exigences')}:</strong> ${offer.requirements || t('non specifie')}</p>
          <p><strong>${t('lieu')}:</strong> ${offer.location || t('non specifie')}</p>
          <p><strong>${t('fourchette de salaire')}:</strong> ${offer.salaryRange || t('non specifie')}</p>
          <p><strong>${t('type de contrat')}:</strong> ${offer.contractType || t('non specifie')}</p>
          <p><strong>${t('date de cloture')}:</strong> ${
            offer.closingDate ? new Date(offer.closingDate).toLocaleDateString('fr-FR') : t('non specifie')
          }</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: user?.role === 'utilisateur' && !offer.has_applied ? t('postuler') : t('fermer'),
      showCancelButton: user?.role === 'utilisateur' && !offer.has_applied,
      cancelButtonText: t('fermer'),
      customClass: {
        popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        confirmButton: darkMode
          ? 'bg-red-600 text-yellow-100 hover:bg-red-700 px-4 py-2 rounded'
          : 'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded',
        cancelButton: darkMode
          ? 'bg-gray-600 text-yellow-100 hover:bg-gray-500 px-4 py-2 rounded'
          : 'bg-gray-300 text-gray-800 hover:bg-gray-400 px-4 py-2 rounded',
      },
    }).then((result) => {
      if (result.isConfirmed && user?.role === 'utilisateur' && !offer.has_applied) {
        openApplyModal(offer);
      }
    });
  };

  const openModal = (offer = null) => {
    setCurrentOffer(offer);
    setFormData(
      offer || {
        title: '',
        description: '',
        requirements: '',
        location: '',
        salaryRange: '',
        contractType: '',
        closingDate: '',
      }
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentOffer(null);
  };

  const openApplyModal = (offer) => {
    setCurrentOffer(offer);
    setApplyData({ coverLetter: '', cv: null });
    setIsApplyModalOpen(true);
  };

  const closeApplyModal = () => {
    setIsApplyModalOpen(false);
    setCurrentOffer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleApplyInputChange = (e) => {
    const { name, value, files } = e.target;
    setApplyData({ ...applyData, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));
      const payload = {
        ...formData,
        contract_type: formData.contractType,
        salary_range: formData.salaryRange,
        closing_date: formData.closingDate,
      };
      delete payload.contractType;
      delete payload.salaryRange;
      delete payload.closingDate;

      if (currentOffer) {
        await api.put(`/job-offers/${currentOffer.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post('/job-offers', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchJobOffers();
      closeModal();
      setError(null);
      Swal.fire({
        title: t('succes'),
        text: currentOffer ? t('offre mise a jour') : t('offre creee'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (error) {
      console.error('Erreur de soumission:', error.message, error.response?.data);
      setError(error.response?.data?.error || t('echec de la sauvegarde de l offre'));
      Swal.fire({
        title: t('erreur'),
        text: error.response?.data?.error || t('echec de la sauvegarde de l offre'),
        icon: 'error',
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));
      const formDataToSend = new FormData();
      formDataToSend.append('cover_letter', applyData.coverLetter || '');
      formDataToSend.append('cv', applyData.cv);

      await api.post(`/job-offers/${currentOffer.id}/apply`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchJobOffers();
      closeApplyModal();
      setError(null);
      Swal.fire({
        title: t('succes'),
        text: t('candidature soumise'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (error) {
      console.error('Erreur de candidature:', error.message, error.response?.data);
      let errorMessage = t('echec de la soumission de la candidature');
      if (error.response) {
        if (error.response.status === 422) {
          errorMessage = error.response.data.errors?.cv?.[0] || t('fichier invalide');
        } else if (error.response.status === 400) {
          errorMessage = t('deja postule');
        } else if (error.response.status === 403) {
          errorMessage = t('non autorise');
        } else if (error.response.status === 404) {
          errorMessage = t('offre non trouvee');
        } else {
          errorMessage = error.response.data.error || t('erreur serveur');
        }
      }
      setError(errorMessage);
      Swal.fire({
        title: t('erreur'),
        text: errorMessage,
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
      text: t('confirmation de la suppression de l offre'),
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
        await api.delete(`/job-offers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchJobOffers();
        setError(null);
        Swal.fire({
          title: t('supprime'),
          text: t('offre supprimee'),
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      } catch (error) {
        console.error('Erreur de suppression:', error.message, error.response?.data);
        setError(error.response?.data?.error || t('echec de la suppression de l offre'));
        Swal.fire({
          title: t('erreur'),
          text: error.response?.data?.error || t('echec de la suppression de l offre'),
          icon: 'error',
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      }
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterContractType('');
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
                {t('offres d emploi')}
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
                  {t('ajouter une offre')}
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
                  {t('type de contrat')}
                </label>
                <select
                  value={filterContractType}
                  onChange={(e) => setFilterContractType(e.target.value)}
                  className={cn(
                    'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                >
                  <option value="">{t('tous les types de contrat')}</option>
                  {contractTypes.map((type) => (
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
            ) : filteredJobOffers.length === 0 ? (
              <p
                className={cn(
                  'text-center',
                  darkMode ? 'text-yellow-400' : 'text-gray-600'
                )}
              >
                {t('aucune offre d emploi')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobOffers.map((offer) => (
                  <div
                    key={offer.id}
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
                      {offer.title}
                    </h2>
                    <p
                      className={cn(
                        'mb-4 line-clamp-3',
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      )}
                    >
                      {offer.description}
                    </p>
                    <p
                      className={cn(
                        'text-sm mb-1',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('lieu')}:</span> {offer.location || t('non specifie')}
                    </p>
                    <p
                      className={cn(
                        'text-sm mb-4',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('type de contrat')}:</span> {offer.contractType || t('non specifie')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => showDetails(offer)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                          darkMode
                            ? 'bg-gray-700 text-yellow-100 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        )}
                      >
                        {t('details')}
                      </button>
                      {(user?.role === 'admin' || (user?.role === 'entreprise' && offer.user_id === user?.id)) && (
                        <>
                          <button
                            onClick={() => openModal(offer)}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                              darkMode
                                ? 'bg-yellow-700 text-gray-900 hover:bg-yellow-600'
                                : 'bg-yellow-500 text-white hover:bg-yellow-600'
                            )}
                          >
                            <Edit className="h-4 w-4" />
                            {t('modifier')}
                          </button>
                          <button
                            onClick={() => handleDelete(offer.id)}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                              darkMode
                                ? 'bg-red-700 text-yellow-100 hover:bg-red-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('supprimer')}
                          </button>
                        </>
                      )}
                      {user?.role === 'utilisateur' && (
                        <button
                          onClick={() => openApplyModal(offer)}
                          disabled={offer.has_applied}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                            offer.has_applied
                              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                              : darkMode
                              ? 'bg-red-600 text-yellow-100 hover:bg-red-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          )}
                        >
                          <Briefcase className="h-4 w-4" />
                          {offer.has_applied ? t('deja postule') : t('postuler')}
                        </button>
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
                        {currentOffer ? t('modifier une offre') : t('ajouter une offre')}
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
                            {t('exigences')}
                          </label>
                          <textarea
                            name="requirements"
                            value={formData.requirements}
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
                            {t('fourchette de salaire')}
                          </label>
                          <input
                            type="text"
                            name="salaryRange"
                            value={formData.salaryRange}
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
                            {t('type de contrat')}
                          </label>
                          <input
                            type="text"
                            name="contractType"
                            value={formData.contractType}
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
                            {t('date de cloture')}
                          </label>
                          <input
                            type="date"
                            name="closingDate"
                            value={formData.closingDate}
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
                            {currentOffer ? t('mettre a jour') : t('creer')}
                          </button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>

          <Transition show={isApplyModalOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeApplyModal}>
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
                        {t('postuler pour l offre', { title: currentOffer?.title })}
                      </Dialog.Title>
                      <form onSubmit={handleApplySubmit} className="mt-4 space-y-4">
                        <div>
                          <label
                            className={cn(
                              'block text-sm font-medium',
                              darkMode ? 'text-yellow-400' : 'text-gray-700'
                            )}
                          >
                            {t('lettre de motivation')}
                          </label>
                          <textarea
                            name="coverLetter"
                            value={applyData.coverLetter}
                            onChange={handleApplyInputChange}
                            className={cn(
                              'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                                : 'border-gray-300 text-gray-900 focus:ring-red-600'
                            )}
                            rows="4"
                          />
                        </div>
                        <div>
                          <label
                            className={cn(
                              'block text-sm font-medium',
                              darkMode ? 'text-yellow-400' : 'text-gray-700'
                            )}
                          >
                            {t('cv')}
                          </label>
                          <input
                            type="file"
                            name="cv"
                            accept=".pdf,.doc,.docx"
                            onChange={handleApplyInputChange}
                            className={cn(
                              'mt-1 block w-full text-sm',
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-yellow-100'
                                : 'border-gray-300 text-gray-900'
                            )}
                            required
                          />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={closeApplyModal}
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
                            {t('soumettre la candidature')}
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

export default OffresEmploi;