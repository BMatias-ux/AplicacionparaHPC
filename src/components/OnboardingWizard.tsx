import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (user: UserProfile) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<UserProfile>({
    nombre: 'Matias',
    apellido: 'Benni',
    dni: '28208159',
    fechaNacimiento: '02/12/1980',
    genero: 'Masculino',
    domicilio: 'Talcahuano 74',
    telefono: '3874060702',
    email: 'bennimatias@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    isOnboarded: false,
  });

  const handleNext = () => {
    if (step < 8) {
      setStep((prev) => prev + 1);
    } else {
      const finalUser: UserProfile = {
        ...formData,
        isOnboarded: true,
      };
      onComplete(finalUser);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const updateField = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F9FBFC] text-[#2D3748] relative">
      {/* Top Header with Back Button and Progress Dots */}
      <div className="pt-8 pb-4 px-8 flex flex-col items-center">
        <div className="w-full flex items-center justify-between h-8 mb-6">
          {step > 1 ? (
            <button
              onClick={handleBack}
              aria-label="Atrás"
              className="text-[#0D9488] hover:opacity-80 transition-opacity p-1 -ml-2 rounded-full focus:outline-none"
            >
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>
          ) : (
            <div className="w-8" />
          )}

          {/* 8 Step Dots */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((dotIndex) => (
              <div
                key={dotIndex}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  dotIndex === step
                    ? 'bg-[#0D9488] scale-125 shadow-xs shadow-teal-500/50'
                    : dotIndex < step
                    ? 'bg-[#0D9488]/40'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="w-8" />
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 px-8 pt-4 pb-28 flex flex-col justify-start">
        {step === 1 && (
          <div className="space-y-6 pt-4 animate-fade-in text-center sm:text-left">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto sm:mx-0 text-[#0D9488] mb-4">
              <Sparkles size={28} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0D9488] block">
              Registro de Paciente
            </span>
            <h1 className="text-3xl font-extrabold text-[#1A202C]">¡Hola!</h1>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed font-medium">
              Necesitamos pedirte algunos datos indispensables para realizar acciones en{' '}
              <span className="text-[#0D9488] font-bold">Habilidades para el Cambio</span>. Si estás listo para empezar presioná CONTINUAR.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="pt-6 space-y-4 animate-fade-in">
            <div className="ineco-input-container">
              <span className="ineco-input-label">Nombre</span>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                placeholder="Matias"
                autoFocus
                className="ineco-input-box"
              />
            </div>
            <p className="text-xs text-gray-500 px-2">Ingresá tu nombre tal como figura en tu DNI</p>
          </div>
        )}

        {step === 3 && (
          <div className="pt-6 space-y-4 animate-fade-in">
            <div className="ineco-input-container">
              <span className="ineco-input-label">Apellido</span>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => updateField('apellido', e.target.value)}
                placeholder="Benni"
                autoFocus
                className="ineco-input-box"
              />
            </div>
            <p className="text-xs text-gray-500 px-2">Ingresá tus apellidos completos</p>
          </div>
        )}

        {step === 4 && (
          <div className="pt-6 space-y-4 animate-fade-in">
            <div className="ineco-input-container">
              <span className="ineco-input-label">DNI (solo numeros)</span>
              <input
                type="number"
                value={formData.dni}
                onChange={(e) => updateField('dni', e.target.value)}
                placeholder="28208159"
                autoFocus
                className="ineco-input-box"
              />
            </div>
            <p className="text-xs text-gray-500 px-2">Documento Nacional de Identidad</p>
          </div>
        )}

        {step === 5 && (
          <div className="pt-6 space-y-4 animate-fade-in">
            <div className="ineco-input-container">
              <span className="ineco-input-label">Fecha de nacimiento (DD/MM/AAAA)</span>
              <input
                type="text"
                value={formData.fechaNacimiento}
                onChange={(e) => updateField('fechaNacimiento', e.target.value)}
                placeholder="02/12/1980"
                autoFocus
                className="ineco-input-box"
              />
            </div>
            <p className="text-xs text-gray-500 px-2">Formato día/mes/año</p>
          </div>
        )}

        {step === 6 && (
          <div className="pt-6 space-y-4 animate-fade-in">
            <div className="relative">
              <div className="relative">
                <select
                  value={formData.genero}
                  onChange={(e) => updateField('genero', e.target.value)}
                  className="w-full border-[1.5px] border-[#0D9488] rounded-xl py-3.5 px-4 bg-white text-gray-800 appearance-none font-medium outline-none transition-colors"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                  <option value="Prefiero no decir">Prefiero no decir</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                  <svg className="fill-current h-4 w-4 text-[#0D9488]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 px-2">Seleccioná una opción de la lista</p>
          </div>
        )}

        {step === 7 && (
          <div className="pt-6 space-y-4 animate-fade-in">
            <div className="ineco-input-container">
              <span className="ineco-input-label">Domicilio</span>
              <input
                type="text"
                value={formData.domicilio}
                onChange={(e) => updateField('domicilio', e.target.value)}
                placeholder="Talcahuano 74"
                autoFocus
                className="ineco-input-box"
              />
            </div>
            <p className="text-xs text-gray-500 px-2">Calle, número y localidad</p>
          </div>
        )}

        {step === 8 && (
          <div className="pt-6 space-y-4 animate-fade-in">
            <div className="ineco-input-container">
              <span className="ineco-input-label">Teléfono</span>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                placeholder="3874060702"
                autoFocus
                className="ineco-input-box"
              />
            </div>
            <p className="text-xs text-gray-500 px-2">Número de contacto para notificaciones y WhatsApp</p>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="absolute bottom-6 left-0 right-0 px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={`flex-1 py-3.5 px-4 rounded-xl border border-teal-200 text-[#0D9488] font-bold text-xs tracking-widest uppercase transition-all ${
              step === 1 ? 'opacity-40 cursor-not-allowed bg-gray-50' : 'bg-white hover:bg-teal-50 active:scale-98'
            }`}
          >
            ATRAS
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3.5 px-4 rounded-xl bg-[#0D9488] text-white font-bold text-xs tracking-widest uppercase shadow-lg shadow-teal-900/20 hover:bg-[#0F766E] active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            {step === 8 && <CheckCircle2 size={16} />}
            <span>{step === 8 ? 'FINALIZAR' : 'CONTINUAR'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
