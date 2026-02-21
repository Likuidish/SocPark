import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { storage } from '../services/storage';
import { CheckCircle, UserCheck, Pencil, Save, X, KeyRound, AlertTriangle, Trash2, UserPlus, AlertOctagon, Loader2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSpotValue, setEditSpotValue] = useState('');
  
  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserSpot, setNewUserSpot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    setLoading(true);
    try {
        const data = await storage.getAllUsers();
        setUsers(data);
    } catch (e) {
        console.error("Failed to load users", e);
    } finally {
        setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    // Optimistic
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    await storage.updateUserStatus(userId, status);
  };

  // --- Add User Logic ---
  const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUserUsername || newUserUsername.length !== 4) {
          alert("Le nom d'utilisateur doit faire exactement 4 lettres.");
          return;
      }
      if (!newUserSpot) {
          alert("La place est requise.");
          return;
      }

      setIsSubmitting(true);
      try {
          await storage.adminAddUser(newUserUsername.toUpperCase(), newUserSpot);
          setNewUserUsername('');
          setNewUserSpot('');
          setShowAddUser(false);
          await refreshUsers(); 
          alert("Utilisateur ajouté avec succès (MDP: 1234)");
      } catch (e: any) {
          alert(e.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- Edit Spot Logic ---
  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditSpotValue(user.assignedSpot);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSpotValue('');
  };

  const saveEdit = async (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, assignedSpot: editSpotValue } : u));
    await storage.updateUserSpot(userId, editSpotValue);
    setEditingId(null);
    setEditSpotValue('');
  };

  // --- User Management Logic ---
  const resetPassword = async (userId: string) => {
      if(window.confirm('Réinitialiser le mot de passe de cet utilisateur à "1234" ?')) {
          await storage.adminResetPassword(userId);
          alert('Mot de passe réinitialisé à "1234"');
          refreshUsers();
      }
  };

  const confirmDeleteUser = async () => {
      if (userToDelete) {
          // Optimistic UI update
          setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
          await storage.deleteUser(userToDelete.id);
          setUserToDelete(null);
      }
  };

  const pendingUsers = users.filter(u => u.status === UserStatus.PENDING);
  const resetRequestedUsers = users.filter(u => u.passwordResetRequested);
  const activeUsers = users.filter(u => u.status === UserStatus.APPROVED && !u.isAdmin);

  if (loading && users.length === 0) {
      return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;
  }

  return (
    <div className="space-y-8 relative">
      
      {/* Delete Confirmation Modal */}
      {userToDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
                  <div className="flex items-center gap-3 text-red-600 mb-4">
                      <AlertOctagon size={24} />
                      <h3 className="text-lg font-bold">Confirmer la suppression</h3>
                  </div>
                  <p className="text-slate-600 mb-6">
                      Voulez-vous vraiment supprimer définitivement l'utilisateur <span className="font-bold text-slate-800">{userToDelete.username}</span> ?
                      <br/><br/>
                      <span className="text-xs text-red-500">Cette action est irréversible.</span>
                  </p>
                  <div className="flex gap-3 justify-end">
                      <button 
                          onClick={() => setUserToDelete(null)}
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                      >
                          Annuler
                      </button>
                      <button 
                          onClick={confirmDeleteUser}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                      >
                          Supprimer
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-800">Administration</h1>
          <button 
            onClick={() => setShowAddUser(!showAddUser)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
          >
              <UserPlus size={18} />
              Nouvel Utilisateur
          </button>
      </div>

      {/* Add User Form */}
      {showAddUser && (
          <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-md animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Ajouter un collaborateur</h3>
              <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Trigramme (4 lettres)</label>
                      <input 
                        type="text" 
                        value={newUserUsername}
                        onChange={e => setNewUserUsername(e.target.value.toUpperCase())}
                        maxLength={4}
                        placeholder="EX: ABCD"
                        className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500 uppercase"
                        required
                      />
                  </div>
                  <div className="flex-1 w-full">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Place attribuée</label>
                      <input 
                        type="text" 
                        value={newUserSpot}
                        onChange={e => setNewUserSpot(e.target.value)}
                        placeholder="A-42"
                        className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                      <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 md:flex-none px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Annuler</button>
                      <button type="submit" disabled={isSubmitting} className="flex-1 md:flex-none px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium disabled:opacity-50">
                          {isSubmitting ? "Création..." : "Créer"}
                      </button>
                  </div>
              </form>
          </div>
      )}

      {/* Password Reset Requests */}
      {resetRequestedUsers.length > 0 && (
          <section>
             <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-slate-800">Demandes de réinitialisation MDP</h2>
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">{resetRequestedUsers.length}</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-amber-50 border-b border-amber-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-amber-800 uppercase">Utilisateur</th>
                            <th className="px-6 py-4 text-xs font-semibold text-amber-800 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {resetRequestedUsers.map(u => (
                             <tr key={u.id}>
                                 <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                                     <AlertTriangle size={16} className="text-amber-500"/>
                                     {u.username}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                     <button 
                                        onClick={() => resetPassword(u.id)}
                                        className="text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ml-auto"
                                     >
                                         <KeyRound size={16} /> Réinitialiser à "1234"
                                     </button>
                                 </td>
                             </tr>
                         ))}
                    </tbody>
                </table>
            </div>
          </section>
      )}

      {/* Pending Approvals */}
      <section>
        <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-slate-800">Inscriptions en attente</h2>
            {pendingUsers.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{pendingUsers.length}</span>
            )}
        </div>
        
        {pendingUsers.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Utilisateur</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Place</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pendingUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{u.username}</td>
                                <td className="px-6 py-4 text-slate-600">{u.assignedSpot}</td>
                                <td className="px-6 py-4 flex justify-end gap-2">
                                    <button 
                                        onClick={() => handleStatusChange(u.id, UserStatus.APPROVED)}
                                        className="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                    >
                                        <CheckCircle size={16}/> Approuver
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUserToDelete(u);
                                        }}
                                        className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 size={16}/> Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center text-emerald-800 flex flex-col items-center">
                <UserCheck size={32} className="mb-2 opacity-50"/>
                <p>Aucune demande en attente. Tout est à jour !</p>
            </div>
        )}
      </section>

      {/* User Management */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Membres Actifs</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Utilisateur</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Place (Modifier)</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {activeUsers.length > 0 ? (
                        activeUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium text-slate-800">{u.username}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    {editingId === u.id ? (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                value={editSpotValue}
                                                onChange={(e) => setEditSpotValue(e.target.value)}
                                                className="border border-emerald-300 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                    ) : (
                                        u.assignedSpot || <span className="text-slate-400 italic">Aucune place</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button 
                                            onClick={() => resetPassword(u.id)}
                                            className="text-amber-500 hover:bg-amber-50 p-1 rounded" 
                                            title="Réinitialiser MDP"
                                        >
                                            <KeyRound size={16} />
                                        </button>
                                        
                                        <span className="w-px h-4 bg-slate-300 mx-1"></span>

                                        {editingId === u.id ? (
                                            <>
                                                <button onClick={() => saveEdit(u.id)} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Enregistrer">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={cancelEdit} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Annuler">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => startEdit(u)} className="text-slate-400 hover:text-emerald-600 p-1 rounded transition-colors" title="Modifier la place">
                                                <Pencil size={16} />
                                            </button>
                                        )}
                                        
                                        <span className="w-px h-4 bg-slate-300 mx-1"></span>

                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUserToDelete(u);
                                            }}
                                            className="text-slate-400 hover:text-red-600 p-1 rounded"
                                            title="Supprimer l'utilisateur"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">
                                Aucun membre actif pour le moment.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </section>
    </div>
  );
};