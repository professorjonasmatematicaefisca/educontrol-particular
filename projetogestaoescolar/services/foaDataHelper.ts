/**
 * Reusable FOA data generation logic — extracted from FOA.tsx
 * so that Comunicados can generate FOA PDFs with real data.
 */
import { Student, Teacher, ClassSession, Occurrence } from '../types';

export type Concept = 'O' | 'B' | 'S' | 'I' | '-';

export interface DisciplineRowData {
    subject: string;
    teacherName: string;
    comportamento: Concept;
    atencao: Concept;
    tarefas: Concept;
    atividades: Concept;
    material: Concept;
    engajamento: Concept;
    autogestao: Concept;
    participacao: Concept;
    abertura: Concept;
}

export interface ObservationLog {
    date: string;
    subject: string;
    teacher: string;
    note: string;
    hasPhotos: boolean;
}

/**
 * Converts raw numeric averages into concept grades (O/B/S/I)
 */
export const getConcept = (value: number, type: 'comportamento' | 'atencao' | 'material' | 'atividade' | 'autogestao' | 'tarefas' | 'participacao'): Concept => {
    if (isNaN(value)) return '-';

    switch (type) {
        case 'comportamento':
            if (value <= 0.2) return 'O';
            if (value <= 0.6) return 'B';
            if (value <= 1.2) return 'S';
            return 'I';

        case 'atencao':
            if (value <= 0.1) return 'O';
            if (value <= 0.5) return 'B';
            if (value <= 1.5) return 'S';
            return 'I';

        case 'material':
            if (value >= 0.9) return 'O';
            if (value >= 0.7) return 'B';
            if (value >= 0.5) return 'S';
            return 'I';

        case 'tarefas':
            if (value >= 0.9) return 'O';
            if (value >= 0.7) return 'B';
            if (value >= 0.5) return 'S';
            return 'I';

        case 'atividade':
            if (value >= 2.8) return 'O';
            if (value >= 2.0) return 'B';
            if (value >= 1.0) return 'S';
            return 'I';

        case 'participacao':
            if (value >= 8.0) return 'O';
            if (value >= 5.0) return 'B';
            if (value >= 2.0) return 'S';
            return 'I';

        case 'autogestao':
            if (value <= 0.05) return 'O';
            if (value <= 0.15) return 'B';
            if (value <= 0.3) return 'S';
            return 'I';

        default: return '-';
    }
};

/**
 * Generates FOA data for a specific student, given all the required context.
 * This is an extracted, standalone version of FOA.tsx's generateFOAData().
 */
export function generateFOADataForStudent(
    studentId: string,
    className: string,
    year: number,
    sessions: ClassSession[],
    teachers: Teacher[],
    occurrences: Occurrence[]
): { rows: DisciplineRowData[], observations: ObservationLog[] } {
    const rows: DisciplineRowData[] = [];
    const observations: ObservationLog[] = [];

    // 1. Identify all subjects for this class based on Teacher Assignments
    const classCurriculum: { subject: string; teacherId: string; teacherName: string }[] = [];

    teachers.forEach(t => {
        if (t.assignments) {
            t.assignments.forEach(a => {
                if (a.classId === className) {
                    classCurriculum.push({
                        subject: a.subject,
                        teacherId: t.id,
                        teacherName: t.name
                    });
                }
            });
        }
    });

    const uniqueCurriculum = Array.from(new Map(classCurriculum.map(item => [item.subject, item])).values());
    uniqueCurriculum.sort((a, b) => a.subject.localeCompare(b.subject));

    // Add formal occurrences to observations
    occurrences.forEach(occ => {
        if (occ.studentIds.includes(studentId) && new Date(occ.date).getFullYear() === year) {
            observations.push({
                date: occ.date,
                subject: 'OCORRÊNCIA',
                teacher: occ.reportedBy,
                note: `[${occ.type}] ${occ.description}`,
                hasPhotos: !!(occ.photos && occ.photos.length > 0)
            });
        }
    });

    // 2. Process Stats per Subject
    uniqueCurriculum.forEach(curr => {
        const subjectSessions = sessions.filter(s =>
            s.className === className &&
            s.subject === curr.subject &&
            new Date(s.date).getFullYear() === year
        );

        let recordsCount = 0;
        let sumTalk = 0, sumSleep = 0, sumBathroom = 0, sumMaterial = 0, sumActivity = 0, sumPhone = 0, sumHomework = 0, sumParticipation = 0;

        subjectSessions.forEach(sess => {
            const rec = sess.records.find(r => r.studentId === studentId);
            if (rec) {
                recordsCount++;
                sumTalk += rec.counters.talk;
                sumSleep += rec.counters.sleep;
                sumBathroom += rec.counters.bathroom;
                sumMaterial += rec.counters.material;
                sumActivity += rec.counters.activity;
                sumPhone += (rec.phoneConfiscated ? 1 : 0);
                sumHomework += (rec.counters.homework ?? 1);
                sumParticipation += (rec.counters.participation ?? 0);

                if (rec.notes || (rec.photos && rec.photos.length > 0)) {
                    observations.push({
                        date: sess.date,
                        subject: curr.subject,
                        teacher: sess.teacherName || curr.teacherName.split(' ')[0],
                        note: rec.notes || 'Registro de imagem sem observação escrita.',
                        hasPhotos: !!(rec.photos && rec.photos.length > 0)
                    });
                }
            }
        });

        const count = recordsCount || 0;
        const participationScore = count ? sumParticipation / count : 0;

        const stats: DisciplineRowData = {
            subject: curr.subject,
            teacherName: curr.teacherName,
            comportamento: count ? getConcept((sumTalk + sumSleep) / count, 'comportamento') : '-',
            atencao: count ? getConcept(sumBathroom / count, 'atencao') : '-',
            tarefas: count ? getConcept(sumHomework / count, 'tarefas') : '-',
            atividades: count ? getConcept(sumActivity / count, 'atividade') : '-',
            material: count ? getConcept(sumMaterial / count, 'material') : '-',
            engajamento: count ? getConcept(((sumActivity / count) + (participationScore * 3)) / 2, 'atividade') : '-',
            autogestao: count ? getConcept(sumPhone / count, 'autogestao') : '-',
            participacao: count ? getConcept(sumParticipation / count, 'participacao') : '-',
            abertura: count ? ((sumTalk / count) < 1 ? 'O' : 'B') : '-'
        };

        rows.push(stats);
    });

    observations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { rows, observations };
}
