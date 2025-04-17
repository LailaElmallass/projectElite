import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
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
    }, [user, navigate]);

    const fetchGeneralTests = async (retries = 3) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.get('/tests/general', {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('General tests API response', {
                success: response.data.success,
                tests: response.data.data.tests,
                needs_student_selection: response.data.data.needs_student_selection,
                message: response.data.message,
                reason: response.data.errors?.reason,
            });

            const tests = response.data.data.tests || [];
            setGeneralTests(tests);

            if (response.data.data.needs_student_selection) {
                console.log('Needs student selection');
                setNeedsStudentSelection(true);
                setQuestions([]);
            } else if (tests.length > 0 && tests[0].questions.length > 0) {
                console.log('Tests found, setting questions', { test_id: tests[0].id });
                setNeedsStudentSelection(false);
                setQuestions(
                    tests[0].questions.map((q) => {
                        try {
                            return {
                                ...q,
                                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                            };
                        } catch (e) {
                            console.error('Error parsing options for question', { question: q, error: e });
                            return null;
                        }
                    }).filter(Boolean)
                );
            } else {
                console.warn('No valid tests or questions found', { tests });
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
            console.error('Error fetching general tests:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            if (error.response?.status === 401) {
                console.log('Unauthorized, clearing token and redirecting to signin');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                onLogout();
                navigate('/signin');
                return;
            }
            if (retries > 0) {
                console.log(`Retrying fetchGeneralTests, ${retries} attempts left`);
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
                text: 'Erreur lors du chargement des tests généraux. Veuillez vérifier votre connexion et réessayer.',
                toast: true,
                position: 'top',
                timer: 5000,
                showConfirmButton: false,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSelection = async (isStudentChoice) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token');
            }
            console.log('Sending student selection', { is_student: isStudentChoice, token });
            const response = await api.put('/users/student-status', { is_student: isStudentChoice }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Student selection response', response.data);
            const updatedUser = response.data.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setNeedsStudentSelection(false);
            await fetchGeneralTests();
        } catch (error) {
            console.error('Error updating student status:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            let message = 'Erreur lors de la mise à jour du statut étudiant.';
            if (error.response?.status === 404) {
                message = 'Service indisponible. Contactez l’administrateur.';
            } else if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/signin');
                message = 'Session expirée. Veuillez vous reconnecter.';
            }
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: message,
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
        setAnswers({ ...answers, [questionId]: optionIndex });
        console.log('Answer recorded', { questionId, optionIndex });
    };

    const nextQuestion = async () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            await submitTest();
        }
    };

    const submitTest = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (Object.keys(answers).length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Aucune réponse',
                    text: 'Veuillez répondre à au moins une question avant de soumettre.',
                    toast: true,
                    position: 'top',
                    timer: 5000,
                    showConfirmButton: false,
                });
                return;
            }

            const response = await api.post(
                '/tests/general/submit',
                { answers },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const feedbackData = response.data.data.feedback;
            setFeedback(feedbackData);

            const userData = JSON.parse(localStorage.getItem('user')) || {};
            const updatedUser = {
                ...userData,
                target_audience: feedbackData.recommended_audience,
                is_first_time: false,
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            console.log('Test submitted', {
                feedback: feedbackData,
                target_audience: feedbackData.recommended_audience,
            });

            localStorage.setItem('user_audience', feedbackData.recommended_audience);
            localStorage.setItem('first_test_completed', 'true');
            setShowResults(true);
        } catch (error) {
            console.error('Error submitting test:', {
                message: error.message,
                response: error.response?.data,
            });
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                onLogout();
                navigate('/signin');
            }
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: error.response?.data?.message || 'Erreur lors de la soumission du test.',
                toast: true,
                position: 'top',
                timer: 5000,
                showConfirmButton: false,
            });
            setFeedback({
                points_forts: ['Effort fourni'],
                domaines_d_amélioration: ['Erreur réseau détectée'],
                recommandations: ['Vérifiez votre connexion et réessayez'],
                recommended_audience: 'etudiant_maroc',
            });
            setShowResults(true);
        } finally {
            setLoading(false);
        }
    };

    const proceedToDashboard = () => {
        console.log('Navigating to dashboard');
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

        console.log('Rendering no tests message', {
            user_id: user?.id,
            is_student: user?.is_student,
            is_first_time: user?.is_first_time,
            tests_fetched: generalTests.length,
            reason,
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

    if (!showResults) {
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
                    <h1 className="text-3xl font-bold text-elite-red-500 dark:text-elite-red-400 mb-6">
                        Test Général
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
                                {feedback.recommended_audience}
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
};

export default TestGeneral;