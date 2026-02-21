import React, { useState } from 'react';
import { storage } from '../services/storage';
import { User } from '../types';
import { Car, Lock, User as UserIcon, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

type AuthView = 'login' | 'register' | 'forgot';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [spot, setSpot] = useState('');

  const clearState = () => {
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setSpot('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (view === 'register') {
        // Validation for registration
        const usernameRegex = /^[A-Z]{4}$/;
        if (!usernameRegex.test(username)) {
          throw new Error("Le nom d'utilisateur doit comporter exactement 4 lettres majuscules.");
        }
        if (!password || password.length < 4) {
          throw new Error("Le mot de passe est trop court.");
        }
        if (!spot) {
          throw new Error("Veuillez renseigner votre place attribuée.");
        }

        await storage.register({
          username,
          password,
          assignedSpot: spot
        });
        
        setSuccess("Compte créé avec succès ! Attendez l'approbation d'un administrateur.");
        setView('login');
        setUsername('');
        setPassword('');
        setSpot('');

      } else if (view === 'login') {
        const user = await storage.login(username, password);
        onLogin(user);

      } else if (view === 'forgot') {
         if (!username) throw new Error("Veuillez entrer votre nom d'utilisateur");
         await storage.requestPasswordReset(username);
         setSuccess("Demande envoyée. Un administrateur réinitialisera votre mot de passe.");
         setTimeout(() => {
             setView('login');
             setSuccess('');
         }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
      clearState();
      setView(newView);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-800">
        <div className="bg-emerald-900 p-8 text-center">
           <div className="mx-auto bg-emerald-800 w-16 h-16 rounded-full flex items-center justify-center mb-4 ring-4 ring-emerald-800/50">
             <Car className="text-white" size={32} />
           </div>
           <h1 className="text-3xl font-bold text-white tracking-tight">SocPark</h1>
           <p className="text-emerald-200 mt-2">Gestion de parking simplifiée</p>
        </div>

        <div className="p-8">
          <div className="mb-6 text-center relative">
             {view !== 'login' && (
                 <button onClick={() => switchView('login')} className="absolute left-0 top-0 text-slate-400 hover:text-white transition-colors">
                     <ArrowLeft size={20}/>
                 </button>
             )}
             <h2 className="text-xl font-semibold text-white">
                {view === 'register' ? "Créer un compte" : view === 'forgot' ? "Mot de passe oublié" : "Connexion"}
             </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded-md text-sm border border-red-900/50">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-900/30 text-emerald-300 rounded-md text-sm border border-emerald-900/50 flex items-center gap-2">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Nom d'utilisateur (4 Lettres Maj)</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase().slice(0, 4))}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors uppercase placeholder-slate-500"
                  placeholder="EX: ABCD"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {view !== 'forgot' && (
                <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Mot de passe</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder-slate-500"
                    placeholder="••••••••"
                    required
                    />
                </div>
                </div>
            )}

            {view === 'register' && (
               <div>
               <label className="block text-sm font-medium text-slate-200 mb-1">Place Attribuée</label>
               <div className="relative">
                 <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} />
                 <input
                   type="text"
                   value={spot}
                   onChange={(e) => setSpot(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder-slate-500"
                   placeholder="Ex: A-42"
                   required
                 />
               </div>
             </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-lg shadow-emerald-900/20"
            >
              {loading ? "Chargement..." : 
                view === 'register' ? "S'inscrire" : 
                view === 'forgot' ? "Envoyer demande" : 
                "Se connecter"
              }
            </button>
          </form>

          {view === 'login' && (
              <div className="mt-6 space-y-3 text-center">
                <button
                onClick={() => switchView('register')}
                className="block w-full text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                Pas de compte ? S'inscrire
                </button>
                <button
                onClick={() => switchView('forgot')}
                className="block w-full text-xs text-slate-500 hover:text-slate-300 hover:underline"
                >
                Mot de passe oublié ?
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};