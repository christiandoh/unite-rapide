import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#08080F] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl font-bold">!</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Une erreur est survenue</h1>
            <p className="text-white/50 mb-6">L'application a rencontre un probleme. Rafraichis la page pour continuer.</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all"
            >
              Rafraichir la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
