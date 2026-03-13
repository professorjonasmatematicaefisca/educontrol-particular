
import { Student, Occurrence, ClassSession, Teacher, ClassRoom, User, UserRole, SessionRecord, Discipline } from '../types';
import { SEED_STUDENTS, SEED_OCCURRENCES, SEED_SESSIONS, SEED_TEACHERS, SEED_CLASSES, SEED_DISCIPLINES } from './mockData';

const KEYS = {
  STUDENTS: 'educontrol_students',
  OCCURRENCES: 'educontrol_occurrences',
  SESSIONS: 'educontrol_sessions',
  TEACHERS: 'educontrol_teachers', // Legacy: Keeping for classroom selection
  CLASSES: 'educontrol_classes',
  USERS: 'educontrol_users',
  DISCIPLINES: 'educontrol_disciplines'
};

const DEFAULT_PASSWORD = 'mudar123';

// Initialize Data
const init = () => {
  // Check if we need to migrate/update to the new requested class list
  const currentClasses = JSON.parse(localStorage.getItem(KEYS.CLASSES) || '[]');
  const hasAEM = currentClasses.some((c: ClassRoom) => c.name === '1º AEM');

  // If 1º AEM is missing, force update the seed data to ensure the user request is met
  if (!hasAEM) {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(SEED_CLASSES));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(SEED_STUDENTS));
    // Reset sessions to prevent ID conflicts with old data
    localStorage.setItem(KEYS.SESSIONS, '[]');
  } else {
    // Standard checks for empty storage
    if (!localStorage.getItem(KEYS.STUDENTS)) {
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(SEED_STUDENTS));
    }
    if (!localStorage.getItem(KEYS.CLASSES)) {
      localStorage.setItem(KEYS.CLASSES, JSON.stringify(SEED_CLASSES));
    }
  }

  if (!localStorage.getItem(KEYS.OCCURRENCES)) {
    localStorage.setItem(KEYS.OCCURRENCES, JSON.stringify(SEED_OCCURRENCES));
  }

  if (!localStorage.getItem(KEYS.SESSIONS) || localStorage.getItem(KEYS.SESSIONS) === '[]') {
    // Create realistic history for charts only if empty
    // We generate history for the NEW students (1º AEM)
    const historySessions = generateMockHistory();
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(historySessions));
  }

  if (!localStorage.getItem(KEYS.TEACHERS)) {
    localStorage.setItem(KEYS.TEACHERS, JSON.stringify(SEED_TEACHERS));
  }

  if (!localStorage.getItem(KEYS.DISCIPLINES)) {
    localStorage.setItem(KEYS.DISCIPLINES, JSON.stringify(SEED_DISCIPLINES));
  }

  // Initialize Users (Auth)
  if (!localStorage.getItem(KEYS.USERS)) {
    const initialUsers: User[] = [
      { id: 'admin-1', name: 'Coordenador', email: 'coordenador@gmail.com', password: 'mudar123', role: UserRole.COORDINATOR },
      {
        id: 'prof-1',
        name: 'Prof. Anderson',
        email: 'prof@edu.com',
        password: '123',
        role: UserRole.TEACHER,
        subject: 'Biologia',
        assignments: SEED_TEACHERS[0].assignments
      },
      { id: 'mon-1', name: 'Monitora Julia', email: 'mon@edu.com', password: '123', role: UserRole.MONITOR }
    ];
    // Sync Mock Teachers to Users
    SEED_TEACHERS.forEach(t => {
      if (!initialUsers.find(u => u.email === t.email)) {
        initialUsers.push({
          id: t.id,
          name: t.name,
          email: t.email,
          password: DEFAULT_PASSWORD,
          role: UserRole.TEACHER,
          subject: t.subject,
          assignments: t.assignments
        });
      }
    });

    localStorage.setItem(KEYS.USERS, JSON.stringify(initialUsers));
  }
};

