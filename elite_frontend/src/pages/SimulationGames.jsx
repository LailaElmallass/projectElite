import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '@/lib/api';

const MySwal = withReactContent(Swal);

const SimulationGames = ({ user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState(null);
  const [formSuccess, setFormSuccess] = React.useState(null);

  // Show alert on component mount
  useEffect(() => {
    MySwal.fire({
      title: 'En cours de développement',
      text: 'La section "Jeux de Simulations" est en cours de développement. Restez à l’écoute pour des mises à jour !',
      icon: 'info',
      confirmButtonText: 'OK',
      confirmButtonColor: '#f56565', // Matches text-elite-red-500
      toast: true,
      position: 'top-end',
      timer: 5000,
      timerProgressBar: true,
    });
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        '/contact',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFormSuccess('Votre message a été envoyé avec succès ! Nous vous répondrons bientôt.');
      setFormData({ name: '', email: '', message: '' });
      MySwal.fire({
        title: 'Succès',
        text: 'Votre message a été envoyé !',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f56565',
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Une erreur est survenue lors de l’envoi du message.';
      setFormError(errorMessage);
      MySwal.fire({
        title: 'Erreur',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f56565',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          onLogout={onLogout}
        />
        <div className="container mx-auto py-10 px-6 max-w-7xl">
          <h1 className="text-3xl font-bold text-elite-red-500 mb-4">Jeux de Simulations</h1>
          <p className="text-gray-700 mb-6">
            Contenu des jeux de simulations à venir... En attendant, utilisez le formulaire ci-dessous pour nous contacter si vous avez des questions ou suggestions !
          </p>

          {/* Contact Form */}
          <div className="bg-white shadow-lg rounded-lg p-6 max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold text-elite-red-500 mb-4">Nous Contacter</h2>
            {formSuccess && (
              <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
                {formSuccess}
              </div>
            )}
            {formError && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-elite-red-500 focus:border-elite-red-500 sm:text-sm"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-elite-red-500 focus:border-elite-red-500 sm:text-sm"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-elite-red-500 focus:border-elite-red-500 sm:text-sm"
                  placeholder="Votre message..."
                ></textarea>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-elite-red-500 hover:bg-elite-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-elite-red-500 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationGames;