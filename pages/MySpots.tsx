import React, { useState, useEffect } from 'react';
import { User, Availability, Reservation, ReservationStatus } from '../types';
import { storage } from '../services/storage';
import { formatDateForDisplay } from '../utils/dateUtils';
import { Plus, Trash2, Calendar, Check, X, Clock, AlertOctagon, Loader2, ArrowRight } from 'lucide-react';

interface MySpotsProps {
  user: User;
}

export const MySpots: React.FC<MySpotsProps> = ({ user }) => {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Availability Form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, [user.id]);

  const refreshData = async () => {
    setLoading(true);
    try {
        const [myAvails, reqs] = await Promise.all([
            storage.getAvailabilitiesForUser(user.id),
            storage.getIncomingReservations(user.id)
        ]);

        setAvailabilities(myAvails);
        
        reqs.sort((a, b) => {
            if (a.status === ReservationStatus.PENDING && b.status !== ReservationStatus.PENDING) return -1;
            if (a.status !== ReservationStatus.PENDING && b.status === ReservationStatus.PENDING) return 1;
            // Fallback for missing dates in sorting
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            return dateB - dateA;
        });
        setReservations(reqs);
    } catch (e) {
        console.error("Error loading spots", e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    
    if (new Date(startDate) > new Date(endDate)) {
        alert("La date de fin doit être après la date de début");
        return;
    }

    setIsSubmitting(true);
    try {
        await storage.addAvailability({
            providerId: user.id,
            providerUsername: user.username,
            spotNumber: user.assignedSpot,
            startDate,
            endDate
        });
        
        setStartDate('');
        setEndDate('');
        setShowForm(false);
        await refreshData();
    } catch (e) {
        alert("Erreur lors de la création");
    } finally {
        setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
      if (itemToDelete) {
        // Optimistic
        setAvailabilities(prev => prev.filter(a => a.id !== itemToDelete));
        await storage.deleteAvailability(itemToDelete);
        setItemToDelete(null);
      }
  };

  const handleReservationAction = async (id: string, status: ReservationStatus) => {
      // Optimistic
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      await storage.updateReservationStatus(id, status);
  };

  if (loading && availabilities.length === 0 && reservations.length === 0) {
      return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
      
      {/* Custom Delete Modal */}
      {itemToDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
                  <div className="flex items-center gap-3 text-red-600 mb-4">
                      <AlertOctagon size={24} />
                      <h3 className="text-lg font-bold">Confirmer</h3>
                  </div>
                  <p className="text-slate-600 mb-6">
                      Voulez-vous vraiment retirer cette disponibilité ?
                  </p>
                  <div className="flex gap-3 justify-end">
                      <button 
                          onClick={() => setItemToDelete(null)}
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                      >
                          Annuler
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                      >
                          Supprimer
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Left Column: My Shared Slots */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Mes Disponibilités</h2>
            <button 
                onClick={() => setShowForm(!showForm)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
                <Plus size={16} />
                Nouvelle
            </button>
        </div>

        {showForm && (
            <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm animate-fade-in">
                <form onSubmit={handleCreateAvailability} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Du</label>
                            <input 
                                type="date" 
                                required
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Au</label>
                            <input 
                                type="date" 
                                required
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Annuler</button>
                        <button type="submit" disabled={isSubmitting} className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50">
                            {isSubmitting ? "Publication..." : "Publier"}
                        </button>
                    </div>
                </form>
            </div>
        )}

        <div className="space-y-4">
            {availabilities.length > 0 ? (
                availabilities.map(avail => (
                    <div key={avail.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">
                                    {avail.startDate ? `Du ${formatDateForDisplay(avail.startDate)} au ${formatDateForDisplay(avail.endDate)}` : 'Dates inconnues'}
                                </p>
                                <p className="text-xs text-slate-500">Place {avail.spotNumber}</p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setItemToDelete(avail.id);
                            }}
                            className="flex items-center gap-2 text-slate-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors cursor-pointer group"
                            title="Supprimer"
                        >
                            <Trash2 size={18} className="group-hover:stroke-red-600" />
                            <span className="text-sm font-medium group-hover:text-red-600">Supprimer</span>
                        </button>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                    Vous n'avez pas partagé votre place.
                </div>
            )}
        </div>
      </div>

      {/* Right Column: Incoming Reservations */}
      <div className="space-y-6">
         <h2 className="text-2xl font-bold text-slate-800">Demandes Reçues</h2>
         
         <div className="space-y-4">
            {reservations.length > 0 ? (
                reservations.map(res => (
                    <div key={res.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">
                                    {res.reserverUsername}
                                </h3>
                                <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                    {res.startDate ? (
                                        <>
                                            <span>Du {formatDateForDisplay(res.startDate)}</span>
                                            <ArrowRight size={12}/>
                                            <span>Au {formatDateForDisplay(res.endDate)}</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-400 italic">Dates non disponibles</span>
                                    )}
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                res.status === ReservationStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                                res.status === ReservationStatus.APPROVED ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {res.status === ReservationStatus.PENDING ? 'En attente' : 
                                 res.status === ReservationStatus.APPROVED ? 'Approuvé' : 'Rejeté'}
                            </div>
                        </div>
                        
                        {res.status === ReservationStatus.PENDING && (
                            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={() => handleReservationAction(res.id, ReservationStatus.APPROVED)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Check size={16}/> Accepter
                                </button>
                                <button 
                                    onClick={() => handleReservationAction(res.id, ReservationStatus.REJECTED)}
                                    className="flex-1 bg-white border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <X size={16}/> Refuser
                                </button>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                    Aucune demande de réservation reçue.
                </div>
            )}
         </div>
      </div>

    </div>
  );
};