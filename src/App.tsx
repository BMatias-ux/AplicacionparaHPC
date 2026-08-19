import React, { useState, useEffect } from 'react';
import { UserProfile, Appointment } from './types';
import { INITIAL_USER } from './mockData';
import { OnboardingWizard } from './components/OnboardingWizard';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { HomeScreen } from './components/HomeScreen';
import { TurnosScreen } from './components/TurnosScreen';
import { ActividadesScreen } from './components/ActividadesScreen';
import { MisDatosScreen } from './components/MisDatosScreen';
import { MasScreen } from './components/MasScreen';
import { Smartphone, Monitor } from 'lucide-react';

const USER_STORAGE_KEY = 'hpc_user_profile_v1';
const APPOINTMENTS_STORAGE_KEY = 'hpc_appointments_v1';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const stored = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isDirectBookingMode, setIsDirectBookingMode] = useState<boolean>(false);
  const [isDeviceFrame, setIsDeviceFrame] = useState<boolean>(false);

  // Sync user changes to localStorage
  const handleCompleteOnboarding = (newUser: UserProfile) => {
    setUser(newUser);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    } catch {
      // ignore
    }
    setCurrentTab('home');
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteAccount = () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(APPOINTMENTS_STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
    setAppointments([]);
    setCurrentTab('home');
    setIsDirectBookingMode(false);
  };

  // Appointment operations
  const handleAddAppointment = (newAppt: Appointment) => {
    const updated = [newAppt, ...appointments];
    setAppointments(updated);
    try {
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleCancelAppointment = (id: string) => {
    if (window.confirm('¿Deseas cancelar este turno?')) {
      const updated = appointments.filter((a) => a.id !== id);
      setAppointments(updated);
      try {
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const handleNavigateToBooking = () => {
    setIsDirectBookingMode(true);
    setCurrentTab('turnos');
  };

  // Reset direct booking mode on tab switch
  const handleTabChange = (tab: TabType) => {
    setIsDirectBookingMode(false);
    setCurrentTab(tab);
  };

  // If user is not yet registered / onboarded, show the 8-step wizard
  const showOnboarding = !user || !user.isOnboarded;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Desktop Mode Switcher Bar */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-2 px-3 text-white/70 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-white tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#9C1342]" />
          <span>Habilidades para el Cambio • Portal</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/90 rounded-full p-1 border border-slate-700">
          <button
            onClick={() => setIsDeviceFrame(false)}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1 text-[11px] font-bold transition-all ${
              !isDeviceFrame ? 'bg-[#9C1342] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone size={13} />
            <span>Móvil</span>
          </button>
          <button
            onClick={() => setIsDeviceFrame(true)}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1 text-[11px] font-bold transition-all ${
              isDeviceFrame ? 'bg-[#9C1342] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor size={13} />
            <span>Expandido</span>
          </button>
        </div>
      </div>

      {/* Main Application Container */}
      <div
        className={`w-full bg-white relative flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${
          isDeviceFrame
            ? 'max-w-2xl sm:rounded-3xl min-h-[92vh] max-h-[92vh] border-4 border-slate-800'
            : 'max-w-md sm:rounded-[2.5rem] min-h-[100vh] sm:min-h-[860px] sm:max-h-[890px] border-0 sm:border-[8px] sm:border-slate-800'
        }`}
      >
        {/* Mobile Top Status Notch Bar Simulation */}
        <div className="hidden sm:flex items-center justify-between px-6 pt-2 pb-1 bg-black text-white text-[10px] font-bold z-50">
          <span>09:41</span>
          <div className="w-24 h-4 bg-slate-900 rounded-b-xl -mt-2" />
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {showOnboarding ? (
            <OnboardingWizard onComplete={handleCompleteOnboarding} />
          ) : (
            <>
              {currentTab === 'home' && (
                <HomeScreen
                  user={user}
                  onNavigateToBooking={handleNavigateToBooking}
                  onNavigateToTab={(t) => handleTabChange(t as TabType)}
                />
              )}

              {currentTab === 'turnos' && (
                <TurnosScreen
                  user={user}
                  appointments={appointments}
                  onAddAppointment={handleAddAppointment}
                  onCancelAppointment={handleCancelAppointment}
                  initialBookingMode={isDirectBookingMode}
                />
              )}

              {currentTab === 'actividades' && <ActividadesScreen />}

              {currentTab === 'mis-datos' && (
                <MisDatosScreen
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  onDeleteAccount={handleDeleteAccount}
                />
              )}

              {currentTab === 'mas' && <MasScreen />}

              {/* Persistent Bottom Bar across all screens */}
              <BottomNavBar
                activeTab={currentTab}
                onTabChange={handleTabChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
