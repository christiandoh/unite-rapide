import React from 'react';
import { TrendingUp, CheckCircle, Smartphone, Clock, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import { COLORS } from '../constants';

export default function DashboardPage({ data, setTab }) {
  const d = data.dashboard;
  const h = data.historique;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Aperçu de votre plateforme USSD</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Commandes aujourd'hui" value={d?.stats_jour?.commandes || 0} color="bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF]" />
        <StatCard icon={CheckCircle} label="Taux de succès" value={`${d?.stats_jour?.taux_succes || 0}%`} color="bg-gradient-to-br from-[#2ED3A0] to-[#5EE0B8]" />
        <StatCard icon={Smartphone} label="Téléphones actifs" value={d?.telephones_actifs || 0} color="bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]" />
        <StatCard icon={Clock} label="File d'attente" value={d?.file_attente || 0} color="bg-gradient-to-br from-[#FFB84D] to-[#FFD580]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 overflow-x-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Évolution des commandes</h3>
          {h?.quotidien ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={h.quotidien}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} stroke="#E5E7EB" />
                <YAxis stroke="#E5E7EB" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  labelFormatter={v => new Date(v).toLocaleDateString('fr-FR')}
                />
                <Line type="monotone" dataKey="total" stroke="#7C5CFC" strokeWidth={2} dot={false} name="Total" />
                <Line type="monotone" dataKey="reussi" stroke="#2ED3A0" strokeWidth={2} dot={false} name="Réussi" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">Données insuffisantes</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition</h3>
          {h?.stats ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Réussies', value: h.quotidien.reduce((s, d) => s + d.reussi, 0) },
                      { name: 'Échouées', value: h.quotidien.reduce((s, d) => s + d.echoue, 0) },
                      { name: 'Autres', value: h.quotidien.reduce((s, d) => s + d.total - d.reussi - d.echoue, 0) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {[0, 1, 2].map(i => <Cell key={i} fill={[COLORS[0], COLORS[2], COLORS[3]][i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 pt-2">
                {[
                  { label: 'Réussies', color: COLORS[0], value: h.quotidien.reduce((s, d) => s + d.reussi, 0) },
                  { label: 'Échouées', color: COLORS[2], value: h.quotidien.reduce((s, d) => s + d.echoue, 0) },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">Données insuffisantes</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Forfaits populaires</h3>
          <button onClick={() => setTab('services')} className="text-xs sm:text-sm text-[#7C5CFC] font-medium hover:underline">Voir tout</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.services.filter(s => s.actif).slice(0, 6).map(s => (
            <div key={s.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#7C5CFC] uppercase bg-[#7C5CFC]/5 px-2 py-1 rounded-lg">{s.operateur.nom}</span>
                {s.populaire && <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFB84D] fill-[#FFB84D]" />}
              </div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">{s.nom}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {Number(s.montantWave).toLocaleString()} <span className="text-xs sm:text-sm font-normal text-gray-400">F</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
