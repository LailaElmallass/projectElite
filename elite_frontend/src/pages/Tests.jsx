import React, { useState, useEffect } from 'react';
import { Check, X, ArrowRight, AlertCircle, Brain, Edit, Trash2, PlusCircle } from 'lucide-react';
import api from '../lib/api';
import { Link, useLocation } from 'react-router-dom';

const Tests = () => {
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    test_id: '',
    question: '',
    options: ['', '', '', ''],
    correct_answer_index: 0
  });
  const [newTest, setNewTest] = useState({
    title: '',
    duration: '',
    description: ''
  });
  const [editQuestion, setEditQuestion] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState(null); // 'question' or 'test'
  const [showQuestions, setShowQuestions] = useState(false); // New state to control questions visibility
  const location = useLocation();
  const isAdmin = localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user')).role === 'admin' 
    : false;

  useEffect(() => {
    fetchTests();
    if (location.state?.showAddForm) {
      setShowAddForm(true);
      setAddMode('question');
      setShowQuestions(false); // Hide questions if adding from navbar
    }
  }, [location]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tests');
      setTests(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des tests :', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (testId) => {
    try {
      setLoading(true);
      const response = await api.get(`/tests/${testId}/questions`);
      setQuestions(response.data.questions || []);
      setShowQuestions(true); // Show questions
      setShowAddForm(false); // Hide add form
      setEditQuestion(null); // Hide edit form
    } catch (error) {
      console.error('Erreur lors de la récupération des questions :', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const startTest = (testId) => {
    setActiveTest(testId);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setFeedback(null);
    fetchQuestions(testId);
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
        const response = await api.post('/tests/submit', {
          test_id: activeTest,
          answers,
        });
        setFeedback(response.data.feedback);
        setShowResults(true);
      } catch (error) {
        console.error('Erreur lors de la soumission du test :', error);
        const errorMessage = error.response?.data?.error || 'Erreur serveur inconnue';
        setFeedback({
          points_forts: ['Erreur lors de la soumission'],
          domaines_d_amélioration: [errorMessage],
          recommandations: ['Vérifiez votre connexion ou contactez un administrateur'],
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
    setShowAddForm(false);
    setAddMode(null);
    setShowQuestions(false);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/tests/questions', newQuestion);
      alert('Question ajoutée avec succès !');
      setNewQuestion({ test_id: '', question: '', options: ['', '', '', ''], correct_answer_index: 0 });
      fetchQuestions(newQuestion.test_id);
      setShowAddForm(false);
      setAddMode(null);
    } catch (error) {
      console.error('Erreur lors de l’ajout de la question :', error);
      alert('Erreur lors de l’ajout de la question.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/tests', newTest);
      alert('Test ajouté avec succès !');
      setNewTest({ title: '', duration: '', description: '' });
      fetchTests();
      setShowAddForm(false);
      setAddMode(null);
    } catch (error) {
      console.error('Erreur lors de l’ajout du test :', error);
      alert('Erreur lors de l’ajout du test.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/tests/questions/${editQuestion.id}`, editQuestion);
      alert('Question modifiée avec succès !');
      fetchQuestions(editQuestion.test_id);
      setEditQuestion(null);
    } catch (error) {
      console.error('Erreur lors de la modification de la question :', error);
      alert('Erreur lors de la modification de la question.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId, testId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette question ?')) {
      try {
        setLoading(true);
        await api.delete(`/tests/questions/${questionId}`);
        alert('Question supprimée avec succès !');
        fetchQuestions(testId);
      } catch (error) {
        console.error('Erreur lors de la suppression de la question :', error);
        alert('Erreur lors de la suppression de la question.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteTest = async (testId) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce test et toutes ses questions ?')) {
      try {
        setLoading(true);
        await api.delete(`/tests/${testId}`);
        alert('Test supprimé avec succès !');
        fetchTests();
        setQuestions([]);
        setShowQuestions(false);
      } catch (error) {
        console.error('Erreur lors de la suppression du test :', error);
        alert('Erreur lors de la suppression du test.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleAddForm = () => {
    setShowAddForm(true);
    setShowQuestions(false); // Hide questions when showing add form
    setEditQuestion(null); // Hide edit form
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 animate-pulse text-lg font-bold tracking-wide">
          Chargement...
        </div>
      </div>
    );
  }

  if (showResults) {
    if (!feedback) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
          <div className="text-yellow-400 animate-pulse text-lg font-bold tracking-wide">
            Chargement du feedback...
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gray-800/90 rounded-xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105">
          <button 
            onClick={backToTests} 
            className="flex items-center text-yellow-400 mb-6 hover:text-yellow-300 transition-colors font-semibold"
          >
            <ArrowRight className="h-5 w-5 mr-2 rotate-180" />
            Retour aux tests
          </button>
          <h1 className="text-3xl font-bold text-red-500 mb-4 tracking-tight">Résultats d'évaluation</h1>
          <p className="text-gray-300 mb-8">Analyse détaillée de vos performances</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-700/80 p-6 rounded-xl shadow-lg border border-gray-600">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
                <Check className="h-6 w-6 mr-2 text-green-400" />
                Points forts
              </h2>
              <ul className="space-y-3">
                {feedback.points_forts?.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="h-6 w-6 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center mr-3">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="text-gray-200">{strength}</span>
                  </li>
                )) || <li className="text-gray-200">Aucun point fort disponible</li>}
              </ul>
            </div>

            <div className="bg-gray-700/80 p-6 rounded-xl shadow-lg border border-gray-600">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
                <AlertCircle className="h-6 w-6 mr-2 text-amber-400" />
                Points à améliorer
              </h2>
              <ul className="space-y-3">
                {feedback?.domaines_d_amélioration?.map((weakness, index) => (
                  <li key={index} className="flex items-start">
                    <span className="h-6 w-6 rounded-full bg-amber-900/50 text-amber-400 flex items-center justify-center mr-3">
                      <X className="h-4 w-4" />
                    </span>
                    <span className="text-gray-200">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gray-700/80 p-6 rounded-xl shadow-lg border border-gray-600 mb-8">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
              <Brain className="h-6 w-6 mr-2 text-red-500" />
              Recommandations
            </h2>
            <ul className="space-y-3">
              {feedback?.recommandations?.map((recommendation, index) => (
                <li key={index} className="flex items-center">
                  <span className="h-6 w-6 rounded-full bg-red-900/50 text-red-500 flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-200">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <button 
              onClick={backToTests} 
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md"
            >
              Retour à la liste des tests
            </button>
          </div>
          
          <div className="mt-12 text-center">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
            >
              Votre tableau de bord
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (activeTest) {
    if (questions.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
          <div className="text-gray-200 text-lg font-medium tracking-wide">
            Aucune question disponible pour ce test.
          </div>
        </div>
      );
    }

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-gray-800/90 rounded-xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105">
          <button 
            onClick={backToTests} 
            className="flex items-center text-yellow-400 mb-6 hover:text-yellow-300 transition-colors font-semibold"
          >
            <ArrowRight className="h-5 w-5 mr-2 rotate-180" />
            Quitter le test
          </button>
          <h1 className="text-3xl font-bold text-red-400 mb-4 tracking-tight">
            {tests.find(t => t.id === activeTest)?.title}
          </h1>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-300">
              Question {currentQuestion + 1} sur {questions.length}
            </span>
            <span className="text-sm font-semibold text-yellow-400">
              {Math.round(progress)}% complété
            </span>
          </div>
          <div className="w-full h-3 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="bg-gray-700/80 p-6 rounded-xl shadow-lg mt-6 border border-gray-600">
            <h2 className="text-xl font-medium text-yellow-400 mb-6 tracking-wide">
              {question?.question || 'Question non disponible'}
            </h2>
            <div className="space-y-4">
              {question?.options?.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleAnswer(question.id, index)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    answers[question.id] === index
                      ? 'border-red-400 bg-red-400/20'
                      : 'border-gray-600 hover:border-yellow-500'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`h-6 w-6 rounded-full border mr-3 flex items-center justify-center ${
                        answers[question.id] === index
                          ? 'border-red-500 bg-red-400 text-white'
                          : 'border-gray-500 hover:border-yellow-500'
                      }`}
                    >
                      {answers[question.id] === index && <Check className="h-4 w-4" />}
                    </div>
                    <span className="text-gray-200">{option}</span>
                  </div>
                </div>
              )) || <p className="text-gray-200">Aucune option disponible</p>}
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={nextQuestion}
              disabled={answers[question?.id] === undefined}
              className="bg-red-400 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold shadow-md"
            >
              {currentQuestion < questions.length -1 ? 'Suivant' : 'Résultats'}
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-red-500 mb-4 tracking-tight drop-shadow-md">
            Tests d'évaluation
          </h1>
          <p className="text-lg text-gray-300 tracking-wide">
            Évaluez vos compétences avec style et précision
          </p>
        </div>
        
        {isAdmin && (
          <div className="text-center mb-8">
            <button
              onClick={toggleAddForm}
              className="bg-red-400 text-white px-6 py-3 rounded-full hover:bg-red-600 transition-all duration-300 font-semibold flex items-center mx-auto shadow-lg transform hover:scale-105"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Ajouter
            </button>
          </div>
        )}

        {tests.length === 0 ? (
          <p className="text-gray-200 text-center text-lg tracking-wide">
            Aucun test disponible actuellement.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tests.map((test) => (
              <div 
                key={test.id} 
                className="bg-gray-800/90 rounded-xl shadow-2xl p-6 transition-all duration-500 hover:shadow-xl hover:scale-105 border border-gray-700"
              >
                <h2 className="text-xl font-semibold text-yellow-400 mb-3 tracking-tight">
                  {test.title}
                </h2>
                <div className="flex items-center text-sm text-gray-400 mb-4">
                  <span className="mr-4">{test.duration}</span>
                  <span>{test.questions_count} questions</span>
                </div>
                <p className="text-sm text-gray-300 mb-6 tracking-wide">
                  {test.description}
                </p>
                <button
                  onClick={() => startTest(test.id)}
                  className={`w-full py-3 px-4 rounded-full font-semibold transition-all duration-300 shadow-md transform hover:scale-105 ${
                    test.completed
                      ? 'bg-gray-600 text-yellow-400 hover:bg-gray-500'
                      : 'bg-red-400 text-white hover:bg-red-400'
                  }`}
                >
                  {test.completed ? 'Refaire' : 'Commencer'}
                </button>
                {test.completed && (
                  <div className="mt-4 flex items-center text-sm text-green-400 font-semibold">
                    <Check className="h-5 w-5 mr-2" />
                    Complété
                  </div>
                )}
                {isAdmin && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => fetchQuestions(test.id)}
                      className="flex-1 py-2 px-4 rounded-full bg-yellow-600 text-white hover:bg-yellow-700 transition-all duration-300 font-semibold shadow-md transform hover:scale-105"
                    >
                      Voir les questions
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="flex-1 py-2 px-4 rounded-full bg-yellow-600 text-white hover:bg-yellow-700 transition-all duration-300 font-semibold flex items-center justify-center shadow-md transform hover:scale-105"
                    >
                      <Trash2 className="h-5 w-5 mr-2" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdmin && showQuestions && questions.length > 0 && (
          <div className="mt-12 bg-gray-800/90 p-6 rounded-xl shadow-2xl border border-gray-700 animate-fadeIn">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-6 tracking-tight">
              Questions du test sélectionné
            </h2>
            <ul className="space-y-4">
              {questions.map((q) => (
                <li key={q.id} className="p-4 border border-gray-600 rounded-lg flex justify-between items-center bg-gray-700/50">
                  <div>
                    <p className="text-yellow-400 font-medium">{q.question}</p>
                    <p className="text-sm text-gray-300">
                      Réponse correcte: <span className="text-green-400">{q.options[q.correct_answer_index]}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditQuestion({ ...q, options: [...q.options] })}
                      className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id, q.test_id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isAdmin && showAddForm && !editQuestion && (
          <div className="mt-12 bg-gray-800/90 p-6 rounded-xl shadow-2xl border border-gray-700 animate-fadeIn">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-6 tracking-tight">
              Ajouter {addMode === 'test' ? 'un test' : 'une question'}
            </h2>
            {!addMode ? (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setAddMode('question')}
                  className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-all duration-300 font-semibold shadow-md transform hover:scale-105"
                >
                  Ajouter une question
                </button>
                <button
                  onClick={() => setAddMode('test')}
                  className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-all duration-300 font-semibold shadow-md transform hover:scale-105"
                >
                  Ajouter un test
                </button>
              </div>
            ) : addMode === 'question' ? (
              <form onSubmit={handleAddQuestion} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 tracking-wide">
                    Test
                  </label>
                  <select
                    value={newQuestion.test_id}
                    onChange={(e) => setNewQuestion({ ...newQuestion, test_id: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                    required
                  >
                    <option value="">Sélectionnez un test</option>
                    {tests.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 tracking-wide">
                    Question
                  </label>
                  <input
                    type="text"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                {newQuestion.options.map((option, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-300 tracking-wide">
                      Option {index + 1}
                    </label>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const updatedOptions = [...newQuestion.options];
                        updatedOptions[index] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: updatedOptions });
                      }}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-300 tracking-wide">
                    Réponse correcte (0-3)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={newQuestion.correct_answer_index}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer_index: parseInt(e.target.value) })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="submit" 
                    className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-all duration-300 font-semibold shadow-md transform hover:scale-105"
                  >
                    Ajouter
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowAddForm(false); setAddMode(null); }}
                    className="bg-gray-600 text-white px-6 py-3 rounded-full hover:bg-gray-500 transition-all duration-300 font-semibold shadow-md transform hover:scale-105"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddTest} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 tracking-wide">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={newTest.title}
                    onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 tracking-wide">
                    Durée
                  </label>
                  <input
                    type="text"
                    value={newTest.duration}
                    onChange={(e) => setNewTest({ ...newTest, duration: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={newTest.description}
                    onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="submit" 
                    className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-all duration-300 font-semibold shadow-md transform hover:scale-105"
                  >
                    Ajouter
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowAddForm(false); setAddMode(null); }}
                    className="bg-gray-600 text-white px-6 py-3 rounded-full hover:bg-gray-500 transition-all duration-300 font-semibold shadow-md transform hover:scale-105"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {isAdmin && editQuestion && (
          <div className="mt-12 bg-gray-800/90 p-6 rounded-xl shadow-2xl border border-gray-700 animate-fadeIn">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-6 tracking-tight">
              Modifier la question
            </h2>
            <form onSubmit={handleEditQuestion} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 tracking-wide">
                  Test
                </label>
                <select
                  value={editQuestion.test_id}
                  onChange={(e) => setEditQuestion({ ...editQuestion, test_id: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                  required
                >
                  <option value="">Sélectionnez un test</option>
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 tracking-wide">
                  Question
                </label>
                <input
                  type="text"
                  value={editQuestion.question}
                  onChange={(e) => setEditQuestion({ ...editQuestion, question: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              {editQuestion.options.map((option, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-300 tracking-wide">
                    Option {index + 1}
                  </label>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const updatedOptions = [...editQuestion.options];
                      updatedOptions[index] = e.target.value;
                      setEditQuestion({ ...editQuestion, options: updatedOptions });
                    }}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-300 tracking-wide">
                  Réponse correcte (0-3)
                </label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={editQuestion.correct_answer_index}
                  onChange={(e) => setEditQuestion({ ...editQuestion, correct_answer_index: parseInt(e.target.value) })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="submit" 
                  className="bg-yellow-500 text-white px-6 py-3 rounded-full hover:bg-yellow-700 transition-all duration-300 font-semibold shadow-md transform hover:scale-105"
                >
                  Modifier
                </button>
                <button 
                  type="button"
                  onClick={() => setEditQuestion(null)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-full hover:bg-gray-500 transition-all duration-300 font-semibold shadow-md transform hover:scale-105"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tests;