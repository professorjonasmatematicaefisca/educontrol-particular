
export enum UserRole {
  COORDINATOR = 'COORDINATOR',
  TEACHER = 'TEACHER',
  MONITOR = 'MONITOR',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  GAME_STUDENT = 'GAME_STUDENT'
}

export interface TeacherClassAssignment {
  classId: string; // The name of the class (e.g., "9º Ano A")
  subject: string; // The name of the subject
  front?: string;  // Optional front (e.g., "Frente 1")
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional because we might not return it in all queries
  role: UserRole;
  photoUrl?: string;
  subject?: string; // Legacy/Simple
  assignments?: TeacherClassAssignment[]; // New: Specific class/subject assignments
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subject: string; // Legacy: Primary subject or "Multiple"
  assignments?: TeacherClassAssignment[];
  photoUrl?: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "9º Ano A"
  period: string; // e.g. "Matutino"
  disciplineIds?: string[];
}

export interface Discipline {
  id: string;
  name: string; // e.g. "Matemática 9º EFII"
  displayName?: string; // e.g. "Matemática"
  whiteboardBackgroundUrl?: string; // PDF A4 background for the whiteboard
}

export interface Student {
  id: string;
  name: string;
  photoUrl: string;
  parentEmail: string;
  parentName?: string;
  parentId?: string; // Link to users table
  billing_day?: number;
  billing_period?: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'PER_CLASS';
  hourlyRate?: number;
  phone?: string;
  className: string;
  status?: string; // 'ACTIVE' | 'INACTIVE'
  inactiveReason?: string;
  inactiveDate?: string;
}

export interface Counters {
  talk: number;
  bathroom: number;
  sleep: number;
  material: number;
  activity: number;
  homework: number; // New: 0 (No) or 1 (Yes)
  participation: number; // New: Total ticks (0-10)
}

export interface SessionRecord {
  studentId: string;
  present: boolean;
  present2?: boolean; // New: Support for second attendance call in double classes
  justifiedAbsence?: boolean; // New field for justified absence (Grade 5.0)
  phoneConfiscated: boolean;
  counters: Counters;
  notes?: string;
  photos?: string[]; // New: Specific photos for this student's record
}

export interface ClassSession {
  id: string;
  date: string; // ISO String
  teacherId: string;
  teacherName?: string;
  subject: string;
  className: string;
  block: string;
  blocksCount?: number; // New: Number of time blocks (e.g., 2 for double class)
  records: SessionRecord[];
  topic?: string;
  generalNotes?: string;
  homework?: string;
  photos?: string[]; // URLs (Class generic photos)
  moduleIds?: string[]; // IDs of planning modules used in this session
}

export enum OccurrenceStatus {
  OPEN = 'OPEN',
  ANALYZING = 'ANALYZING',
  RESOLVED = 'RESOLVED'
}

export enum OccurrenceType {
  DISCIPLINE = 'DISCIPLINE',
  HEALTH = 'HEALTH',
  CONFLICT = 'CONFLICT',
  PRAISE = 'PRAISE'
}

export interface Occurrence {
  id: string;
  type: OccurrenceType;
  description: string;
  studentIds: string[];
  date: string;
  status: OccurrenceStatus;
  photos?: string[];
  reportedBy: string;
}

export interface StudentExit {
  id: string;
  studentId: string;
  studentName?: string; // For UI convenience
  studentPhoto?: string; // For UI convenience
  className?: string;   // For UI convenience
  reasons: string[];
  exitTime: string;
  returnTime?: string;
  registeredBy?: string; // Who registered this exit
}


export interface PlanningModule {
  id: string;
  disciplineId: string;
  teacherId?: string;
  classId?: string;
  front: string;
  chapter: string;
  module: string;
  title: string;
  topic: string;
  bimestre: number;
  isUsed?: boolean;
  createdAt?: string;
}

export interface PlanningSchedule {
  id: string;
  moduleId: string;
  plannedDate: string;
  executionStatus?: 'pending' | 'executed' | 'not_executed';
  justification?: string;
  createdAt?: string;
}

export interface StudyGuideItem {
  id: string;
  teacherId: string;
  disciplineId: string;
  classId: string;
  moduleId: string;
  bimestre: number;
  examType: 'P1' | 'P2' | 'SUBSTITUTIVA' | 'RECUPERACAO';
  orientation?: string;
  module?: PlanningModule; // joined
  createdAt?: string;
}

export interface ScheduledClass {
  id: string;
  studentId: string;
  teacherId?: string;
  classDate: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ABSENT';
  hourlyRate?: number;
  totalValue?: number;
  notes?: string;
  disciplineId?: string; // New: Selected discipline when completed
  subjectNotes?: string; // New: What was taught
  rescheduledBy?: string; // New: Who changed the time
  rescheduledAt?: string; // New: When it was changed
  studentName?: string; // Join field
  studentPhoto?: string; // Join field
  className?: string; // Join field
  parentName?: string; // Join field
  teacherName?: string; // Join field
  teacherPhoto?: string; // Join field
  whiteboardUrl?: string; // New: Saved whiteboard PDF
  paymentStatus?: 'PENDING' | 'PAID'; // New: Payment status for private lessons
  previousClassDate?: string; // New: Audit history
  previousStartTime?: string; // New: Audit history
  paymentAccountId?: string; // New: Bank account used
  paidAt?: string; // New: Payment date
  pdfUrl?: string; // New: Attachment associated with the completed class
  disciplineName?: string; // Join field for UI convenience
}

export interface BankAccount {
  id: string;
  name: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface Simulado {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  disciplineId: string;
  type: 'LISTA' | 'SIMULADO';
  contentTopic?: string;
  questions: any[]; 
  durationMinutes?: number;
  createdAt?: string;
}

export interface SimuladoAssignment {
  id: string;
  simuladoId: string;
  studentId: string;
  teacherId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string;
  createdAt?: string;
  simulado?: Simulado; // Joined field
}

export interface SimuladoAttempt {
  id: string;
  simuladoId: string;
  studentId: string;
  assignmentId?: string;
  score?: number;
  startedAt: string;
  completedAt?: string;
  answers: any[];
  status: 'IN_PROGRESS' | 'COMPLETED';
  timeSpentSeconds?: number;
}

export type ViewState = 'DASHBOARD' | 'STUDENTS' | 'CALENDAR' | 'ADMIN' | 'SETTINGS' | 'FINANCIAL' | 'SIMULADO' | 'COURSES' | 'WHITEBOARD';

export interface RequestItem {
  id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  teacherId?: string;
  teacherName?: string;
  sessionId?: string;
  sessionInfo?: {
    date: string;
    className: string;
    subject: string;
    block: string;
  };
  reason?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface MessageItem {
  id: string;
  senderName: string;
  senderEmail?: string;
  senderRole: string;
  subject: string;
  body: string;
  recipients: 'students' | 'parents' | 'both' | 'coordinator' | 'individual_student' | 'individual_parent';
  targetClass?: string;
  targetStudentId?: string; // New: For individual communications
  attachmentType?: string;
  attachmentData?: any;
  directImages?: string[]; // New: For direct photo uploads
  isRead?: boolean;
  createdAt: string;
}


export interface Course {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  disciplineId?: string;
  createdAt: string;
  items?: CourseItem[];
}

export interface CourseItem {
  id: string;
  courseId: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'LINK' | 'TEXT';
  contentUrl?: string;
  textContent?: string;
  order: number;
}
