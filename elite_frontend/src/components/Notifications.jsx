import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import Swal from 'sweetalert2';
import { useDarkMode } from '../DarkModeContext';

const Notifications = ({ user }) => {
  const { darkMode } = useDarkMode();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coachesAndEnterprises, setCoachesAndEnterprises] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState({});

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await api.get('/enterprise-notifications', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setNotifications(response.data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des notifications:', err);
        setError('Erreur lors du chargement des notifications.');
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors du chargement des notifications.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            popup: darkMode ? 'dark-swal bg-elite-black-800 text-elite-yellow-100' : 'bg-white text-elite-black-900',
          },
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchCoachesAndEnterprises = async () => {
      try {
        const response = await api.get('/users?role=coach,entreprise', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const usersData = response.data.data || response.data;
        if (!Array.isArray(usersData)) {
          throw new Error('Invalid users data format');
        }
        setCoachesAndEnterprises(usersData);
      } catch (err) {
        console.error('Erreur lors du chargement des coachs et entreprises:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors du chargement des utilisateurs.',
          toast: true,
          position: 'top',
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            popup: darkMode ? 'dark-swal bg-elite-black-800 text-elite-yellow-100' : 'bg-white text-elite-black-900',
          },
        });
      }
    };

    fetchNotifications();
    fetchCoachesAndEnterprises();
  }, [user, darkMode]);

  const handleCheckboxChange = (notificationId, userId) => {
    setSelectedUsers((prev) => ({
      ...prev,
      [notificationId]: {
        ...prev[notificationId],
        [userId]: !prev[notificationId]?.[userId],
      },
    }));
  };

  const handleAssignUsers = async (notificationId) => {
    const selected = selectedUsers[notificationId] || {};
    const userIds = Object.keys(selected)
      .filter((userId) => selected[userId])
      .map(Number);

    if (userIds.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Aucun utilisateur sélectionné',
        text: 'Veuillez sélectionner au moins un coach ou une entreprise.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-elite-black-800 text-elite-yellow-100' : 'bg-white text-elite-black-900',
        },
      });
      return;
    }

    try {
      await api.post(
        `/notifications/${notificationId}/assign`,
        { user_ids: userIds },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Utilisateurs assignés avec succès.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-elite-black-800 text-elite-yellow-100' : 'bg-white text-elite-black-900',
        },
      });
    } catch (err) {
      console.error('Erreur lors de l’assignation des utilisateurs:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l’assignation des utilisateurs.',
        toast: true,
        position: 'top',
        timer: 3000,
        showConfirmButton: false,
        customClass: {
          popup: darkMode ? 'dark-swal bg-elite-black-800 text-elite-yellow-100' : 'bg-white text-elite-black-900',
        },
      });
    }
  };

  if (loading) {
    return (
      <div className={cn('text-center p-4', darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
        Chargement des notifications...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'p-4 rounded-lg',
          darkMode ? 'bg-elite-red-900/30 text-elite-red-400' : 'bg-elite-red-500/20 text-elite-red-500'
        )}
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <p className={cn(darkMode ? 'text-elite-yellow-100' : 'text-elite-black-900')}>
          Aucune notification disponible.
        </p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'p-4 rounded-lg shadow-md',
              darkMode ? 'bg-elite-black-800 text-elite-yellow-100' : 'bg-white text-elite-black-900'
            )}
          >
            <h3 className="text-lg font-semibold">{notification.title}</h3>
            <p className="text-sm">{notification.message}</p>
            <p className="text-xs mt-2">
              <strong>Date :</strong>{' '}
              {new Date(notification.created_at).toLocaleString()}
            </p>
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Assigner à :</h4>
              <div className="space-y-2">
                {coachesAndEnterprises.map((u) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers[notification.id]?.[u.id] || false}
                      onChange={() => handleCheckboxChange(notification.id, u.id)}
                      className="h-4 w-4 text-elite-green-500 focus:ring-elite-green-500"
                    />
                    <span>
                      {u.nomComplet || u.company_name} ({u.role})
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleAssignUsers(notification.id)}
                className={cn(
                  'mt-4 py-2 px-4 rounded-lg transition-colors duration-300',
                  darkMode
                    ? 'bg-elite-green-500 text-white hover:bg-elite-green-600'
                    : 'bg-elite-green-500 text-white hover:bg-elite-green-600'
                )}
              >
                Assigner
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Notifications;