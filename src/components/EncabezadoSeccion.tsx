// src/components/EncabezadoSeccion.tsx
// Título común de cada sección, para que todas se vean igual.

interface Props {
  antetitulo: string;
  titulo: string;
  bajada?: string;
}

export function EncabezadoSeccion({ antetitulo, titulo, bajada }: Props) {
  return (
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dorado">{antetitulo}</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-hpc">{titulo}</h1>
      {bajada && <p className="mt-3 max-w-2xl text-tinta/75 leading-relaxed">{bajada}</p>}
    </header>
  );
}
