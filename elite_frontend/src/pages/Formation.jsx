import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import { Search, Filter, Clock, BookOpen, Star, Users, Edit, Trash2, Upload, PlayCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Swal from 'sweetalert2';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

const FormationForm = ({ editFormation, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    level: '',
    category: '',
    instructor: '',
    price: '',
    students: '',
    target_audience: '',
    link: '',
    points: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (editFormation) {
      setFormData({
        title: editFormation.title || '',
        description: editFormation.description || '',
        duration: editFormation.duration || '',
        level: editFormation.level || '',
        category: editFormation.category || '',
        instructor: editFormation.instructor || '',
        price: editFormation.price || '',
        students: editFormation.students || '',
        target_audience: editFormation.target_audience || '',
        link: editFormation.link || '',
        points: editFormation.points || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        duration: '',
        level: '',
        category: '',
        instructor: '',
        price: '',
        students: '',
        target_audience: '',
        link: '',
        points: '',
      });
    }
    setFormErrors({});
  }, [editFormation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'image' && !file.type.startsWith('image/')) {
        setFormErrors((prev) => ({ ...prev, image: t('veuillez selectionner une image valide') }));
        return;
      }
      if (type === 'video' && !['video/mp4', 'video/avi'].includes(file.type)) {
        setFormErrors((prev) => ({ ...prev, video: t('veuillez selectionner un fichier mp4 ou avi') }));
        return;
      }
      if (file.size > (type === 'image' ? 2 * 1024 * 1024 : 100 * 1024 * 1024)) {
        setFormErrors((prev) => ({
          ...prev,
          [type]: t(`le fichier depasse la taille maximale de ${type === 'image' ? '2 Mo' : '100 Mo'}`),
        }));
        return;
      }
      if (type === 'image') setImageFile(file);
      else setVideoFile(file);
      setFormErrors((prev) => ({ ...prev, [type]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== '') data.append(key, formData[key]);
    });
    if (imageFile) data.append('image', imageFile);
    if (videoFile) data.append('video', videoFile);

    console.log('Données envoyées dans FormData :');
    for (let [key, value] of data.entries()) {
      console.log(`${key}: ${value instanceof File ? value.name : value}`);
    }

    onSubmit(data, editFormation);
  };

  return (
    <Transition show={true} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
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
                  {editFormation ? t('modifier la formation') : t('ajouter une formation')}
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
                    {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={cn(
                          'block text-sm font-medium',
                          darkMode ? 'text-yellow-400' : 'text-gray-700'
                        )}
                      >
                        {t('durée')}
                      </label>
                      <input
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
                      {formErrors.duration && <p className="text-red-500 text-sm mt-1">{formErrors.duration}</p>}
                    </div>
                    <div>
                      <label
                        className={cn(
                          'block text-sm font-medium',
                          darkMode ? 'text-yellow-400' : 'text-gray-700'
                        )}
                      >
                        {t('niveau')}
                      </label>
                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleInputChange}
                        className={cn(
                          'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                            : 'border-gray-300 text-gray-900 focus:ring-red-600'
                        )}
                        required
                      >
                        <option value="">{t('sélectionner')}</option>
                        <option value="Débutant">{t('débutant')}</option>
                        <option value="Intermédiaire">{t('intermédiaire')}</option>
                        <option value="Avancé">{t('avancé')}</option>
                      </select>
                      {formErrors.level && <p className="text-red-500 text-sm mt-1">{formErrors.level}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={cn(
                          'block text-sm font-medium',
                          darkMode ? 'text-yellow-400' : 'text-gray-700'
                        )}
                      >
                        {t('catégorie')}
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={cn(
                          'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                            : 'border-gray-300 text-gray-900 focus:ring-red-600'
                        )}
                        required
                      >
                        <option value="">{t('sélectionner')}</option>
                        <option value="Management">{t('management')}</option>
                        <option value="Communication">{t('communication')}</option>
                        <option value="Analyse">{t('analyse')}</option>
                        <option value="Gestion de projet">{t('gestion de projet')}</option>
                        <option value="Vente">{t('vente')}</option>
                        <option value="Développement personnel">{t('développement personnel')}</option>
                      </select>
                      {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
                    </div>
                    <div>
                      <label
                        className={cn(
                          'block text-sm font-medium',
                          darkMode ? 'text-yellow-400' : 'text-gray-700'
                        )}
                      >
                        {t('formateur')}
                      </label>
                      <input
                        name="instructor"
                        value={formData.instructor}
                        onChange={handleInputChange}
                        className={cn(
                          'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                            : 'border-gray-300 text-gray-900 focus:ring-red-600'
                        )}
                        required
                      />
                      {formErrors.instructor && <p className="text-red-500 text-sm mt-1">{formErrors.instructor}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={cn(
                          'block text-sm font-medium',
                          darkMode ? 'text-yellow-400' : 'text-gray-700'
                        )}
                      >
                        {t('prix (€)')}
                      </label>
                      <input
                        name="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        className={cn(
                          'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                            : 'border-gray-300 text-gray-900 focus:ring-red-600'
                        )}
                        required
                      />
                      {formErrors.price && <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>}
                    </div>
                    <div>
                      <label
                        className={cn(
                          'block text-sm font-medium',
                          darkMode ? 'text-yellow-400' : 'text-gray-700'
                        )}
                      >
                        {t('nombre d\'étudiants')}
                      </label>
                      <input
                        name="students"
                        type="number"
                        value={formData.students}
                        onChange={handleInputChange}
                        className={cn(
                          'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                            : 'border-gray-300 text-gray-900 focus:ring-red-600'
                        )}
                      />
                      {formErrors.students && <p className="text-red-500 text-sm mt-1">{formErrors.students}</p>}
                    </div>
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
                      <option value="">{t('sélectionner')}</option>
                      <option value="etudiant_maroc">{t('étudiants maroc')}</option>
                      <option value="etudiant_etranger">{t('étudiants étranger')}</option>
                      <option value="entrepreneur">{t('entrepreneur')}</option>
                      <option value="salarie_etat">{t('salarié public')}</option>
                      <option value="salarie_prive">{t('salarié privé')}</option>
                    </select>
                    {formErrors.target_audience && <p className="text-red-500 text-sm mt-1">{formErrors.target_audience}</p>}
                  </div>
                  <div>
                    <label
                      className={cn(
                        'block text-sm font-medium',
                        darkMode ? 'text-yellow-400' : 'text-gray-700'
                      )}
                    >
                      {t('image de la formation')}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'image')}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600'
                      )}
                    />
                    {formErrors.image && <p className="text-red-500 text-sm mt-1">{formErrors.image}</p>}
                  </div>
                  <div>
                    <label
                      className={cn(
                        'block text-sm font-medium',
                        darkMode ? 'text-yellow-400' : 'text-gray-700'
                      )}
                    >
                      {t('vidéo de la formation')}
                    </label>
                    <input
                      type="file"
                      accept="video/mp4,video/avi"
                      onChange={(e) => handleFileChange(e, 'video')}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600'
                      )}
                    />
                    {formErrors.video && <p className="text-red-500 text-sm mt-1">{formErrors.video}</p>}
                  </div>
                  <div>
                    <label
                      className={cn(
                        'block text-sm font-medium',
                        darkMode ? 'text-yellow-400' : 'text-gray-700'
                      )}
                    >
                      {t('lien externe')}
                    </label>
                    <input
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600'
                      )}
                    />
                    {formErrors.link && <p className="text-red-500 text-sm mt-1">{formErrors.link}</p>}
                  </div>
                  <div>
                    <label
                      className={cn(
                        'block text-sm font-medium',
                        darkMode ? 'text-yellow-400' : 'text-gray-700'
                      )}
                    >
                      {t('points attribués')}
                    </label>
                    <input
                      name="points"
                      type="number"
                      value={formData.points}
                      onChange={handleInputChange}
                      className={cn(
                        'mt-1 block w-full rounded-md shadow-sm focus:outline-none focus:ring-2',
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                          : 'border-gray-300 text-gray-900 focus:ring-red-600'
                      )}
                      required
                    />
                    {formErrors.points && <p className="text-red-500 text-sm mt-1">{formErrors.points}</p>}
                  </div>
                  {formErrors.general && <p className="text-red-500 text-sm mt-1">{formErrors.general}</p>}
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
                      <Upload className="h-5 w-5 inline mr-2" /> {editFormation ? t('mettre à jour') : t('créer')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const Formations = ({ user: propUser, onLogout }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [formations, setFormations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFormation, setActiveFormation] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editFormation, setEditFormation] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [user, setUser] = useState(propUser);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [completedFormations, setCompletedFormations] = useState(new Set());

  useEffect(() => {
    fetchUser();
    fetchFormations();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur :', error);
      setUser(null);
    }
  };

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'admin' ? '/api/admin/formations' : '/api/formations';
      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFormations(Array.isArray(response.data) ? response.data : []);
      const completed = new Set(response.data.filter((f) => f.is_completed).map((f) => f.id));
      setCompletedFormations(completed);
    } catch (error) {
      setError(t('impossible de charger les formations'));
      setFormations([]);
    } finally {
      setLoading(false);
    }
  };

  const completeFormation = async (formationId) => {
    try {
      const response = await api.post(
        `/api/formations/${formationId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setCompletedFormations((prev) => new Set([...prev, formationId]));
      Swal.fire({
        title: t('succès'),
        text: t(`formation complétée ! Points gagnés : ${response.data.points_earned}`),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
      fetchFormations();
    } catch (error) {
      setError(t('erreur lors de la complétion'));
      Swal.fire({
        title: t('erreur'),
        text: t('erreur lors de la complétion'),
        icon: 'error',
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    }
  };

  const toggleFilters = () => setShowFilters(!showFilters);

  const filteredFormations = Array.isArray(formations)
    ? formations.filter((formation) => {
        const matchesSearch =
          formation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          formation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          formation.instructor.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? formation.category === selectedCategory : true;
        const matchesLevel = selectedLevel ? formation.level === selectedLevel : true;
        return matchesSearch && matchesCategory && matchesLevel;
      })
    : [];

  const initiatePayment = async (isGlobal) => {
    try {
      const response = await api.post(
        '/api/formations/payment',
        { formation_id: isGlobal ? null : activeFormation.id, is_global: isGlobal },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchFormations();
      setShowPaymentModal(false);
      Swal.fire({
        title: t('succès'),
        text: t('paiement effectué avec succès'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (error) {
      setError(t('erreur lors du paiement'));
      Swal.fire({
        title: t('erreur'),
        text: t('erreur lors du paiement'),
        icon: 'error',
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    }
  };

  const checkAndProceed = (formation) => {
    if (user?.role === 'admin' || formation.has_access) {
      setActiveFormation(formation);
    } else {
      setActiveFormation(formation);
      setShowPaymentModal(true);
    }
  };

  const handleAddOrUpdateFormation = async (data, editFormation) => {
    try {
      let response;
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      };

      console.log('Données envoyées dans la requête :');
      for (let [key, value] of data.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }

      if (editFormation) {
        console.log('Envoi PUT vers /api/admin/formations/' + editFormation.id);
        response = await api.put(`/api/admin/formations/${editFormation.id}`, data, { headers });
      } else {
        console.log('Envoi POST vers /api/admin/formations');
        response = await api.post('/api/admin/formations', data, { headers });
      }
      console.log('Réponse API:', response.data);
      await fetchFormations();
      setEditFormation(null);
      setShowAddForm(false);
      setError(null);
      Swal.fire({
        title: t('succès'),
        text: editFormation ? t('formation mise à jour') : t('formation créée'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (error) {
      console.error('Erreur handleAddOrUpdateFormation:', error.response?.data || error.message);
      const errorData = error.response?.data;
      if (error.response?.status === 422) {
        const errors = errorData.errors || {};
        setError(t(`erreur lors de la sauvegarde : ${Object.values(errors).flat().join(' ')}`));
      } else if (error.response?.status === 413) {
        setError(t('fichier trop volumineux. Maximum 100 Mo pour la vidéo, 2 Mo pour l’image'));
      } else {
        setError(t('erreur lors de la sauvegarde de la formation'));
      }
      Swal.fire({
        title: t('erreur'),
        text: error.response?.data?.error || t('erreur lors de la sauvegarde de la formation'),
        icon: 'error',
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    }
  };

  const handleDeleteFormation = async (id) => {
    const result = await Swal.fire({
      title: t('confirmer la suppression'),
      text: t('voulez-vous vraiment supprimer cette formation ?'),
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
        await api.delete(`/api/admin/formations/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        await fetchFormations();
        setError(null);
        Swal.fire({
          title: t('supprimé'),
          text: t('formation supprimée'),
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      } catch (error) {
        setError(t('erreur lors de la suppression'));
        Swal.fire({
          title: t('erreur'),
          text: t('erreur lors de la suppression'),
          icon: 'error',
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      }
    }
  };

  const handleCancel = () => {
    setEditFormation(null);
    setShowAddForm(false);
  };

  const PaymentModal = () => (
    <Transition show={true} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setShowPaymentModal(false)}>
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
                  'w-full max-w-md rounded-2xl p-6 shadow-xl',
                  darkMode ? 'bg-gray-800 text-yellow-100' : 'bg-white text-gray-900'
                )}
              >
                <Dialog.Title as="h3" className="text-lg font-medium">
                  {t('options de paiement')}
                </Dialog.Title>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('pour accéder à')} "{activeFormation.title}" :
                </p>
                <div className="mt-4 space-y-4">
                  <button
                    onClick={() => initiatePayment(false)}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center',
                      darkMode
                        ? 'bg-red-600 text-yellow-100 hover:bg-red-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    )}
                  >
                    <PlayCircle className="h-5 w-5 mr-2" /> {t('payer pour cette formation')} ({activeFormation.price}€)
                  </button>
                  <button
                    onClick={() => initiatePayment(true)}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center',
                      darkMode
                        ? 'bg-red-600 text-yellow-100 hover:bg-red-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    )}
                  >
                    <PlayCircle className="h-5 w-5 mr-2" /> {t('abonnement global')} (99.99€)
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg transition-all duration-200',
                      darkMode
                        ? 'bg-gray-600 text-yellow-100 hover:bg-gray-500'
                        : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                    )}
                  >
                    {t('annuler')}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  if (loading) {
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

  if (error) {
    return (
      <div
        className={cn(
          'flex justify-center items-center h-screen',
          darkMode ? 'bg-gray-900 text-yellow-100' : 'bg-gray-50 text-gray-900'
        )}
      >
        {error}
      </div>
    );
  }

  if (activeFormation && !showPaymentModal) {
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
                onClick={() => setActiveFormation(null)}
                className={cn(
                  'flex items-center text-sm mb-6',
                  darkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-red-600 hover:text-red-700'
                )}
              >
                <ArrowRight className="h-5 w-5 mr-2 rotate-180" /> {t('retour')}
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
                    {activeFormation.title}
                  </h1>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setEditFormation(activeFormation);
                        setShowAddForm(true);
                      }}
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
                    'mb-6 leading-relaxed',
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  )}
                >
                  {activeFormation.description}
                </p>
                {activeFormation.image && (
                  <img
                    src={`${api.defaults.baseURL}${activeFormation.image}`}
                    alt={activeFormation.title}
                    className="w-full h-64 object-cover rounded-xl mb-6"
                  />
                )}
                {activeFormation.video && (
                  <video
                    controls
                    src={`${api.defaults.baseURL}${activeFormation.video}`}
                    className="w-full rounded-xl mb-6 shadow-md"
                  />
                )}
                {activeFormation.link && (
                  <a
                    href={activeFormation.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'block mb-6',
                      darkMode ? 'text-yellow-400 hover:underline' : 'text-red-600 hover:underline'
                    )}
                  >
                    {t('lien externe')}
                  </a>
                )}
                <div
                  className={cn(
                    'flex flex-wrap items-center gap-6 text-sm mb-6',
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  <span className="flex items-center">
                    <Clock className={cn('h-5 w-5 mr-2', darkMode ? 'text-yellow-400' : 'text-red-600')} />
                    {activeFormation.duration}
                  </span>
                  <span className="flex items-center">
                    <BookOpen className={cn('h-5 w-5 mr-2', darkMode ? 'text-yellow-400' : 'text-red-600')} />
                    {activeFormation.level}
                  </span>
                  <span className="flex items-center">
                    <Users className={cn('h-5 w-5 mr-2', darkMode ? 'text-yellow-400' : 'text-red-600')} />
                    {activeFormation.students || 0} {t('apprenants')}
                  </span>
                  <span className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    {activeFormation.rating || 'N/A'}/5
                  </span>
                </div>
                {user?.role !== 'admin' && !completedFormations.has(activeFormation.id) && (
                  <button
                    onClick={() => completeFormation(activeFormation.id)}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center',
                      darkMode
                        ? 'bg-green-600 text-yellow-100 hover:bg-green-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    )}
                  >
                    <PlayCircle className="h-5 w-5 mr-2" /> {t('marquer comme complété')} ({activeFormation.points} {t('points')})
                  </button>
                )}
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
                {t('formations')}
              </h1>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className={cn(
                    'flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200',
                    darkMode ? 'hover:bg-red-500' : 'hover:bg-red-700'
                  )}
                >
                  <Upload className="h-5 w-5" />
                  {t('ajouter une formation')}
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
                  placeholder={t('rechercher par titre, description ou formateur')}
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
                  {t('catégorie')}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={cn(
                    'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                >
                  <option value="">{t('toutes les catégories')}</option>
                  <option value="Management">{t('management')}</option>
                  <option value="Communication">{t('communication')}</option>
                  <option value="Analyse">{t('analyse')}</option>
                  <option value="Gestion de projet">{t('gestion de projet')}</option>
                  <option value="Vente">{t('vente')}</option>
                  <option value="Développement personnel">{t('développement personnel')}</option>
                </select>
              </div>
              <div>
                <label
                  className={cn(
                    'block text-sm font-medium mb-1',
                    darkMode ? 'text-yellow-400' : 'text-gray-700'
                  )}
                >
                  {t('niveau')}
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className={cn(
                    'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                >
                  <option value="">{t('tous les niveaux')}</option>
                  <option value="Débutant">{t('débutant')}</option>
                  <option value="Intermédiaire">{t('intermédiaire')}</option>
                  <option value="Avancé">{t('avancé')}</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={toggleFilters}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center',
                    darkMode
                      ? 'bg-gray-600 text-yellow-100 hover:bg-gray-500'
                      : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                  )}
                >
                  <Filter className="h-5 w-5 mr-2" /> {t('filtres')}
                </button>
              </div>
            </div>

            {showFilters && (
              <div
                className={cn(
                  'mb-6 p-4 rounded-xl shadow-md',
                  darkMode ? 'bg-gray-800' : 'bg-white'
                )}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={cn(
                      'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                        : 'border-gray-300 text-gray-900 focus:ring-red-600'
                    )}
                  >
                    <option value="">{t('toutes les catégories')}</option>
                    <option value="Management">{t('management')}</option>
                    <option value="Communication">{t('communication')}</option>
                    <option value="Analyse">{t('analyse')}</option>
                    <option value="Gestion de projet">{t('gestion de projet')}</option>
                    <option value="Vente">{t('vente')}</option>
                    <option value="Développement personnel">{t('développement personnel')}</option>
                  </select>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className={cn(
                      'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                        : 'border-gray-300 text-gray-900 focus:ring-red-600'
                    )}
                  >
                    <option value="">{t('tous les niveaux')}</option>
                    <option value="Débutant">{t('débutant')}</option>
                    <option value="Intermédiaire">{t('intermédiaire')}</option>
                    <option value="Avancé">{t('avancé')}</option>
                  </select>
                </div>
              </div>
            )}

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

            {filteredFormations.length === 0 ? (
              <p
                className={cn(
                  'text-center py-16',
                  darkMode ? 'text-yellow-400' : 'text-gray-600'
                )}
              >
                {t('aucune formation trouvée')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFormations.map((formation) => (
                  <div
                    key={formation.id}
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
                      {formation.title}
                    </h2>
                    <p
                      className={cn(
                        'mb-4 line-clamp-3',
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      )}
                    >
                      {formation.description}
                    </p>
                    <div
                      className={cn(
                        'flex items-center gap-4 text-sm mb-4',
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      )}
                    >
                      <span className="flex items-center">
                        <Clock className={cn('h-4 w-4 mr-1', darkMode ? 'text-yellow-400' : 'text-red-600')} />
                        {formation.duration}
                      </span>
                      <span className="flex items-center">
                        <BookOpen className={cn('h-4 w-4 mr-1', darkMode ? 'text-yellow-400' : 'text-red-600')} />
                        {formation.level}
                      </span>
                    </div>
                    {user?.role === 'admin' ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditFormation(formation);
                            setShowAddForm(true);
                          }}
                          className={cn(
                            'flex-1 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                            darkMode
                              ? 'bg-yellow-700 text-gray-900 hover:bg-yellow-600'
                              : 'bg-yellow-500 text-white hover:bg-yellow-600'
                          )}
                        >
                          <Edit className="h-4 w-4" /> {t('modifier')}
                        </button>
                        <button
                          onClick={() => handleDeleteFormation(formation.id)}
                          className={cn(
                            'flex-1 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                            darkMode
                              ? 'bg-red-700 text-yellow-100 hover:bg-red-600'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          )}
                        >
                          <Trash2 className="h-4 w-4" /> {t('supprimer')}
                        </button>
                      </div>
                    ) : null}
                    <button
                      onClick={() => checkAndProceed(formation)}
                      className={cn(
                        'w-full mt-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                        darkMode
                          ? 'bg-red-600 text-yellow-100 hover:bg-red-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      )}
                    >
                      <ArrowRight className="h-5 w-5" />
                      {completedFormations.has(formation.id)
                        ? t('revoir')
                        : formation.has_access
                        ? t('accéder')
                        : t(`accéder (${formation.price}€)`)}
                    </button>
                    {completedFormations.has(formation.id) && user?.role !== 'admin' && (
                      <p
                        className={cn(
                          'text-sm mt-2 text-center',
                          darkMode ? 'text-green-400' : 'text-green-600'
                        )}
                      >
                        {t('formation complétée')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(showAddForm || editFormation) && (
              <FormationForm
                editFormation={editFormation}
                onSubmit={handleAddOrUpdateFormation}
                onCancel={handleCancel}
              />
            )}
            {showPaymentModal && <PaymentModal />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Formations;