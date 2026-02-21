import React, { useEffect, useState } from 'react';
import { User, Reservation, ReservationStatus } from '../types';
import { storage } from '../services/storage';
import { formatDateForDisplay } from '../utils/dateUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Calendar, CheckCircle, XCircle, Clock, Award, ArrowRight, PlusCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserDashboardProps {
  user: User;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({ daysProvided: 0, daysReserved: 0 });
  const [leaderboard, setLeaderboard] = useState<{ username: string; daysProvided: number }[]>([]);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    setLoading(true);
    try {
        const [s, l, myRes] = await Promise.all([
            storage.getUserStats(user.id),
            storage.getLeaderboard(),
            storage.getMyReservations(user.id)
        ]);

        setStats(s);
        setLeaderboard(l.slice(0, 5));
        
        // Sort by date descending
        myRes.sort((a, b) => {
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
        setRecentReservations(myRes.slice(0, 5));

    } catch (e) {
        console.error("Failed to load dashboard data", e);
    } finally {
        setLoading(false);
    }
  };

  // Changed to green/emerald shades
  const data = [
    { name: 'Fournies', value: stats.daysProvided, color: '#10b981' }, // emerald-500
    { name: 'Réservées', value: stats.daysReserved, color: '#f59e0b' }, // amber-500
  ];

  const hasData = stats.daysProvided > 0 || stats.daysReserved > 0;

  if (loading) {
      return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Bonjour, {user.username} 👋</h1>
            <p className="text-slate-500">Voici un aperçu de votre activité sur SocPark.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Quick Action: Book a Spot (Prominent) */}
        <Link to="/marketplace" className="bg-emerald-600 p-6 rounded-xl shadow-md border border-emerald-500 flex flex-col items-center justify-center text-white hover:bg-emerald-700 transition-all transform hover:scale-[1.02] cursor-pointer group">
            <div className="p-4 bg-white/20 rounded-full mb-4 group-hover:bg-white/30 transition-colors">
                <PlusCircle size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold">Réserver une place</h3>
            <p className="text-emerald-100 text-sm mt-2 font-medium">Voir les disponibilités</p>
        </Link>

        {/* Stat Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
             <Calendar size={20} className="text-emerald-600"/>
             Mon Bilan
           </h3>
           <div className="h-64">
             {hasData ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={data}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {data.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip />
                   <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <p>Pas encore de données</p>
                </div>
             )}
           </div>
           <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <span className="block text-2xl font-bold text-emerald-700">{stats.daysProvided}</span>
                <span className="text-xs text-emerald-600 font-medium uppercase">Jours Fournis</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <span className="block text-2xl font-bold text-amber-600">{stats.daysReserved}</span>
                <span className="text-xs text-amber-600 font-medium uppercase">Jours Réservés</span>
              </div>
           </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Award size={20} className="text-yellow-500"/>
            Top Contributeurs
          </h3>
          <div className="space-y-4">
            {leaderboard.length > 0 ? (
              leaderboard.map((l, index) => (
                <div key={l.username} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-600'}`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-700">{l.username}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{l.daysProvided} j</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-10">Aucun contributeur pour le moment</p>
            )}
          </div>
        </div>

        {/* Recent Reservations Status (Full Width on Mobile) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-slate-600"/>
            Mes Dernières Réservations
          </h3>
          <div className="space-y-3">
             {recentReservations.length > 0 ? (
               recentReservations.map(res => (
                 <div key={res.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-medium text-slate-800 flex items-center gap-2 text-sm">
                          <span>{formatDateForDisplay(res.startDate)}</span>
                          <ArrowRight size={12} className="text-slate-400" />
                          <span>{formatDateForDisplay(res.endDate)}</span>
                      </div>
                      <p className="text-xs text-slate-500">Place {res.spotNumber}</p>
                    </div>
                    <div>
                       {res.status === ReservationStatus.APPROVED && <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full"><CheckCircle size={12}/> CONFIRMÉ</span>}
                       {res.status === ReservationStatus.REJECTED && <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full"><XCircle size={12}/> REFUSÉ</span>}
                       {res.status === ReservationStatus.PENDING && <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full"><Clock size={12}/> EN ATTENTE</span>}
                    </div>
                 </div>
               ))
             ) : (
                <p className="text-slate-400 text-center py-10">Aucune réservation récente</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};