// Helper to generate history for chart visualization
const generateMockHistory = (): ClassSession[] => {
  const sessions: ClassSession[] = [];
  const baseDate = new Date();
  // Generate last 5 days
  for (let i = 5; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);

    sessions.push({
      id: `sess-hist-${i}`,
      date: date.toISOString(),
      teacherId: 'prof-1',
      subject: 'Biologia',
      className: '1º AEM',
      block: '07:00 - 07:50',
      blocksCount: 1,
      records: SEED_STUDENTS.map(s => {
        // Randomize performance for chart variation
        const talk = Math.floor(Math.random() * 2);
        const activity = Math.floor(Math.random() * 2) + 2; // 2 or 3
        return {
          studentId: s.id,
          present: true,
          phoneConfiscated: Math.random() > 0.95,
          counters: {
            talk,
            bathroom: 0,
            sleep: 0,
            material: 1,
            activity,
            homework: Math.random() > 0.2 ? 1 : 0, // 80% chance done
            participation: Math.random() > 0.5 ? 1 : 0
          },
          justifiedAbsence: false
        };
      })
    });
  }
  return sessions;
};

init();

export const StorageService = {
  // --- GRADE CALCULATION LOGIC ---
  calculateGrade: (record: SessionRecord): number => {
    // 1. Presence Logic
    if (!record.present) {
      return 0.0; // In case of absence, score is always 0.0
    }

    let grade = 10.0;

    // 2. Deductions
    // Conversa (Talk): -2.5 per occurrence
    grade -= (record.counters.talk * 2.5);

    // Dormir (Sleep): -2.5 per occurrence
    grade -= (record.counters.sleep * 2.5);

    // Material: If 0 (missing), deduct 1.5
    if (record.counters.material === 0) {
      grade -= 1.5;
    }

    // Atividade (Activity): Starts at 3. Deduct 2.0 per tick lost.
    const lostActivityLevels = 3 - record.counters.activity;
    if (lostActivityLevels > 0) {
      grade -= (lostActivityLevels * 2.0);
    }

    // Tarefas (Homework): If 0 (missing), deduct 2.5
    if (record.counters.homework === 0) {
      grade -= 2.5;
    }

    // Banheiro (Bathroom): -2.5 per occurrence
    grade -= (record.counters.bathroom * 2.5);

    // Celular (Phone): If SIM (true), deduct 5.0
    if (record.phoneConfiscated) {
      grade -= 5.0;
    }

    // 3. Bonuses
    // Participation: +0.5 per tick, up to 10 ticks (+5.0 bonus)
    if (record.counters.participation && record.counters.participation > 0) {
      grade += (record.counters.participation * 0.5);
    }

    // Ensure grade is between 0 and 10
    return Math.max(0, Math.min(10, grade));
  },

  // --- AUTH / USERS ---
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },

  validateLogin: (email: string, password: string): User | null => {
    const users = StorageService.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    return user || null;
  },

  changePassword: (email: string, newPassword: string): boolean => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.email === email);
    if (index !== -1) {
      users[index].password = newPassword;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      return true;
    }
    return false;
  },

  // Helper to sync Staff (User) creation
  addUser: (user: User) => {
    const users = StorageService.getUsers();
    // Ensure default password if not set
    if (!user.password) user.password = DEFAULT_PASSWORD;
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));

    // If it's a teacher, also add to legacy TEACHERS list for classroom compatibility
    if (user.role === UserRole.TEACHER) {
      StorageService.addTeacher({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subject: user.subject || 'Geral',
        photoUrl: user.photoUrl,
        assignments: user.assignments
      });
    }
  },

  updateUser: (user: User) => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      // Preserve password if not provided in update
      const oldPassword = users[index].password;
      users[index] = { ...user, password: user.password || oldPassword };
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));

      // Sync legacy
      if (user.role === UserRole.TEACHER) {
        StorageService.updateTeacher({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          subject: user.subject || 'Geral',
          photoUrl: user.photoUrl,
          assignments: user.assignments
        });
      }
    }
  },

  deleteUser: (id: string) => {
    const users = StorageService.getUsers();
    const userToDelete = users.find(u => u.id === id);
    const newUsers = users.filter(u => u.id !== id);
    localStorage.setItem(KEYS.USERS, JSON.stringify(newUsers));

    if (userToDelete?.role === UserRole.TEACHER) {
      StorageService.deleteTeacher(id);
    }
  },

  // --- DISCIPLINES ---
  getDisciplines: (): Discipline[] => {
    return JSON.parse(localStorage.getItem(KEYS.DISCIPLINES) || '[]');
  },
  addDiscipline: (disc: Discipline) => {
    const list = StorageService.getDisciplines();
    list.push(disc);
    localStorage.setItem(KEYS.DISCIPLINES, JSON.stringify(list));
  },
  deleteDiscipline: (id: string) => {
    const list = StorageService.getDisciplines().filter(d => d.id !== id);
    localStorage.setItem(KEYS.DISCIPLINES, JSON.stringify(list));
  },

  // --- STUDENTS ---
  getStudents: (): Student[] => {
    return JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
  },
  addStudent: (student: Student) => {
    const list = StorageService.getStudents();
    list.push(student);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(list));
  },
  updateStudent: (student: Student) => {
    const list = StorageService.getStudents();
    const index = list.findIndex(s => s.id === student.id);
    if (index !== -1) {
      list[index] = student;
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(list));
    }
  },
  deleteStudent: (id: string) => {
    const list = StorageService.getStudents().filter(s => s.id !== id);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(list));
  },

  // --- TEACHERS (Legacy/Specific View) ---
  getTeachers: (): Teacher[] => {
    return JSON.parse(localStorage.getItem(KEYS.TEACHERS) || '[]');
  },
  addTeacher: (teacher: Teacher) => {
    const list = StorageService.getTeachers();
    // Check dupe
    if (!list.find(t => t.id === teacher.id)) {
      list.push(teacher);
      localStorage.setItem(KEYS.TEACHERS, JSON.stringify(list));
    }
  },
  updateTeacher: (teacher: Teacher) => {
    const list = StorageService.getTeachers();
    const index = list.findIndex(t => t.id === teacher.id);
    if (index !== -1) {
      list[index] = teacher;
      localStorage.setItem(KEYS.TEACHERS, JSON.stringify(list));
    }
  },
  deleteTeacher: (id: string) => {
    const list = StorageService.getTeachers().filter(t => t.id !== id);
    localStorage.setItem(KEYS.TEACHERS, JSON.stringify(list));
  },

  // --- CLASSES ---
  getClasses: (): ClassRoom[] => {
    return JSON.parse(localStorage.getItem(KEYS.CLASSES) || '[]');
  },
  addClass: (cls: ClassRoom) => {
    const list = StorageService.getClasses();
    list.push(cls);
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(list));
  },
  updateClass: (cls: ClassRoom) => {
    const list = StorageService.getClasses();
    const index = list.findIndex(c => c.id === cls.id);
    if (index !== -1) {
      list[index] = cls;
      localStorage.setItem(KEYS.CLASSES, JSON.stringify(list));
    }
  },
  deleteClass: (id: string) => {
    const list = StorageService.getClasses().filter(c => c.id !== id);
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(list));
  },

  // --- OCCURRENCES ---
  getOccurrences: (): Occurrence[] => {
    return JSON.parse(localStorage.getItem(KEYS.OCCURRENCES) || '[]');
  },
  saveOccurrence: (occurrence: Occurrence) => {
    const list = StorageService.getOccurrences();
    const index = list.findIndex(o => o.id === occurrence.id);
    if (index >= 0) {
      list[index] = occurrence;
    } else {
      list.unshift(occurrence); // Add to top
    }
    localStorage.setItem(KEYS.OCCURRENCES, JSON.stringify(list));
  },

  // --- SESSIONS ---
  getSessions: (): ClassSession[] => {
    return JSON.parse(localStorage.getItem(KEYS.SESSIONS) || '[]');
  },
  saveSession: (session: ClassSession) => {
    const list = StorageService.getSessions();
    const index = list.findIndex(s => s.id === session.id);
    if (index >= 0) {
      list[index] = session;
    } else {
      list.push(session);
    }
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(list));
  },

  getStudentStats: (studentId: string) => {
    const sessions = StorageService.getSessions();
    let totalClasses = 0;
    let presentClasses = 0;
    let talk = 0;
    let activity = 0;

    sessions.forEach(sess => {
      const record = sess.records.find(r => r.studentId === studentId);
      if (record) {
        // Count double classes if blocksCount > 1, default 1
        const weight = sess.blocksCount || 1;
        totalClasses += weight;

        if (record.present) presentClasses += weight;

        // Counters are average per session entry, not per block necessarily, 
        // but for simple averaging we sum them up.
        talk += record.counters.talk;
        activity += record.counters.activity;
      }
    });

    const sessionsCount = sessions.filter(s => s.records.some(r => r.studentId === studentId)).length;

    return {
      attendanceRate: totalClasses ? (presentClasses / totalClasses) * 100 : 0,
      avgTalk: sessionsCount ? (talk / sessionsCount) : 0,
      avgActivity: sessionsCount ? (activity / sessionsCount) : 0,
      totalClasses
    };
  }
};
