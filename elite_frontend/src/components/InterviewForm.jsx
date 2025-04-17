import React, { useState } from 'react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { useDarkMode } from '../DarkModeContext';

const InterviewForm = ({ user, onSave }) => {
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    target_audience: '', // Valeur initiale vide, sera mise à jour par le select
  });
  const [error, setError] = useState(null);

  // Liste d'options pour l'audience cible (vous pouvez la personnaliser)
  const audienceOptions = [
    { value: 'developers', label: 'Développeurs' },
    { value: 'designers', label: 'Designers' },
    { value: 'managers', label: 'Managers' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'students', label: 'Étudiants' },
    { value: 'all', label: 'Tous' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/interviews', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      onSave(response.data); // Appeler la fonction onSave avec le nouvel entretien
      setFormData({ title: '', description: '', date: '', target_audience: '' }); // Réinitialiser le formulaire
      setError(null);
    } catch (error) {
      console.error('Error creating interview:', error);
      setError(error.response?.data?.message || "Erreur lors de la création de l'entretien.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-2 bg-elite-red-500/20 text-elite-red-500 rounded">{error}</div>}
      <div>
        <label className={cn('block', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
          Titre
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={cn(
            'w-full p-2 border rounded focus:ring-2 focus:ring-elite-red-500',
            darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300'
          )}
          required
        />
      </div>
      <div>
        <label className={cn('block', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={cn(
            'w-full p-2 border rounded focus:ring-2 focus:ring-elite-red-500',
            darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300'
          )}
          required
        />
      </div>
      <div>
        <label className={cn('block', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
          Date
        </label>
        <input
          type="datetime-local"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className={cn(
            'w-full p-2 border rounded focus:ring-2 focus:ring-elite-red-500',
            darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300'
          )}
          required
        />
      </div>
      <div>
        <label className={cn('block', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
          Audience cible
        </label>
        <select
          value={formData.target_audience}
          onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
          className={cn(
            'w-full p-2 border rounded focus:ring-2 focus:ring-elite-red-500',
            darkMode ? 'bg-elite-black-800 text-elite-yellow-100 border-elite-black-700' : 'bg-white text-elite-black-900 border-gray-300'
          )}
          required
        >
          <option value="" disabled>
            Sélectionnez une audience
          </option>
          {audienceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className={cn(
          'w-full bg-elite-yellow-400 text-black py-2 rounded-lg hover:bg-elite-yellow-500 transition-colors'
        )}
      >
        Ajouter l'entretien
      </button>
    </form>
  );
};

export default InterviewForm;