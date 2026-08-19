import { Professional, NewsArticle, UserProfile } from './types';

export const PROFESSIONALS: Professional[] = [
  {
    id: 'pessio',
    name: 'Pessio, Julian',
    title: 'Médico Psiquiatra',
    specialty: 'Psiquiatría Clínica y Neurociencias',
    rating: 4.9,
    availableNext: 'Mañana 14:00 hs',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'cetkovich',
    name: 'Cetkovich, Marcelo',
    title: 'Director Médico',
    specialty: 'Psiquiatría y Trastornos del Ánimo',
    rating: 5.0,
    availableNext: 'Jueves 16:30 hs',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'kes',
    name: 'Kes, Mariana',
    title: 'Médica Psiquiatra',
    specialty: 'Especialista en Adultos y Neurobiología',
    rating: 4.8,
    availableNext: 'Viernes 10:00 hs',
    avatar: 'https://images.unsplash.com/photo-1594824813598-132d73f47e33?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'patrone',
    name: 'Patrone, Leandro',
    title: 'Médico Psiquiatra',
    specialty: 'Neurociencias Clínicas y Psicofarmacología',
    rating: 4.9,
    availableNext: 'Lunes 11:30 hs',
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'dines',
    name: 'Dines, Micaela',
    title: 'Lic. en Psicología',
    specialty: 'Terapia Cognitivo-Conductual (TCC)',
    rating: 4.9,
    availableNext: 'Hoy 18:00 hs',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'amaya',
    name: 'Amaya, Natalia',
    title: 'Neuropsicóloga',
    specialty: 'Evaluación y Rehabilitación Neurocognitiva',
    rating: 4.9,
    availableNext: 'Martes 09:30 hs',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'sere',
    name: 'Sere, Lucia',
    title: 'Médica Psiquiatra',
    specialty: 'Psicoterapia y Salud Mental Integral',
    rating: 4.8,
    availableNext: 'Miércoles 15:00 hs',
    avatar: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'nielsen',
    name: 'Nielsen, Maria Gabriela',
    title: 'Lic. en Psicología',
    specialty: 'Neuropsicología Cognitiva',
    rating: 4.9,
    availableNext: 'Jueves 12:00 hs',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'rodriguez',
    name: 'Rodriguez, Clara',
    title: 'Médica Especialista',
    specialty: 'Psiquiatría Infanto-Juvenil y Neurodesarrollo',
    rating: 4.8,
    availableNext: 'Viernes 17:00 hs',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'cozzarin',
    name: 'Cozzarin, Linda Gisele',
    title: 'Lic. en Psicología',
    specialty: 'Terapia de Aceptación y Compromiso (ACT)',
    rating: 4.9,
    availableNext: 'Lunes 16:00 hs',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
  },
];

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'habitos-neurociencia',
    title: 'Cuatro recomendaciones de la neurociencia para planificar nuevos hábitos saludables...',
    category: 'NOTICIAS',
    image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80',
    readTime: '4 min de lectura',
    date: '15 Ago 2026',
    summary: 'La neuroplasticidad nos enseña que el cerebro puede reconfigurar sus circuitos neuronales ante estímulos sostenidos y repetición consciente.',
    content: `La neurociencia contemporánea ha demostrado que la formación de hábitos no depende únicamente de la fuerza de voluntad, sino de la arquitectura de nuestros circuitos estriatales y de recompensa dopaminérgica.

1. **Micro-objetivos basados en la dopamina:** Dividir las metas complejas en acciones de menos de dos minutos activa el circuito de recompensa sin generar la resistencia del córtex prefrontal.
2. **Anclaje de hábitos existentes:** Asociar la nueva conducta deseada inmediatamente después de una rutina consolidada (por ejemplo, 5 minutos de respiración consciente después de lavarse los dientes).
3. **Optimización del entorno:** Diseñar el contexto físico para reducir la fricción cognitiva hacia los hábitos constructivos y aumentar la fricción hacia distracciones.
4. **Celebración inmediata del progreso:** Reconocer conscientemente el logro refuerza la mielinización de las vías neuronales implicadas.`,
  },
  {
    id: 'flexibilidad-cognitiva',
    title: 'Vulnerabilidad y resiliencia: cómo entrenar la flexibilidad cognitiva y la tolerancia...',
    category: 'NOTICIAS',
    image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&auto=format&fit=crop&q=80',
    readTime: '5 min de lectura',
    date: '10 Ago 2026',
    summary: 'Aprender a tolerar el malestar emocional y reinterpretar las situaciones difíciles permite una mayor adaptación en la vida cotidiana.',
    content: `La flexibilidad cognitiva es la capacidad de adaptar nuestros pensamientos y conductas ante situaciones cambiantes o inesperadas.

En Fundación Habilidades para el Cambio trabajamos desde modelos de Terapia Cognitivo-Conductual y Terapias de Tercera Ola (como ACT) para ayudar a los pacientes a:
- Identificar pensamientos automáticos rígidos y distorsiones cognitivas.
- Desarrollar la 'defusión cognitiva': notar los pensamientos sin fusionarse con ellos.
- Actuar en consonancia con los propios valores personales incluso en presencia de emociones displacenteras.`,
  },
  {
    id: 'tcc-estres',
    title: 'Terapia Cognitivo-Conductual: evidencia y técnicas prácticas para regular la ansiedad',
    category: 'SALUD MENTAL',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    readTime: '3 min de lectura',
    date: '02 Ago 2026',
    summary: 'Claves científicas de la psicoterapia basada en evidencia para desactivar la hiperactivación del sistema nervioso simpático.',
    content: `La ansiedad es una respuesta adaptativa de supervivencia, pero cuando se vuelve crónica distorsiona la evaluación del riesgo. La TCC provee herramientas estructuradas de reestructuración cognitiva y exposición gradual que modifican la respuesta de la amígdala cerebral y restauran el bienestar.`,
  },
  {
    id: 'sueno-cerebro',
    title: 'La higiene del sueño y su impacto directo en la salud neurobiológica y el ánimo',
    category: 'BIENESTAR',
    image: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?w=600&auto=format&fit=crop&q=80',
    readTime: '4 min de lectura',
    date: '28 Jul 2026',
    summary: 'Durante las fases de sueño profundo y REM, el sistema glinfático limpia los residuos metabólicos del cerebro.',
    content: `Dormir entre 7 y 8 horas con horarios regulares regula los niveles de cortisol, protege contra el deterioro cognitivo y mejora la estabilidad emocional en pacientes con depresión y ansiedad.`,
  }
];

export const INITIAL_USER: UserProfile = {
  nombre: 'Matias',
  apellido: 'Benni',
  dni: '28208159',
  fechaNacimiento: '02/12/1980',
  genero: 'Masculino',
  domicilio: 'Talcahuano 74',
  telefono: '3874060702',
  email: 'bennimatias@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  isOnboarded: true,
};
