import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Sun, Moon } from 'lucide-react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext'; // Import context

const SignUp = () => {
  const { darkMode, setDarkMode } = useDarkMode(); // Use context instead of local state
  const [role, setRole] = useState('utilisateur');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [numeroDeTelephone, setNumeroDeTelephone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    // Password match validation
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Les mots de passe ne correspondent pas.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    // Email validation
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(email)) {
      setError('Veuillez entrer un email valide.');
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez entrer un email valide.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    // Gender validation for utilisateur and coach
    if ((role === 'utilisateur' || role === 'coach') && !gender) {
      setError('Veuillez sélectionner votre genre.');
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez sélectionner votre genre.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    // Phone number validation (basic length check)
    if (numeroDeTelephone.length < 6 || numeroDeTelephone.length > 20) {
      setError('Le numéro de téléphone doit être entre 6 et 20 caractères.');
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Le numéro de téléphone doit être entre 6 et 20 caractères.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    const userData = {
      role,
      email,
      password,
      password_confirmation: confirmPassword,
      nom,
      prenom,
      numero_de_telephone: numeroDeTelephone,
    };
    if (role === 'coach') userData.specialty = specialty;
    if (role === 'entreprise') {
      userData.company_name = companyName;
      userData.industry = industry;
    }
    if (role === 'utilisateur' || role === 'coach') userData.gender = gender;

    try {
      console.log('Signup request payload:', userData); // Debug payload
      const response = await api.post('/register', userData, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      console.log('Signup response:', response.data); // Debug response
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      Swal.fire({
        icon: 'success',
        title: 'Compte créé avec succès !',
        text: 'Vous allez être redirigé vers la page de tests.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });

      setTimeout(() => navigate(response.data.redirect || '/tests'), 2000);
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message); // Debug error
      let errorMessage = 'Erreur lors de la création du compte.';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          const firstErrorKey = Object.keys(error.response.data.errors)[0];
          errorMessage = error.response.data.errors[firstErrorKey][0];
        }
      }
      setError(errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center bg-gradient-to-br',
        darkMode ? 'from-elite-black-900 to-elite-black-700' : 'from-elite-yellow-50 to-elite-red-100'
      )}
    >
      <button
        onClick={toggleDarkMode}
        className={cn(
          'absolute top-4 right-4 p-2 rounded-full hover:bg-elite-red-500/20 transition-colors',
          darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700'
        )}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </button>

      <div
        className={cn(
          'w-full max-w-md p-8 mt-20 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300 backdrop-blur-md',
          darkMode ? 'bg-elite-black-800/90 text-elite-yellow-100' : 'bg-elite-yellow-50 text-elite-black-900'
        )}
      >
        <h2
          className={cn(
            'text-3xl font-extrabold flex items-center justify-center mb-6',
            darkMode ? 'text-elite-red-400' : 'text-elite-red-400'
          )}
        >
          <User className="h-7 w-7 mr-3" /> Inscription
        </h2>

        {error && (
          <p
            className={cn(
              'text-sm text-center font-medium p-2 rounded mb-4',
              darkMode ? 'text-elite-red-400 bg-elite-red-900/30' : 'text-elite-red-600 bg-red-100'
            )}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label
              className={cn(
                'block text-sm font-medium mb-1',
                darkMode ? 'text-elite-black-200' : 'text-elite-black-700'
              )}
            >
              Choisir un rôle :
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={cn(
                'w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all',
                darkMode
                  ? 'bg-elite-black-700 border-elite-black-600 text-elite-yellow-100'
                  : 'bg-elite-yellow-50 border-elite-black-300 text-elite-black-900'
              )}
            >
              <option value="utilisateur">Utilisateur</option>
              <option value="coach">Coach</option>
              <option value="entreprise">Entreprise</option>
              <option value="admin">Administrateur</option> {/* Fixed typo */}
            </select>
          </div>

          <div>
            <input
              type="text"
              placeholder="Nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className={cn(
                'w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all',
                darkMode
                  ? 'bg-elite-black-700 border-elite-black-600 text-elite-yellow-100'
                  : 'bg-elite-yellow-50 border-elite-black-300 text-elite-black-900'
              )}
              required
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Prénom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              className={cn(
                'w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all',
                darkMode
                  ? 'bg-elite-black-700 border-elite-black-600 text-elite-yellow-100'
                  : 'bg-elite-yellow-50 border-elite-black-300 text-elite-black-900'
              )}
              required
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                'w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all',
                darkMode
                  ? 'bg-elite-black-700 border-elite-black-600 text-elite-yellow-100'
                  : 'bg-elite-yellow-50 border-elite-black-300 text-elite-black-900'
              )}
              required
            />
          </div>

          <div>
            <input
              type="tel"
              placeholder="Numéro de téléphone"
              value={numeroDeTelephone}
              onChange={(e) => setNumeroDeTelephone(e.target.value)}
              className={cn(
                'w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all',
                darkMode
                  ? 'bg-elite-black-700 border-elite-black-600 text-elite-yellow-100'
                  : 'bg-elite-yellow-50 border-elite-black-300 text-elite-black-900'
              )}
              required
            />
          </div>

          <div>
            <input
              type="password" // Reverted to password for security
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                'w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all',
                darkMode
                  ? 'bg-elite-black-700 border-elite-black-600 text-elite-yellow-100'
                  : 'bg-elite-yellow-50 border-elite-black-300 text-elite-black-900'
              )}
              required
            />
          </div>

          <div>
            <input
              type="password" // Reverted to password for security
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn(
                'w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all',
                darkMode
                  ? 'bg-elite-black-700 border-elite-black-600 text-elite-yellow-100'
                  : 'bg-elite-yellow-50 border-elite-black-300 text-elite-black-900'
              )}
              required
            />
          </div>

          {(role === 'utilisateur' || role === 'coach') && (
            <div>
              <label
                className={cn(
                  'block text-sm font-medium mb-1',
                  darkMode ? 'text-elite-black-200' : 'text-elite-black-700'
                )}
              >
                Genre :
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={(e) => setGender(e.target.value)}
                    className="h-4 w-4 text-elite-red-500 focus:ring-elite-red-500"
                  />
                  Monsieur
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={(e) => setGender(e.target.value)}
                    className="h-4 w-4 text-elite-red-500 focus:ring-elite-red-500"
                  />
                  Madame
                </label>
              </div>
            </div>
          )}

          {role === 'coach' && (
            <div>
              <input
                type="text"
                placeholder="Spécialité"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className={cn(
                  'w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all',
                  darkMode
                    ? 'bg-elite-black-700 border-elite-black-600 text-elite-yellow-100'
                    : 'bg-elite-yellow-50 border-elite-black-300 text-elite-black-900'
                )}
                required
              />
            </div>
          )}

          {role === 'entreprise' && (
            <>
              <div>
                <input
                  type="text"
                  placeholder="Nom de l'entreprise"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={cn(
                    'w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all',
                    darkMode
                      ? 'bg-elite-black-700 border-elite-black-600 text-elite-yellow-100'
                      : 'bg-elite-yellow-50 border-elite-black-300 text-elite-black-900'
                  )}
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Secteur d’activité"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={cn(
                    'w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all',
                    darkMode
                      ? 'bg-elite-black-700 border-elite-black-600 text-elite-yellow-100'
                      : 'bg-elite-yellow-50 border-elite-black-300 text-elite-black-900'
                  )}
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className={cn(
              'w-full py-3 rounded-md font-semibold transition-all duration-300 transform hover:scale-105',
              darkMode ? 'bg-elite-red-400 text-white hover:bg-elite-red-600' : 'bg-elite-red-400 text-white hover:bg-elite-red-600'
            )}
          >
            Créer un compte
          </button>
        </form>

        <p
          className={cn(
            'mt-4 text-center text-sm',
            darkMode ? 'text-elite-black-300' : 'text-elite-black-600'
          )}
        >
          Déjà inscrit ?{' '}
          <Link
            to="/signin"
            className={cn(
              'font-semibold hover:underline',
              darkMode ? 'text-elite-yellow-400' : 'text-elite-yellow-600'
            )}
          >
            Se connecter
          </Link>
        </p>
        <p
          className={cn(
            'mt-2 text-center text-sm',
            darkMode ? 'text-elite-black-300' : 'text-elite-black-600'
          )}
        >
          <Link
            to="/"
            className={cn(
              'font-semibold hover:underline',
              darkMode ? 'text-elite-yellow-400' : 'text-elite-yellow-600'
            )}
          >
            Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;