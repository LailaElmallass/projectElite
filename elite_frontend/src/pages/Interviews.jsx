
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import { Search, Calendar, CheckCircle, UserPlus } from 'lucide-react';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import InterviewForm from '../components/InterviewForm';
import Swal from 'sweetalert2';

const Interviews = ({ user, isLoading, onLogout }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [interviews, setInterviews] = useState([]);
  const [appliedInterviews, setAppliedInterviews] = useState(new Set());
  const [candidates, setCandidates] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  const fetchCandidates = useCallback(
    async (interviewId) => {
      try {
        const response = await api.get(`/interviews/${interviewId}/candidates`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setCandidates((prev) => ({ ...prev, [interviewId]: response.data }));
      } catch (err) {
        if (err.response?.status === 403) {
          setCandidates((prev) => ({ ...prev, [interviewId]: [] }));
        } else {
          setError(t('erreur chargement candidats'));
          Swal.fire({
            icon: 'error',
            title: t('erreur'),
            text: t('erreur chargement candidats'),
            customClass: {
              popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
            },
          });
        }
      }
    },
    [darkMode, t]
  );

  const fetchInterviews = useCallback(
    async () => {
      if (!user || !user.id || !user.role || !['admin', 'entreprise', 'utilisateur', 'coach'].includes(user.role)) {
        setError(t('utilisateur non valide'));
        setLoading(false);
        return;
      }
      if (hasFetchedRef.current) {
        setLoading(false);
        return;
      }
      try {
        hasFetchedRef.current = true;
        setLoading(true);
        const endpoint = user.role === 'admin' ? '/all-interviews' : '/interviews';
        const response = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response format: Expected an array');
        }
        setInterviews(response.data);
        if (user.role === 'admin') {
          response.data.forEach((interview) => fetchCandidates(interview.id));
        } else if (user.role === 'entreprise') {
          response.data.forEach((interview) => {
            if (interview.user_id === user.id) {
              fetchCandidates(interview.id);
            } else {
              setCandidates((prev) => ({ ...prev, [interview.id]: [] }));
            }
          });
        } else {
          response.data.forEach((interview) => {
            setCandidates((prev) => ({ ...prev, [interview.id]: [] }));
          });
        }
      } catch (err) {
        setError(t('erreur chargement entretiens'));
        if (err.response?.status === 401) {
          onLogout(() => navigate('/signin'));
        }
      } finally {
        setLoading(false);
      }
    },
    [user, onLogout, navigate, fetchCandidates, t]
  );

  const fetchAppliedInterviews = useCallback(
    async () => {
      try {
        const response = await api.get('/user/interviews/applied', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAppliedInterviews(new Set(response.data.map((interview) => interview.id)));
      } catch (err) {
        setError(t('erreur chargement candidatures'));
      }
    },
    [t]
  );

  useEffect(() => {
    if (!isLoading && user && user.id && user.role) {
      fetchInterviews();
      if (user.role !== 'admin' && user.role !== 'entreprise') {
        fetchAppliedInterviews();
      }
    }
  }, [isLoading, user, fetchInterviews, fetchAppliedInterviews]);

  const handleConfirm = async (id) => {
    try {
      await api.put(
        `/interviews/${id}/confirm`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      hasFetchedRef.current = false;
      fetchInterviews();
      Swal.fire({
        icon: 'success',
        title: t('succes'),
        text: t('entretien confirme'),
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (err) {
      setError(t('erreur confirmation'));
      Swal.fire({
        icon: 'error',
        title: t('erreur'),
        text: t('erreur confirmation'),
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    }
  };

  const handleApply = async (id) => {
    try {
      await api.post(
        `/interviews/${id}/apply`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setAppliedInterviews((prev) => new Set([...prev, id]));
      setError(null);
      Swal.fire({
        icon: 'success',
        title: t('succes'),
        text: t('candidature envoyee'),
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || t('erreur candidature'));
      Swal.fire({
        icon: 'error',
        title: t('erreur'),
        text: err.response?.data?.message || t('erreur candidature'),
        customClass: {
          popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
        },
      });
    }
  };

  const handleAddInterview = (newInterview) => {
    setInterviews([...interviews, newInterview]);
    setIsModalOpen(false);
    hasFetchedRef.current = false;
    Swal.fire({
      icon: 'success',
      title: t('succes'),
      text: t('entretien cree'),
      timer: 1500,
      showConfirmButton: false,
      customClass: {
        popup: darkMode ? 'dark-swal bg-gray-800 text-yellow-100' : 'bg-white text-gray-900',
      },
    });
  };

  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch =
      (interview.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (interview.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? interview.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  if (loading || isLoading) {
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

  if (!user || !user.id || !user.role) {
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
            <div className="flex justify-between items-center mb-6">
              <h1
                className={cn(
                  'text-3xl font-bold',
                  darkMode ? 'text-yellow-400' : 'text-gray-900'
                )}
              >
                {t('entretiens')}
              </h1>
              {(user.role === 'entreprise' || user.role === 'admin') && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={cn(
                    'flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200',
                    darkMode ? 'hover:bg-red-500' : 'hover:bg-red-700'
                  )}
                >
                  <UserPlus className="h-5 w-5" />
                  {t('ajouter entretien')}
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('rechercher entretien')}
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
                  {t('statut')}
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={cn(
                    'w-full rounded-md shadow-sm focus:outline-none focus:ring-2 py-2 px-3',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-yellow-100 focus:ring-yellow-400'
                      : 'border-gray-300 text-gray-900 focus:ring-red-600'
                  )}
                >
                  <option value="">{t('tous statuts')}</option>
                  <option value="pending">{t('en attente')}</option>
                  <option value="confirmed">{t('confirme')}</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
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
            ) : filteredInterviews.length === 0 ? (
              <p
                className={cn(
                  'text-center',
                  darkMode ? 'text-yellow-400' : 'text-gray-600'
                )}
              >
                {t('aucun entretien')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className={cn(
                      'rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6',
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    )}
                  >
                    <h3
                      className={cn(
                        'text-xl font-semibold mb-2',
                        darkMode ? 'text-yellow-400' : 'text-gray-900'
                      )}
                    >
                      {interview.title}
                    </h3>
                    <p
                      className={cn(
                        'mb-4 line-clamp-3',
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      )}
                    >
                      {interview.description}
                    </p>
                    <p
                      className={cn(
                        'text-sm mb-1',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('date')}:</span>{' '}
                      {new Date(interview.date).toLocaleDateString('fr-FR')}
                    </p>
                    <p
                      className={cn(
                        'text-sm mb-1',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('audience cible')}:</span>{' '}
                      {interview.target_audience || t('non specifie')}
                    </p>
                    <p
                      className={cn(
                        'text-sm mb-4',
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      )}
                    >
                      <span className="font-medium">{t('statut')}:</span>{' '}
                      {interview.status === 'pending' ? t('en attente') : t('confirme')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user.role !== 'admin' &&
                        user.role !== 'entreprise' &&
                        interview.status === 'confirmed' && (
                          <button
                            onClick={() => handleApply(interview.id)}
                            disabled={appliedInterviews.has(interview.id)}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                              appliedInterviews.has(interview.id)
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : darkMode
                                ? 'bg-red-600 text-yellow-100 hover:bg-red-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            )}
                          >
                            <UserPlus className="h-4 w-4" />
                            {appliedInterviews.has(interview.id)
                              ? t('candidature envoyee')
                              : t('postuler')}
                          </button>
                        )}
                      {user.role === 'admin' && interview.status === 'pending' && (
                        <button
                          onClick={() => handleConfirm(interview.id)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                            darkMode
                              ? 'bg-yellow-700 text-gray-900 hover:bg-yellow-600'
                              : 'bg-yellow-500 text-white hover:bg-yellow-600'
                          )}
                        >
                          <CheckCircle className="h-4 w-4" />
                          {t('confirmer')}
                        </button>
                      )}
                    </div>
                    {(user.role === 'admin' || (user.role === 'entreprise' && interview.user_id === user.id)) && (
                      <div className="mt-4">
                        <h4
                          className={cn(
                            'text-md font-semibold mb-2',
                            darkMode ? 'text-yellow-400' : 'text-gray-900'
                          )}
                        >
                          {t('candidatures')}
                        </h4>
                        {candidates[interview.id] !== undefined ? (
                          candidates[interview.id].length === 0 ? (
                            <p
                              className={cn(
                                'text-sm',
                                darkMode ? 'text-gray-300' : 'text-gray-500'
                              )}
                            >
                              {t('aucune candidature')}
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {candidates[interview.id].map((candidate) => (
                                <li
                                  key={candidate.id}
                                  className={cn(
                                    'p-3 rounded-lg',
                                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                                  )}
                                >
                                  <p>
                                    <strong>{t('nom')}:</strong> {candidate.nomComplet}
                                  </p>
                                  <p>
                                    <strong>{t('email')}:</strong> {candidate.email}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )
                        ) : (
                          <p
                            className={cn(
                              'text-sm',
                              darkMode ? 'text-gray-300' : 'text-gray-500'
                            )}
                          >
                            {t('chargement candidatures')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Transition show={isModalOpen} as={React.Fragment}>
              <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
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
                          {t('ajouter entretien')}
                        </Dialog.Title>
                        <InterviewForm
                          user={user}
                          onSave={handleAddInterview}
                          onCancel={() => setIsModalOpen(false)}
                          darkMode={darkMode}
                        />
                      </Dialog.Panel>
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

export default Interviews;
