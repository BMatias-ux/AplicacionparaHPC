import React, { useState } from 'react';
import { Appointment, Professional, UserProfile } from '../types';
import { PROFESSIONALS } from '../mockData';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  AlertCircle,
  X,
  PlusCircle,
  CalendarCheck2,
  Trash2,
  Zap,
} from 'lucide-react';

interface TurnosScreenProps {
  user: UserProfile;
  appointments: Appointment[];
  onAddAppointment: (appointment: Appointment) => void;
  onCancelAppointment: (id: string) => void;
  initialBookingMode?: boolean;
}

export const TurnosScreen: React.FC<TurnosScreenProps> = ({
  user,
  appointments,
  onAddAppointment,
  onCancelAppointment,
  initialBookingMode = false,
}) => {
  const [bookingStep, setBookingStep] = useState<
    'category' | 'modality' | 'doctor' | 'slot' | 'summary' | null
  >(initialBookingMode ? 'category' : null);

  const [selectedCategory, setSelectedCategory] = useState<'Consultas' | 'Evaluaciones'>('Consultas');
  const [selectedModality, setSelectedModality] = useState<
    'Consulta Psiquiatria - Presencial' | 'Consulta Psiquiatria - Online' | 'Evaluación Neurocognitiva Integral' | 'Psicoterapia Individual (TCC)'
  >('Consulta Psiquiatria - Presencial');
  const [selectedDoctor, setSelectedDoctor] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-28');
  const [selectedTime, setSelectedTime] = useState<string>('16:30');

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [appointmentDetail, setAppointmentDetail] = useState<Appointment | null>(null);

  const availableSlots = [
    { date: '2026-08-21', formatted: 'Viernes 21 de Agosto', times: ['09:00', '11:30', '15:00', '17:30'] },
    { date: '2026-08-24', formatted: 'Lunes 24 de Agosto', times: ['10:00', '14:00', '16:30', '18:00'] },
    { date: '2026-08-26', formatted: 'Miércoles 26 de Agosto', times: ['09:30', '12:00', '15:30', '17:00'] },
    { date: '2026-08-28', formatted: 'Jueves 28 de Agosto', times: ['11:00', '14:30', '16:30', '18:30'] },
  ];

  const handleStartBooking = () => {
    setBookingStep('category');
  };

  const handleCategorySelect = (cat: 'Consultas' | 'Evaluaciones') => {
    setSelectedCategory(cat);
    if (cat === 'Evaluaciones') {
      setSelectedModality('Evaluación Neurocognitiva Integral');
    } else {
      setSelectedModality('Consulta Psiquiatria - Presencial');
    }
    setBookingStep('modality');
  };

  const handleModalitySelect = (
    mod:
      | 'Consulta Psiquiatria - Presencial'
      | 'Consulta Psiquiatria - Online'
      | 'Evaluación Neurocognitiva Integral'
      | 'Psicoterapia Individual (TCC)'
  ) => {
    setSelectedModality(mod);
    setBookingStep('doctor');
  };

  const handleDoctorSelect = (doc: Professional | null) => {
    if (doc) {
      setSelectedDoctor(doc);
    } else {
      setSelectedDoctor(PROFESSIONALS[0]);
    }
    setBookingStep('slot');
  };

  const handleConfirmAppointment = () => {
    const chosenDocName = selectedDoctor ? selectedDoctor.name : 'Pessio, Julian';
    const chosenDocTitle = selectedDoctor ? selectedDoctor.title : 'Médico Psiquiatra';
    const isOnline = selectedModality.includes('Online');

    const dayObj = availableSlots.find((s) => s.date === selectedDate) || availableSlots[0];
    const formattedDate = `${dayObj.formatted} - ${selectedTime} hs`;

    const newAppt: Appointment = {
      id: 'appt_' + Date.now(),
      professional: chosenDocName,
      specialty: chosenDocTitle,
      category: selectedCategory,
      modality: selectedModality,
      date: selectedDate,
      time: selectedTime,
      formattedDate,
      location: isOnline
        ? 'Enlace Google Meet / Sala Virtual Segura'
        : 'Sede Central - Talcahuano 74, CABA',
      status: 'CONFIRMADO',
      createdAt: new Date().toISOString(),
      notes: `Consulta programada para ${user.nombre || 'el paciente'}. Presentarse 10 minutos antes.`,
    };

    onAddAppointment(newAppt);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0D9488', '#0F766E', '#14B8A6', '#2DD4BF'],
      });
    } catch {
      // silent
    }

    setBookingStep(null);
  };

  /* BOOKING STEP 1: CATEGORY */
  if (bookingStep === 'category') {
    return (
      <div className="flex-1 bg-[#F9FBFC] flex flex-col overflow-y-auto pb-20 no-scrollbar text-[#2D3748]">
        <div className="bg-[#0D9488] text-white pt-8 pb-6 px-6 rounded-b-3xl shadow-lg shadow-teal-900/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBookingStep(null)}
              aria-label="Volver"
              className="p-1 -ml-2 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Nuevo turno</h1>
          </div>
        </div>

        <div className="px-6 pt-6 pb-2">
          <span className="text-[10px] font-bold text-[#0D9488] tracking-widest uppercase">
            Paso 1 de 4 • Tipo de atención
          </span>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
            Mantené apretado para ver descripción
          </p>
        </div>

        <div className="px-6 space-y-3.5 mt-2">
          <button
            onClick={() => handleCategorySelect('Consultas')}
            className="w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:border-[#0D9488] hover:shadow-md active:scale-98 transition-all text-left group"
          >
            <div>
              <span className="text-[#1A202C] font-bold text-base block group-hover:text-[#0D9488] transition-colors">
                Consultas
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">
                Psiquiatría y psicoterapia individual TCC
              </span>
            </div>
            <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0D9488] transition-colors" />
          </button>

          <button
            onClick={() => handleCategorySelect('Evaluaciones')}
            className="w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:border-[#0D9488] hover:shadow-md active:scale-98 transition-all text-left group"
          >
            <div>
              <span className="text-[#1A202C] font-bold text-base block group-hover:text-[#0D9488] transition-colors">
                Evaluaciones
              </span>
              <span className="text-xs text-gray-500 mt-0.5 block">
                Baterías neurocognitivas y diagnóstico integral
              </span>
            </div>
            <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0D9488] transition-colors" />
          </button>
        </div>
      </div>
    );
  }

  /* BOOKING STEP 2: MODALITY */
  if (bookingStep === 'modality') {
    return (
      <div className="flex-1 bg-[#F9FBFC] flex flex-col overflow-y-auto pb-20 no-scrollbar text-[#2D3748]">
        <div className="bg-[#0D9488] text-white pt-8 pb-6 px-6 rounded-b-3xl shadow-lg shadow-teal-900/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBookingStep('category')}
              aria-label="Volver"
              className="p-1 -ml-2 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Nuevo turno</h1>
          </div>
        </div>

        <div className="px-6 pt-6 pb-2">
          <span className="text-[10px] font-bold text-[#0D9488] tracking-widest uppercase">
            Paso 2 de 4 • Modalidad
          </span>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
            Mantené apretado para ver descripción
          </p>
        </div>

        <div className="px-6 space-y-3.5 mt-2">
          {selectedCategory === 'Consultas' ? (
            <>
              <button
                onClick={() => handleModalitySelect('Consulta Psiquiatria - Presencial')}
                className="w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:border-[#0D9488] hover:shadow-md active:scale-98 transition-all text-left group"
              >
                <div>
                  <span className="text-[#1A202C] font-bold text-base block group-hover:text-[#0D9488] transition-colors">
                    Consulta Psiquiatria - Presencial
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    Sede Talcahuano 74, CABA
                  </span>
                </div>
                <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0D9488] shrink-0" />
              </button>

              <button
                onClick={() => handleModalitySelect('Consulta Psiquiatria - Online')}
                className="w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:border-[#0D9488] hover:shadow-md active:scale-98 transition-all text-left group"
              >
                <div>
                  <span className="text-[#1A202C] font-bold text-base block group-hover:text-[#0D9488] transition-colors">
                    Consulta Psiquiatria - Online
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    Videollamada encriptada y receta electrónica
                  </span>
                </div>
                <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0D9488] shrink-0" />
              </button>

              <button
                onClick={() => handleModalitySelect('Psicoterapia Individual (TCC)')}
                className="w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:border-[#0D9488] hover:shadow-md active:scale-98 transition-all text-left group"
              >
                <div>
                  <span className="text-[#1A202C] font-bold text-base block group-hover:text-[#0D9488] transition-colors">
                    Psicoterapia Cognitivo-Conductual
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    Tratamiento individual basado en evidencia
                  </span>
                </div>
                <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0D9488] shrink-0" />
              </button>
            </>
          ) : (
            <button
              onClick={() => handleModalitySelect('Evaluación Neurocognitiva Integral')}
              className="w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:border-[#0D9488] hover:shadow-md active:scale-98 transition-all text-left group"
            >
              <div>
                <span className="text-[#1A202C] font-bold text-base block group-hover:text-[#0D9488] transition-colors">
                  Evaluación Neurocognitiva Integral
                </span>
                <span className="text-xs text-gray-500 mt-0.5 block">
                  Batería diagnóstica de memoria, atención y funciones ejecutivas
                </span>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0D9488] shrink-0" />
            </button>
          )}
        </div>
      </div>
    );
  }

  /* BOOKING STEP 3: PROFESSIONAL */
  if (bookingStep === 'doctor') {
    return (
      <div className="flex-1 bg-[#F9FBFC] flex flex-col overflow-y-auto pb-24 no-scrollbar text-[#2D3748]">
        <div className="bg-[#0D9488] text-white pt-8 pb-6 px-6 rounded-b-3xl shadow-lg shadow-teal-900/10 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBookingStep('modality')}
              aria-label="Volver"
              className="p-1 -ml-2 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Elegir profesional</h1>
          </div>
        </div>

        {/* Option 1: "Lo Antes Posible" */}
        <div className="px-6 pt-6 pb-2">
          <span className="text-[10px] font-bold text-[#0D9488] tracking-widest uppercase mb-2 block">
            SI QUERÉS UN TURNO LO ANTES POSIBLE
          </span>
          <button
            onClick={() => handleDoctorSelect(null)}
            className="w-full bg-white border-2 border-[#0D9488]/30 hover:border-[#0D9488] rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center font-bold">
                <Zap size={22} />
              </div>
              <div>
                <span className="text-[#1A202C] font-bold text-base block group-hover:text-[#0D9488] transition-colors">
                  Lo Antes Posible
                </span>
                <span className="text-xs text-gray-500">Primer turno disponible con especialista</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0D9488]" />
          </button>
        </div>

        {/* Section 2: Specific Professionals */}
        <div className="px-6 pt-4 pb-2">
          <span className="text-[10px] font-bold text-[#0D9488] tracking-widest uppercase mb-2.5 block">
            O PODÉS SELECCIONAR TU PROFESIONAL
          </span>
          <div className="space-y-2.5">
            {PROFESSIONALS.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDoctorSelect(doc)}
                className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-[#0D9488] hover:shadow-md active:scale-98 transition-all text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-100"
                  />
                  <div>
                    <span className="text-[#1A202C] font-bold text-sm sm:text-base block group-hover:text-[#0D9488] transition-colors">
                      {doc.name}
                    </span>
                    <span className="text-xs text-gray-500 block">{doc.title}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0D9488] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* BOOKING STEP 4: DATE & TIME */
  if (bookingStep === 'slot') {
    return (
      <div className="flex-1 bg-[#F9FBFC] flex flex-col overflow-y-auto pb-24 no-scrollbar text-[#2D3748]">
        <div className="bg-[#0D9488] text-white pt-8 pb-6 px-6 rounded-b-3xl shadow-lg shadow-teal-900/10 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBookingStep('doctor')}
              aria-label="Volver"
              className="p-1 -ml-2 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Fecha y horario</h1>
          </div>
        </div>

        <div className="px-6 pt-5">
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-3.5">
            <img
              src={selectedDoctor?.avatar || PROFESSIONALS[0].avatar}
              alt="Doctor"
              className="w-12 h-12 rounded-xl object-cover border border-teal-300"
            />
            <div>
              <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider block">
                {selectedModality}
              </span>
              <h3 className="font-bold text-[#1A202C] text-sm sm:text-base">
                {selectedDoctor?.name || 'Pessio, Julian'}
              </h3>
              <p className="text-xs text-gray-500">{selectedDoctor?.title}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pt-6">
          <span className="text-[10px] font-bold text-[#0D9488] tracking-widest uppercase mb-3 block">
            SELECCIONÁ EL DÍA
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {availableSlots.map((slot) => {
              const isSelected = selectedDate === slot.date;
              return (
                <button
                  key={slot.date}
                  onClick={() => setSelectedDate(slot.date)}
                  className={`p-3.5 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-md shadow-teal-900/15 font-bold'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <CalendarIcon size={16} className={isSelected ? 'text-white mb-1' : 'text-gray-400 mb-1'} />
                  <div className="text-xs font-bold leading-tight">{slot.formatted}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 pt-6">
          <span className="text-[10px] font-bold text-[#0D9488] tracking-widest uppercase mb-3 block">
            HORARIOS DISPONIBLES
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {availableSlots
              .find((s) => s.date === selectedDate)
              ?.times.map((t) => {
                const isSelected = selectedTime === t;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-3 rounded-xl text-center text-sm font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-md scale-102'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    {t} hs
                  </button>
                );
              })}
          </div>
        </div>

        <div className="px-6 mt-8">
          <button
            onClick={handleConfirmAppointment}
            className="w-full py-4 bg-[#0D9488] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-900/20 hover:bg-[#0F766E] active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} />
            <span>Confirmar Turno</span>
          </button>
        </div>
      </div>
    );
  }

  /* MAIN SCREEN: LIST OF APPOINTMENTS OR EDITORIAL EMPTY STATE */
  return (
    <div className="flex-1 bg-[#F9FBFC] text-[#2D3748] flex flex-col justify-between overflow-y-auto pb-24 no-scrollbar relative">
      {/* Editorial Curved Header */}
      <div className="bg-[#0D9488] text-white pt-8 pb-6 px-6 rounded-b-3xl shadow-lg shadow-teal-900/10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200 block mb-1">
              Agenda Médica
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Próximos turnos</h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <CalendarIcon size={20} className="text-white" />
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 flex flex-col">
        {appointments.length === 0 ? (
          /* EDITORIAL EMPTY STATE CARD */
          <div className="bg-white rounded-3xl border border-gray-100 p-8 flex-1 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4 text-[#0D9488]">
              <CalendarIcon className="w-10 h-10 text-[#0D9488]" />
            </div>
            <h3 className="text-lg font-bold text-[#1A202C] mb-2">No hay próximos turnos</h3>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Cuando reserves un turno, aparecerá en esta pantalla. Podés sacar uno nuevo con el botón de abajo.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest">
                Turnos Agendados ({appointments.length})
              </span>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs font-bold text-[#0D9488] hover:underline"
              >
                Ver historial
              </button>
            </div>

            {appointments.map((appt) => {
              const isOnline = appt.modality.includes('Online');
              return (
                <div
                  key={appt.id}
                  className="bg-white border border-gray-100 hover:border-teal-200 rounded-3xl p-5 shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-teal-50 text-[#0D9488] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {appt.status}
                      </span>
                      <h3 className="text-lg font-extrabold text-[#1A202C] mt-2">
                        {appt.modality}
                      </h3>
                      <p className="text-sm font-semibold text-gray-700">
                        {appt.professional}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center shadow-xs">
                      {isOnline ? <Video size={20} /> : <MapPin size={20} />}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <Clock size={15} className="text-[#0D9488]" />
                      <span>{appt.formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-[#0D9488] shrink-0" />
                      <span className="line-clamp-1">{appt.location}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setAppointmentDetail(appt)}
                      className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
                    >
                      <span>Ver detalles</span>
                      <ChevronRight size={14} />
                    </button>

                    <button
                      onClick={() => onCancelAppointment(appt.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 p-1"
                      title="Cancelar turno"
                    >
                      <Trash2 size={14} />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="px-6 pt-2 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex-1 py-3.5 px-4 rounded-xl border border-teal-200 text-[#0D9488] font-bold text-xs tracking-widest uppercase bg-white hover:bg-teal-50 active:scale-98 transition-all text-center"
          >
            HISTORIAL
          </button>

          <button
            onClick={handleStartBooking}
            className="flex-1 py-3.5 px-4 rounded-xl bg-[#0D9488] text-white font-bold text-xs tracking-widest uppercase shadow-lg shadow-teal-900/20 hover:bg-[#0F766E] active:scale-98 transition-all text-center flex items-center justify-center gap-1.5"
          >
            <PlusCircle size={16} />
            <span>NUEVO TURNO</span>
          </button>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-[#1A202C]">Historial de Turnos</h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                aria-label="Cerrar"
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Consulta de Admisión Inicial</span>
                  <span className="text-teal-700 font-extrabold">COMPLETADO</span>
                </div>
                <p className="text-gray-600">Dr. Cetkovich, Marcelo • 12 de Julio 2026</p>
                <p className="text-gray-500 italic pt-1">
                  "Evaluación clínica integral. Plan terapéutico iniciado satisfactoriamente."
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-3 bg-[#0D9488] text-white font-bold text-xs uppercase tracking-widest rounded-xl"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {appointmentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-[#1A202C]">Comprobante de Turno</h2>
              <button
                onClick={() => setAppointmentDetail(null)}
                aria-label="Cerrar"
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-[#0D9488] uppercase tracking-wider">
                    {appointmentDetail.status}
                  </span>
                  <span className="text-xs text-gray-500">ID: {appointmentDetail.id.slice(-6)}</span>
                </div>
                <h3 className="font-extrabold text-[#1A202C] text-base">
                  {appointmentDetail.modality}
                </h3>
                <p className="font-bold text-gray-700">
                  {appointmentDetail.professional} ({appointmentDetail.specialty})
                </p>
                <p className="text-gray-600 text-xs">
                  📅 {appointmentDetail.formattedDate}
                </p>
                <p className="text-gray-600 text-xs">
                  📍 {appointmentDetail.location}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  alert('Agregado al calendario de tu dispositivo.');
                  setAppointmentDetail(null);
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl uppercase tracking-wider"
              >
                Exportar a Calendario
              </button>
              <button
                onClick={() => setAppointmentDetail(null)}
                className="flex-1 py-3 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs rounded-xl uppercase tracking-wider"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
