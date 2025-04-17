import React, { useState, useEffect } from 'react';
import { User, Mail, Key, Trash2, Save, Camera, Phone, MapPin, Building } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';

const Profile = ({ user, setUser, isLoading: parentLoading, onLogout, fetchUser: parentFetchUser }) => {
  const { darkMode } = useDarkMode();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    numero_de_telephone: '',
    ville: '',
    email: '',
    logo: null,
    software_technologies: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [previewLogoImage, setPreviewLogoImage] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        prenom: user.prenom || '',
        numero_de_telephone: user.numero_de_telephone || '',
        ville: user.ville || '',
        email: user.email || '',
        logo: user.logo || null,
        software_technologies: user.software_technologies || '',
        address: user.address || '',
      });
      setLoading(false);
    } else if (!parentLoading) {
      fetchUser();
    }
  }, [user, parentLoading]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUser(response.data);
      setFormData({
        nom: response.data.nom || '',
        prenom: response.data.prenom || '',
        numero_de_telephone: response.data.numero_de_telephone || '',
        ville: response.data.ville || '',
        email: response.data.email || '',
        logo: response.data.logo || null,
        software_technologies: response.data.software_technologies || '',
        address: response.data.address || '',
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur :', error.response?.data || error.message);
      setError('Impossible de charger les informations du profil.');
      if (error.response?.status === 401) {
        handleLogout(() => navigate('/signin'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        setError('Type de fichier non supporté. Utilisez JPEG, PNG, JPG, GIF ou WEBP.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('L’image dépasse la limite de 2 Mo.');
        return;
      }
      if (type === 'profile') {
        setProfileImage(file);
        setPreviewProfileImage(URL.createObjectURL(file));
      } else if (type === 'logo') {
        setLogoImage(file);
        setPreviewLogoImage(URL.createObjectURL(file));
        setFormData((prev) => ({ ...prev, logo: file }));
      }
      setError(null);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom || !formData.email) {
      setError('Le nom, le prénom et l\'email sont requis.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    const data = new FormData();
    data.append('nom', formData.nom);
    data.append('prenom', formData.prenom);
    data.append('numero_de_telephone', formData.numero_de_telephone);
    data.append('ville', formData.ville);
    data.append('email', formData.email);
    if (profileImage) data.append('image', profileImage);
    if (user?.role === 'entreprise') {
      if (logoImage) data.append('logo', logoImage);
      data.append('software_technologies', formData.software_technologies);
      data.append('address', formData.address);
    }
    data.append('_method', 'POST');

    try {
      const response = await api.post('/profile', data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });
      const updatedUser = response.data.user;
      setUser(updatedUser);
      setFormData({
        nom: updatedUser.nom || '',
        prenom: updatedUser.prenom || '',
        numero_de_telephone: updatedUser.numero_de_telephone || '',
        ville: updatedUser.ville || '',
        email: updatedUser.email || '',
        logo: updatedUser.logo || null,
        software_technologies: updatedUser.software_technologies || '',
        address: updatedUser.address || '',
      });
      setProfileImage(null);
      setLogoImage(null);
      setPreviewProfileImage(null);
      setPreviewLogoImage(null);
      setSuccess('Profil mis à jour avec succès.');
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await api.put('/password', passwordData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
      setSuccess('Mot de passe mis à jour avec succès.');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe :', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setError('Veuillez entrer votre mot de passe pour confirmer la suppression.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.delete('/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        data: { password: deletePassword },
      });
      handleLogout(() => navigate('/signin'));
    } catch (error) {
      console.error('Erreur lors de la suppression du compte :', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Erreur lors de la suppression du compte.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (redirect) => {
    onLogout(redirect);
  };

  const getInitials = (name) => {
    if (!name) return 'JD';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  if (loading || parentLoading || !user) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <p className={cn('text-lg', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
          Chargement du profil...
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-screen', darkMode ? 'bg-gradient-to-br from-elite-black-900 to-black' : 'bg-gradient-to-br from-gray-100 to-gray-300')}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          setUser={setUser}
          onLogout={handleLogout}
        />
        <div className="container mx-auto py-10 px-6 max-w-2xl">
          <h1 className={cn('text-3xl font-bold mb-6', darkMode ? 'text-elite-red-500' : 'text-elite-red-500')}>
            Mon profil
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-elite-red-500/20 text-elite-red-500 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-500/20 text-green-500 rounded-lg">{success}</div>
          )}

          <div className={cn('bg-white dark:bg-elite-black-800/90 rounded-xl shadow-lg p-6 mb-6 border', darkMode ? 'border-elite-black-700' : 'border-gray-200')}>
            <h2 className={cn('text-xl font-semibold mb-4', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
              Informations personnelles
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                {previewProfileImage ? (
                  <img src={previewProfileImage} alt="Aperçu" className="w-16 h-16 rounded-full object-cover" />
                ) : user.image ? (
                  <img
                    src={`${api.defaults.baseURL.replace('/api', '')}${user.image}?t=${new Date().getTime()}`}
                    alt="Photo de profil"
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => (e.target.src = `${api.defaults.baseURL.replace('/api', '')}/default-profile.jpg`)}
                  />
                ) : (
                  <div
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center font-medium text-xl',
                      darkMode ? 'bg-elite-yellow-400 text-elite-black-900' : 'bg-elite-yellow-100 text-elite-black-900'
                    )}
                  >
                    {getInitials(user.nomComplet || `${formData.nom} ${formData.prenom}`)}
                  </div>
                )}
                <label
                  htmlFor="profile-image-upload"
                  className={cn('flex items-center gap-2 cursor-pointer', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}
                >
                  <Camera className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                  <span>{user.image || previewProfileImage ? 'Changer l\'image' : 'Ajouter une image'}</span>
                </label>
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'profile')}
                  className="hidden"
                />
              </div>
              <div className="flex items-center gap-3">
                <User className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  placeholder="Nom"
                  className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-3">
                <User className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  placeholder="Prénom"
                  className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-3">
                <Phone className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                <input
                  type="text"
                  name="numero_de_telephone"
                  value={formData.numero_de_telephone}
                  onChange={handleInputChange}
                  placeholder="Numéro de téléphone"
                  className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-3">
                <MapPin className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                <input
                  type="text"
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                  placeholder="Ville"
                  className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-3">
                <Mail className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                  required
                  disabled={loading}
                />
              </div>

              {/* Section spécifique aux entreprises */}
              {user.role === 'entreprise' && (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    {previewLogoImage ? (
                      <img src={previewLogoImage} alt="Aperçu du logo" className="w-20 h-20 object-cover" />
                    ) : formData.logo ? (
                      <img
                        src={`${api.defaults.baseURL.replace('/api', '')}${formData.logo}?t=${new Date().getTime()}`}
                        alt="Logo"
                        className="w-20 h-20 object-cover"
                        onError={(e) => (e.target.src = `${api.defaults.baseURL.replace('/api', '')}/default-logo.jpg`)}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 flex items-center justify-center">Aucun logo</div>
                    )}
                    <label
                      htmlFor="logo-upload"
                      className={cn('flex items-center gap-2 cursor-pointer', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}
                    >
                      <Camera className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                      <span>{formData.logo || previewLogoImage ? 'Changer le logo' : 'Ajouter un logo'}</span>
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'logo')}
                      className="hidden"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                    <input
                      type="text"
                      name="software_technologies"
                      value={formData.software_technologies}
                      onChange={handleInputChange}
                      placeholder="Logiciels/Technologies"
                      className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Adresse"
                      className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className={cn('w-full bg-elite-red-500 text-white py-2 rounded-lg hover:bg-elite-red-600 transition-colors flex items-center justify-center gap-2', loading && 'opacity-50 cursor-not-allowed')}
                disabled={loading}
              >
                {loading ? 'Mise à jour...' : <><Save className="h-5 w-5" /> Mettre à jour</>}
              </button>
            </form>
          </div>

          <div className={cn('bg-white dark:bg-elite-black-800/90 rounded-xl shadow-lg p-6 mb-6 border', darkMode ? 'border-elite-black-700' : 'border-gray-200')}>
            <h2 className={cn('text-xl font-semibold mb-4', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
              Changer le mot de passe
            </h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="flex items-center gap-3">
                <Key className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Mot de passe actuel"
                  className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-3">
                <Key className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Nouveau mot de passe"
                  className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-3">
                <Key className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                <input
                  type="password"
                  name="new_password_confirmation"
                  value={passwordData.new_password_confirmation}
                  onChange={handlePasswordChange}
                  placeholder="Confirmer le nouveau mot de passe"
                  className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className={cn('w-full bg-elite-red-500 text-white py-2 rounded-lg hover:bg-elite-red-600 transition-colors flex items-center justify-center gap-2', loading && 'opacity-50 cursor-not-allowed')}
                disabled={loading}
              >
                {loading ? 'Mise à jour...' : <><Save className="h-5 w-5" /> Mettre à jour le mot de passe</>}
              </button>
            </form>
          </div>

          <div className={cn('bg-white dark:bg-elite-black-800/90 rounded-xl shadow-lg p-6 border', darkMode ? 'border-elite-black-700' : 'border-gray-200')}>
            <h2 className={cn('text-xl font-semibold mb-4', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
              Supprimer le compte
            </h2>
            <p className={cn('text-sm mb-4', darkMode ? 'text-elite-yellow-200' : 'text-elite-black-600')}>
              Cette action marquera votre compte comme supprimé. Vous ne pourrez plus y accéder.
            </p>
            <form onSubmit={handleSoftDeleteAccount} className="space-y-4">
              <div className="flex items-center gap-3">
                <Key className={cn('h-5 w-5', darkMode ? 'text-elite-yellow-400' : 'text-elite-black-700')} />
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Mot de passe actuel"
                  className={cn('flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-elite-red-500', darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300')}
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className={cn('w-full bg-elite-red-500 text-white py-2 rounded-lg hover:bg-elite-red-600 transition-colors flex items-center justify-center gap-2', loading && 'opacity-50 cursor-not-allowed')}
                disabled={loading}
              >
                {loading ? 'Suppression...' : <><Trash2 className="h-5 w-5" /> Supprimer le compte</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;