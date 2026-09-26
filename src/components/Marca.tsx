// src/components/Marca.tsx
// Logo provisorio de texto. Cuando la Fundación pase el logo oficial (SVG), se reemplaza acá
// y en public/icons.

export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-semibold text-lg ${
          claro ? 'bg-crema text-hpc' : 'bg-hpc text-crema'
        }`}
      >
        H
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
