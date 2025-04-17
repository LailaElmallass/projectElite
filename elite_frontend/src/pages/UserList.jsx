import React, { useState, useEffect, useCallback } from 'react';
import { UserCircle, UserPlus, Pencil, Trash, Settings } from 'lucide-react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const UserList = ({ user, onLogout }) => {
  const { darkMode } = useDarkMode();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showManageRoleModal, setShowManageRoleModal] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'utilisateur',
    gender: '',
    numero_de_telephone: '',
    specialty: '',
    company_name: '',
    industry: '',
  });
  const [editUser, setEditUser] = useState(null);
  const [manageUser, setManageUser] = useState(null);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    try {
      const response = await api.get('/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Fetched users:', response.data);
      if (!Array.isArray(response.data)) {
        throw new Error('API response is not an array');
      }
      response.data.forEach((u, i) => {
        if (!u.id) console.warn(`User at index ${i} missing id:`, u);
      });
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('Impossible de charger la liste des utilisateurs.');
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger la liste des utilisateurs.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
  
    // Validate password confirmation
    if (newUser.password !== newUser.password_confirmation) {
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
      setShowAddForm(true); // Keep form open
      return;
    }
  
    // Validate email format
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(newUser.email)) {
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
      setShowAddForm(true); // Keep form open
      return;
    }
  
    // Validate gender for utilisateur or coach
    if ((newUser.role === 'utilisateur' || newUser.role === 'coach') && !newUser.gender) {
      setError('Veuillez sélectionner le genre.');
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Veuillez sélectionner le genre.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
      setShowAddForm(true); // Keep form open
      return;
    }
  
    // Prepare user data
    const userData = {
      nom: newUser.nom,
      prenom: newUser.prenom,
      nomComplet: `${newUser.nom} ${newUser.prenom}`.trim(),
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      numero_de_telephone: newUser.numero_de_telephone,
    };
    if (newUser.role === 'coach') userData.specialty = newUser.specialty;
    if (newUser.role === 'entreprise') {
      userData.company_name = newUser.company_name;
      userData.industry = newUser.industry;
    }
    if (newUser.role === 'utilisateur' || newUser.role === 'coach') userData.gender = newUser.gender;
  
    try {
      const response = await api.post('/users', userData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedUsers = [...users, response.data];
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setNewUser({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'utilisateur',
        gender: '',
        numero_de_telephone: '',
        specialty: '',
        company_name: '',
        industry: '',
      });
      setShowAddForm(false);
      setError('');
      Swal.fire({
        icon: 'success',
        title: 'Utilisateur ajouté !',
        text: 'L’utilisateur a été ajouté avec succès.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      let errorMessage = 'Erreur lors de l’ajout de l’utilisateur.';
      if (error.response?.data?.errors?.email?.[0] === 'The email has already been taken.') {
        errorMessage = 'Cet email est déjà utilisé.';
      } else if (error.response?.data?.error) {
        errorMessage = `Erreur serveur: ${error.response.data.error}`;
      }
      setError(errorMessage);
      setShowAddForm(true); // Keep form open on error
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
        toast: true,
        position: 'top',
        timer: 5000, // Longer timer for detailed errors
        showConfirmButton: false,
      });
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setError('');
    const userData = {
      nom: editUser.nom,
      prenom: editUser.prenom,
      nomComplet: `${editUser.nom} ${editUser.prenom}`.trim(), // Always recompute
      email: editUser.email,
      role: editUser.role,
      numero_de_telephone: editUser.numero_de_telephone,
    };
    if (editUser.role === 'coach') userData.specialty = editUser.specialty;
    if (editUser.role === 'entreprise') {
      userData.company_name = editUser.company_name;
      userData.industry = editUser.industry;
    }
    if (editUser.role === 'utilisateur' || editUser.role === 'coach') userData.gender = editUser.gender;

    try {
      console.log('Sending update:', userData); // Debug
      const response = await api.put(`/users/${editUser.id}`, userData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Edit response:', response.data);
      const updatedUser = response.data.user;
      const updateUserInArray = (arr) =>
        arr.map((u) => (u.id === editUser.id ? { ...u, ...updatedUser } : u));
      setUsers((prev) => {
        const newUsers = updateUserInArray(prev);
        console.log('Updated users:', newUsers);
        return newUsers;
      });
      setFilteredUsers((prev) => {
        const newFiltered = updateUserInArray(prev);
        console.log('Updated filteredUsers:', newFiltered);
        return newFiltered;
      });
      setShowEditForm(false);
      setEditUser(null);
      setError('');
      Swal.fire({
        icon: 'success',
        title: 'Utilisateur modifié !',
        text: 'L’utilisateur a été modifié avec succès.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Edit error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la modification.';
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

  const openEditForm = (userToEdit) => {
    setEditUser({
      id: userToEdit.id,
      nom: userToEdit.nom || '',
      prenom: userToEdit.prenom || '',
      email: userToEdit.email || '',
      role: userToEdit.role || 'utilisateur',
      gender: userToEdit.gender || '',
      numero_de_telephone: userToEdit.numero_de_telephone || '',
      specialty: userToEdit.specialty || '',
      company_name: userToEdit.company_name || '',
      industry: userToEdit.industry || '',
    });
    setShowEditForm(true);
  };

  const handleDeleteUser = async (userId) => {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Vous ne pourrez pas revenir en arrière !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/users/${userId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          const updatedUsers = users.filter((u) => u.id !== userId);
          setUsers(updatedUsers);
          setFilteredUsers(updatedUsers);
          setSelectedUsers(selectedUsers.filter((id) => id !== userId));
          Swal.fire({
            icon: 'success',
            title: 'Supprimé !',
            text: 'L’utilisateur a été supprimé avec succès.',
            toast: true,
            position: 'top',
            timer: 3000,
            showConfirmButton: false,
          });
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression.';
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
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Aucune sélection',
        text: 'Veuillez sélectionner au moins un utilisateur à supprimer.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: 'Confirmer la suppression groupée ?',
      text: `Vous êtes sur le point de supprimer ${selectedUsers.length} utilisateur(s).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await Promise.all(
            selectedUsers.map((userId) =>
              api.delete(`/users/${userId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              })
            )
          );
          const updatedUsers = users.filter((u) => !selectedUsers.includes(u.id));
          setUsers(updatedUsers);
          setFilteredUsers(updatedUsers);
          setSelectedUsers([]);
          Swal.fire({
            icon: 'success',
            title: 'Supprimés !',
            text: 'Les utilisateurs sélectionnés ont été supprimés.',
            toast: true,
            position: 'top',
            timer: 3000,
            showConfirmButton: false,
          });
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression groupée.';
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
      }
    });
  };

  const handleSearch = (query) => {
    console.log('Search query:', query);
    if (!query) {
      setFilteredUsers(users);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = users.filter(
      (u) =>
        (u.nomComplet || `${u.nom || ''} ${u.prenom || ''}`.trim()).toLowerCase().includes(lowerQuery) ||
        u.email.toLowerCase().includes(lowerQuery)
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map((u) => u.id)
    );
  };

  const openManageRoleModal = (userToManage) => {
    setManageUser({ id: userToManage.id, role: userToManage.role });
    setShowManageRoleModal(true);
  };

  const handleManageRole = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.put(
        `/users/${manageUser.id}`,
        { role: manageUser.role },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      const updatedUser = response.data.user;
      const updateUserInArray = (arr) =>
        arr.map((u) => (u.id === manageUser.id ? { ...u, ...updatedUser } : u));
      setUsers((prev) => updateUserInArray(prev));
      setFilteredUsers((prev) => updateUserInArray(prev));
      setShowManageRoleModal(false);
      setManageUser(null);
      Swal.fire({
        icon: 'success',
        title: 'Rôle modifié !',
        text: 'Le rôle a été mis à jour.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la modification du rôle.';
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

  if (!user || user.role !== 'admin') return null;

  return (
    <div className={cn("min-h-screen", darkMode ? "dark bg-elite-black-900" : "bg-elite-yellow-50")}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          onLogout={onLogout}
          onSearch={handleSearch}
        />
        <div className="p-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-6">
            <UserCircle className={cn('w-8 h-8', darkMode ? 'text-elite-yellow-400' : 'text-elite-red-500')} />
            <h1 className={cn('text-2xl font-semibold', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
              Gestion des Utilisateurs
            </h1>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition-all duration-200',
                darkMode ? 'bg-elite-red-500 text-white hover:bg-elite-red-600' : 'bg-elite-red-400 text-white hover:bg-elite-red-500'
              )}
            >
              <UserPlus className="w-5 h-5" />
              Ajouter
            </button>
            <button
              onClick={handleBulkDelete}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition-all duration-200',
                darkMode ? 'bg-elite-red-600 text-white hover:bg-elite-red-700' : 'bg-elite-red-500 text-white hover:bg-elite-red-600',
                selectedUsers.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
              disabled={selectedUsers.length === 0}
            >
              <Trash className="w-5 h-5" />
              Supprimer ({selectedUsers.length})
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddUser} className="mb-6 p-6 bg-white dark:bg-elite-black-800 rounded-xl shadow-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Rôle
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                  >
                    <option value="utilisateur">Utilisateur</option>
                    <option value="coach">Coach</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Nom
                  </label>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newUser.nom}
                    onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={newUser.prenom}
                    onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="Numéro de téléphone"
                    value={newUser.numero_de_telephone}
                    onChange={(e) => setNewUser({ ...newUser, numero_de_telephone: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Confirmation
                  </label>
                  <input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={newUser.password_confirmation}
                    onChange={(e) => setNewUser({ ...newUser, password_confirmation: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                </div>
              </div>

              {(newUser.role === 'utilisateur' || newUser.role === 'coach') && (
                <div className="flex gap-6">
                  <label className={cn('flex items-center gap-2', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={newUser.gender === 'male'}
                      onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                      className="h-4 w-4 text-elite-red-500"
                    />
                    Monsieur
                  </label>
                  <label className={cn('flex items-center gap-2', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={newUser.gender === 'female'}
                      onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                      className="h-4 w-4 text-elite-red-500"
                    />
                    Madame
                  </label>
                </div>
              )}

              {newUser.role === 'coach' && (
                <div>
                  <input
                    type="text"
                    placeholder="Spécialité"
                    value={newUser.specialty}
                    onChange={(e) => setNewUser({ ...newUser, specialty: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                  />
                </div>
              )}

              {newUser.role === 'entreprise' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nom de l'entreprise"
                    value={newUser.company_name}
                    onChange={(e) => setNewUser({ ...newUser, company_name: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Secteur d’activité"
                    value={newUser.industry}
                    onChange={(e) => setNewUser({ ...newUser, industry: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                  />
                </div>
              )}

              <button
                type="submit"
                className={cn(
                  'w-full py-3 rounded-lg font-semibold shadow-md transition-all duration-200 hover:shadow-lg',
                  darkMode
                    ? 'bg-elite-red-500 text-white hover:bg-elite-red-600'
                    : 'bg-elite-red-400 text-white hover:bg-elite-red-500'
                )}
              >
                Ajouter l’utilisateur
              </button>
            </form>
          )}

          {showEditForm && editUser && (
            <form onSubmit={handleEditUser} className="mb-6 p-6 bg-white dark:bg-elite-black-800 rounded-xl shadow-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Rôle
                  </label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                  >
                    <option value="utilisateur">Utilisateur</option>
                    <option value="coach">Coach</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Nom
                  </label>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={editUser.nom}
                    onChange={(e) => setEditUser({ ...editUser, nom: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={editUser.prenom}
                    onChange={(e) => setEditUser({ ...editUser, prenom: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="Numéro de téléphone"
                    value={editUser.numero_de_telephone}
                    onChange={(e) => setEditUser({ ...editUser, numero_de_telephone: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                </div>
              </div>

              {(editUser.role === 'utilisateur' || editUser.role === 'coach') && (
                <div className="flex gap-6">
                  <label className={cn('flex items-center gap-2', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    <input
                      type="radio"
                      name="editGender"
                      value="male"
                      checked={editUser.gender === 'male'}
                      onChange={(e) => setEditUser({ ...editUser, gender: e.target.value })}
                      className="h-4 w-4 text-elite-red-500"
                    />
                    Monsieur
                  </label>
                  <label className={cn('flex items-center gap-2', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}>
                    <input
                      type="radio"
                      name="editGender"
                      value="female"
                      checked={editUser.gender === 'female'}
                      onChange={(e) => setEditUser({ ...editUser, gender: e.target.value })}
                      className="h-4 w-4 text-elite-red-500"
                    />
                    Madame
                  </label>
                </div>
              )}

              {editUser.role === 'coach' && (
                <div>
                  <input
                    type="text"
                    placeholder="Spécialité"
                    value={editUser.specialty}
                    onChange={(e) => setEditUser({ ...editUser, specialty: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                  />
                </div>
              )}

              {editUser.role === 'entreprise' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nom de l'entreprise"
                    value={editUser.company_name}
                    onChange={(e) => setEditUser({ ...editUser, company_name: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Secteur d’activité"
                    value={editUser.industry}
                    onChange={(e) => setEditUser({ ...editUser, industry: e.target.value })}
                    className={cn(
                      'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                      darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    )}
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className={cn(
                    'flex-1 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 hover:shadow-lg',
                    darkMode
                      ? 'bg-elite-red-500 text-white hover:bg-elite-red-600'
                      : 'bg-elite-red-400 text-white hover:bg-elite-red-500'
                  )}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className={cn(
                    'flex-1 py-3 rounded-lg font-semibold transition-all duration-200',
                    darkMode
                      ? 'bg-gray-600 text-elite-yellow-100 hover:bg-gray-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  )}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {showManageRoleModal && manageUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className={cn(
                  'p-6 rounded-xl shadow-lg w-full max-w-md',
                  darkMode ? 'bg-elite-black-800 text-white' : 'bg-white text-gray-800'
                )}
              >
                <h2 className="text-xl font-semibold mb-4">Gérer le rôle</h2>
                <form onSubmit={handleManageRole}>
                  <div className="mb-4">
                    <label
                      className={cn('block text-sm font-medium mb-1', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}
                    >
                      Rôle
                    </label>
                    <select
                      value={manageUser.role}
                      onChange={(e) => setManageUser({ ...manageUser, role: e.target.value })}
                      className={cn(
                        'w-full p-3 rounded-lg border focus:ring-2 focus:ring-elite-red-400 transition-all',
                        darkMode ? 'bg-elite-black-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      )}
                    >
                      <option value="utilisateur">Utilisateur</option>
                      <option value="coach">Coach</option>
                      <option value="entreprise">Entreprise</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className={cn(
                        'flex-1 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 hover:shadow-lg',
                        darkMode
                          ? 'bg-elite-red-500 text-white hover:bg-elite-red-600'
                          : 'bg-elite-red-400 text-white hover:bg-elite-red-500'
                      )}
                    >
                      Sauvegarder
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManageRoleModal(false)}
                      className={cn(
                        'flex-1 py-3 rounded-lg font-semibold transition-all duration-200',
                        darkMode
                          ? 'bg-gray-600 text-elite-yellow-100 hover:bg-gray-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      )}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {error && (
            <div
              className={cn(
                'mb-6 p-4 rounded-lg text-sm font-medium',
                darkMode ? 'bg-elite-red-900/20 text-elite-red-400' : 'bg-red-50 text-elite-red-600'
              )}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className={cn('text-center p-4', darkMode ? 'text-elite-yellow-100' : 'text-gray-600')}>
              Chargement...
            </div>
          ) : (
            <div className="bg-white dark:bg-elite-black-800 rounded-xl shadow-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className={cn(darkMode ? 'bg-elite-black-700' : 'bg-gray-50')}>
                  <tr>
                    <th className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-elite-red-500 rounded"
                      />
                    </th>
                    <th
                      className={cn('p-4 text-left font-semibold', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}
                    >
                      Nom
                    </th>
                    <th
                      className={cn('p-4 text-left font-semibold', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}
                    >
                      Email
                    </th>
                    <th
                      className={cn('p-4 text-left font-semibold', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}
                    >
                      Rôle
                    </th>
                    <th
                      className={cn('p-4 text-left font-semibold', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}
                    >
                      Téléphone
                    </th>
                    <th
                      className={cn('p-4 text-left font-semibold', darkMode ? 'text-elite-yellow-100' : 'text-gray-700')}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={cn(
                        'border-t',
                        darkMode ? 'border-gray-700 hover:bg-elite-black-700' : 'border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={() => handleSelectUser(u.id)}
                          className="h-4 w-4 text-elite-red-500 rounded"
                        />
                      </td>
                      <td className={cn('p-4', darkMode ? 'text-white' : 'text-gray-800')}>
                        {u.nomComplet || `${u.nom || ''} ${u.prenom || ''}`.trim()}
                      </td>
                      <td className={cn('p-4', darkMode ? 'text-white' : 'text-gray-800')}>{u.email}</td>
                      <td className={cn('p-4', darkMode ? 'text-white' : 'text-gray-800')}>{u.role}</td>
                      <td className={cn('p-4', darkMode ? 'text-white' : 'text-gray-800')}>{u.numero_de_telephone}</td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => openEditForm(u)}
                          className={cn(
                            'p-2 rounded-full transition-colors',
                            darkMode
                              ? 'text-elite-yellow-400 hover:bg-elite-yellow-900/20'
                              : 'text-elite-yellow-500 hover:bg-elite-yellow-100'
                          )}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className={cn(
                            'p-2 rounded-full transition-colors',
                            darkMode
                              ? 'text-elite-red-400 hover:bg-elite-red-900/20'
                              : 'text-elite-red-500 hover:bg-elite-red-100'
                          )}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openManageRoleModal(u)}
                          className={cn(
                            'p-2 rounded-full transition-colors',
                            darkMode
                              ? 'text-elite-blue-400 hover:bg-elite-blue-900/20'
                              : 'text-elite-blue-500 hover:bg-elite-blue-100'
                          )}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserList;