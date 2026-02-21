import React, { useState, useEffect } from 'react';
import { User, Availability, Reservation, ReservationStatus } from '../types';
import { storage } from '../services/storage';
import { formatDateForDisplay } from '../utils/dateUtils';
import { Search, ArrowRight, Check, Loader2, CalendarRange } from 'lucide-react';

interface MarketplaceProps {
  user: User;
  title?: string;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ user, title }) => {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  useEffect(() => {
    refreshData();
  }, [user.id]);

  const refreshData = async () => {
    setLoading(true);
    try {
        const [allAvails, allRes] = await Promise.all([
            storage.getAllAvailabilities(),
            storage.getAllReservations()
        ]);
        
        // Sort by start date
        allAvails.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setAvailabilities(allAvails);
        setAllReservations(allRes);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }

  const handleReserve = async (avail: Availability) => {
    setMessage(null);
    setProcessingId(avail.id);
    try {
        await storage.createReservation({
            availabilityId: avail.id,
            reserverId: user.id,
            reserverUsername: user.username,
            providerId: avail.providerId,
            spotNumber: avail.spotNumber,
            startDate: avail.startDate,
            endDate: avail.endDate,
        });
        setMessage({ type: 'success', text: `Demande envoyée pour la place ${avail.spotNumber} (Du ${formatDateForDisplay(avail.startDate)} au ${formatDateForDisplay(avail.endDate)})`});
        await refreshData(); 
    } catch (e: any) {
        setMessage({ type: 'error', text: e.message });
    } finally {
        setProcessingId(null);
    }
  };

  const isAvailabilityTaken = (avail: Availability) => {
      // Check if there is any reservation for this availability (by ID or overlapping spot)
      // Since users book the "entire duration", we mainly check if there is a pending/approved reservation for this specific availabilityID.
      // However, checking overlaps is safer if the backend allowed partials previously.
      // We stick to: Is there a non-rejected reservation for this availability ID?
      const reserved = allReservations.some(r => {
          return r.availabilityId === avail.id && r.status !== ReservationStatus.REJECTED;
      });
      return reserved;
  };

  // Filter logic: Only show availabilities that are NOT taken
  const visibleAvailabilities = availabilities.filter(avail => {
      // Don't show my own spots
      if (String(avail.providerId) === String(user.id)) return false;
      
      // Don't show past availabilities (optional, but good UX)
      // const isPast = new Date(avail.endDate) < new Date();
      // if (isPast) return false;

      // Don't show taken spots
      if (isAvailabilityTaken(avail)) return false;
      
      return true;
  });

  if (loading && availabilities.length === 0) {
      return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">{title || "Réserver une place"}</h1>
            <p className="text-slate-500">Réservez une place disponible pour toute la durée proposée.</p>
        </div>
       </div>

       {message && (
         <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} flex items-center gap-2 animate-fade-in`}>
            {message.type === 'success' ? <Check size={18} /> : null}
            {message.text}
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {visibleAvailabilities.length > 0 ? (
            visibleAvailabilities.map(avail => {
                return (
                    <div key={avail.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-5 border-b border-slate-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Place {avail.spotNumber}</h3>
                                    <p className="text-sm text-slate-500">Proposé par <span className="font-semibold text-emerald-600">{avail.providerUsername}</span></p>
                                </div>
                                <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                                    Dispo
                                </div>
                            </div>
                        </div>
                        <div className="p-5 bg-slate-50/50">
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 bg-white p-3 rounded border border-slate-100">
                                <CalendarRange size={16} className="text-slate-400"/>
                                <span className="font-medium">Du {formatDateForDisplay(avail.startDate)}</span>
                                <ArrowRight size={14} className="text-slate-400"/>
                                <span className="font-medium">Au {formatDateForDisplay(avail.endDate)}</span>
                            </div>
                            
                            <button 
                                onClick={() => handleReserve(avail)}
                                disabled={processingId === avail.id}
                                className="w-full font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
                            >
                                {processingId === avail.id ? <Loader2 className="animate-spin" size={18} /> : 
                                    "Réserver cette période"}
                            </button>
                        </div>
                    </div>
                );
            })
         ) : (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p>Aucune place disponible pour le moment.</p>
                <p className="text-sm mt-2">Revenez plus tard !</p>
            </div>
         )}
       </div>
    </div>
  );
};