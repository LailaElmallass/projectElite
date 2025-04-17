import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, Sun, Moon, Edit, Trash2, PlusCircle } from 'lucide-react';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Swal from 'sweetalert2';

const Tests = ({ user, onLogout, setUser }) => {
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    description: '',
    target_audience: 'etudiant_maroc', // Matches DB default
    is_general: false,
    is_student: null,
    questions: [],
  });
  const navigate = useNavigate();

  const audienceOptions = [
    { value: 'etudiant_maroc', label: 'Étudiants Maroc' },
    { value: 'etudiant_etranger', label: 'Étudiants Étranger' },
    { value: 'entrepreneur', label: 'Entrepreneur' },
    { value: 'salarie_etat', label: 'Salarié Public' },
    { value: 'salarie_prive', label: 'Salarié Privé' },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (user?.is_first_time && user.role !== 'admin') {
      navigate('/test-general');
      return;
    }
    fetchTests();
  }, [user, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tests');
      const fetchedTests = Array.isArray(response.data.data.tests) ? response.data.data.tests : [];
      setTests(fetchedTests);

      if (response.data.data.needs_audience_selection && user.role !== 'admin') {
        Swal.fire({
          icon: 'warning',
          title: 'Profil incomplet',
          text: 'Veuillez compléter votre profil pour accéder aux tests.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
        });
        navigate('/test-general');
      } else if (fetchedTests.length === 0 && user.role !== 'admin') {
        Swal.fire({
          icon: 'info',
          title: 'Aucun test disponible',
          text: 'Aucun test ne correspond à votre profil pour le moment.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      setTests([]);
      if (error.response?.status === 401) {
        onLogout();
        navigate('/signin');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors du chargement des tests.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (testId) => {
    try {
      setLoading(true);
      const response = await api.get(`/tests/${testId}/questions`);
      const fetchedQuestions = response.data.data.questions.map((q) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }));
      if (fetchedQuestions.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Ce test n’a pas de questions disponibles.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }
      setQuestions(fetchedQuestions);
      setActiveTest(testId);
      setCurrentQuestion(0);
      setAnswers({});
      setShowResults(false);
      setFeedback(null);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les questions du test.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const nextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      try {
        setLoading(true);
        if (Object.keys(answers).length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Aucune réponse',
            text: 'Veuillez répondre à au moins une question avant de soumettre.',
            toast: true,
            position: 'top',
            timer: 3000,
            showConfirmButton: false,
          });
          return;
        }
        const response = await api.post('/tests/submit', {
          test_id: activeTest,
          answers,
        });
        setFeedback(response.data.data.feedback);
        setShowResults(true);
      } catch (error) {
        console.error('Error submitting test:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.response?.data?.message || 'Erreur lors de la soumission du test.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
        });
        setFeedback({
          points_forts: ['Effort fourni'],
          domaines_d_amélioration: ['Erreur réseau détectée'],
          recommandations: ['Vérifiez votre connexion et réessayez'],
        });
        setShowResults(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const backToTests = () => {
    setActiveTest(null);
    setShowResults(false);
    setFeedback(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers({});
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { question: '', options: ['', '', '', ''], correct_answer_index: 0 },
      ],
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const validateFormData = () => {
    if (!isEditing && (!formData.title?.trim() || !formData.duration?.trim() || !formData.description?.trim())) {
      return 'Le titre, la durée et la description sont requis pour créer un test.';
    }
    if (formData.is_general && (formData.is_student === null || formData.is_student === undefined)) {
      return 'Le statut étudiant doit être défini (Oui ou Non) pour les tests généraux.';
    }
    const validAudiences = ['etudiant_maroc', 'etudiant_etranger', 'entrepreneur', 'salarie_etat', 'salarie_prive'];
    if (!formData.target_audience || !validAudiences.includes(formData.target_audience)) {
      console.log('Validation failed: Invalid target_audience', { target_audience: formData.target_audience });
      return 'Une audience cible valide est requise.';
    }
    if (!formData.questions?.length) {
      return 'Au moins une question est requise.';
    }
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.question?.trim()) {
        return `La question ${i + 1} est vide.`;
      }
      const validOptions = q.options?.filter((opt) => opt?.trim()) || [];
      if (validOptions.length < 2) {
        return `La question ${i + 1} doit avoir au moins 2 options non vides.`;
      }
      const correctIndex = Number(q.correct_answer_index);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= validOptions.length) {
        return `L’index de la réponse correcte pour la question ${i + 1} est invalide (doit être entre 0 et ${validOptions.length - 1}).`;
      }
    }
    return null;
  };

  const handleFormChange = (e, index = null, optionIndex = null) => {
    const { name, value, type, checked } = e.target;
    if (name === 'is_general') {
      setFormData({
        ...formData,
        is_general: checked,
        target_audience: checked ? 'etudiant_maroc' : formData.target_audience || 'etudiant_maroc',
        is_student: checked ? formData.is_student ?? false : null,
      });
      console.log('is_general changed:', { is_general: checked, target_audience: checked ? 'etudiant_maroc' : formData.target_audience || 'etudiant_maroc' });
    } else if (name === 'is_student') {
      setFormData({
        ...formData,
        is_student: value === 'true' ? true : value === 'false' ? false : null,
      });
    } else if (name === 'target_audience') {
      const newValue = value || 'etudiant_maroc';
      setFormData({
        ...formData,
        target_audience: newValue,
      });
      console.log('target_audience changed:', { old: formData.target_audience, new: newValue });
    } else if (index !== null && optionIndex !== null) {
      const newQuestions = [...formData.questions];
      newQuestions[index].options[optionIndex] = value;
      setFormData({ ...formData, questions: newQuestions });
    } else if (index !== null && name === 'question') {
      const newQuestions = [...formData.questions];
      newQuestions[index][name] = value;
      setFormData({ ...formData, questions: newQuestions });
    } else if (index !== null && name === 'correct_answer_index') {
      const newQuestions = [...formData.questions];
      newQuestions[index][name] = parseInt(value) || 0;
      setFormData({ ...formData, questions: newQuestions });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value === '' ? null : value,
      });
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log('Form data before validation:', JSON.stringify(formData, null, 2));
      const validationError = validateFormData();
      if (validationError) {
        console.log('Validation error:', validationError);
        Swal.fire({
          icon: 'error',
          title: 'Erreur de validation',
          text: validationError,
          toast: true,
          position: 'top',
          timer: 5000,
          showConfirmButton: false,
        });
        return;
      }

      const payload = {
        title: formData.title?.trim() || undefined,
        duration: formData.duration?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        is_general: !!formData.is_general,
        target_audience: formData.target_audience || 'etudiant_maroc',
        is_student: formData.is_general ? (formData.is_student ?? false) : null,
        questions: formData.questions
          .map((q) => {
            const question = {
              question: q.question?.trim() || undefined,
              options: q.options?.filter((opt) => opt?.trim()) || [],
              correct_answer_index: Number(q.correct_answer_index) || 0,
            };
            if (q.id && Number.isInteger(Number(q.id)) && Number(q.id) > 0) {
              question.id = Number(q.id);
            }
            return question;
          })
          .filter((q) => q.question && q.options.length >= 2),
      };

      console.log('Submitting payload:', JSON.stringify(payload, null, 2));

      if (isEditing) {
        const response = await api.put(`/tests/${isEditing}`, payload);
        Swal.fire({
          icon: 'success',
          title: 'Test mis à jour',
          text: 'Le test a été mis à jour avec succès.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
        });
        setIsEditing(null);
      } else {
        const response = await api.post('/tests', payload);
        Swal.fire({
          icon: 'success',
          title: 'Test créé',
          text: 'Le test a été créé avec succès.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
        });
      }
      setIsAdding(false);
      setFormData({
        title: '',
        duration: '',
        description: '',
        target_audience: 'etudiant_maroc',
        is_general: false,
        is_student: null,
        questions: [],
      });
      fetchTests();
    } catch (error) {
      console.error('Error saving test:', error);
      let errorMessage = 'Erreur lors de la sauvegarde du test.';
      if (error.response?.status === 422) {
        const errors = error.response.data.errors || [];
        errorMessage = Array.isArray(errors) ? errors.join('\n') : error.response.data.message || 'Validation échouée';
        console.log('Validation errors:', errors);
      } else if (error.response?.status === 500) {
        errorMessage = error.response.data.message || 'Erreur serveur lors de la mise à jour du test.';
        console.log('Server error details:', error.response.data);
      } else if (error.response?.status === 403) {
        errorMessage = 'Accès administrateur requis.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expirée, veuillez vous reconnecter.';
        onLogout();
        navigate('/signin');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
        toast: true,
        position: 'top',
        timer: 5000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTest = async (testId) => {
    try {
      setLoading(true);
      const response = await api.get(`/tests/${testId}`);
      const test = response.data.data.test;
      const isGeneral = !!test.is_general;
      const targetAudience = test.target_audience || 'etudiant_maroc';
      setFormData({
        title: test.title || '',
        duration: test.duration || '',
        description: test.description || '',
        target_audience: targetAudience,
        is_general: isGeneral,
        is_student: isGeneral ? (test.is_student ?? false) : null,
        questions: Array.isArray(test.questions)
          ? test.questions.map((q) => ({
              id: q.id,
              question: q.question || '',
              options: Array.isArray(q.options) ? q.options.concat(['', '']).slice(0, 4) : ['', '', '', ''],
              correct_answer_index: Number(q.correct_answer_index) || 0,
            }))
          : [{ question: '', options: ['', '', '', ''], correct_answer_index: 0 }],
      });
      console.log('Form data after edit fetch:', {
        target_audience: targetAudience,
        is_general: isGeneral,
      });
      setIsEditing(testId);
      setIsAdding(true);
    } catch (error) {
      console.error('Error fetching test for edit:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors du chargement du test pour modification.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    const result = await Swal.fire({
      title: 'Confirmer la suppression',
      text: 'Voulez-vous vraiment supprimer ce test ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await api.delete(`/tests/${testId}`);
        setTests(tests.filter((test) => test.id !== testId));
        Swal.fire({
          icon: 'success',
          title: 'Test supprimé',
          text: 'Le test a été supprimé avec succès.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error deleting test:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la suppression.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black">
        <div className="text-elite-red-500 dark:text-elite-red-400 animate-pulse text-xl font-semibold">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black">
        <div className="text-elite-red-500 dark:text-elite-red-400 text-xl font-semibold">Veuillez vous connecter pour accéder aux tests</div>
      </div>
    );
  }

  if (isAdding || isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-elite-red-500 dark:text-elite-red-400 mb-6">
            {isEditing ? 'Modifier le Test' : 'Ajouter un Nouveau Test'}
          </h1>
          <form onSubmit={handleSubmitForm} className="space-y-6">
            <div>
              <label className="block text-elite-black-700 dark:text-elite-black-300">Titre</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleFormChange}
                className="w-full p-3 border rounded-md dark:bg-elite-black-700 dark:border-elite-black-600 dark:text-elite-yellow-100"
              />
            </div>
            <div>
              <label className="block text-elite-black-700 dark:text-elite-black-300">Durée</label>
              <input
                type="text"
                name="duration"
                value={formData.duration || ''}
                onChange={handleFormChange}
                className="w-full p-3 border rounded-md dark:bg-elite-black-700 dark:border-elite-black-600 dark:text-elite-yellow-100"
              />
            </div>
            <div>
              <label className="block text-elite-black-700 dark:text-elite-black-300">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleFormChange}
                className="w-full p-3 border rounded-md dark:bg-elite-black-700 dark:border-elite-black-600 dark:text-elite-yellow-100"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_general"
                  checked={formData.is_general}
                  onChange={handleFormChange}
                  className="mr-2"
                />
                <span className="text-elite-black-700 dark:text-elite-black-300">Test Général</span>
              </label>
            </div>
            {formData.is_general ? (
              <div>
                <label className="block text-elite-black-700 dark:text-elite-black-300">Pour les étudiants ?</label>
                <select
                  name="is_student"
                  value={formData.is_student === null ? '' : formData.is_student.toString()}
                  onChange={handleFormChange}
                  className="w-full p-3 border rounded-md dark:bg-elite-black-700 dark:border-elite-black-600 dark:text-elite-yellow-100"
                  required
                >
                  <option value="" disabled>Sélectionner</option>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-elite-black-700 dark:text-elite-black-300">Audience cible</label>
                <select
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleFormChange}
                  className="w-full p-3 border rounded-md dark:bg-elite-black-700 dark:border-elite-black-600 dark:text-elite-yellow-100"
                  required
                >
                  {audienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-elite-yellow-600 dark:text-elite-yellow-400 mb-4">Questions</h3>
              {formData.questions.map((q, index) => (
                <div key={index} className="border p-4 rounded-md mb-4 dark:border-elite-black-600">
                  <div>
                    <label className="block text-elite-black-700 dark:text-elite-black-300">Question {index + 1}</label>
                    <input
                      type="text"
                      name="question"
                      value={q.question}
                      onChange={(e) => handleFormChange(e, index)}
                      className="w-full p-3 border rounded-md dark:bg-elite-black-700 dark:border-elite-black-600 dark:text-elite-yellow-100"
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-elite-black-700 dark:text-elite-black-300">Options</label>
                    {q.options.map((option, optIndex) => (
                      <input
                        key={optIndex}
                        type="text"
                        value={option}
                        onChange={(e) => handleFormChange(e, index, optIndex)}
                        className="w-full p-3 border rounded-md mb-2 dark:bg-elite-black-700 dark:border-elite-black-600 dark:text-elite-yellow-100"
                        placeholder={`Option ${optIndex + 1}`}
                      />
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-elite-black-700 dark:text-elite-black-300">Index de la réponse correcte</label>
                    <input
                      type="number"
                      name="correct_answer_index"
                      value={q.correct_answer_index}
                      onChange={(e) => handleFormChange(e, index)}
                      className="w-full p-3 border rounded-md dark:bg-elite-black-700 dark:border-elite-black-600 dark:text-elite-yellow-100"
                      min="0"
                      max={q.options.filter((opt) => opt.trim() !== '').length - 1}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="mt-2 text-elite-red-500 hover:text-elite-red-600"
                  >
                    Supprimer la question
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center text-elite-yellow-600 dark:text-elite-yellow-400 hover:text-elite-yellow-700"
              >
                <PlusCircle className="h-5 w-5 mr-2" /> Ajouter une question
              </button>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(null);
                  setFormData({
                    title: '',
                    duration: '',
                    description: '',
                    target_audience: 'etudiant_maroc',
                    is_general: false,
                    is_student: null,
                    questions: [],
                  });
                }}
                className="bg-elite-black-500 text-white px-6 py-3 rounded-lg hover:bg-elite-black-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showResults && feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black py-12 px-4 sm:px-6 lg:px-8 relative">
        
        <div className="max-w-4xl mx-auto bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-elite-red-500 dark:text-elite-red-400 mb-8">Résultats de Votre Test</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-elite-black-50 dark:bg-elite-black-700 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-elite-yellow-600 dark:text-elite-yellow-400 mb-4 flex items-center">
                <Check className="h-6 w-6 mr-2 text-elite-red-500 dark:text-elite-red-400" />
                Vos Points Forts
              </h2>
              <ul className="space-y-3">
                {feedback.points_forts?.map((strength, index) => (
                  <li key={index} className="flex items-start text-elite-black-700 dark:text-elite-black-300">
                    <Check className="h-5 w-5 mr-2 text-elite-yellow-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-elite-black-50 dark:bg-elite-black-700 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-elite-yellow-600 dark:text-elite-yellow-400 mb-4 flex items-center">
                <ArrowRight className="h-6 w-6 mr-2 text-elite-red-500 dark:text-elite-red-400" />
                Axes d’Amélioration
              </h2>
              <ul className="space-y-3">
                {feedback.domaines_d_amélioration?.map((weakness, index) => (
                  <li key={index} className="flex items-start text-elite-black-700 dark:text-elite-black-300">
                    <ArrowRight className="h-5 w-5 mr-2 text-elite-yellow-500" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-elite-black-50 dark:bg-elite-black-700 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-elite-yellow-600 dark:text-elite-yellow-400 mb-4 flex items-center">
              <Check className="h-6 w-6 mr-2 text-elite-red-500 dark:text-elite-red-400" />
              Nos Conseils Pour Vous
            </h2>
            <p className="text-elite-black-600 dark:text-elite-black-300 mb-4">
              Voici quelques suggestions personnalisées pour vous guider dans vos prochaines étapes :
            </p>
            <ul className="space-y-3">
              {feedback.recommandations?.map((rec, index) => (
                <li key={index} className="flex items-center text-elite-black-700 dark:text-elite-black-300">
                  <span className="h-6 w-6 rounded-full bg-elite-red-100 dark:bg-elite-red-500/20 text-elite-red-500 dark:text-elite-red-400 flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-center mt-8">
            <button
              onClick={backToTests}
              className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 transition-colors"
            >
              Retour aux Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTest && questions.length > 0) {
    const question = questions[currentQuestion];
    const totalQuestions = questions.length;
    const progress = ((currentQuestion + 1) / totalQuestions) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black py-12 px-4 sm:px-6 lg:px-8 relative">
        
        <div className="max-w-3xl mx-auto bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-elite-red-500 dark:text-elite-red-400 mb-6">
            Test : {tests.find((t) => t.id === activeTest)?.title || 'Test'}
          </h1>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-elite-black-600 dark:text-elite-black-300">
              Question {currentQuestion + 1} sur {totalQuestions}
            </span>
            <span className="text-sm font-semibold text-elite-yellow-600 dark:text-elite-yellow-400">
              {Math.round(progress)}% complété
            </span>
          </div>
          <div className="w-full h-3 bg-elite-black-200 dark:bg-elite-black-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-elite-red-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="bg-elite-black-50 dark:bg-elite-black-700 p-6 rounded-xl mt-6">
            <h2 className="text-xl font-medium text-elite-yellow-600 dark:text-elite-yellow-400 mb-6">
              {question?.question || 'Question non disponible'}
            </h2>
            <div className="space-y-4">
              {question?.options?.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleAnswer(question.id, index)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    answers[question.id] === index
                      ? 'border-elite-red-500 bg-elite-red-100 dark:bg-elite-red-500/20'
                      : 'border-elite-black-300 dark:border-elite-black-600 hover:border-elite-red-500'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`h-6 w-6 rounded-full border mr-3 flex items-center justify-center ${
                        answers[question.id] === index
                          ? 'border-elite-red-500 bg-elite-red-500 text-white'
                          : 'border-elite-black-400 dark:border-elite-black-500 hover:border-elite-red-500'
                      }`}
                    >
                      {answers[question.id] === index && <Check className="h-4 w-4" />}
                    </div>
                    <span className="text-elite-black-700 dark:text-elite-black-300">{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={nextQuestion}
              disabled={answers[question?.id] === undefined}
              className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {currentQuestion < questions.length - 1 ? 'Suivant' : 'Terminer'}
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          onLogout={onLogout}
        />
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-elite-red-500 dark:text-elite-red-400">Tests Disponibles</h1>
            {user.role === 'admin' && (
              <button
                onClick={() => setIsAdding(true)}
                className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 transition-colors flex items-center"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Ajouter un Test
              </button>
            )}
          </div>
          {tests.length === 0 ? (
            <div className="bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-8 text-center">
              <h2 className="text-xl font-semibold text-elite-black-700 dark:text-elite-black-300">
                Aucun test disponible
              </h2>
              <p className="text-elite-black-500 dark:text-elite-black-400 mt-2">
                {user.role === 'admin'
                  ? 'Créez un nouveau test pour commencer.'
                  : user.is_first_time
                  ? 'Veuillez compléter le test général pour accéder aux tests adaptés à votre profil.'
                  : 'Aucun test ne correspond à votre profil pour le moment.'}
              </p>
              {user.role !== 'admin' && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/test-general')}
                    className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 transition-colors mr-4"
                  >
                    Aller au Test Général
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-elite-black-500 text-white px-6 py-3 rounded-lg hover:bg-elite-black-600 transition-colors"
                  >
                    Retour au Tableau de Bord
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
                >
                  <h2 className="text-xl font-semibold text-elite-yellow-600 dark:text-elite-yellow-400 mb-2">
                    {test.title}
                  </h2>
                  <p className="text-elite-black-600 dark:text-elite-black-300 mb-4">{test.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-elite-black-500 dark:text-elite-black-400">
                      <p>Durée : {test.duration}</p>
                      <p>Questions : {test.questions_count || 0}</p>
                      {test.is_general ? (
                        <p>Pour : {test.is_student ? 'Étudiants' : 'Non-étudiants'}</p>
                      ) : (
                        <p>Audience : {audienceOptions.find((opt) => opt.value === test.target_audience)?.label || 'Non spécifié'}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startTest(test.id)}
                        className="bg-elite-red-500 text-white px-4 py-2 rounded-lg hover:bg-elite-red-600 transition-colors"
                      >
                        Commencer
                      </button>
                      {user.role === 'admin' && (
                        <>
                          <button
                            onClick={() => handleEditTest(test.id)}
                            className="p-2 rounded-full bg-elite-yellow-200 dark:bg-elite-yellow-500/20 text-elite-yellow-600 dark:text-elite-yellow-400 hover:bg-elite-yellow-300 dark:hover:bg-elite-yellow-500/30 transition-colors"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="p-2 rounded-full bg-elite-red-200 dark:bg-elite-red-500/20 text-elite-red-600 dark:text-elite-red-400 hover:bg-elite-red-300 dark:hover:bg-elite-red-500/30 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tests;