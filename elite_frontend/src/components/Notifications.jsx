import React, { useState, useEffect } from 'react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  // Récupérer les notifications depuis l'API
  const fetchNotifications = async () => {
    const response = await fetch('http://localhost:8000/api/notifications');
    const data = await response.json();
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Ajouter une notification (réservée à l'administrateur)
  const addNotification = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:8000/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        message,
      }),
    });

    const newNotification = await response.json();
    setNotifications([...notifications, newNotification]);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="container">
      <h1>Notifications</h1>

      {/* Affichage des notifications */}
      <div>
        <h2>Toutes les notifications</h2>
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id}>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Formulaire pour ajouter une notification (admin) */}
      <div>
        <h2>Ajouter une notification</h2>
        <form onSubmit={addNotification}>
          <div>
            <label>Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </div>
  );
};

export default Notifications;
