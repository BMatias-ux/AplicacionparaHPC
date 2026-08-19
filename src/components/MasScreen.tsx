import React, { useState } from 'react';
import {
  Settings,
  HelpCircle,
  ChevronRight,
  Info,
  FileQuestion,
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  X,
  Bell,
  Fingerprint,
  ExternalLink,
} from 'lucide-react';

export const MasScreen: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'config' | 'contacto' | 'sobre' | 'faq' | null>(null);
  const [notifAppointments, setNotifAppointments] = useState<boolean>(true);
  const [notifActivities, setNotifActivities] = useState<boolean>(true);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);

  return (
    <div className="flex-1 bg-[#F9FBFC] text-[#2D3748] flex flex-col justify-between overflow-y-auto pb-24 no-scrollbar">
      <div className="bg-[#0D9488] text-white pt-8 pb-6 px-6 rounded-b-3xl shadow-lg shadow-teal-900/10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200 block mb-1">
          Ajustes & Soporte
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Más funcionalidades</h1>
      </div>

      <div className="flex-1 px-6 py-6 space-y-3.5">
        {[
          { id: 'config' as const, label: 'Configuración', icon: Settings },
          { id: 'contacto' as const, label: 'Contacto & Sedes', icon: HelpCircle },
          { id: 'sobre' as const, label: 'Sobre Fundación Habilidades', icon: Info },
          { id: 'faq' as const, label: 'Preguntas Frecuentes', icon: FileQuestion },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModal(item.id)}
              className="w-full bg-white border border-gray-100 rounded-2xl p-4.5 flex items-center justify-between shadow-xs hover:border-[#0D9488] hover:shadow-md active:scale-98 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center font-bold group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
                  <Icon size={22} />
                </div>
                <span className="text-[#1A202C] font-bold text-base">{item.label}</span>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0D9488] transition-colors" />
            </button>
          );
        })}
      </div>

      <div className="py-6 text-center">
        <span className="text-xs font-semibold text-gray-400 tracking-wider">
          Versión 2.0.4 • Habilidades para el Cambio
        </span>
      </div>

      {activeModal === 'config' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-[#1A202C]">Configuración</h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-[#0D9488]" />
                  <div>
                    <p className="font-bold text-gray-800 text-xs">Recordatorios de Turnos</p>
                    <p className="text-[11px] text-gray-500">Notificar 24hs y 2hs antes</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifAppointments}
                  onChange={(e) => setNotifAppointments(e.target.checked)}
                  className="w-5 h-5 accent-[#0D9488] rounded-sm cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Fingerprint size={18} className="text-[#0D9488]" />
                  <div>
                    <p className="font-bold text-gray-800 text-xs">Acceso con Huella / Biometría</p>
                    <p className="text-[11px] text-gray-500">Bloqueo de seguridad médico</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={biometricEnabled}
                  onChange={(e) => setBiometricEnabled(e.target.checked)}
                  className="w-5 h-5 accent-[#0D9488] rounded-sm cursor-pointer"
                />
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-[#0D9488] text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md hover:bg-[#0F766E]"
            >
              Guardar Preferencias
            </button>
          </div>
        </div>
      )}

      {activeModal === 'contacto' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-[#1A202C]">Contacto & Admisión</h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <a
                href="https://wa.me/5491140607020"
                target="_blank"
                rel="noreferrer"
                className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-between group transition-colors block text-emerald-900"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-950">WhatsApp de Admisión</h4>
                    <p className="text-emerald-700">+54 9 11 4060-7020</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-emerald-600" />
              </a>

              <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
                <MapPin size={18} className="text-[#0D9488] shrink-0" />
                <div>
                  <span className="font-bold text-gray-800 block">Sede Central</span>
                  <span className="text-gray-600">Talcahuano 74, CABA • Lun a Vie 08:00 a 20:00 hs</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-[#0D9488] text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md hover:bg-[#0F766E]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {activeModal === 'sobre' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-[#1A202C]">Sobre la Fundación</h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Fundación Habilidades para el Cambio</strong> (habilidadesparaelcambio.com.ar) es un centro de excelencia en salud mental, neurociencias cognitivas y psicoterapia basada en evidencia.
            </p>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-[#0D9488] text-white font-bold text-xs uppercase tracking-widest rounded-xl"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {activeModal === 'faq' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-[#1A202C]">Preguntas Frecuentes</h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <h4 className="font-bold text-[#1A202C]">¿Cómo sacar un turno?</h4>
                <p className="text-gray-600 mt-1">Desde la pestaña 'Turnos' o el botón 'Pedir turno de admisión' en Inicio.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-[#0D9488] text-white font-bold text-xs uppercase tracking-widest rounded-xl"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
