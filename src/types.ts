export interface UserProfile {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  genero: string;
  domicilio: string;
  telefono: string;
  email: string;
  avatarUrl: string;
  isOnboarded: boolean;
}

export interface Appointment {
  id: string;
  professional: string;
  specialty: string;
  category: 'Consultas' | 'Evaluaciones';
  modality: 'Consulta Psiquiatria - Presencial' | 'Consulta Psiquiatria - Online' | 'Evaluación Neurocognitiva Integral' | 'Psicoterapia Individual (TCC)';
  date: string; // e.g. "2026-08-28"
  time: string; // e.g. "16:30"
  formattedDate: string; // e.g. "Jueves 28 de Agosto - 16:30 hs"
  location: string;
  status: 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO';
  createdAt: string;
  notes?: string;
}

export interface Professional {
  id: string;
  name: string;
  title: string;
  specialty: string;
  rating: number;
  availableNext: string;
  avatar: string;
  isSoonest?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  image: string;
  readTime: string;
  date: string;
  summary: string;
  content: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  type: 'cuestionario' | 'registro_animo' | 'respiracion' | 'lectura';
  completed: boolean;
  completedAt?: string;
  score?: number;
}
