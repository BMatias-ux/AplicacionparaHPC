import React, { useState } from 'react';
import { UserProfile, NewsArticle } from '../types';
import { NEWS_ARTICLES } from '../mockData';
import { ArticleModal } from './ArticleModal';
import { ChevronRight, Calendar, HeartPulse, FileText, ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface HomeScreenProps {
  user: UserProfile;
  onNavigateToBooking: () => void;
  onNavigateToTab: (tab: 'turnos' | 'actividades' | 'mis-datos' | 'mas') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onNavigateToBooking,
  onNavigateToTab,
}) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const displayName = user.nombre ? user.nombre : 'Matias';
  const initials = `${user.nombre?.charAt(0) || 'M'}${user.apellido?.charAt(0) || 'B'}`;

  return (
    <div className="flex-1 bg-[#F9FBFC] text-[#2D3748] overflow-y-auto pb-24 no-scrollbar">
      {/* Editorial Header */}
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sm:px-8 shrink-0 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0D9488] rounded-xl flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-[#1A202C]">
              HABILIDADES
            </span>
            <span className="text-[10px] font-bold text-[#0D9488] tracking-widest uppercase">
              Para el Cambio
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigateToTab('mis-datos')}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#1A202C]">{displayName} {user.apellido}</p>
            <p className="text-[10px] text-gray-500 font-medium">Paciente No. 4920</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-teal-50 border-2 border-[#0D9488]/30 shadow-xs overflow-hidden flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#0D9488] text-xs font-extrabold">{initials}</span>
            )}
          </div>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* Editorial Hero Gradient Banner */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0D9488] via-[#0F766E] to-[#134E4A] p-6 sm:p-8 text-white flex flex-col justify-end shadow-xl shadow-teal-900/10 min-h-[190px]">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
            <Sparkles className="w-40 h-40" />
          </div>

          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200 bg-white/15 backdrop-blur-xs px-2.5 py-1 rounded-full inline-block mb-3">
              Portal del Paciente
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              ¡Hola {displayName}!
            </h1>
            <p className="text-teal-50 text-sm sm:text-base opacity-95 max-w-lg leading-relaxed">
              Tu bienestar mental es nuestra prioridad. Estamos aquí para acompañarte en cada paso de tu tratamiento.
            </p>
          </div>
        </section>

        {/* Primary CTA Card: "Sacar un Turno" */}
        <div
          onClick={onNavigateToBooking}
          className="bg-[#0D9488] rounded-3xl p-6 text-white text-center shadow-lg shadow-teal-900/15 cursor-pointer hover:bg-[#0F766E] active:scale-98 transition-all group"
        >
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3.5 group-hover:scale-105 transition-transform">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-1 tracking-tight">Pedir turno de admisión</h3>
          <p className="text-sm text-teal-100">Reservá tu consulta presencial u online en minutos</p>
        </div>

        {/* Quick Access Services */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={onNavigateToBooking}
            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs hover:border-[#0D9488] hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center mb-2 group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
              <HeartPulse size={20} />
            </div>
            <span className="text-xs font-bold text-[#1A202C]">Turnos</span>
            <span className="text-[10px] text-gray-500 mt-0.5">Reservar cita</span>
          </button>

          <button
            onClick={() => onNavigateToTab('actividades')}
            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs hover:border-[#0D9488] hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center mb-2 group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
              <FileText size={20} />
            </div>
            <span className="text-xs font-bold text-[#1A202C]">Actividades</span>
            <span className="text-[10px] text-gray-500 mt-0.5">Ejercicios TCC</span>
          </button>

          <button
            onClick={() => onNavigateToTab('mas')}
            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs hover:border-[#0D9488] hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center mb-2 group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xs font-bold text-[#1A202C]">Contacto</span>
            <span className="text-[10px] text-gray-500 mt-0.5">Sede & Ayuda</span>
          </button>
        </div>

        {/* Editorial News Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#1A202C]">
              Noticias y Recomendaciones
            </h2>
            <button
              onClick={() => setSelectedArticle(NEWS_ARTICLES[0])}
              className="text-xs font-bold text-[#0D9488] hover:text-[#0F766E] uppercase tracking-wider flex items-center gap-0.5"
            >
              <span>Ver todo</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3.5">
            {NEWS_ARTICLES.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="w-full bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex gap-4 shadow-xs hover:border-teal-200 hover:shadow-md cursor-pointer transition-all group"
              >
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-100 rounded-xl shrink-0 bg-cover bg-center overflow-hidden border border-gray-100 group-hover:scale-102 transition-transform"
                  style={{ backgroundImage: `url(${article.image})` }}
                />
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#0D9488] mb-1.5 block">
                      {article.category}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-[#1A202C] leading-snug line-clamp-2 group-hover:text-[#0D9488] transition-colors">
                      {article.title}
                    </h3>
                  </div>
                  <div className="flex items-center text-xs text-gray-400 gap-2 mt-2">
                    <span>{article.readTime}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Article Reader Modal */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
};
