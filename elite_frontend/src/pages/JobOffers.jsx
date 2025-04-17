import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '@/lib/api';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';
import { Briefcase, PlusCircle, Edit, Trash2, Users } from 'lucide-react';
import Swal from 'sweetalert2';

const OffresEmploi = ({ user, isLoading, onLogout }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isApplicationsModalOpen, setIsApplicationsModalOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    exigences: '',
    lieu: '',
    plageDeSalaire: '',
    typeDeContrat: '',
    dateDeCloture: '',
  });
  const [applyData, setApplyData] = useState({
    lettreDeMotivation: '',
    cv: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterContractType, setFilterContractType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  useEffect(() => {
    console.log('Utilisateur:', user);
    fetchJobOffers();
  }, [searchQuery, filterContractType, filterLocation]);

  const fetchJobOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));
      const response = await api.get('/job-offers', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchQuery, contract_type: filterContractType, location: filterLocation },
      });
      setJobOffers(response.data || []);
    } catch (error) {
      console.error('Erreur de chargement:', error);
      setError(error.response?.data?.error || t('echec chargement offres'));
      setJobOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (offerId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));
      const response = await api.get(`/job-offers/${offerId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(response.data || []);
      setIsApplicationsModalOpen(true);
    } catch (error) {
      console.error('Erreur lors du chargement des candidatures:', error);
      Swal.fire({
        title: t('erreur'),
        text: error.response?.data?.error || t('echec chargement candidatures'),
        icon: 'error',
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    }
  };

  const contractTypes = [...new Set(jobOffers.map(offer => offer.contract_type).filter(type => type))];
  const locations = [...new Set(jobOffers.map(offer => offer.location).filter(loc => loc))];

  const filteredJobOffers = jobOffers;

  const showDetails = (offer) => {
    Swal.fire({
      title: offer.title,
      html: `
        <div class="text-left text-sm">
          <p><strong>${t('description')}:</strong> ${offer.description || t('non specifie')}</p>
          <p><strong>${t('exigences')}:</strong> ${offer.requirements || t('non specifie')}</p>
          <p><strong>${t('lieu')}:</strong> ${offer.location || t('non specifie')}</p>
          <p><strong>${t('plage de salaire')}:</strong> ${offer.salary_range || t('non specifie')}</p>
          <p><strong>${t('type de contrat')}:</strong> ${offer.contract_type || t('non specifie')}</p>
          <p><strong>${t('date de cloture')}:</strong> ${
            offer.closing_date ? new Date(offer.closing_date).toLocaleDateString('fr-FR') : t('non specifie')
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
      offer
        ? {
            titre: offer.title,
            description: offer.description,
            exigences: offer.requirements,
            lieu: offer.location,
            plageDeSalaire: offer.salary_range || '',
            typeDeContrat: offer.contract_type || '',
            dateDeCloture: offer.closing_date ? offer.closing_date.split('T')[0] : '',
          }
        : {
            titre: '',
            description: '',
            exigences: '',
            lieu: '',
            plageDeSalaire: '',
            typeDeContrat: '',
            dateDeCloture: '',
          }
    );
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentOffer(null);
    setFormErrors({});
  };

  const openApplyModal = (offer) => {
    console.log('Ouverture du modal de candidature pour l\'offre:', offer);
    setCurrentOffer(offer);
    setApplyData({ lettreDeMotivation: '', cv: null });
    setFormErrors({});
    setIsApplyModalOpen(true);
  };

  const closeApplyModal = () => {
    setIsApplyModalOpen(false);
    setCurrentOffer(null);
    setFormErrors({});
  };

  const closeApplicationsModal = () => {
    setIsApplicationsModalOpen(false);
    setApplications([]);
    setCurrentOffer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: '' });
  };

  const handleApplyInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      if (file && file.size > 2 * 1024 * 1024) {
        setFormErrors({ ...formErrors, cv: t('cv trop grand') });
        return;
      }
      if (file && file.type !== 'application/pdf') {
        setFormErrors({ ...formErrors, cv: t('cv doit etre pdf') });
        return;
      }
    }
    setApplyData({ ...applyData, [name]: files ? files[0] : value });
    setFormErrors({ ...formErrors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));

      const payload = {
        title: formData.titre,
        description: formData.description,
        requirements: formData.exigences,
        location: formData.lieu,
        salary_range: formData.plageDeSalaire,
        contract_type: formData.typeDeContrat,
        closing_date: formData.dateDeCloture,
      };

      const response = currentOffer
        ? await api.put(`/job-offers/${currentOffer.id}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await api.post('/job-offers', payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

      fetchJobOffers();
      closeModal();
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
      console.error('Erreur de soumission:', error);
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors);
      } else {
        setError(error.response?.data?.error || t('echec sauvegarde offre'));
        Swal.fire({
          title: t('erreur'),
          text: error.response?.data?.error || t('echec sauvegarde offre'),
          icon: 'error',
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      }
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyData.cv) {
      setFormErrors({ ...formErrors, cv: t('cv requis') });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));

      const formDataToSend = new FormData();
      formDataToSend.append('cover_letter', applyData.lettreDeMotivation || '');
      formDataToSend.append('cv', applyData.cv);

      await api.post(`/job-offers/${currentOffer.id}/apply`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      fetchJobOffers();
      closeApplyModal();
      Swal.fire({
        title: t('succes'),
        text: t('candidature envoyee'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (error) {
      console.error('Erreur de candidature:', error);
      let errorMessage = t('echec soumission candidature');
      if (error.response) {
        if (error.response.status === 422) {
          setFormErrors(error.response.data.errors);
          errorMessage = error.response.data.errors.cv?.[0] || t('echec soumission candidature');
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
      title: t('confirmer suppression'),
      text: t('confirmer suppression offre'),
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
        console.error('Erreur de suppression:', error);
        setError(error.response?.data?.error || t('echec suppression offre'));
        Swal.fire({
          title: t('erreur'),
          text: error.response?.data?.error || t('echec suppression offre'),
          icon: 'error',
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      }
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t('aucun jeton trouve'));

      await api.put(`/job-applications/${applicationId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));

      Swal.fire({
        title: t('succes'),
        text: t('statut mis a jour'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (error) {
      console.error('Erreur de mise à jour du statut:', error);
      Swal.fire({
        title: t('erreur'),
        text: error.response?.data?.error || t('echec mise a jour statut'),
        icon: 'error',
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
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
    <div className={cn('min-h-screen', darkMode ? 'dark bg-elite-black-900' : 'bg-elite-yellow-50')}>
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
                {t('offres emploi')}
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
                  {t('ajouter offre')}
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
                  {t('recherche')}
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
                  <option value="">{t('tous types de contrat')}</option>
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
                  <option value="">{t('tous lieux')}</option>
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
            ) : filteredJobOffers.length === 0 ? (
              <p
                className={cn(
                  'text-center',
                  darkMode ? 'text-yellow-400' : 'text-gray-600'
                )}
              >
                {t('aucune offre emploi')}
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
                      <span className="font-medium">{t('type de contrat')}:</span> {offer.contract_type || t('non specifie')}
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
                          <button
                            onClick={() => {
                              setCurrentOffer(offer);
                              fetchApplications(offer.id);
                            }}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                              darkMode
                                ? 'bg-blue-700 text-yellow-100 hover:bg-blue-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            )}
                          >
                            <Users className="h-4 w-4" />
                            {t('voir candidatures')}
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

          {/* Modal Créer/Modifier Offre */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div
                className={cn(
                  'w-full max-w-lg rounded-2xl p-6 shadow-xl',
                  darkMode ? 'bg-gray-800 text-yellow-100' : 'bg-white text-gray-900'
                )}
              >
                <h3 className="text-lg font-medium">
                  {currentOffer ? t('modifier offre') : t('ajouter offre')}
                </h3>
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
                      name="titre"
                      value={formData.titre}
                      onChange={handleInputChange}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600',
                        formErrors.titre ? 'border-red-500' : ''
                      )}
                      required
                    />
                    {formErrors.titre && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.titre}</p>
                    )}
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
                          : 'border-gray-300 text-gray-900 focus:ring-red-600',
                        formErrors.description ? 'border-red-500' : ''
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
                      {t('exigences')}
                    </label>
                    <textarea
                      name="exigences"
                      value={formData.exigences}
                      onChange={handleInputChange}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600',
                        formErrors.exigences ? 'border-red-500' : ''
                      )}
                      rows="4"
                      required
                    />
                    {formErrors.exigences && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.exigences}</p>
                    )}
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
                      name="lieu"
                      value={formData.lieu}
                      onChange={handleInputChange}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600',
                        formErrors.lieu ? 'border-red-500' : ''
                      )}
                      required
                    />
                    {formErrors.lieu && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.lieu}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className={cn(
                        'block text-sm font-medium',
                        darkMode ? 'text-yellow-400' : 'text-gray-700'
                      )}
                    >
                      {t('plage de salaire')}
                    </label>
                    <input
                      type="text"
                      name="plageDeSalaire"
                      value={formData.plageDeSalaire}
                      onChange={handleInputChange}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600',
                        formErrors.salary_range ? 'border-red-500' : ''
                      )}
                    />
                    {formErrors.salary_range && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.salary_range}</p>
                    )}
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
                    <select
                      name="typeDeContrat"
                      value={formData.typeDeContrat}
                      onChange={handleInputChange}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600',
                        formErrors.contract_type ? 'border-red-500' : ''
                      )}
                      required
                    >
                      <option value="">{t('selectionner type de contrat')}</option>
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Stage">Stage</option>
                    </select>
                    {formErrors.contract_type && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.contract_type}</p>
                    )}
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
                      name="dateDeCloture"
                      value={formData.dateDeCloture}
                      onChange={handleInputChange}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600',
                        formErrors.closing_date ? 'border-red-500' : ''
                      )}
                      required
                    />
                    {formErrors.closing_date && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.closing_date}</p>
                    )}
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
              </div>
            </div>
          )}

          {/* Modal Candidature */}
          {isApplyModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div
                className={cn(
                  'w-full max-w-lg rounded-2xl p-6 shadow-xl',
                  darkMode ? 'bg-gray-800 text-yellow-100' : 'bg-white text-gray-900'
                )}
              >
                <h3 className="text-lg font-medium">
                  {t('postuler pour offre', { titre: currentOffer?.title })}
                </h3>
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
                      name="lettreDeMotivation"
                      value={applyData.lettreDeMotivation}
                      onChange={handleApplyInputChange}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600',
                        formErrors.cover_letter ? 'border-red-500' : ''
                      )}
                      rows="4"
                    />
                    {formErrors.cover_letter && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.cover_letter}</p>
                    )}
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
                      accept="application/pdf"
                      onChange={handleApplyInputChange}
                      className={cn(
                        'mt-1 block w-full text-sm',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100'
                          : 'border-gray-300 text-gray-900',
                        formErrors.cv ? 'border-red-500' : ''
                      )}
                      required
                    />
                    {formErrors.cv && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.cv}</p>
                    )}
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
                      {t('soumettre candidature')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Candidatures */}
          {isApplicationsModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div
                className={cn(
                  'w-full max-w-2xl rounded-2xl p-6 shadow-xl',
                  darkMode ? 'bg-gray-800 text-yellow-100' : 'bg-white text-gray-900'
                )}
              >
                <h3 className="text-lg font-medium">
                  {t('candidatures pour', { titre: currentOffer?.title })}
                </h3>
                <div className="mt-4">
                  {applications.length === 0 ? (
                    <p className={cn('text-center', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                      {t('aucune candidature')}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className={cn(
                            'p-4 rounded-lg',
                            darkMode ? 'bg-gray-700' : 'bg-gray-100'
                          )}
                        >
                          <h4 className="font-medium">{app.user.nom_complet}</h4>
                          <p className="text-sm">
                            <strong>{t('email')}:</strong> {app.user.email}
                          </p>
                          <p className="text-sm">
                            <strong>{t('telephone')}:</strong> {app.user.telephone || t('non specifie')}
                          </p>
                          <p className="text-sm">
                            <strong>{t('lettre de motivation')}:</strong>{' '}
                            {app.cover_letter || t('aucune lettre')}
                          </p>
                          <p className="text-sm">
                            <strong>{t('statut')}:</strong> {t(app.status)}
                          </p>
                          <p className="text-sm">
                            <strong>{t('date candidature')}:</strong>{' '}
                            {new Date(app.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          <div className="mt-2 flex gap-2">
                            {app.cv_url ? (
                              <a
                                href={app.cv_url}
                                download
                                onClick={async (e) => {
                                  try {
                                    const response = await fetch(app.cv_url, { method: 'HEAD' });
                                    if (!response.ok) {
                                      e.preventDefault();
                                      Swal.fire({
                                        title: t('erreur'),
                                        text: t('cv non trouve'),
                                        icon: 'error',
                                        customClass: {
                                          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
                                        },
                                      });
                                    }
                                  } catch (err) {
                                    e.preventDefault();
                                    Swal.fire({
                                      title: t('erreur'),
                                      text: t('cv non trouve'),
                                      icon: 'error',
                                      customClass: {
                                        popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
                                      },
                                    });
                                  }
                                }}
                                className={cn(
                                  'px-3 py-1 rounded-lg text-sm transition-all duration-200',
                                  darkMode
                                    ? 'bg-blue-600 text-yellow-100 hover:bg-blue-500'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                )}
                              >
                                {t('telecharger cv')}
                              </a>
                            ) : (
                              <span className="text-sm text-red-500">{t('cv non trouve')}</span>
                            )}
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: app.user.nom_complet,
                                  html: `
                                    <div class="text-left text-sm">
                                      <p><strong>${t('email')}:</strong> ${app.user.email}</p>
                                      <p><strong>${t('telephone')}:</strong> ${
                                        app.user.telephone || t('non specifie')
                                      }</p>
                                    </div>
                                  `,
                                  icon: 'info',
                                  confirmButtonText: t('fermer'),
                                  customClass: {
                                    popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
                                  },
                                });
                              }}
                              className={cn(
                                'px-3 py-1 rounded-lg text-sm transition-all duration-200',
                                darkMode
                                  ? 'bg-green-600 text-yellow-100 hover:bg-green-500'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              )}
                            >
                              {t('voir profil')}
                            </button>
                            <select
                              value={app.status}
                              onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                              className={cn(
                                'rounded-md text-sm',
                                darkMode
                                  ? 'bg-gray-600 text-yellow-100 border-gray-500'
                                  : 'bg-white text-gray-900 border-gray-300'
                              )}
                            >
                              <option value="pending">{t('en attente')}</option>
                              <option value="accepted">{t('accepte')}</option>
                              <option value="rejected">{t('rejete')}</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeApplicationsModal}
                    className={cn(
                      'px-4 py-2 rounded-lg transition-all duration-200',
                      darkMode
                        ? 'bg-gray-600 text-yellow-100 hover:bg-gray-500'
                        : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                    )}
                  >
                    {t('fermer')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OffresEmploi;