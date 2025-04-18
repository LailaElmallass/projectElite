import React, { useState, useEffect, useRef } from 'react';
import { Check, ArrowRight, Brain, Sun, Moon } from 'lucide-react';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const TestGeneral = ({ user, onLogout, setUser, toggleTheme, isDarkMode }) => {
    const [generalTests, setGeneralTests] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);
    const [retryLoading, setRetryLoading] = useState(false);
    const [needsStudentSelection, setNeedsStudentSelection] = useState(false);
    const navigate = useNavigate();
    const isMounted = useRef(true);
    const fetchController = useRef(null);

    useEffect(() => {
        isMounted.current = true;
        if (!user) {
            console.log('No user, redirecting to signin');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/signin');
            return;
        }
        if (!user.is_first_time) {
            console.log('Not first-time user, redirecting to dashboard');
            navigate('/dashboard');
            return;
        }
        if (user.is_student === null || user.is_student === undefined) {
            console.log('User needs student selection', { user_id: user.id });
            setNeedsStudentSelection(true);
        } else {
            fetchGeneralTests();
        }

        return () => {
            isMounted.current = false;
            if (fetchController.current) {
                fetchController.current.abort();
            }
        };
    }, [user, navigate]);

    const fetchGeneralTests = async (retries = 3) => {
        if (!isMounted.current) return;
        try {
            setLoading(true);
            setGeneralTests([]);
            setQuestions([]);
            localStorage.removeItem('no_tests_reason');

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Aucun jeton d’authentification trouvé');
            }

            fetchController.current = new AbortController();
            const response = await api.get('/tests/general', {
                headers: { Authorization: `Bearer ${token}` },
                signal: fetchController.current.signal,
            });

            console.log('Réponse API tests généraux', {
                success: response.data.success,
                tests: response.data.data.tests,
                needs_student_selection: response.data.data.needs_student_selection,
                message: response.data.message,
                reason: response.data.errors?.reason,
            });

            if (!isMounted.current) return;

            const tests = response.data.data.tests || [];
            setGeneralTests(tests);

            if (response.data.data.needs_student_selection) {
                console.log('Sélection du statut étudiant requise');
                setNeedsStudentSelection(true);
                setQuestions([]);
            } else if (tests.length > 0 && tests[0].questions.length > 0) {
                console.log('Tests trouvés, définition des questions', { test_id: tests[0].id });
                setNeedsStudentSelection(false);
                const parsedQuestions = tests[0].questions
                    .map((q) => {
                        try {
                            const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                            if (!Array.isArray(options) || options.length < 2) {
                                console.error('Options invalides pour la question', { question: q });
                                return null;
                            }
                            return { ...q, options };
                        } catch (e) {
                            console.error('Erreur lors du parsing des options', { question: q, error: e });
                            return null;
                        }
                    })
                    .filter(Boolean);
                setQuestions(parsedQuestions);
                console.log('Questions définies', {
                    question_count: parsedQuestions.length,
                    test_id: tests[0].id,
                    question_ids: parsedQuestions.map(q => q.id),
                });
                if (parsedQuestions.length === 0) {
                    console.warn('Aucune question valide après parsing', { tests });
                    localStorage.setItem('no_tests_reason', 'no_valid_questions');
                    Swal.fire({
                        icon: 'info',
                        title: 'Aucun test disponible',
                        text: 'Les questions du test sont invalides. Contactez l’administrateur.',
                        toast: true,
                        position: 'top',
                        timer: 5000,
                        showConfirmButton: false,
                    });
                }
            } else {
                console.warn('Aucun test ou question valide trouvé', { tests });
                setNeedsStudentSelection(false);
                setQuestions([]);
                localStorage.setItem('no_tests_reason', response.data.errors?.reason || 'no_matching_tests');
                Swal.fire({
                    icon: 'info',
                    title: 'Aucun test disponible',
                    text: `Aucun test général ne correspond à votre profil (${user.is_student ? 'étudiant' : 'non-étudiant'}). Contactez l'administrateur ou réessayez plus tard.`,
                    toast: true,
                    position: 'top',
                    timer: 5000,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Requête annulée');
                return;
            }
            console.error('Erreur lors de la récupération des tests généraux:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            if (!isMounted.current) return;

            if (error.response?.status === 401) {
                console.log('Non autorisé, suppression du jeton et redirection vers signin');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                onLogout();
                navigate('/signin');
                return;
            }
            if (retries > 0) {
                console.log(`Nouvelle tentative de fetchGeneralTests, ${retries} essais restants`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return fetchGeneralTests(retries - 1);
            }
            setGeneralTests([]);
            setQuestions([]);
            setNeedsStudentSelection(false);
            localStorage.setItem('no_tests_reason', error.response?.status === 401 ? 'auth_error' : 'network_error');
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: error.response?.data?.message || 'Erreur lors du chargement des tests généraux. Veuillez vérifier votre connexion et réessayer.',
                toast: true,
                position: 'top',
                timer: 5000,
                showConfirmButton: false,
            });
        } finally {
            if (isMounted.current) {
                setLoading(false);
                fetchController.current = null;
            }
        }
    };

    const handleStudentSelection = async (isStudent) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.post(
                '/users/student-status',
                { is_student: isStudent },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedUser = response.data.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setNeedsStudentSelection(false);
            await fetchGeneralTests();
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut étudiant:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Erreur lors de la mise à jour du statut étudiant. Veuillez réessayer.',
                toast: true,
                position: 'top',
                timer: 5000,
                showConfirmButton: false,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId, optionIndex) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionIndex,
        }));
        console.log('Réponse enregistrée', { questionId, optionIndex, answers: { ...answers, [questionId]: optionIndex } });
    };

    const nextQuestion = async () => {
        if (currentQuestion < questions.length - 1) {
            if (answers[questions[currentQuestion].id] === undefined) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Réponse requise',
                    text: 'Veuillez sélectionner une réponse avant de passer à la question suivante.',
                    toast: true,
                    position: 'top',
                    timer: 3000,
                    showConfirmButton: false,
                });
                return;
            }
            setCurrentQuestion(currentQuestion + 1);
        } else {
            if (Object.keys(answers).length < questions.length) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Réponses incomplètes',
                    text: 'Veuillez répondre à toutes les questions avant de soumettre le test.',
                    toast: true,
                    position: 'top',
                    timer: 3000,
                    showConfirmButton: false,
                });
                return;
            }
            if (!generalTests[0]?.id) {
                console.error('Aucun ID de test disponible', { generalTests });
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: 'Impossible de soumettre le test : ID du test manquant.',
                    toast: true,
                    position: 'top',
                    timer: 5000,
                    showConfirmButton: false,
                });
                return;
            }
            console.log('Soumission du test depuis nextQuestion', {
                testId: generalTests[0].id,
                answers,
            });
            await submitTest(generalTests[0].id);
        }
    };

    const submitTest = async (testId) => {
        try {
            setLoading(true);
            console.log('submitTest appelé', { testId, answers: JSON.stringify(answers) });

            if (!testId) {
                throw new Error('L’ID du test est manquant');
            }
            if (!answers || Object.keys(answers).length === 0) {
                throw new Error('Aucune réponse fournie');
            }

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Aucun jeton d’authentification trouvé');
            }

            const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
                question_id: parseInt(questionId),
                answer: parseInt(answer),
            }));

            const response = await api.post(
                '/tests/general/submit',
                {
                    test_id: testId,
                    answers: formattedAnswers,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log('Réponse de soumission du test', {
                success: response.data.success,
                score: response.data.data.score,
                total_questions: response.data.data.total_questions,
                percentage: response.data.data.percentage,
                feedback: response.data.data.feedback,
                message: response.data.message,
            });

            if (!isMounted.current) return;

            setFeedback(response.data.data.feedback);
            setShowResults(true);

            Swal.fire({
                icon: 'success',
                title: 'Test soumis !',
                text: `Votre score : ${response.data.data.score}/${response.data.data.total_questions} (${response.data.data.percentage}%)`,
                toast: true,
                position: 'top',
                timer: 5000,
                showConfirmButton: false,
            });

            const updatedUser = { ...user, is_first_time: false, target_audience: response.data.data.feedback.recommended_audience };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (error) {
            console.error('Erreur lors de la soumission du test:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                fullResponse: JSON.stringify(error.response?.data),
            });

            if (!isMounted.current) return;

            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                onLogout();
                navigate('/signin');
                return;
            }

            const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la soumission du test.';
            const errorDetails = error.response?.data?.error || '';

            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: `${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`,
                toast: true,
                position: 'top',
                timer: 7000,
                showConfirmButton: false,
                footer: error.response?.status >= 500
                    ? '<button onclick="window.location.reload()">Réessayer</button>'
                    : null,
            });
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const proceedToDashboard = () => {
        console.log('Redirection vers le tableau de bord');
        navigate('/dashboard');
    };

    const handleRetry = async () => {
        setRetryLoading(true);
        await fetchGeneralTests();
        setRetryLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black">
                <div className="text-elite-red-500 dark:text-elite-red-400 animate-pulse text-xl font-semibold">
                    Chargement...
                </div>
            </div>
        );
    }

    if (needsStudentSelection) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black py-12 px-4 sm:px-6 lg:px-8 relative">
                <button
                    onClick={toggleTheme}
                    className="absolute top-4 right-4 p-2 rounded-full bg-elite-yellow-200 dark:bg-elite-black-600 text-elite-black-900 dark:text-elite-yellow-100 hover:bg-elite-yellow-300 dark:hover:bg-elite-black-500 transition-colors"
                >
                    {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </button>
                <div className="max-w-3xl mx-auto bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-8 text-center">
                    <h1 className="text-3xl font-bold text-elite-red-500 dark:text-elite-red-400 mb-6">
                        Êtes-vous étudiant ?
                    </h1>
                    <p className="text-elite-black-600 dark:text-elite-black-300 mb-8">
                        Pour accéder au test général, veuillez indiquer si vous êtes étudiant ou non.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => handleStudentSelection(true)}
                            className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 transition-colors"
                        >
                            Oui, je suis étudiant
                        </button>
                        <button
                            onClick={() => handleStudentSelection(false)}
                            className="bg-elite-black-500 text-white px-6 py-3 rounded-lg hover:bg-elite-black-600 transition-colors"
                        >
                            Non, je ne suis pas étudiant
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        const reason = localStorage.getItem('no_tests_reason') || 'unknown';
        const noTestsReason = {
            no_valid_tests: 'Aucun test général n’a été configuré pour votre profil. Veuillez contacter l’administrateur.',
            no_tests_found: 'Aucun test général ne correspond à votre profil. Veuillez contacter l’administrateur.',
            no_valid_questions: 'Les tests disponibles n’ont pas de questions valides. Veuillez contacter l’administrateur.',
            no_matching_tests: 'Aucun test général ne correspond à votre profil. Veuillez contacter l’administrateur.',
            network_error: 'Une erreur de connexion est survenue. Veuillez vérifier votre connexion et réessayer.',
            auth_error: 'Problème d’authentification. Veuillez vous reconnecter.',
            not_first_time: 'Vous avez déjà complété le test général. Accédez à votre tableau de bord.',
            unknown: 'Aucun test général n’est disponible pour le moment. Contactez l’administrateur.',
        }[reason] || 'Aucun test général n’est disponible pour le moment.';

        console.log('Affichage du message aucun test', {
            user_id: user?.id,
            is_student: user?.is_student,
            is_first_time: user?.is_first_time,
            tests_fetched: generalTests.length,
            reason,
            general_tests: generalTests,
        });

        return (
            <div className="min-h-screen bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black py-12 px-4 sm:px-6 lg:px-8 relative">
                <button
                    onClick={toggleTheme}
                    className="absolute top-4 right-4 p-2 rounded-full bg-elite-yellow-200 dark:bg-elite-black-600 text-elite-black-900 dark:text-elite-yellow-100 hover:bg-elite-yellow-300 dark:hover:bg-elite-black-500 transition-colors"
                >
                    {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </button>
                <div className="max-w-3xl mx-auto bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-8 text-center">
                    <h1 className="text-3xl font-bold text-elite-red-500 dark:text-elite-red-400 mb-6">
                        Aucun Test Général Disponible
                    </h1>
                    <p className="text-elite-black-600 dark:text-elite-black-300 mb-4">
                        {noTestsReason}
                    </p>
                    <p className="text-elite-black-500 dark:text-elite-black-400 text-sm mb-6">
                        Profil: {JSON.stringify({ id: user?.id, is_student: user?.is_student, is_first_time: user?.is_first_time })}
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handleRetry}
                            disabled={retryLoading}
                            className="bg-elite-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-elite-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {retryLoading ? 'Chargement...' : 'Réessayer'}
                        </button>
                        <button
                            onClick={proceedToDashboard}
                            className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 transition-colors"
                        >
                            Retour au tableau de bord
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showResults) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black py-12 px-4 sm:px-6 lg:px-8 relative">
                <button
                    onClick={toggleTheme}
                    className="absolute top-4 right-4 p-2 rounded-full bg-elite-yellow-200 dark:bg-elite-black-600 text-elite-black-900 dark:text-elite-yellow-100 hover:bg-elite-yellow-300 dark:hover:bg-elite-black-500 transition-colors"
                >
                    {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </button>
                <div className="max-w-4xl mx-auto bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-elite-red-500 dark:text-elite-red-400 mb-8">
                        Résultats de Votre Test Général
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-elite-black-50 dark:bg-elite-black-700 p-6 rounded-xl">
                            <h2 className="text-xl font-semibold text-elite-yellow-600 dark:text-elite-yellow-400 mb-4 flex items-center">
                                <Check className="h-6 w-6 mr-2 text-elite-red-500 dark:text-elite-red-400" />
                                Vos Points Forts
                            </h2>
                            <ul className="space-y-3">
                                {feedback?.points_forts?.length > 0 ? (
                                    feedback.points_forts.map((strength, index) => (
                                        <li key={index} className="flex items-start text-elite-black-700 dark:text-elite-black-300">
                                            <Check className="h-5 w-5 mr-2 text-elite-yellow-500" />
                                            {strength}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-elite-black-500 dark:text-elite-black-400">
                                        Aucun point fort spécifique identifié.
                                    </li>
                                )}
                            </ul>
                        </div>
                        <div className="bg-elite-black-50 dark:bg-elite-black-700 p-6 rounded-xl">
                            <h2 className="text-xl font-semibold text-elite-yellow-600 dark:text-elite-yellow-400 mb-4 flex items-center">
                                <ArrowRight className="h-6 w-6 mr-2 text-elite-red-500 dark:text-elite-red-400" />
                                Axes d’Amélioration
                            </h2>
                            <ul className="space-y-3">
                                {feedback?.domaines_d_amélioration?.length > 0 ? (
                                    feedback.domaines_d_amélioration.map((weakness, index) => (
                                        <li key={index} className="flex items-start text-elite-black-700 dark:text-elite-black-300">
                                            <ArrowRight className="h-5 w-5 mr-2 text-elite-yellow-500" />
                                            {weakness}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-elite-black-500 dark:text-elite-black-400">
                                        Aucun axe d’amélioration spécifique identifié.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                    <div className="bg-elite-black-50 dark:bg-elite-black-700 p-6 rounded-xl mb-8">
                        <h2 className="text-xl font-semibold text-elite-yellow-600 dark:text-elite-yellow-400 mb-4 flex items-center">
                            <Brain className="h-6 w-6 mr-2 text-elite-red-500 dark:text-elite-red-400" />
                            Recommandations
                        </h2>
                        <ul className="space-y-3">
                            {feedback?.recommandations?.length > 0 ? (
                                feedback.recommandations.map((recommendation, index) => (
                                    <li key={index} className="flex items-start text-elite-black-700 dark:text-elite-black-300">
                                        <Brain className="h-5 w-5 mr-2 text-elite-yellow-500" />
                                        {recommendation}
                                    </li>
                                ))
                            ) : (
                                <li className="text-elite-black-500 dark:text-elite-black-400">
                                    Aucune recommandation spécifique fournie.
                                </li>
                            )}
                        </ul>
                    </div>
                    {feedback?.recommended_audience && (
                        <div className="text-center mb-8">
                            <p className="text-elite-black-600 dark:text-elite-black-300 text-lg">
                                Profil recommandé :{' '}
                                <span className="font-semibold text-elite-red-500 dark:text-elite-red-400">
                                    {feedback.recommended_audience.replace('_', ' ')}
                                </span>
                            </p>
                        </div>
                    )}
                    <div className="flex justify-center">
                        <button
                            onClick={proceedToDashboard}
                            className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 transition-colors flex items-center"
                        >
                            Continuer vers le tableau de bord
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const question = questions[currentQuestion];
    const totalQuestions = questions.length;
    const progress = ((currentQuestion + 1) / totalQuestions) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black py-12 px-4 sm:px-6 lg:px-8 relative">
            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 p-2 rounded-full bg-elite-yellow-200 dark:bg-elite-black-600 text-elite-black-900 dark:text-elite-yellow-100 hover:bg-elite-yellow-300 dark:hover:bg-elite-black-500 transition-colors"
            >
                {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>
            <div className="max-w-3xl mx-auto bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-8">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-elite-red-500 dark:text-elite-red-400">
                            Test Général - Question {currentQuestion + 1} sur {totalQuestions}
                        </h1>
                        <span className="text-elite-black-500 dark:text-elite-black-400">
                            {generalTests[0]?.title || 'Test Général'}
                        </span>
                    </div>
                    <div className="w-full bg-elite-black-200 dark:bg-elite-black-700 rounded-full h-2.5">
                        <div
                            className="bg-elite-yellow-500 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-elite-black-700 dark:text-elite-black-300 mb-4">
                        {question.question}
                    </h2>
                    <div className="space-y-3">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(question.id, index)}
                                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                                    answers[question.id] === index
                                        ? 'bg-elite-yellow-100 border-elite-yellow-500 text-elite-black-900 dark:bg-elite-yellow-900 dark:border-elite-yellow-400 dark:text-elite-yellow-100'
                                        : 'bg-elite-black-50 border-elite-black-200 text-elite-black-700 hover:bg-elite-black-100 dark:bg-elite-black-700 dark:border-elite-black-600 dark:text-elite-black-300 dark:hover:bg-elite-black-600'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={nextQuestion}
                        disabled={loading}
                        className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {currentQuestion < questions.length - 1 ? 'Suivant' : 'Soumettre'}
                        <ArrowRight className="h-5 w-5 ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestGeneral;