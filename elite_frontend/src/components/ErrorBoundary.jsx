import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-elite-black-100 to-elite-black-300 dark:from-elite-black-900 dark:to-black">
          <div className="text-center bg-white dark:bg-elite-black-800 rounded-xl shadow-xl p-8">
            <h1 className="text-4xl font-bold text-elite-red-500 dark:text-elite-red-400 mb-4">
              Une erreur s'est produite
            </h1>
            <p className="text-elite-black-600 dark:text-elite-black-300 mb-6">
              {this.state.error?.message || 'Une erreur inattendue est survenue.'}
            </p>
            <Link
              to="/"
              className="bg-elite-red-500 text-white px-6 py-3 rounded-lg hover:bg-elite-red-600 transition-colors"
            >
              Retour à l'Accueil
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;