import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Notifications from '../components/Notifications';
import { useDarkMode } from '../DarkModeContext';
import api from '../lib/api';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

const CollaboratorsEnterprises = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [enterprises, setEnterprises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnterprises = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users?role=entreprise', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const enterprisesData = response.data.data || response.data;
        if (!Array.isArray(enterprisesData)) {
          throw new Error('Invalid enterprises data format');
        }
        setEnterprises(enterprisesData);
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || t('erreur chargement entreprises'));
        Swal.fire({
          icon: 'error',
          title: t('erreur'),
          text: error.response?.data?.message || t('erreur chargement entreprises'),
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEnterprises();
  }, [darkMode, t]);

  const formatProgrammingLanguage = (language) => {
    if (!language) return t('non specifie');
    try {
      const parsed = typeof language === 'string' && language.startsWith('[')
        ? JSON.parse(language)
        : Array.isArray(language)
        ? language
        : [language];
      return parsed.join(', ') || t('non specifie');
    } catch (e) {
      return language || t('non specifie');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ENT';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 3);
  };

  const generatePDF = async (enterprise) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;
    const logoSize = 30;
    const padding = 10;

    const cleanLogoPath = enterprise.logo
      ? enterprise.logo.replace(/^\/?(storage\/)?(logos\/|profiles\/)?/, '')
      : null;
    const logoUrl = cleanLogoPath
      ? `${api.defaults.baseURL.replace('/api', '')}/${cleanLogoPath}?t=${new Date().getTime()}`
      : null;

    if (logoUrl) {
      try {
        const imgData = await fetch(logoUrl).then((res) => res.blob());
        const reader = new FileReader();
        reader.readAsDataURL(imgData);
        await new Promise((resolve) => {
          reader.onload = () => resolve();
        });
        doc.addImage(
          reader.result,
          'PNG',
          pageWidth - margin - logoSize,
          margin,
          logoSize,
          logoSize
        );
      } catch (e) {
        console.error(`Failed to load logo for ${enterprise.company_name}:`, e);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(229, 57, 53);
    doc.text(`${enterprise.company_name || 'Entreprise'} - ${t('fiche technique')}`, margin, margin + 10);

    doc.setLineWidth(0.5);
    doc.setDrawColor(229, 57, 53);
    doc.roundedRect(margin, margin, contentWidth, pageHeight - 2 * margin, 5, 5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const startY = margin + 30;
    const lineHeight = 8;

    const fieldsmeals = [
      { label: t('nom entreprise'), value: enterprise.company_name || t('non specifie') },
      { label: t('email'), value: enterprise.email || t('non specifie') },
      { label: t('adresse'), value: enterprise.address || t('non specifie') },
      { label: t('ville'), value: enterprise.ville || t('non specifie') },
      { label: t('telephone'), value: enterprise.numero_de_telephone || t('non specifie') },
      { label: t('technologies'), value: enterprise.software_technologies || t('non specifie') },
      { label: t('langages'), value: formatProgrammingLanguage(enterprise.programming_language) },
      { label: t('competences'), value: enterprise.required_skills || t('non specifie') },
      { label: t('cef'), value: enterprise.cef || t('non specifie') },
      { label: t('date creation'), value: enterprise.creation_date || t('non specifie') },
      { label: t('age requis'), value: enterprise.age_range || t('non specifie') },
      { label: t('diplomes'), value: enterprise.required_diplomas || t('non specifie') },
      { label: t('industrie'), value: enterprise.industry || t('non specifie') },
    ];

    fields.forEach((field, index) => {
      const y = startY + index * lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.text(`${field.label}:`, margin + padding, y);
      doc.setFont('helvetica', 'normal');
      const textLines = doc.splitTextToSize(field.value, contentWidth - padding - 50);
      doc.text(textLines, margin + padding + 45, y);
    });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(t('genere par talents elite'), margin + 5, pageHeight - margin - 5);

    doc.save(`${enterprise.company_name || 'entreprise'}_fiche_technique.pdf`);
  };

  const showEnterpriseDetails = (enterprise) => {
    Swal.fire({
      title: `${enterprise.company_name || 'Entreprise'} - ${t('fiche technique')}`,
      html: `
         <div class="text-left text-sm">
          <p><strong>Nom de l’entreprise:</strong> ${enterprise.company_name || '<span class="text-gray-500 italic">Non spécifié</span>'}</p>
          <p><strong>Email:</strong> ${enterprise.email || '<span class="text-gray-500 italic">Non spécifié</span>'}</p>
          <p><strong>Adresse:</strong> ${enterprise.address || '<span class="text-gray-500 italic">Non spécifiée</span>'}</p>
          <p><strong>Ville:</strong> ${enterprise.ville || '<span class="text-gray-500 italic">Non spécifiée</span>'}</p>
          <p><strong>Téléphone:</strong> ${enterprise.numero_de_telephone || '<span class="text-gray-500 italic">Non spécifié</span>'}</p>
          <p><strong>Technologies:</strong> ${enterprise.software_technologies || '<span class="text-gray-500 italic">Non spécifiées</span>'}</p>
          <p><strong>Langages:</strong> ${formatProgrammingLanguage(enterprise.programming_language)}</p>
          <p><strong>Compétences:</strong> ${enterprise.required_skills || '<span class="text-gray-500 italic">Non spécifiées</span>'}</p>
          <p><strong>CEF:</strong> ${enterprise.cef || '<span class="text-gray-500 italic">Non spécifié</span>'}</p>
          <p><strong>Date de création:</strong> ${enterprise.creation_date || '<span class="text-gray-500 italic">Non spécifiée</span>'}</p>
          <p><strong>Âge requis:</strong> ${enterprise.age_range || '<span class="text-gray-500 italic">Non spécifié</span>'}</p>
          <p><strong>Diplômes:</strong> ${enterprise.required_diplomas || '<span class="text-gray-500 italic">Non spécifiés</span>'}</p>
          <p><strong>Industrie:</strong> ${enterprise.industry || '<span class="text-gray-500 italic">Non spécifiée</span>'}</p>
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

  const filteredEnterprises = enterprises.filter((enterprise) => {
    const matchesSearch =
      (enterprise.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enterprise.software_technologies || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = filterIndustry ? enterprise.industry === filterIndustry : true;
    return matchesSearch && matchesIndustry;
  });

  const industries = [...new Set(enterprises.map((e) => e.industry).filter(Boolean))];

  if (!user) {
    return (
      <div
        className={cn(
          'flex justify-center items-center h-screen',
          darkMode ? 'bg-gray-900 text-yellow-100' : 'bg-gray-50 text-gray-900'
        )}
      >
        {t('chargement utilisateur')}
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
            <h1
              className={cn(
                'text-3xl font-bold mb-6',
                darkMode ? 'text-yellow-400' : 'text-gray-900'
              )}
            >
              {t('entreprises collaboratrices')}
            </h1>

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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('rechercher entreprise')}
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
                  {t('industrie')}
                </label>
                <select
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  className={cn(
                    'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                >
                  <option value="">{t('toutes industries')}</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterIndustry('');
                  }}
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

            {loading ? (
              <div
                className={cn(
                  'text-center',
                  darkMode ? 'text-yellow-400' : 'text-gray-600'
                )}
              >
                {t('chargement')}
              </div>
            ) : filteredEnterprises.length === 0 ? (
              <p
                className={cn(
                  'text-center',
                  darkMode ? 'text-yellow-400' : 'text-gray-600'
                )}
              >
                {t('aucune entreprise')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEnterprises.map((enterprise) => (
                  <div
                    key={enterprise.id}
                    className={cn(
                      'rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6',
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    )}
                  >
                    <div className="flex items-center mb-4">
                      {enterprise.logo && enterprise.logo !== '' ? (
                        <img
                          src={`${api.defaults.baseURL.replace('/api', '')}${enterprise.logo}?t=${new Date().getTime()}`}
                          alt={`${enterprise.company_name || 'Entreprise'} logo`}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                          onError={(e) => {
                            e.target.src = '/default-logo.jpg';
                          }}
                        />
                      ) : (
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center mr-4 font-semibold',
                            darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-200 text-gray-900'
                          )}
                        >
                          {getInitials(enterprise.company_name)}
                        </div>
                      )}
                      <h2
                        className={cn(
                          'text-xl font-semibold',
                          darkMode ? 'text-yellow-400' : 'text-gray-900'
                        )}
                      >
                        {enterprise.company_name || 'Entreprise'}
                      </h2>
                    </div>
                    <p
                      className={cn(
                        'text-sm mb-2',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('industrie')}:</span>{' '}
                      {enterprise.industry || t('non specifie')}
                    </p>
                    <p
                      className={cn(
                        'text-sm mb-4',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('technologies')}:</span>{' '}
                      {enterprise.software_technologies || t('non specifie')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => showEnterpriseDetails(enterprise)}
                        className={cn(
                          'flex-1 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                          darkMode
                            ? 'bg-gray-700 text-yellow-100 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        )}
                      >
                        {t('details')}
                      </button>
                      <button
                        onClick={() => generatePDF(enterprise)}
                        className={cn(
                          'flex-1 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                          darkMode
                            ? 'bg-red-600 text-yellow-100 hover:bg-red-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        )}
                      >
                        <Download className="h-4 w-4" />
                        {t('pdf')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {user.role === 'entreprise' && (
              <div className="mt-12">
                <h2
                  className={cn(
                    'text-2xl font-bold mb-6',
                    darkMode ? 'text-yellow-400' : 'text-gray-900'
                  )}
                >
                  {t('notifications')}
                </h2>
                <Notifications user={user} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CollaboratorsEnterprises;