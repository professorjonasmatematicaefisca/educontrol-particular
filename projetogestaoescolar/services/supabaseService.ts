import { supabase } from '../supabaseClient';
import { Student, ClassRoom, Discipline, Teacher, Occurrence, ClassSession, SessionRecord, UserRole, StudentExit, PlanningModule, PlanningSchedule, StudyGuideItem, RequestItem, ScheduledClass, Simulado, SimuladoAttempt, BankAccount } from '../types';
import { SEED_STUDENTS, SEED_CLASSES, SEED_TEACHERS, SEED_OCCURRENCES } from './mockData';
import { offlineService } from './offlineService';

export const SupabaseService = {
    async getPlanningModules(filters?: { teacherId?: string, classId?: string, disciplineId?: string, unusedOnly?: boolean }): Promise<PlanningModule[]> {
        let query = supabase.from('planning_modules').select('*');

        // Note: For shared planning, we mainly filter by disciplineId
        if (filters?.disciplineId) query = query.eq('discipline_id', filters.disciplineId);

        // If unusedOnly is true and classId is provided, filter out modules used by this specific class
        let dataToReturn: any[] = [];

        const { data, error } = await query
            .order('chapter', { ascending: true })
            .order('module', { ascending: true });

        if (error) {
            console.error("Error fetching planning modules:", error);
            return [];
        }

        dataToReturn = data;

        if (filters?.unusedOnly && filters?.classId) {
            const { data: usageData } = await supabase
                .from('planning_usage')
                .select('module_id')
                .eq('class_id', filters.classId);

            if (usageData) {
                const usedIds = new Set(usageData.map((u: any) => u.module_id));
                // Keep Cap 0 / Mod 0 modules (special always-available modules) even if used
                dataToReturn = data.filter((m: any) =>
                    !usedIds.has(m.id) || (String(m.chapter) === '0' && String(m.module) === '0')
                );
            }
        }

        if (error) {
            console.error("Error fetching planning modules:", error);
            return [];
        }

        return dataToReturn.map((m: any) => ({
            id: m.id,
            disciplineId: m.discipline_id,
            teacherId: m.teacher_id,
            classId: m.class_id,
            front: m.front,
            chapter: m.chapter,
            module: m.module,
            title: m.title,
            topic: m.topic,
            bimestre: m.bimestre || 1,
            isUsed: false, // Usage is handled by filtering above
            createdAt: m.created_at
        }));
    },

    async markModulesAsUsed(moduleIds: string[], classId?: string): Promise<boolean> {
        if (moduleIds.length === 0 || !classId) return true;

        const usageToInsert = moduleIds.map(id => ({
            class_id: classId,
            module_id: id,
            is_used: true
        }));

        const { error } = await supabase
            .from('planning_usage')
            .upsert(usageToInsert, { onConflict: 'class_id, module_id' });

        if (error) {
            console.error("Error marking modules as used:", error);
            return false;
        }
        return true;
    },

    async deletePlanningModule(id: string): Promise<boolean> {
        const { error } = await supabase.from('planning_modules').delete().eq('id', id);
        if (error) {
            console.error("Error deleting planning module:", error);
            return false;
        }
        return true;
    },

    async savePlanningModule(module: Omit<PlanningModule, 'id'>): Promise<string | null> {
        const { data, error } = await supabase.from('planning_modules').insert({
            discipline_id: module.disciplineId,
            teacher_id: module.teacherId,
            class_id: module.classId,
            front: module.front,
            chapter: module.chapter,
            module: module.module,
            title: module.title,
            topic: module.topic,
            bimestre: module.bimestre || 1
        }).select().single();

        if (error) {
            console.error("Error saving planning module:", error);
            return null;
        }
        return data.id;
    },

    async getClassDisciplines(classId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('class_disciplines')
            .select('discipline_id')
            .eq('class_id', classId);

        if (error) {
            console.error("Error fetching class disciplines:", error);
            return [];
        }
        return data.map((d: any) => d.discipline_id);
    },

    async setClassDisciplines(classId: string, disciplineIds: string[]): Promise<boolean> {
        // Delete existing
        const { error: delError } = await supabase
            .from('class_disciplines')
            .delete()
            .eq('class_id', classId);

        if (delError) {
            console.error("Error deleting old class disciplines:", delError);
            return false;
        }

        if (disciplineIds.length === 0) return true;

        const toInsert = disciplineIds.map(dId => ({
            class_id: classId,
            discipline_id: dId
        }));

        const { error: insError } = await supabase
            .from('class_disciplines')
            .insert(toInsert);

        if (insError) {
            console.error("Error inserting class disciplines:", insError);
            return false;
        }
        return true;
    },

    async getPlanningSchedule(filters?: { moduleId?: string, teacherId?: string }): Promise<(PlanningSchedule & { module?: PlanningModule })[]> {
        let query = supabase
            .from('planning_schedule')
            .select('*, module:planning_modules(*)');

        if (filters?.moduleId) query = query.eq('module_id', filters.moduleId);

        const { data, error } = await query.order('planned_date', { ascending: true });

        if (error) {
            console.error("Error fetching planning schedule:", error);
            return [];
        }

        return data.map((s: any) => ({
            id: s.id,
            moduleId: s.module_id,
            plannedDate: s.planned_date,
            executionStatus: s.execution_status || 'pending',
            justification: s.justification,
            createdAt: s.created_at,
            module: s.module ? {
                id: s.module.id,
                disciplineId: s.module.discipline_id,
                teacherId: s.module.teacher_id,
                classId: s.module.class_id,
                front: s.module.front,
                chapter: s.module.chapter,
                module: s.module.module,
                title: s.module.title,
                topic: s.module.topic,
                bimestre: s.module.bimestre || 1,
                createdAt: s.module.created_at
            } : undefined
        }));
    },

    async deletePlanningSchedule(id: string): Promise<boolean> {
        const { error } = await supabase.from('planning_schedule').delete().eq('id', id);
        if (error) {
            console.error("Error deleting schedule:", error);
            return false;
        }
        return true;
    },

    async updatePlanningSchedule(id: string, updates: Partial<Omit<PlanningSchedule, 'id'>>): Promise<boolean> {
        const payload: any = {};
        if (updates.moduleId !== undefined) payload.module_id = updates.moduleId;
        if (updates.plannedDate !== undefined) payload.planned_date = updates.plannedDate;

        const { error } = await supabase.from('planning_schedule').update(payload).eq('id', id);
        if (error) {
            console.error("Error updating schedule:", error);
            return false;
        }
        return true;
    },

    // --- PLANNING LOCKS ---
    async getPlanningLocks(): Promise<{ globalLocked: boolean; teacherLocks: { teacherId: string; locked: boolean }[] }> {
        const { data, error } = await supabase.from('planning_locks').select('*');
        if (error || !data) return { globalLocked: false, teacherLocks: [] };

        const globalRow = data.find((r: any) => r.id === 'global');
        const teacherRows = data.filter((r: any) => r.id !== 'global' && r.teacher_id);

        return {
            globalLocked: globalRow?.locked || false,
            teacherLocks: teacherRows.map((r: any) => ({ teacherId: r.teacher_id, locked: r.locked }))
        };
    },

    async setGlobalLock(locked: boolean, lockedBy?: string): Promise<boolean> {
        const { error } = await supabase.from('planning_locks').upsert({
            id: 'global',
            locked,
            locked_by: lockedBy || null,
            teacher_id: null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        return !error;
    },

    async setTeacherLock(teacherId: string, locked: boolean, lockedBy?: string): Promise<boolean> {
        const lockId = `teacher_${teacherId}`;
        const { error } = await supabase.from('planning_locks').upsert({
            id: lockId,
            locked,
            teacher_id: teacherId,
            locked_by: lockedBy || null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        return !error;
    },

    async removeTeacherLock(teacherId: string): Promise<boolean> {
        const lockId = `teacher_${teacherId}`;
        const { error } = await supabase.from('planning_locks').delete().eq('id', lockId);
        return !error;
    },

    async savePlanningSchedule(schedule: Omit<PlanningSchedule, 'id'>): Promise<boolean> {
        const { error } = await supabase.from('planning_schedule').insert({
            module_id: schedule.moduleId,
            planned_date: schedule.plannedDate
        });

        if (error) {
            console.error("Error saving planning schedule:", error);
            return false;
        }
        return true;
    },

    async updateScheduleJustification(scheduleId: string, status: string, justification: string): Promise<boolean> {
        const { error } = await supabase.from('planning_schedule').update({
            execution_status: status,
            justification: justification
        }).eq('id', scheduleId);
        if (error) {
            console.error("Error updating justification:", error);
            return false;
        }
        return true;
    },
    // --- MIGRATION UTILS ---
    async migrateMockData() {
        console.log("Starting migration...");

        // 1. Migrate Classes
        const { data: existingClasses } = await supabase.from('classes').select('name');
        const existingClassNames = new Set(existingClasses?.map(c => c.name));

        const classesToInsert = SEED_CLASSES.filter(c => !existingClassNames.has(c.name)).map(c => ({
            name: c.name,
            period: c.period
        }));

        if (classesToInsert.length > 0) {
            const { error: classError } = await supabase.from('classes').insert(classesToInsert);
            if (classError) console.error("Error migrating classes:", classError);
            else console.log("Classes migrated successfully.");
        } else {
            console.log("Classes already exist, skipping.");
        }

        // 2. Migrate Teachers (Users)
        // Check if users exist by email
        const { data: existingUsers } = await supabase.from('users').select('email');
        const existingEmails = new Set(existingUsers?.map(u => u.email));

        const teachersToInsert = SEED_TEACHERS.filter(t => !existingEmails.has(t.email)).map(t => ({
            name: t.name,
            email: t.email,
            password: '123', // Senha padrão 123
            role: 'TEACHER',
            subject: t.subject,
            assignments: t.assignments,
        }));

        if (teachersToInsert.length > 0) {
            const { error: userError } = await supabase.from('users').insert(teachersToInsert);
            if (userError) console.error("Error migrating teachers:", userError);
            else console.log("Teachers migrated successfully.");
        } else {
            console.log("Teachers already exist, skipping.");
        }

        // 3. Migrate Students
        // Check if students exist by name (assuming unique names for now, or fetch all and check)
        const { data: existingStudents } = await supabase.from('students').select('name');
        const existingStudentNames = new Set(existingStudents?.map(s => s.name));

        const studentsToInsert = SEED_STUDENTS.filter(s => !existingStudentNames.has(s.name)).map(s => ({
            name: s.name,
            photo_url: s.photoUrl,
            parent_email: s.parentEmail,
            class_name: s.className
        }));

        if (studentsToInsert.length > 0) {
            const { error: studentError } = await supabase.from('students').insert(studentsToInsert);
            if (studentError) console.error("Error migrating students:", studentError);
            else console.log("Students migrated successfully:", studentsToInsert.length);
        } else {
            console.log("Students already exist, skipping.");
        }

        console.log("Migration completed.");
    },

    // --- DATA FETCHING ---
    async getClasses(): Promise<ClassRoom[]> {
        if (!offlineService.isOnline()) {
            const cached = await offlineService.getCache<ClassRoom[]>('classes');
            if (cached) return cached;
            return [];
        }

        const { data, error } = await supabase.from('classes').select('*');
        if (error) {
            console.error("Error fetching classes:", error);
            const cached = await offlineService.getCache<ClassRoom[]>('classes');
            return cached || [];
        }

        const { data: assignments } = await supabase.from('class_disciplines').select('class_id, discipline_id');
        const assignmentsMap: Record<string, string[]> = {};
        assignments?.forEach(a => {
            if (!assignmentsMap[a.class_id]) assignmentsMap[a.class_id] = [];
            assignmentsMap[a.class_id].push(a.discipline_id);
        });

        const classes = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            period: c.period,
            disciplineIds: assignmentsMap[c.id] || []
        }));

        const classOrder: Record<string, number> = {
            '9º A EFII': 1,
            '9º B EFII': 2,
            '1º AEM': 3,
            '2º AEM': 4,
            '3º AEM': 5,
        };

        const sorted = classes.sort((a, b) => {
            const orderA = classOrder[a.name] || 99;
            const orderB = classOrder[b.name] || 99;
            if (orderA === orderB) return a.name.localeCompare(b.name);
            return orderA - orderB;
        });

        await offlineService.setCache('classes', sorted);
        return sorted;
    },

    async getStudents(includeInactive = false): Promise<Student[]> {
        const cacheKey = `students_${includeInactive}`;

        if (!offlineService.isOnline()) {
            const cached = await offlineService.getCache<Student[]>(cacheKey);
            if (cached) return cached;
            return [];
        }

        let query = supabase.from('students').select('*');
        if (!includeInactive) {
            query = query.eq('status', 'ACTIVE');
        }
        const { data, error } = await query.order('name', { ascending: true });

        if (error) {
            console.error("Error fetching students:", error);
            const cached = await offlineService.getCache<Student[]>(cacheKey);
            return cached || [];
        }

        const students = data.map((s: any) => ({
            id: String(s.id),
            name: String(s.name || ''),
            photoUrl: String(s.photo_url || ''),
            parentEmail: String(s.parent_email || ''),
            parentName: String(s.parent_name || ''),
            hourlyRate: s.hourly_rate ? Number(s.hourly_rate) : 0,
            phone: String(s.phone || ''),
            className: String(s.class_name || ''),
            status: String(s.status || 'ACTIVE'),
            inactiveReason: String(s.inactive_reason || ''),
            inactiveDate: String(s.inactive_date || '')
        }));

        console.log(`[SupabaseService] getStudents (${includeInactive ? 'incl. inativos' : 'ativos'}): ${students.length} alunos carregados.`);

        await offlineService.setCache(cacheKey, students);
        return students;
    },

    async createStudent(student: Omit<Student, 'id'>): Promise<boolean> {
        console.log("[SupabaseService] Criando aluno:", student);
        
        const hourlyRateNormalized = isNaN(Number(student.hourlyRate)) ? 0 : Number(student.hourlyRate);

        const { data, error } = await supabase.from('students').insert({
            name: student.name || '',
            photo_url: student.photoUrl || null,
            parent_email: student.parentEmail?.toLowerCase() || null,
            parent_name: student.parentName || null,
            hourly_rate: hourlyRateNormalized,
            phone: student.phone || null,
            class_name: student.className,
            status: student.status || 'ACTIVE',
            inactive_reason: student.inactiveReason || null,
            inactive_date: student.inactiveDate || null
        }).select().single();

        if (error) {
            console.error("Error creating student:", error);
            return false;
        }

        // Auto-create parent user if parentEmail is provided
        if (student.parentEmail) {
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('email', student.parentEmail)
                .maybeSingle();

            if (!existing) {
                await supabase.from('users').insert({
                    name: `Responsável de ${student.name}`,
                    email: student.parentEmail,
                    password: 'mudar123',
                    role: 'PARENT'
                });
            }
        }

        // Criar a matrícula primária
        if (data && data.id) {
            await supabase.from('enrollments').insert({
                student_id: data.id,
                class_name: student.className,
                academic_year: new Date().getFullYear(),
                status: 'ACTIVE'
            });
        }

        return true;
    },

    async deactivateStudent(id: string, reason: string): Promise<boolean> {
        // 1. Marcar aluno como inativo
        const { error: studentError } = await supabase
            .from('students')
            .update({
                status: 'INACTIVE',
                inactive_reason: reason,
                inactive_date: new Date().toISOString()
            })
            .eq('id', id);

        if (studentError) {
            console.error("Error deactivating student:", studentError);
            return false;
        }

        // 2. Encerrar a matrícula atual (fechar enrollment)
        await supabase
            .from('enrollments')
            .update({
                status: 'INACTIVE',
                end_date: new Date().toISOString()
            })
            .eq('student_id', id)
            .eq('status', 'ACTIVE')
            .is('end_date', null);

        return true;
    },

    async transferStudentClass(id: string, newClassName: string): Promise<boolean> {
        // 1. Fechar a matrícula antiga
        await supabase
            .from('enrollments')
            .update({
                status: 'TRANSFERRED',
                end_date: new Date().toISOString()
            })
            .eq('student_id', id)
            .eq('status', 'ACTIVE')
            .is('end_date', null);

        // 2. Criar a nova matrícula
        const currentYear = new Date().getFullYear();
        await supabase.from('enrollments').insert({
            student_id: id,
            class_name: newClassName,
            academic_year: currentYear,
            status: 'ACTIVE'
        });

        // 3. Atualizar a ref base no estudante
        const { error } = await supabase
            .from('students')
            .update({ class_name: newClassName })
            .eq('id', id);

        return !error;
    },

    async advanceStudentsYear(studentIds: string[], targetClassName: string, targetYear: number): Promise<boolean> {
        if (studentIds.length === 0) return true;

        // 1. Completar matrículas atuais destes alunos
        await supabase
            .from('enrollments')
            .update({
                status: 'COMPLETED',
                end_date: new Date().toISOString()
            })
            .in('student_id', studentIds)
            .eq('status', 'ACTIVE')
            .is('end_date', null);

        // 2. Criar novas matrículas para o novo ano
        const newEnrollments = studentIds.map(id => ({
            student_id: id,
            class_name: targetClassName,
            academic_year: targetYear,
            status: 'ACTIVE'
        }));

        await supabase.from('enrollments').insert(newEnrollments);

        // 3. Atualizar a base do aluno para aparecerem na nova classe no sistema atual
        const { error } = await supabase
            .from('students')
            .update({ class_name: targetClassName })
            .in('id', studentIds);

        return !error;
    },

    async getEnrollments(year: number): Promise<any[]> {
        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                *,
                student:student_id (id, name, photo_url, parent_email)
            `)
            .eq('academic_year', year);

        if (error) {
            console.error("Error fetching enrollments:", error);
            return [];
        }
        return data;
    },

    async getStudentsByYear(year: number): Promise<Student[]> {
        const enrollments = await this.getEnrollments(year);
        return enrollments.map(e => ({
            id: e.student.id,
            name: e.student.name,
            photoUrl: e.student.photo_url,
            parentEmail: e.student.parent_email,
            className: e.class_name, // Turma que ele estava NAQUELE ano
            status: e.status
        }));
    },

    async syncParentAccounts(): Promise<{ success: boolean, createdCount: number }> {
        const { data: students, error: sError } = await supabase.from('students').select('*');
        if (sError) return { success: false, createdCount: 0 };

        let createdCount = 0;
        for (const student of students) {
            if (student.parent_email) {
                const { data: existing } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', student.parent_email)
                    .maybeSingle();

                if (!existing) {
                    const { error: iError } = await supabase.from('users').insert({
                        name: `Responsável de ${student.name}`,
                        email: student.parent_email,
                        password: 'mudar123',
                        role: 'PARENT'
                    });
                    if (!iError) createdCount++;
                }
            }
        }
        return { success: true, createdCount };
    },

    async getTeachers(): Promise<Teacher[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .in('role', [UserRole.TEACHER, UserRole.COORDINATOR, UserRole.MONITOR])
            .order('name', { ascending: true });

        if (error) {
            console.error("Error fetching staff:", error);
            return SEED_TEACHERS.map(t => ({ ...t, role: UserRole.TEACHER }));
        }
        const teachers = data.map((t: any) => ({
            id: String(t.id),
            name: String(t.name || ''),
            email: String(t.email || ''),
            role: t.role as UserRole,
            subject: String(t.subject || ''),
            assignments: t.assignments || [],
            photoUrl: String(t.photo_url || '')
        }));

        await offlineService.setCache('staff', teachers);
        return teachers;
    },

    // --- HELPERS ---
    async getTeacherIdByEmail(email: string): Promise<string | null> {
        const { data, error } = await supabase.from('users').select('id').eq('email', email).single();
        if (error || !data) return null;
        return data.id;
    },

    // --- SESSION MANAGEMENT ---
    async saveSession(session: ClassSession, userEmail?: string): Promise<{ success: boolean, error?: string }> {
        if (!offlineService.isOnline()) {
            await offlineService.addToSyncQueue({
                feature: 'frequence',
                operation: 'POST',
                data: { session, userEmail }
            });
            return { success: true };
        }

        let teacherId = session.teacherId;

        // Try to resolve teacher ID from email if it's a mock ID or missing
        if ((!teacherId || teacherId.startsWith('prof-')) && userEmail) {
            const resolvedId = await this.getTeacherIdByEmail(userEmail);
            if (resolvedId) teacherId = resolvedId;
        }

        const { date, subject, className, block, blocksCount, generalNotes, homework, photos } = session;
        const sessionPayload: any = {
            date,
            teacher_id: teacherId && !teacherId.startsWith('prof-') ? teacherId : null,
            subject,
            class_name: className,
            block,
            blocks_count: blocksCount || 1,
            general_notes: generalNotes,
            homework,
            photos,
            module_ids: session.moduleIds || []
        };

        let sessionId: string;

        // Upsert strategy based on (date, teacher_id, subject, class_name)
        // This ensures uniqueness even if finding existing session fails client-side
        const { data: upsertData, error: upsertError } = await supabase
            .from('sessions')
            .upsert(sessionPayload, {
                onConflict: 'date, teacher_id, subject, class_name',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (upsertError || !upsertData) {
            console.error("Error upserting session:", upsertError);
            return {
                success: false,
                error: upsertError ? `${upsertError.code}: ${upsertError.message}` : "Falha ao salvar sessão"
            };
        }

        sessionId = upsertData.id;

        // Delete existing records to replace them (Clean-up before re-insert)
        const { error: deleteError } = await supabase
            .from('session_records')
            .delete()
            .eq('session_id', sessionId);

        if (deleteError) {
            console.error("Error clearing old records:", deleteError);
            return { success: false, error: `Delete Error: ${deleteError.message}` };
        }

        // Insert Records
        const recordsToInsert = session.records.map(r => ({
            session_id: sessionId,
            student_id: r.studentId,
            present: r.present,
            present2: r.present2 ?? r.present, // Default to present1 if present2 is missing
            justified_absence: r.justifiedAbsence,
            phone_confiscated: r.phoneConfiscated,
            counters: r.counters,
            notes: r.notes,
            photos: r.photos
        }));

        const { error: recordsError } = await supabase.from('session_records').insert(recordsToInsert);

        if (recordsError) {
            console.error("Error saving session records:", recordsError);
            return { success: false, error: `Records Error: ${recordsError.message}` };
        }

        // --- NEW: Repair orphans for this class immediately after saving ---
        const { data: classData } = await supabase.from('classes').select('id').eq('name', session.className).maybeSingle();
        if (classData) {
            await SupabaseService.repairPlanningUsage(classData.id, session.className);
        }

        return { success: true };
    },

    async findSession(filters: { date: string, teacherId: string, subject: string, className: string }): Promise<ClassSession | null> {
        // Find session for a specific day/teacher/subject/class
        // Note: we look for sessions where date starts with the YYYY-MM-DD string
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                teacher:teacher_id (name),
                session_records (*)
            `)
            .eq('class_name', filters.className)
            .eq('subject', filters.subject)
            .eq('teacher_id', filters.teacherId)
            // Use date range to capture all times within that day in UTC/ISO
            .gte('date', `${filters.date}T00:00:00Z`)
            .lte('date', `${filters.date}T23:59:59Z`)
            .maybeSingle();

        if (error || !data) return null;

        return {
            id: data.id,
            date: data.date,
            teacherId: data.teacher_id,
            teacherName: data.teacher?.name,
            subject: data.subject,
            className: data.class_name,
            block: data.block,
            blocksCount: data.blocks_count,
            generalNotes: data.general_notes,
            homework: data.homework,
            photos: data.photos,
            moduleIds: data.module_ids,
            records: data.session_records.map((r: any) => ({
                studentId: r.student_id,
                present: r.present,
                present2: r.present2,
                justifiedAbsence: r.justified_absence,
                phoneConfiscated: r.phone_confiscated,
                counters: r.counters,
                notes: r.notes,
                photos: r.photos
            }))
        };
    },

    async deleteSession(sessionId: string, classId?: string): Promise<boolean> {
        // 1. Fetch session to get moduleIds and class_name
        const { data: sessionData, error: fetchError } = await supabase
            .from('sessions')
            .select('module_ids, class_name')
            .eq('id', sessionId)
            .single();

        if (fetchError) {
            console.error("Error fetching session for deletion:", fetchError);
            // We proceed anyway to try and delete the session itself
        }

        let finalClassId = classId;

        // 2. Restore modules if they exist
        // If classId wasn't passed, try to look it up by name with normalization
        if (!finalClassId && sessionData?.class_name) {
            const normalize = (s: string) => s.replace(/[º°]/g, 'o').trim().toLowerCase();
            const sessionClassName = normalize(sessionData.class_name);

            const { data: allClasses } = await supabase.from('classes').select('id, name');
            if (allClasses) {
                const match = allClasses.find(c => normalize(c.name) === sessionClassName);
                if (match) finalClassId = match.id;
            }
        }

        if (finalClassId && sessionData?.module_ids && sessionData.module_ids.length > 0) {
            const { error: usageError } = await supabase
                .from('planning_usage')
                .delete()
                .eq('class_id', finalClassId)
                .in('module_id', sessionData.module_ids);

            if (usageError) {
                console.error("Error restoring planning modules:", usageError);
            }
        }

        // 3. Delete session records (FK constraint)
        const { error: recError } = await supabase
            .from('session_records')
            .delete()
            .eq('session_id', sessionId);
        if (recError) {
            console.error("Error deleting session records:", recError);
            return false;
        }

        // 4. Delete session
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', sessionId);
        if (error) {
            console.error("Error deleting session:", error);
            return false;
        }

        // --- NEW: Repair orphans after deletion ---
        if (finalClassId && sessionData?.class_name) {
            await SupabaseService.repairPlanningUsage(finalClassId, sessionData.class_name);
        }

        return true;
    },

    /**
     * AUTO-CURE: Ensures planning_usage only contains modules that ARE actually
     * referenced in at least one session for that class.
     */
    async repairPlanningUsage(classId: string, className: string): Promise<void> {
        try {
            // 1. Get all session module_ids for this class
            const { data: sessions } = await supabase
                .from('sessions')
                .select('module_ids')
                .eq('class_name', className);

            if (!sessions) return;

            // 2. Consolidate ALL IDs actually used in sessions
            const usedIds = new Set<string>();
            sessions.forEach(s => {
                if (Array.isArray(s.module_ids)) {
                    s.module_ids.forEach(id => usedIds.add(id));
                }
            });

            // 3. Get all IDs marked as used in planning_usage for this class
            const { data: usageData } = await supabase
                .from('planning_usage')
                .select('module_id')
                .eq('class_id', classId);

            if (!usageData) return;

            // 4. Identify Orphans: marked as used but NOT in any session
            const orphans = usageData
                .filter(u => !usedIds.has(u.module_id))
                .map(u => u.module_id);

            if (orphans.length > 0) {
                console.log(`[Auto-Cure] Repairing ${orphans.length} orphan modules for class ${className}`);
                await supabase
                    .from('planning_usage')
                    .delete()
                    .eq('class_id', classId)
                    .in('module_id', orphans);
            }
        } catch (err) {
            console.error("Error in repairPlanningUsage:", err);
        }
    },

    async getSessions(limit?: number): Promise<ClassSession[]> {
        let query = supabase
            .from('sessions')
            .select(`
                *,
                teacher:teacher_id (name),
                session_records (*)
            `)
            .order('date', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data: sessions, error } = await query;

        if (error) {
            console.error("Error fetching sessions:", error);
            return [];
        }

        return sessions.map((s: any) => ({
            id: s.id,
            date: s.date,
            teacherId: s.teacher_id || 'unknown',
            teacherName: s.teacher?.name || 'Professor Desconhecido',
            subject: s.subject,
            className: s.class_name,
            block: s.block,
            blocksCount: s.blocks_count,
            generalNotes: s.general_notes,
            homework: s.homework,
            photos: s.photos,
            moduleIds: s.module_ids,
            records: s.session_records.map((r: any) => ({
                studentId: r.student_id,
                present: r.present,
                present2: r.present2,
                justifiedAbsence: r.justified_absence,
                phoneConfiscated: r.phone_confiscated,
                counters: r.counters,
                notes: r.notes,
                photos: r.photos
            }))
        }));
    },

    async getDisciplines(): Promise<Discipline[]> {
        if (!offlineService.isOnline()) {
            const cached = await offlineService.getCache<Discipline[]>('disciplines');
            if (cached) return cached;
            return [];
        }

        const { data, error } = await supabase.from('disciplines').select('*').order('name', { ascending: true });
        if (error) {
            console.error("Error fetching disciplines:", error);
            const cached = await offlineService.getCache<Discipline[]>('disciplines');
            return cached || [];
        }

        const disciplines = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            displayName: d.display_name
        }));

        await offlineService.setCache('disciplines', disciplines);
        return disciplines;
    },

    async getOccurrences(): Promise<Occurrence[]> {
        const { data, error } = await supabase
            .from('occurrences')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error("Error fetching occurrences:", error);
            return [];
        }
        return data as Occurrence[];
    },

    async saveOccurrence(occurrence: Occurrence): Promise<boolean> {
        if (!offlineService.isOnline()) {
            await offlineService.addToSyncQueue({
                feature: 'occurrence',
                operation: 'POST',
                data: occurrence
            });
            return true;
        }

        const { error } = await supabase
            .from('occurrences')
            .upsert(occurrence);

        if (error) {
            console.error("Error saving occurrence:", error);
            return false;
        }
        return true;
    },

    // --- STUDENT CRUD ---
    async updateStudent(student: Partial<Student> & { id: string }): Promise<boolean> {
        console.log("[SupabaseService] Atualizando aluno:", student);
        
        const hourlyRateNormalized = isNaN(Number(student.hourlyRate)) ? 0 : Number(student.hourlyRate);

        const { data, error } = await supabase
            .from('students')
            .update({
                name: student.name,
                photo_url: student.photoUrl || null,
                parent_email: student.parentEmail?.toLowerCase() || null,
                parent_name: student.parentName || null,
                hourly_rate: hourlyRateNormalized,
                phone: student.phone || null,
                class_name: student.className,
                status: student.status,
                inactive_reason: student.inactiveReason || null,
                inactive_date: student.inactiveDate || null
            })
            .eq('id', student.id)
            .select();

        if (error) {
            console.error("Error updating student:", error);
            return false;
        }

        if (!data || data.length === 0) {
            console.warn("[SupabaseService] Nenhuma linha atualizada. Verifique se o ID existe e RLS.");
            return false;
        }

        // Importante: Limpar cache para forçar recarregamento
        await offlineService.setCache('students_true', null);
        await offlineService.setCache('students_false', null);

        return true;
    },

    async deleteStudent(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting student:", error);
            return false;
        }
        return true;
    },

    // --- AUTH ---
    async loginUser(email: string, password: string): Promise<{ success: boolean; role?: UserRole; name?: string; email?: string; photoUrl?: string }> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (error || !data) {
            console.error("Login error:", error);
            return { success: false };
        }

        return {
            success: true,
            role: data.role as UserRole,
            name: data.name,
            email: data.email,
            photoUrl: data.photo_url
        };
    },

    // --- STORAGE ---
    async uploadPhoto(file: File, path: string): Promise<string | null> {
        try {
            console.log('Iniciando upload de foto:', file.name, 'para:', path);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            console.log('Caminho completo do arquivo:', filePath);

            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error("Erro detalhado no upload:", uploadError);
                console.error("Mensagem:", uploadError.message);
                console.error("Status:", uploadError.statusCode);
                return null;
            }

            console.log('Upload bem-sucedido:', uploadData);

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            console.log('URL pública gerada:', data.publicUrl);
            return data.publicUrl;
        } catch (error) {
            console.error("Erro inesperado no upload:", error);
            return null;
        }
    },

    // --- TEACHER/USER CRUD ---
    async createTeacher(teacher: Omit<Teacher, 'id'>, password: string = '123'): Promise<boolean> {
        const { error } = await supabase.from('users').insert({
            name: teacher.name,
            email: teacher.email,
            password: password,
            role: teacher.role,
            subject: teacher.subject || '',
            assignments: teacher.assignments || [],
            photo_url: teacher.photoUrl
        });

        if (error) {
            console.error("Error creating teacher:", error);
            return false;
        }
        return true;
    },

    async updateTeacher(teacher: Teacher): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .update({
                name: teacher.name,
                email: teacher.email,
                subject: teacher.subject || '',
                assignments: teacher.assignments || [],
                photo_url: teacher.photoUrl
            })
            .eq('id', teacher.id);

        if (error) {
            console.error("Error updating teacher:", error);
            return false;
        }

        // Limpar cache
        await offlineService.setCache('staff', null);

        return true;
    },

    async deleteTeacher(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting teacher:", error);
            return false;
        }
        return true;
    },

    // --- CLASS CRUD ---
    async createClass(classRoom: Omit<ClassRoom, 'id'>): Promise<string | null> {
        const { data, error } = await supabase.from('classes').insert({
            name: classRoom.name,
            period: classRoom.period
        }).select().single();

        if (error) {
            console.error("Error creating class:", error);
            return null;
        }
        return data?.id || null;
    },

    async updateClass(classRoom: ClassRoom): Promise<boolean> {
        const { error } = await supabase
            .from('classes')
            .update({
                name: classRoom.name,
                period: classRoom.period
            })
            .eq('id', classRoom.id);

        if (error) {
            console.error("Error updating class:", error);
            return false;
        }

        // Limpar cache
        await offlineService.setCache('classes', null);

        return true;
    },

    async deleteClass(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting class:", error);
            return false;
        }
        return true;
    },


    async createDiscipline(discipline: Omit<Discipline, 'id'>): Promise<boolean> {
        const { error } = await supabase.from('disciplines').insert({
            name: discipline.name,
            display_name: discipline.displayName
        });

        if (error) {
            console.error("Error creating discipline:", error);
            return false;
        }
        return true;
    },

    async updateDiscipline(discipline: Discipline): Promise<boolean> {
        const { error } = await supabase
            .from('disciplines')
            .update({
                name: discipline.name,
                display_name: discipline.displayName
            })
            .eq('id', discipline.id);

        if (error) {
            console.error("Error updating discipline:", error);
            return false;
        }
        return true;
    },

    async deleteDiscipline(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('disciplines')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting discipline:", error);
            return false;
        }
        return true;
    },

    // --- SOE NOTES (FOA) ---
    async getStudentSOENote(studentId: string, year: number): Promise<{ note: string, signedBy: string }> {
        const { data, error } = await supabase
            .from('student_soe_notes')
            .select('note, signed_by')
            .eq('student_id', studentId)
            .eq('year', year)
            .single();

        if (error || !data) return { note: '', signedBy: '' };
        return {
            note: data.note,
            signedBy: data.signed_by || ''
        };
    },

    async saveStudentSOENote(studentId: string, year: number, note: string, signedBy: string): Promise<boolean> {
        const { error } = await supabase
            .from('student_soe_notes')
            .upsert({
                student_id: studentId,
                year: year,
                note: note,
                signed_by: signedBy,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'student_id,year'
            });

        if (error) {
            console.error("Error saving SOE note:", error);
            return false;
        }
        return true;
    },

    // --- STUDENT EXITS (SAÍDAS) ---
    async registerExit(studentId: string, reasons: string[], registeredBy: string = 'Sistema'): Promise<{ success: boolean; error?: string }> {
        const { error } = await supabase
            .from('student_exits')
            .insert({
                student_id: studentId,
                reasons: reasons,
                exit_time: new Date().toISOString(),
                registered_by: registeredBy
            });

        if (error) {
            console.error("Error registering exit:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    async registerReturn(exitId: string): Promise<boolean> {
        const { error } = await supabase
            .from('student_exits')
            .update({
                return_time: new Date().toISOString()
            })
            .eq('id', exitId);

        if (error) {
            console.error("Error registering return:", error);
            return false;
        }
        return true;
    },

    async getOpenExits(): Promise<StudentExit[]> {
        const { data, error } = await supabase
            .from('student_exits')
            .select(`
                *,
                student:student_id (name, photo_url, class_name)
            `)
            .is('return_time', null)
            .order('exit_time', { ascending: false });

        if (error) {
            console.error("Error fetching open exits:", error);
            // Fallback for demo/dev if table doesn't exist
            return [];
        }

        return data.map((e: any) => ({
            id: e.id,
            studentId: e.student_id,
            studentName: e.student?.name,
            studentPhoto: e.student?.photo_url,
            className: e.student?.class_name,
            reasons: e.reasons,
            exitTime: e.exit_time,
            returnTime: e.return_time,
            registeredBy: e.registered_by
        }));
    },

    async getExitHistory(): Promise<StudentExit[]> {
        const { data, error } = await supabase
            .from('student_exits')
            .select(`
                *,
                student:student_id (name, photo_url, class_name)
            `)
            .not('return_time', 'is', null) // Only completed exits
            .order('exit_time', { ascending: false })
            .limit(50); // Limit to recent 50

        if (error) {
            console.error("Error fetching exit history:", error);
            return [];
        }

        return data.map((e: any) => ({
            id: e.id,
            studentId: e.student_id,
            studentName: e.student?.name,
            studentPhoto: e.student?.photo_url,
            className: e.student?.class_name,
            reasons: e.reasons,
            exitTime: e.exit_time,
            returnTime: e.return_time,
            registeredBy: e.registered_by
        }));
    },

    // --- STUDY GUIDE ---
    async getStudyGuideItems(filters?: { teacherId?: string; bimestre?: number; examType?: string; classId?: string }): Promise<StudyGuideItem[]> {
        let query = supabase.from('study_guide_items').select('*, planning_modules(*)');
        if (filters?.teacherId) query = query.eq('teacher_id', filters.teacherId);
        if (filters?.bimestre) query = query.eq('bimestre', filters.bimestre);
        if (filters?.examType) query = query.eq('exam_type', filters.examType);
        if (filters?.classId) query = query.eq('class_id', filters.classId);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) { console.error('getStudyGuideItems error:', error); return []; }
        return (data || []).map((item: any) => ({
            id: item.id,
            teacherId: item.teacher_id,
            disciplineId: item.discipline_id,
            classId: item.class_id,
            moduleId: item.module_id,
            bimestre: item.bimestre,
            examType: item.exam_type,
            orientation: item.orientation,
            createdAt: item.created_at,
            module: item.planning_modules ? {
                id: item.planning_modules.id,
                disciplineId: item.planning_modules.discipline_id,
                teacherId: item.planning_modules.teacher_id,
                classId: item.planning_modules.class_id,
                front: item.planning_modules.front || '',
                chapter: item.planning_modules.chapter,
                module: item.planning_modules.module,
                title: item.planning_modules.title,
                topic: item.planning_modules.topic,
                bimestre: item.planning_modules.bimestre || 1
            } : undefined
        }));
    },

    async saveStudyGuideItem(item: Omit<StudyGuideItem, 'id'>): Promise<string | null> {
        const { data, error } = await supabase.from('study_guide_items').insert({
            teacher_id: item.teacherId,
            discipline_id: item.disciplineId,
            class_id: item.classId,
            module_id: item.moduleId,
            bimestre: item.bimestre,
            exam_type: item.examType,
            orientation: item.orientation || null
        }).select('id').single();
        if (error) { console.error('saveStudyGuideItem error:', error); return null; }
        return data?.id || null;
    },

    async updateStudyGuideItem(id: string, data: { orientation?: string }): Promise<boolean> {
        const { error } = await supabase.from('study_guide_items').update({ orientation: data.orientation }).eq('id', id);
        if (error) { console.error('updateStudyGuideItem error:', error); return false; }
        return true;
    },

    async deleteStudyGuideItem(id: string): Promise<boolean> {
        const { error } = await supabase.from('study_guide_items').delete().eq('id', id);
        if (error) { console.error('deleteStudyGuideItem error:', error); return false; }
        return true;
    },

    // --- REQUESTS (Solicitações) ---

    async createRequest(request: Omit<RequestItem, 'id' | 'createdAt'>): Promise<boolean> {
        const { error } = await supabase.from('requests').insert({
            type: request.type,
            status: request.status || 'pending',
            teacher_id: request.teacherId,
            teacher_name: request.teacherName,
            session_id: request.sessionId,
            session_info: request.sessionInfo,
            reason: request.reason
        });
        if (error) { console.error('createRequest error:', error); return false; }
        return true;
    },

    async getRequests(): Promise<RequestItem[]> {
        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('getRequests error:', error); return []; }
        return data.map((r: any) => ({
            id: r.id,
            type: r.type,
            status: r.status,
            teacherId: r.teacher_id,
            teacherName: r.teacher_name,
            sessionId: r.session_id,
            sessionInfo: r.session_info,
            reason: r.reason,
            resolvedBy: r.resolved_by,
            resolvedAt: r.resolved_at,
            createdAt: r.created_at
        }));
    },

    async updateRequestStatus(requestId: string, status: 'approved' | 'rejected', resolvedBy?: string): Promise<boolean> {
        const { error } = await supabase
            .from('requests')
            .update({ status, resolved_by: resolvedBy, resolved_at: new Date().toISOString() })
            .eq('id', requestId);
        if (error) { console.error('updateRequestStatus error:', error); return false; }
        return true;
    },

    // --- MESSAGES (Comunicados) ---

    async createMessage(msg: Omit<import('../types').MessageItem, 'id' | 'createdAt'>): Promise<boolean> {
        if (!offlineService.isOnline()) {
            await offlineService.addToSyncQueue({
                feature: 'comunicado',
                operation: 'POST',
                data: msg
            });
            return true;
        }

        const { error } = await supabase.from('messages').insert({
            sender_name: msg.senderName,
            sender_email: msg.senderEmail,
            sender_role: msg.senderRole,
            subject: msg.subject,
            body: msg.body,
            recipients: msg.recipients,
            target_class: msg.targetClass,
            target_student_id: msg.targetStudentId,
            attachment_type: msg.attachmentType,
            attachment_data: msg.attachmentData,
            direct_images: msg.directImages || []
        });
        if (error) { console.error('createMessage error:', error); return false; }
        return true;
    },

    async getMessages(): Promise<import('../types').MessageItem[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('getMessages error:', error); return []; }
        return data.map((m: any) => ({
            id: m.id,
            senderName: m.sender_name,
            senderEmail: m.sender_email,
            senderRole: m.sender_role,
            subject: m.subject,
            body: m.body,
            recipients: m.recipients,
            targetClass: m.target_class,
            targetStudentId: m.target_student_id,
            attachmentType: m.attachment_type,
            attachmentData: m.attachment_data,
            directImages: m.direct_images || [],
            isRead: m.is_read,
            createdAt: m.created_at
        }));
    },

    async deleteMessage(id: string): Promise<boolean> {
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) { console.error('deleteMessage error:', error); return false; }
        return true;
    },

    async markMessageRead(id: string): Promise<boolean> {
        const { error } = await supabase.from('messages').update({ is_read: true }).eq('id', id);
        if (error) { console.error('markMessageRead error:', error); return false; }
        return true;
    },

    async getUnreadMessagesCount(email: string, role: string): Promise<number> {
        // This is a simplified check. Real logic should filter by recipient role/email
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        if (error) { console.error('getUnreadMessagesCount error:', error); return 0; }
        return count || 0;
    },

    async deleteAllRequests(): Promise<boolean> {
        const { error } = await supabase
            .from('requests')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) {
            console.error('deleteAllRequests error:', error);
            return false;
        }
        return true;
    },

    // --- SETTINGS ---
    async getSetting(key: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();

        if (error) {
            console.error(`Error fetching setting ${key}:`, error);
            return null;
        }
        return data?.value || null;
    },

    async updateSetting(key: string, value: string): Promise<boolean> {
        const { error } = await supabase
            .from('settings')
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (error) {
            console.error(`Error updating setting ${key}:`, error);
            return false;
        }
        return true;
    },

    // --- PASSWORD RECOVERY METHODS ---

    /**
     * Envia um e-mail de redefinição de senha para o usuário.
     */
    async resetPasswordForEmail(email: string): Promise<boolean> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) {
            console.error('resetPasswordForEmail error:', error);
            return false;
        }
        return true;
    },

    /**
     * Atualiza a senha do usuário logado (usado após clicar no link do e-mail).
     */
    async updateUserPassword(newPassword: string): Promise<boolean> {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) {
            console.error('updateUserPassword error:', error);
            return false;
        }
        return true;
    },

    // --- SCHEDULED CLASSES (CALENDAR) ---
    async getScheduledClasses(startDate?: string, endDate?: string, studentId?: string): Promise<ScheduledClass[]> {
        let query = supabase.from('scheduled_classes').select(`
            *,
            student:students(name, photo_url, class_name, parent_name),
            teacher:users(name, photo_url)
        `);

        if (startDate) query = query.gte('class_date', startDate);
        if (endDate) query = query.lte('class_date', endDate);
        if (studentId) query = query.eq('student_id', studentId);

        const { data, error } = await query.order('class_date', { ascending: false }).order('start_time', { ascending: false });
        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            studentId: item.student_id,
            teacherId: item.teacher_id,
            classDate: item.class_date,
            startTime: item.start_time.slice(0, 5), // HH:mm
            endTime: item.end_time.slice(0, 5), // HH:mm
            status: item.status,
            hourlyRate: item.hourly_rate,
            totalValue: item.total_value,
            notes: item.notes,
            studentName: item.student?.name,
            studentPhoto: item.student?.photo_url,
            className: item.student?.class_name,
            parentName: item.student?.parent_name,
            teacherName: item.teacher?.name,
            teacherPhoto: item.teacher?.photo_url,
            disciplineId: item.discipline_id,
            subjectNotes: item.subject_notes,
            rescheduledBy: item.rescheduled_by,
            rescheduledAt: item.rescheduled_at,
            previousClassDate: item.previous_class_date,
            previousStartTime: item.previous_start_time?.slice(0, 5),
            paymentStatus: item.payment_status,
            paymentAccountId: item.payment_account_id,
            paidAt: item.paid_at,
            pdfUrl: item.pdf_url
        }));
    },

    async createScheduledClass(item: Partial<ScheduledClass>): Promise<boolean> {
        const { error } = await supabase.from('scheduled_classes').insert({
            student_id: item.studentId,
            teacher_id: item.teacherId,
            class_date: item.classDate,
            start_time: item.startTime,
            end_time: item.endTime,
            status: item.status || 'SCHEDULED',
            hourly_rate: item.hourlyRate,
            notes: item.notes
        });
        return !error;
    },

    async updateScheduledClassStatus(
        id: string, 
        status: ScheduledClass['status'], 
        extras?: { totalValue?: number, disciplineId?: string, subjectNotes?: string, pdfUrl?: string, paymentStatus?: ScheduledClass['paymentStatus'] }
    ): Promise<boolean> {
        const updateData: any = { status };
        if (extras?.totalValue !== undefined) updateData.total_value = extras.totalValue;
        if (extras?.disciplineId !== undefined) updateData.discipline_id = extras.disciplineId;
        if (extras?.subjectNotes !== undefined) updateData.subject_notes = extras.subjectNotes;
        if (extras?.pdfUrl !== undefined) updateData.pdf_url = extras.pdfUrl;
        if (extras?.paymentStatus !== undefined) updateData.payment_status = extras.paymentStatus;
        
        const { error } = await supabase.from('scheduled_classes').update(updateData).eq('id', id);
        return !error;
    },

    async rescheduleClass(id: string, oldDate: string, oldStartTime: string, newDate: string, newStartTime: string, newEndTime: string, userEmail: string): Promise<boolean> {
        const { error } = await supabase.from('scheduled_classes').update({
            class_date: newDate,
            start_time: newStartTime,
            end_time: newEndTime,
            rescheduled_by: userEmail,
            rescheduled_at: new Date().toISOString(),
            previous_class_date: oldDate,
            previous_start_time: oldStartTime
        }).eq('id', id);
        return !error;
    },

    // --- SIMULADOS ---
    async getSimulados(): Promise<Simulado[]> {
        const { data, error } = await supabase.from('simulados').select('*');
        if (error) throw error;
        return data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            teacherId: item.teacher_id,
            questions: item.questions,
            durationMinutes: item.duration_minutes,
            createdAt: item.created_at
        }));
    },

    async createSimulado(simulado: Partial<Simulado>): Promise<boolean> {
        const { error } = await supabase.from('simulados').insert({
            title: simulado.title,
            description: simulado.description,
            teacher_id: simulado.teacherId,
            questions: simulado.questions,
            duration_minutes: simulado.durationMinutes
        });
        return !error;
    },

    async getSimuladoAttempts(studentId: string): Promise<SimuladoAttempt[]> {
        const { data, error } = await supabase.from('simulado_attempts').select('*').eq('student_id', studentId);
        if (error) throw error;
        return data.map((item: any) => ({
            id: item.id,
            simuladoId: item.simulado_id,
            studentId: item.student_id,
            score: item.score,
            startedAt: item.started_at,
            completedAt: item.completed_at,
            answers: item.answers,
            status: item.status
        }));
    },

    async createSimuladoAttempt(attempt: Partial<SimuladoAttempt>): Promise<boolean> {
        const { error } = await supabase.from('simulado_attempts').insert({
            simulado_id: attempt.simuladoId,
            student_id: attempt.studentId,
            started_at: attempt.startedAt,
            status: 'IN_PROGRESS'
        });
        return !error;
    },

    // --- BANK ACCOUNTS ---
    async getBankAccounts(): Promise<BankAccount[]> {
        const { data, error } = await supabase.from('bank_accounts').select('*').order('name', { ascending: true });
        if (error) throw error;
        return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.image_url,
            createdAt: item.created_at
        }));
    },

    async saveBankAccount(account: Partial<BankAccount>): Promise<boolean> {
        const payload: any = {
            name: account.name,
            image_url: account.imageUrl
        };
        if (account.id) payload.id = account.id;
        
        const { error } = await supabase.from('bank_accounts').upsert(payload);
        if (error) {
            console.error("Error saving bank account:", error);
            return false;
        }
        return true;
    },

    async deleteBankAccount(id: string): Promise<boolean> {
        const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
        return !error;
    },

    async confirmPayment(classId: string, accountId: string): Promise<boolean> {
        const { error } = await supabase.from('scheduled_classes').update({
            payment_status: 'PAID',
            payment_account_id: accountId,
            paid_at: new Date().toISOString()
        }).eq('id', classId);
        return !error;
    },

    async uploadPDF(file: File): Promise<string | null> {
        const fileName = `${Math.random().toString(36).substring(2)}_${file.name}`;
        const filePath = `materials/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('materials')
            .upload(filePath, file);

        if (uploadError) {
            console.error("Error uploading PDF:", uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from('materials')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async uploadPhoto(file: File, bucket: string = 'avatars'): Promise<string | null> {
        const fileName = `${Math.random().toString(36).substring(2)}_${file.name}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) {
            console.error(`Error uploading to ${bucket}:`, uploadError);
            // Fallback for missing bucket/permission info
            if (uploadError.message === 'Bucket not found') {
                console.warn(`Creating bucket ${bucket} is required via Dashboard.`);
            }
            return null;
        }

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    // --- COURSES ---
    async getCourses(): Promise<Course[]> {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching courses:", error);
            return [];
        }

        return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            imageUrl: c.image_url,
            disciplineId: c.discipline_id,
            createdAt: c.created_at
        }));
    },

    async saveCourse(course: Partial<Course>): Promise<boolean> {
        const { error } = await supabase
            .from('courses')
            .upsert({
                id: course.id,
                name: course.name,
                description: course.description,
                image_url: course.imageUrl,
                discipline_id: course.disciplineId,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error("Error saving course:", error);
            return false;
        }
        return true;
    },

    async deleteCourse(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting course:", error);
            return false;
        }
        return true;
    },

    async getCourseItems(courseId: string): Promise<CourseItem[]> {
        const { data, error } = await supabase
            .from('course_items')
            .select('*')
            .eq('course_id', courseId)
            .order('order', { ascending: true });

        if (error) {
            console.error("Error fetching course items:", error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id,
            courseId: item.course_id,
            title: item.title,
            type: item.type,
            contentUrl: item.content_url,
            textContent: item.text_content,
            order: item.order
        }));
    },

    async saveCourseItem(item: Partial<CourseItem>): Promise<boolean> {
        const { error } = await supabase
            .from('course_items')
            .upsert({
                id: item.id,
                course_id: item.courseId,
                title: item.title,
                type: item.type,
                content_url: item.contentUrl,
                text_content: item.textContent,
                order: item.order
            });

        if (error) {
            console.error("Error saving course item:", error);
            return false;
        }
        return true;
    },

    async deleteCourseItem(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('course_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting course item:", error);
            return false;
        }
        return true;
    }
};
