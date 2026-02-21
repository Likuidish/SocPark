import React, { useState } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import { Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface SettingsProps {
  user: User;
}

export const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (newPassword.length < 4) {
          throw new Error("Le nouveau mot de passe est trop court");
      }
      if (newPassword !== confirmPassword) {
          throw new Error("Les nouveaux mots de passe ne correspondent pas");
      }

      await storage.changePassword(user.id, oldPassword, newPassword);
      setSuccess("Mot de passe modifié avec succès !");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || "Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Paramètres</h1>
        <p className="text-slate-500">Gérez vos préférences et votre sécurité.</p>
       </header>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                   <Lock size={20} className="text-emerald-600"/>
                   Sécurité
               </h3>
               <p className="text-sm text-slate-500 mt-1">Modifier votre mot de passe</p>
           </div>
           
           <div className="p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm border border-green-100 flex items-center gap-2">
                        <CheckCircle size={16} />
                        {success}
                    </div>
                )}

               <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Ancien mot de passe</label>
                       <input 
                         type="password" 
                         value={oldPassword}
                         onChange={e => setOldPassword(e.target.value)}
                         className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                         required
                       />
                   </div>
                   
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
                       <input 
                         type="password" 
                         value={newPassword}
                         onChange={e => setNewPassword(e.target.value)}
                         className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                         required
                       />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer nouveau mot de passe</label>
                       <input 
                         type="password" 
                         value={confirmPassword}
                         onChange={e => setConfirmPassword(e.target.value)}
                         className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                         required
                       />
                   </div>

                   <button 
                     type="submit" 
                     disabled={loading}
                     className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                       {loading ? "Enregistrement..." : (
                           <>
                             <Save size={18} />
                             Enregistrer
                           </>
                       )}
                   </button>
               </form>
           </div>
       </div>
    </div>
  );
};