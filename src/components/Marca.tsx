// src/components/Marca.tsx
// Marca del portal con el isologo oficial de la Fundación (public/logo.png).
//
// El isologo original viene sobre fondo blanco, así que lo mostramos dentro de un
// "chip" blanco redondeado (como un ícono de app): se ve bien tanto sobre la barra
// lateral teal (claro) como sobre el encabezado crema del celular.
// Al lado va el nombre tipografiado (Fraunces + dorado), que reproduce el logo
// rectangular y se adapta de color según el fondo.

export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 ${
          claro ? '' : 'ring-1 ring-hpc/10'
        }`}
      >
        {/* alt vacío: el nombre ya está escrito al lado; repetirlo sería redundante para lectores de pantalla */}
        <img src="/logo.png" alt="" width={40} height={40} className="w-9 h-9 object-contain" />
      </div>
      <div className="leading-tight">
        <p className={`font-display font-semibold text-base ${claro ? 'text-crema' : 'text-hpc'}`}>
          Habilidades
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dorado">para el Cambio</p>
      </div>
    </div>
  );
}
