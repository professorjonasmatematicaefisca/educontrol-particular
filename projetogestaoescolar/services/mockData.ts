import { Student, Occurrence, OccurrenceType, OccurrenceStatus, ClassSession, Teacher, ClassRoom, Discipline, UserRole } from '../types';

export const SEED_DISCIPLINES: Discipline[] = [
  { id: 'disc-mat', name: 'Matemática' },
  { id: 'disc-bio', name: 'Biologia' },
  { id: 'disc-hist', name: 'História' },
  { id: 'disc-geo', name: 'Geografia' },
  { id: 'disc-port', name: 'Português' },
  { id: 'disc-fis', name: 'Física' },
  { id: 'disc-quim', name: 'Química' },
  { id: 'disc-ing', name: 'Inglês' }
];

export const SEED_CLASSES: ClassRoom[] = [
  { id: 'class-1-aem', name: '1º AEM', period: 'Matutino' },
  { id: 'class-9-a', name: '9º Ano A', period: 'Matutino' },
  { id: 'class-9-b', name: '9º Ano B', period: 'Vespertino' }
];

export const SEED_TEACHERS: Teacher[] = [
  {
    id: 'prof-1',
    name: 'Prof. Anderson',
    email: 'prof@edu.com',
    role: UserRole.TEACHER,
    subject: 'Biologia',
    assignments: [
      { classId: '1º AEM', subject: 'Biologia' },
      { classId: '9º Ano A', subject: 'Biologia' }
    ]
  },
  {
    id: 'prof-2',
    name: 'Prof. Silva',
    email: 'silva@edu.com',
    role: UserRole.TEACHER,
    subject: 'Matemática',
    assignments: [
      { classId: '1º AEM', subject: 'Matemática' },
      { classId: '9º Ano B', subject: 'Matemática' }
    ]
  }
];

const studentNames = [
  "Amanda Balsan Albertini",
  "Ana Clara de Campos",
  "Anthony Gabriel Fernandes Uchoa",
  "Clara Ampudia Laurindo",
  "Clara Bertoluci Bryan",
  "Eduardo Cunha Franco",
  "Esther Romano de Oliveira",
  "Gabriel Santos Cruz",
  "Gabriela Costa Silva",
  "Giovanna Peixoto Gozzoli",
  "Gustavo Magalhães Chaves",
  "Gustavo Pelegrin Nascimento",
  "Helena Gregio da Silva",
  "llana Vitória Gallinari",
  "Isabella Mendes Mitsuoka Waterstraat",
  "Isadora Croistsfelt De Cristi",
  "Isadora Sousa Rosa",
  "Julia Ferreira Bernardes",
  "Julia Pinheiro Mirone",
  "Leticia Aya Kawati",
  "Luan Morais Lima Oliveira",
  "Lucas Simões Pereira",
  "Lucas Taipo Nardari",
  "Luiza Schweter Moreira",
  "Marcelo Tozzi Oliveira",
  "Marina Reinato",
  "Matteo Crémonezzi Muller",
  "Murilo Tozzi Oliveira",
  "Natalia Benalia SIlva",
  "Vitoria Aline Bolina Manfrim"
];

export const SEED_STUDENTS: Student[] = studentNames.map((name, index) => ({
  id: `std-aem-${index + 1}`,
  name: name,
  photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
  parentEmail: `pais.${name.split(' ')[0].toLowerCase()}@exemplo.com`,
  className: "1º AEM"
}));

export const SEED_OCCURRENCES: Occurrence[] = [
  {
    id: 'occ-1',
    type: OccurrenceType.DISCIPLINE,
    description: 'Conversa excessiva durante a explicação.',
    studentIds: ['std-aem-1'],
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: OccurrenceStatus.RESOLVED,
    reportedBy: 'Prof. Anderson'
  }
];

export const SEED_SESSIONS: ClassSession[] = []; // Clear old sessions to avoid mismatch