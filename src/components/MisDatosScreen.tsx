import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ChevronLeft, SlidersHorizontal, LogOut, Camera, Check, Edit2 } from 'lucide-react';

interface MisDatosScreenProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onDeleteAccount: () => void;
}

export const MisDatosScreen: React.FC<MisDatosScreenProps> = ({
  user,
  onUpdateUser,
  onDeleteAccount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<UserProfile>({ ...user });

  const handleSaveEdit = () => {
    onUpdateUser(editForm);
    setIsEditing(false);
  };

  const handleAvatarChange = () => {
    const avatarList = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    ];
    const nextIdx = (avatarList.indexOf(user.avatarUrl) + 1) % avatarList.length;
    onUpdateUser({ ...user, avatarUrl: avatarList[nextIdx] });
  };

  if (showAdvanced) {
    return (
      <div className="flex-1 bg-[#F9FBFC] text-[#2D3748] flex flex-col justify-between overflow-y-auto pb-24 no-scrollbar">
        <div className="bg-[#0D9488] text-white pt-8 pb-6 px-6 rounded-b-3xl shadow-lg shadow-teal-900/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvanced(false)}
              className="p-1 -ml-2 rounded-full hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Mas opciones</h1>
          </div>
        </div>

        <div className="px-6 py-8 flex-1 flex flex-col justify-start">
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="w-full py-4 px-6 bg-[#0D9488] text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-900/20 hover:bg-[#0F766E] active:scale-98 transition-all flex items-center justify-center gap-3"
          >
            <LogOut size={18} className="rotate-180" />
            <span>BORRAR CUENTA</span>
          </button>
          <p className="text-xs text-gray-500 text-center mt-4 px-4 leading-relaxed">
            Al borrar tu cuenta, se eliminarán todos los turnos agendados y datos personales en este dispositivo.
          </p>
        </div>

        {showConfirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <LogOut size={28} className="rotate-180" />
              </div>
              <h3 className="text-lg font-bold text-[#1A202C]">¿Confirmar eliminación de cuenta?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Se restablecerá la app y volverás a la pantalla de bienvenida del registro inicial.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-800 font-bold text-xs rounded-xl uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDelete(false);
                    onDeleteAccount();
                  }}
                  className="flex-1 py-3 bg-red-600 text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow-md"
                >
                  Sí, Borrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F9FBFC] text-[#2D3748] flex flex-col justify-between overflow-y-auto pb-24 no-scrollbar">
      <div className="bg-[#0D9488] text-white pt-8 pb-6 px-6 rounded-b-3xl shadow-lg shadow-teal-900/10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200 block mb-1">
          Identificación
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt="Foto"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-[#0D9488]/30 shadow-md bg-gray-100"
            />
            <button
              onClick={handleAvatarChange}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shadow-md border-2 border-white hover:bg-[#0F766E]"
            >
              <Camera size={14} />
            </button>
          </div>
          <h2 className="text-xl font-extrabold text-[#1A202C] mt-3">
            {user.nombre} {user.apellido}
          </h2>
          <p className="text-xs text-gray-500 font-medium">{user.email}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-1">
            <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest">
              Datos Personales
            </span>
            <button
              onClick={() => (isEditing ? handleSaveEdit() : setIsEditing(true))}
              className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
            >
              {isEditing ? (
                <>
                  <Check size={14} />
                  <span>Guardar</span>
                </>
              ) : (
                <>
                  <Edit2 size={13} />
                  <span>Editar</span>
                </>
              )}
            </button>
          </div>

          {[
            { label: 'Nombre', field: 'nombre' as keyof UserProfile, val: isEditing ? editForm.nombre : user.nombre },
            { label: 'Apellido', field: 'apellido' as keyof UserProfile, val: isEditing ? editForm.apellido : user.apellido },
            { label: 'Email', field: 'email' as keyof UserProfile, val: isEditing ? editForm.email : user.email },
            { label: 'Teléfono', field: 'telefono' as keyof UserProfile, val: isEditing ? editForm.telefono : user.telefono },
            { label: 'DNI', field: 'dni' as keyof UserProfile, val: isEditing ? editForm.dni : user.dni },
            { label: 'Domicilio', field: 'domicilio' as keyof UserProfile, val: isEditing ? editForm.domicilio : user.domicilio },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                {item.label}
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={item.val}
                onChange={(e) => setEditForm({ ...editForm, [item.field]: e.target.value })}
                className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  isEditing
                    ? 'bg-white border-2 border-[#0D9488] text-gray-900 focus:outline-none'
                    : 'bg-gray-50 text-gray-800 border border-gray-100'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button
            onClick={() => setShowAdvanced(true)}
            className="w-full py-3.5 px-4 rounded-2xl border border-teal-200 bg-white hover:bg-teal-50 text-[#0D9488] font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
          >
            <SlidersHorizontal size={16} />
            <span>Opciones avanzadas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
