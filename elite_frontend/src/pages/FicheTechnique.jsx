import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useDarkMode } from '../DarkModeContext';
import Swal from 'sweetalert2';

const FicheTechnique = ({ user: propUser, onSave }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    address: '',
    logo: null,
    software_technologies: '',
    numero_de_telephone: '',
    cef: '',
    creation_date: '',
    required_skills: '',
    programming_languages: [],
    age_range: '',
    required_diplomas: '',
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const availableLanguages = ['PHP', 'JavaScript', 'Python', 'Java', 'C#'];

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const loadedUser = propUser || storedUser;
    if (loadedUser) {
      console.log('Loaded user:', loadedUser);
      setUser(loadedUser);
      setFormData({
        company_name: loadedUser.company_name || '',
        address: loadedUser.address || '',
        logo: loadedUser.logo || null,
        software_technologies: loadedUser.software_technologies || '',
        numero_de_telephone: loadedUser.numero_de_telephone || '',
        cef: loadedUser.cef || '',
        creation_date: loadedUser.creation_date ? loadedUser.creation_date.split('T')[0] : '',
        required_skills: loadedUser.required_skills || '',
        programming_languages:
          Array.isArray(loadedUser.programming_languages)
            ? loadedUser.programming_languages
            : loadedUser.programming_language
            ? typeof loadedUser.programming_language === 'string' &&
              loadedUser.programming_language.startsWith('[')
              ? JSON.parse(loadedUser.programming_language)
              : [loadedUser.programming_language]
            : [],
        age_range: loadedUser.age_range || '',
        required_diplomas: loadedUser.required_diplomas || '',
      });
    }
    setLoading(false);
  }, [propUser]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.company_name) newErrors.company_name = t('erreur_nom_entreprise_requis');
    if (!formData.address) newErrors.address = t('erreur_adresse_requise');
    if (!formData.numero_de_telephone) newErrors.numero_de_telephone = t('erreur_telephone_requis');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      Swal.fire({
        icon: 'error',
        title: t('erreur'),
        text: t('erreur_utilisateur_non_charge'),
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-all duration-300',
        },
      });
      return;
    }

    if (!validateForm()) {
      Swal.fire({
        icon: 'warning',
        title: t('erreur'),
        text: t('erreur_champs_obligatoires'),
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-all duration-300',
        },
      });
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'logo' && value && typeof value !== 'string') {
        data.append('logo', value);
      } else if (key === 'programming_languages' && Array.isArray(value)) {
        value.forEach((lang) => data.append('programming_languages[]', lang));
      } else if (value !== null && value !== undefined && value !== '') {
        data.append(key, value);
      }
    });

    for (let [key, value] of data.entries()) {
      console.log(`FormData: ${key} =`, value);
    }

    try {
      setLoading(true);
      const response = await api.post('/profile', data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          Accept: 'application/json',
        },
      });
      const updatedUser = response.data.user || response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onSave(updatedUser);
      Swal.fire({
        icon: 'success',
        title: t('succes'),
        text: t('fiche_mise_a_jour'),
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la fiche technique:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      Swal.fire({
        icon: 'error',
        title: t('erreur'),
        text: error.response?.data?.message || t('erreur_mise_a_jour_fiche'),
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-all duration-300',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
    }
  };

  const handleLanguageChange = (language) => {
    setFormData((prev) => {
      const updatedLanguages = prev.programming_languages.includes(language)
        ? prev.programming_languages.filter((lang) => lang !== language)
        : [...prev.programming_languages, language];
      return { ...prev, programming_languages: updatedLanguages };
    });
  };

  if (loading) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center bg-gradient-to-br',
          darkMode ? 'from-gray-800 to-gray-900' : 'from-gray-50 to-gray-200'
        )}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-600 mx-auto"></div>
          <p className={cn('mt-4', darkMode ? 'text-yellow-400' : 'text-gray-900')}>
            {t('chargement')}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center bg-gradient-to-br',
          darkMode ? 'from-gray-800 to-gray-900' : 'from-gray-50 to-gray-200'
        )}
      >
        <p className={cn('text-center', darkMode ? 'text-red-400' : 'text-red-500')}>
          {t('erreur_utilisateur_non_trouve')}
        </p>
      </div>
    );
  }

  return (
     <div className={cn("min-h-screen", darkMode ? "dark bg-elite-black-900" : "bg-elite-yellow-50")}>
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
      />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
        <main
          className={cn(
            'flex-1 p-8 transition-all duration-300',
            isSidebarOpen ? 'lg:pl-64 xl:pl-72' : 'pl-0'
          )}
        >
          <div
            className={cn(
              'max-w-3xl mx-auto rounded-xl shadow-md p-6',
              darkMode ? 'bg-gray-800 text-yellow-100' : 'bg-white text-gray-900'
            )}
          >
            <h1 className={cn('text-3xl font-bold mb-8', darkMode ? 'text-yellow-400' : 'text-gray-900')}>
              {t('fiche_technique_entreprise')}
            </h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('nom_entreprise')} *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className={cn(
                    'w-full p-3 rounded-lg border focus:outline-none focus:ring-2',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                  placeholder={t('nom_entreprise_placeholder')}
                />
                {errors.company_name && (
                  <p className={cn('text-sm mt-1', darkMode ? 'text-red-400' : 'text-red-500')}>
                    {errors.company_name}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('adresse')} *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={cn(
                    'w-full p-3 rounded-lg border focus:outline-none focus:ring-2',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                  placeholder={t('adresse_placeholder')}
                />
                {errors.address && (
                  <p className={cn('text-sm mt-1', darkMode ? 'text-red-400' : 'text-red-500')}>
                    {errors.address}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('logo')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={cn(
                    'w-full p-3 rounded-lg border focus:outline-none focus:ring-2',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                />
                {formData.logo && typeof formData.logo === 'string' && (
                  <img
                    src={`${api.defaults.baseURL.replace('/api', '')}${formData.logo}?t=${new Date().getTime()}`}
                    alt={t('logo')}
                    className="w-20 h-20 mt-2 rounded-full object-cover border-2 border-yellow-400"
                    onError={(e) => (e.target.src = '/default-logo.png')}
                  />
                )}
              </div>
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('technologies')}
                </label>
                <input
                  type="text"
                  value={formData.software_technologies}
                  onChange={(e) => setFormData({ ...formData, software_technologies: e.target.value })}
                  className={cn(
                    'w-full p-3 rounded-lg border focus:outline-none focus:ring-2',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                  placeholder={t('technologies_placeholder')}
                />
              </div>
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('telephone')} *
                </label>
                <input
                  type="tel"
                  value={formData.numero_de_telephone}
                  onChange={(e) => setFormData({ ...formData, numero_de_telephone: e.target.value })}
                  className={cn(
                    'w-full p-3 rounded-lg border focus:outline-none focus:ring-2',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                  placeholder={t('telephone_placeholder')}
                />
                {errors.numero_de_telephone && (
                  <p className={cn('text-sm mt-1', darkMode ? 'text-red-400' : 'text-red-500')}>
                    {errors.numero_de_telephone}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('cef')}
                </label>
                <input
                  type="text"
                  value={formData.cef}
                  onChange={(e) => setFormData({ ...formData, cef: e.target.value })}
                  className={cn(
                    'w-full p-3 rounded-lg border focus:outline-none focus:ring-2',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                  placeholder={t('cef_placeholder')}
                />
              </div>
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('date_creation')}
                </label>
                <input
                  type="date"
                  value={formData.creation_date}
                  onChange={(e) => setFormData({ ...formData, creation_date: e.target.value })}
                  className={cn(
                    'w-full p-3 rounded-lg border focus:outline-none focus:ring-2',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                />
              </div>
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('competences_requises')}
                </label>
                <input
                  type="text"
                  value={formData.required_skills}
                  onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                  className={cn(
                    'w-full p-3 rounded-lg border focus:outline-none focus:ring-2',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                  placeholder={t('competences_requises_placeholder')}
                />
              </div>
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('langages_programmation')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {availableLanguages.map((language) => (
                    <label key={language} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.programming_languages.includes(language)}
                        onChange={() => handleLanguageChange(language)}
                        className="h-4 w-4 text-red-600 focus:ring-red-600 border-gray-300 rounded"
                      />
                      <span className={cn('text-sm', darkMode ? 'text-yellow-400' : 'text-gray-700')}>
                        {language}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('age_demande')}
                </label>
                <input
                  type="text"
                  value={formData.age_range}
                  onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                  className={cn(
                    'w-full p-3 rounded-lg border focus:outline-none focus:ring-2',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                  placeholder={t('age_demande_placeholder')}
                />
              </div>
              <div>
                <label
                  className={cn('block text-sm font-medium mb-1', darkMode ? 'text-yellow-400' : 'text-gray-700')}
                >
                  {t('diplomes_requis')}
                </label>
                <textarea
                  value={formData.required_diplomas}
                  onChange={(e) => setFormData({ ...formData, required_diplomas: e.target.value })}
                  className={cn(
                    'w-full p-3 rounded-lg border focus:outline-none focus:ring-2 h-24',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                  placeholder={t('diplomes_requis_placeholder')}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full py-3 rounded-lg font-semibold transition-all duration-200',
                  darkMode
                    ? 'bg-red-600 text-yellow-100 hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700',
                  loading ? 'bg-gray-400 cursor-not-allowed' : ''
                )}
              >
                {loading ? t('mise_a_jour_en_cours') : formData.company_name ? t('mettre_a_jour') : t('creer')}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FicheTechnique;