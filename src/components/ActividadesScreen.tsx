import React, { useState } from 'react';
import { Smile, Frown, Meh, Wind, CheckCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ActividadesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'estado' | 'respiracion' | 'cuestionario' | null>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [thoughtNote, setThoughtNote] = useState<string>('');
  const [moodSaved, setMoodSaved] = useState<boolean>(false);

  const [breathingPhase, setBreathingPhase] = useState<'Inhala' | 'Retén' | 'Exhala'>('Inhala');
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);

  const [surveyAnswers, setSurveyAnswers] = useState<Record<number, number>>({});
  const [surveySubmitted, setSurveySubmitted] = useState<boolean>(false);

  const handleSaveMood = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMood !== null) {
      setMoodSaved(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#0D9488', '#0F766E', '#14B8A6'],
        });
      } catch {
        // silent
      }
      setTimeout(() => {
        setActiveTab(null);
        setMoodSaved(false);
        setSelectedMood(null);
        setThoughtNote('');
      }, 2000);
    }
  };

  const startBreathing = () => {
    setIsBreathingActive(true);
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 3;
      if (step === 0) setBreathingPhase('Inhala');
      if (step === 1) setBreathingPhase('Retén');
      if (step === 2) setBreathingPhase('Exhala');
    }, 4000);

    setTimeout(() => {
      clearInterval(interval);
      setIsBreathingActive(false);
      try {
        confetti({ particleCount: 40, colors: ['#0D9488', '#14B8A6'] });
      } catch {}
    }, 24000);
  };

  return (
    <div className="flex-1 bg-[#F9FBFC] text-[#2D3748] flex flex-col overflow-y-auto pb-24 no-scrollbar">
      {/* Editorial Header */}
      <div className="bg-[#0D9488] text-white pt-8 pb-6 px-6 rounded-b-3xl shadow-lg shadow-teal-900/10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200 block mb-1">
          Seguimiento Terapéutico
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Actividades</h1>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#1A202C] mb-3">Tus Tareas</h2>

          {/* EXACT CARD FROM SPEC */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xs flex items-center justify-center text-center">
            <span className="text-xs font-extrabold text-[#0D9488] tracking-widest uppercase">
              COMPLETASTE TODAS TUS ACTIVIDADES
            </span>
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-4 pt-2">
          <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest block">
            Herramientas de Autorregulación TCC
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('estado')}
              className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-[#0D9488] shadow-xs text-left transition-all group flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Smile size={22} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#1A202C] text-sm group-hover:text-[#0D9488] transition-colors">
                  Registro Diario de Ánimo
                </h3>
                <p className="text-xs text-gray-500">Monitoreo de pensamientos y emociones</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('respiracion')}
              className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-[#0D9488] shadow-xs text-left transition-all group flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Wind size={22} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#1A202C] text-sm group-hover:text-[#0D9488] transition-colors">
                  Pausa de Respiración 4-7-8
                </h3>
                <p className="text-xs text-gray-500">Desactivación del sistema nervioso</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('cuestionario')}
              className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-[#0D9488] shadow-xs text-left transition-all group flex items-center gap-3.5 sm:col-span-2"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles size={22} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#1A202C] text-sm group-hover:text-[#0D9488] transition-colors">
                  Escala de Bienestar y Enfoque
                </h3>
                <p className="text-xs text-gray-500">Cuestionario clínico de seguimiento periódico</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: REGISTRO DE ÁNIMO */}
      {activeTab === 'estado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1A202C]">¿Cómo te sentís en este momento?</h3>
            <p className="text-xs text-gray-500">Seleccioná un nivel en la escala de energía y ánimo:</p>

            <div className="flex justify-between gap-2 py-2">
              {[
                { val: 1, label: 'Bajo', icon: Frown, color: 'text-amber-500' },
                { val: 2, label: 'Neutro', icon: Meh, color: 'text-gray-500' },
                { val: 3, label: 'Bueno', icon: Smile, color: 'text-teal-600' },
                { val: 4, label: 'Excelente', icon: Sparkles, color: 'text-[#0D9488]' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedMood === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setSelectedMood(item.val)}
                    className={`flex-1 py-3 px-2 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-[#0D9488] bg-teal-50 shadow-md scale-105 font-bold'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={item.color} size={24} />
                    <span className="text-[11px] text-gray-700">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="ineco-input-container mt-2">
              <span className="ineco-input-label">Nota o pensamiento destacado</span>
              <textarea
                value={thoughtNote}
                onChange={(e) => setThoughtNote(e.target.value)}
                placeholder="Identifiqué una situación estresante en el trabajo..."
                rows={3}
                className="w-full border-[1.5px] border-[#0D9488] rounded-xl p-3 text-sm focus:outline-none"
              />
            </div>

            {moodSaved ? (
              <div className="p-3 bg-teal-50 text-[#0D9488] text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                <span>¡Registro guardado en tu historial clínico!</span>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedMood === null}
                  onClick={handleSaveMood}
                  className={`flex-1 py-3 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md ${
                    selectedMood !== null ? 'bg-[#0D9488] hover:bg-[#0F766E]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Guardar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: RESPIRACIÓN */}
      {activeTab === 'respiracion' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-6">
            <h3 className="text-xl font-bold text-[#1A202C]">Respiración Guiada 4-7-8</h3>
            <p className="text-xs text-gray-500">
              Inhalar en 4 segundos, sostener durante 7 segundos y exhalar suavemente en 8 segundos.
            </p>

            <div className="flex items-center justify-center py-6">
              <div
                className={`w-36 h-36 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-2xl transition-all duration-1000 ${
                  isBreathingActive
                    ? breathingPhase === 'Inhala'
                      ? 'bg-teal-500 scale-125'
                      : breathingPhase === 'Retén'
                      ? 'bg-teal-700 scale-110'
                      : 'bg-[#134E4A] scale-90'
                    : 'bg-gray-400'
                }`}
              >
                {isBreathingActive ? breathingPhase : 'Listo'}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsBreathingActive(false);
                  setActiveTab(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Cerrar
              </button>
              {!isBreathingActive ? (
                <button
                  onClick={startBreathing}
                  className="flex-1 py-3 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  Iniciar
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 py-3 bg-[#0D9488] text-white rounded-xl font-bold text-xs uppercase tracking-wider opacity-80"
                >
                  En progreso...
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUESTIONARIO */}
      {activeTab === 'cuestionario' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1A202C]">Evaluación de Bienestar</h3>
            <p className="text-xs text-gray-500">Durante las últimas dos semanas, ¿con qué frecuencia sentiste:</p>

            {[
              { id: 1, q: '1. Dificultad para relajarte o calmar tus pensamientos' },
              { id: 2, q: '2. Poco interés o placer en hacer tus tareas habituales' },
              { id: 3, q: '3. Sensación de cansancio o falta de energía' },
            ].map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-gray-800">{item.q}</p>
                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  {['Nunca', 'Varios días', 'Más de la mitad', 'Casi a diario'].map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        setSurveyAnswers((prev) => ({
                          ...prev,
                          [item.id]: idx,
                        }))
                      }
                      className={`p-1.5 rounded-lg border text-center font-medium transition-all ${
                        surveyAnswers[item.id] === idx
                          ? 'bg-[#0D9488] text-white border-[#0D9488] font-bold'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {surveySubmitted ? (
              <div className="p-3 bg-teal-50 text-[#0D9488] text-xs font-bold rounded-xl text-center">
                ✓ ¡Resultados computados! Tu reporte fue actualizado.
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSurveySubmitted(true);
                    try {
                      confetti({ particleCount: 50 });
                    } catch {}
                    setTimeout(() => {
                      setActiveTab(null);
                      setSurveySubmitted(false);
                    }, 2000);
                  }}
                  className="flex-1 py-3 bg-[#0D9488] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#0F766E]"
                >
                  Enviar Respuestas
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
