import React, { useState, useEffect } from 'react';
import { UserPlus, Users, School, BookOpen, X, Plus, Camera, Lock, Trash2, GraduationCap, Edit2, RefreshCw, Mail, AlertCircle, CalendarRange } from 'lucide-react';
import { SupabaseService } from './services/supabaseService';
import { Student, Teacher, ClassRoom, Discipline, UserRole, TeacherClassAssignment } from './types';
import { UserAvatar } from './components/UserAvatar';

interface AdminPanelProps {
    onShowToast: (msg: string) => void;
}

type TabType = 'STUDENTS' | 'STAFF' | 'CLASSES' | 'DISCIPLINES';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onShowToast }) => {
    const [activeTab, setActiveTab] = useState<TabType>('STUDENTS');
    const [loading, setLoading] = useState(true);

    // Data State
    const [students, setStudents] = useState<Student[]>([]);
    const [staff, setStaff] = useState<Teacher[]>([]);
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);

    // Modal & Editing State
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showClassModal, setShowClassModal] = useState(false);
    const [showDisciplineModal, setShowDisciplineModal] = useState(false);

    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [editingClassId, setEditingClassId] = useState<string | null>(null);
    const [editingDisciplineId, setEditingDisciplineId] = useState<string | null>(null);

    // Advanced Year State
    const [showAdvanceYearModal, setShowAdvanceYearModal] = useState(false);
    const [advanceYearFromClass, setAdvanceYearFromClass] = useState<string>('');
    const [advanceYearToClass, setAdvanceYearToClass] = useState<string>('');
    const [advanceYearTarget, setAdvanceYearTarget] = useState<number>(new Date().getFullYear() + 1);
    const [selectedStudentsForAdvance, setSelectedStudentsForAdvance] = useState<string[]>([]);

    // Filter State
    const [filterClass, setFilterClass] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

    // Form State
    const [studentForm, setStudentForm] = useState({ 
        name: '', 
        parentEmail: '', 
        parentName: '', 
        hourlyRate: 0, 
        phone: '', 
        className: '', 
        photoUrl: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
        inactiveReason: '',
        inactiveDate: ''
    });
    const [staffForm, setStaffForm] = useState({
        role: UserRole.TEACHER,
        name: '',
        email: '',
        photoUrl: '',
        assignments: [] as TeacherClassAssignment[]
    });
    const [classForm, setClassForm] = useState({ name: '', period: 'Matutino', disciplineIds: [] as string[] });
    const [disciplineForm, setDisciplineForm] = useState({ name: '', displayName: '' });

    // Deactivation State
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [studentToDeactivate, setStudentToDeactivate] = useState<Student | null>(null);
    const [deactivateReason, setDeactivateReason] = useState('MUDANCA_ESCOLA');

    // Transfer State
    const [originalClassName, setOriginalClassName] = useState<string>('');

    // File Input Refs
    const studentFileRef = React.useRef<HTMLInputElement>(null);
    const staffFileRef = React.useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [fetchedStudents, fetchedTeachers, fetchedClasses, fetchedDisciplines] = await Promise.all([
                SupabaseService.getStudents(true), // We fetch all students here to be able to filter them locally
                SupabaseService.getTeachers(),
                SupabaseService.getClasses(),
                SupabaseService.getDisciplines()
            ]);
            setStudents(fetchedStudents);
            setStaff(fetchedTeachers);
            setClasses(fetchedClasses);
            setDisciplines(fetchedDisciplines);
        } catch (error) {
            console.error('Error loading data:', error);
            onShowToast('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Tentando salvar aluno. Dados no formulário:', studentForm);
        console.log('ID em edição:', editingStudentId);

        if (!studentForm.name || !studentForm.className) {
            onShowToast('Nome e Turma são obrigatórios');
            return;
        }

        let success = false;
        if (editingStudentId) {

            // Verifica se a classe mudou
            if (originalClassName && originalClassName !== studentForm.className) {
                const isTransfer = confirm(`Atenção: O aluno mudou de ${originalClassName} para ${studentForm.className}. Deseja fechar a matrícula anterior e transferi-lo oficialmente no histórico? (Clique Cancelar se foi apenas um erro de digitação original)`);

                if (isTransfer) {
                    await SupabaseService.transferStudentClass(editingStudentId, studentForm.className);
                }
            }

            success = await SupabaseService.updateStudent({
                id: editingStudentId,
                name: studentForm.name,
                parentEmail: studentForm.parentEmail,
                parentName: studentForm.parentName,
                hourlyRate: studentForm.hourlyRate,
                phone: studentForm.phone,
                className: studentForm.className,
                photoUrl: studentForm.photoUrl,
                status: studentForm.status,
                inactiveReason: studentForm.inactiveReason,
                inactiveDate: studentForm.inactiveDate
            });
        } else {
            success = await SupabaseService.createStudent({
                name: studentForm.name,
                parentEmail: studentForm.parentEmail,
                parentName: studentForm.parentName,
                hourlyRate: studentForm.hourlyRate,
                phone: studentForm.phone,
                className: studentForm.className,
                photoUrl: studentForm.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentForm.name)}&background=random`,
                status: studentForm.status,
                inactiveReason: studentForm.inactiveReason,
                inactiveDate: studentForm.inactiveDate
            });
        }

        if (success) {
            onShowToast(editingStudentId ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');
            setShowStudentModal(false);
            setEditingStudentId(null);
            setStudentForm({ 
                name: '', 
                parentEmail: '', 
                parentName: '', 
                hourlyRate: 0, 
                phone: '', 
                className: '', 
                photoUrl: '',
                status: 'ACTIVE',
                inactiveReason: '',
                inactiveDate: ''
            });
            setOriginalClassName('');
            loadData();
        } else {
            onShowToast(editingStudentId ? 'Erro ao atualizar aluno' : 'Erro ao cadastrar aluno');
        }
    };

    const startEditStudent = (student: Student) => {
        setEditingStudentId(student.id);
        setOriginalClassName(student.className);
        setStudentForm({
            name: student.name,
            parentEmail: student.parentEmail,
            parentName: student.parentName || '',
            hourlyRate: student.hourlyRate || 0,
            phone: student.phone || '',
            className: student.className,
            photoUrl: student.photoUrl,
            status: (student.status as any) || 'ACTIVE',
            inactiveReason: student.inactiveReason || '',
            inactiveDate: student.inactiveDate || ''
        });
        setShowStudentModal(true);
    };

    const confirmDeactivateStudent = (student: Student) => {
        setStudentToDeactivate(student);
        setDeactivateReason('MUDANCA_ESCOLA');
        setShowDeactivateModal(true);
    };

    const runDeactivateStudent = async () => {
        if (!studentToDeactivate) return;

        const success = await SupabaseService.deactivateStudent(studentToDeactivate.id, deactivateReason);
        if (success) {
            onShowToast(`Aluno ${studentToDeactivate.name} desativado.`);
            setShowDeactivateModal(false);
            setStudentToDeactivate(null);
            loadData();
        } else {
            onShowToast('Erro ao desativar aluno');
        }
    };
    const handleAdvanceYear = async () => {
        if (selectedStudentsForAdvance.length === 0) {
            onShowToast('Selecione pelo menos um aluno.');
            return;
        }
        if (!advanceYearToClass) {
            onShowToast('Selecione a turma de destino.');
            return;
        }

        const success = await SupabaseService.advanceStudentsYear(
            selectedStudentsForAdvance,
            advanceYearToClass,
            advanceYearTarget
        );

        if (success) {
            onShowToast(`Promoção de ano concluída para ${selectedStudentsForAdvance.length} alunos!`);
            setShowAdvanceYearModal(false);
            setSelectedStudentsForAdvance([]);
            setAdvanceYearFromClass('');
            setAdvanceYearToClass('');
            loadData();
        } else {
            onShowToast('Erro ao realizar a promoção de alunos.');
        }
    };

    const toggleStudentSelectionForAdvance = (id: string) => {
        setSelectedStudentsForAdvance(prev =>
            prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
        );
    };

    const handleDeleteStudent = async (id: string) => {
        if (!confirm('Tem certeza que deseja EXCLUIR DEFINITIVAMENTE este aluno do banco de dados? Isso apagará relatórios! Use apenas para cadastros acidentais.')) return;
        const success = await SupabaseService.deleteStudent(id);
        if (success) {
            onShowToast('Aluno excluído da base');
            loadData();
        } else {
            onShowToast('Erro ao excluir aluno');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'student' | 'staff') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const path = type === 'student' ? 'students' : 'staff';
        const publicUrl = await SupabaseService.uploadPhoto(file, path);

        if (publicUrl) {
            if (type === 'student') {
                setStudentForm({ ...studentForm, photoUrl: publicUrl });
            } else {
                setStaffForm({ ...staffForm, photoUrl: publicUrl });
            }
            onShowToast('Foto carregada com sucesso!');
        } else {
            onShowToast('Erro ao carregar foto');
        }
        setUploading(false);
    };

    // Staff Handlers
    const handleStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffForm.name || !staffForm.email) {
            onShowToast('Nome e Email são obrigatórios');
            return;
        }

        let success = false;
        if (editingStaffId) {
            success = await SupabaseService.updateTeacher({
                id: editingStaffId,
                name: staffForm.name,
                email: staffForm.email,
                role: staffForm.role,
                subject: staffForm.assignments.length > 0 ? staffForm.assignments[0].subject : 'Múltiplas',
                assignments: staffForm.assignments,
                photoUrl: staffForm.photoUrl
            });
        } else {
            success = await SupabaseService.createTeacher({
                name: staffForm.name,
                email: staffForm.email,
                role: staffForm.role,
                subject: staffForm.assignments.length > 0 ? staffForm.assignments[0].subject : 'Múltiplas',
                assignments: staffForm.assignments,
                photoUrl: staffForm.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(staffForm.name)}&background=random`
            }, '123'); // Senha padrão agora é 123
        }

        if (success) {
            onShowToast(editingStaffId ? 'Membro atualizado com sucesso!' : 'Membro cadastrado com sucesso!');
            setShowStaffModal(false);
            setEditingStaffId(null);
            setStaffForm({ role: UserRole.TEACHER, name: '', email: '', photoUrl: '', assignments: [] });
            loadData();
        } else {
            onShowToast(editingStaffId ? 'Erro ao atualizar membro' : 'Erro ao cadastrar membro');
        }
    };

    const startEditStaff = (member: Teacher) => {
        setEditingStaffId(member.id);
        setStaffForm({
            name: member.name,
            email: member.email,
            role: member.role,
            photoUrl: member.photoUrl || '',
            assignments: member.assignments || []
        });
        setShowStaffModal(true);
    };

    const handleDeleteStaff = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este membro?')) return;
        const success = await SupabaseService.deleteTeacher(id);
        if (success) {
            onShowToast('Membro excluído');
            loadData();
        } else {
            onShowToast('Erro ao excluir membro');
        }
    };

    const addAssignment = () => {
        if (classes.length === 0 || disciplines.length === 0) {
            onShowToast('Cadastre turmas e disciplinas primeiro');
            return;
        }
        setStaffForm({
            ...staffForm,
            assignments: [...staffForm.assignments, { classId: classes[0].name, subject: disciplines[0].name }]
        });
    };

    const removeAssignment = (index: number) => {
        setStaffForm({
            ...staffForm,
            assignments: staffForm.assignments.filter((_, i) => i !== index)
        });
    };

    const updateAssignment = (index: number, field: 'classId' | 'subject', value: string) => {
        const newAssignments = [...staffForm.assignments];
        newAssignments[index][field] = value;
        setStaffForm({ ...staffForm, assignments: newAssignments });
    };

    // Class Handlers
    const handleClassSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classForm.name || !classForm.period) {
            onShowToast('Nome e Período são obrigatórios');
            return;
        }

        let success = false;
        if (editingClassId) {
            success = await SupabaseService.updateClass({
                id: editingClassId,
                name: classForm.name,
                period: classForm.period
            });
            if (success) {
                await SupabaseService.setClassDisciplines(editingClassId, classForm.disciplineIds);
            }
        } else {
            const classId = await SupabaseService.createClass({
                name: classForm.name,
                period: classForm.period
            });

            if (classId) {
                success = true;
                await SupabaseService.setClassDisciplines(classId, classForm.disciplineIds);
            }
        }

        if (success) {
            onShowToast(editingClassId ? 'Turma atualizada com sucesso!' : 'Turma cadastrada com sucesso!');
            setShowClassModal(false);
            setEditingClassId(null);
            setClassForm({ name: '', period: 'Matutino', disciplineIds: [] });
            loadData();
        } else {
            onShowToast(editingClassId ? 'Erro ao atualizar turma' : 'Erro ao cadastrar turma');
        }
    };

    const startEditClass = (cls: ClassRoom) => {
        setEditingClassId(cls.id);
        setClassForm({
            name: cls.name,
            period: cls.period,
            disciplineIds: cls.disciplineIds || []
        });
        setShowClassModal(true);
    };

    const handleDeleteClass = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta turma?')) return;
        const success = await SupabaseService.deleteClass(id);
        if (success) {
            onShowToast('Turma excluída');
            loadData();
        } else {
            onShowToast('Erro ao excluir turma');
        }
    };

    // Helper for automatic display name generation
    const generateDisplayName = (name: string): string => {
        if (!name) return '';
        const upperName = name.toUpperCase();
        const isEM = upperName.includes('AEM') || upperName.includes('EM') || (upperName.includes('SÉRIE') && !upperName.includes('FUNDAMENTAL'));

        const discBaseNames: Record<string, string> = {
            'ART': 'Arte', 'BIO': 'Biologia', 'FIL': 'Filosofia', 'FIS': 'Física',
            'GEO': 'Geografia', 'GRA': 'Gramática', 'HIS': 'História', 'LES': 'Língua Espanhola',
            'LIN': 'Língua Inglesa', 'LIT': 'Literatura', 'MAT': 'Matemática', 'PTX': 'Produção de Texto',
            'QUI': 'Química', 'SOC': 'Sociologia', 'PORT': 'Português', 'PORTUGUÊS': 'Português'
        };

        let baseName = '';
        let code = '';

        if (name.includes('_')) {
            const parts = name.split('_');
            const lastPart = parts[parts.length - 1];
            const midPart = parts[1];
            baseName = discBaseNames[midPart?.toUpperCase()] || midPart || parts[0];
            code = /^[0-9]{2}[A-Z]$/.test(lastPart) ? lastPart : '';
        } else if (name.includes('-')) {
            const firstPart = name.split('-')[0].trim();
            const parts = firstPart.split(' ');
            baseName = parts[0];
            code = parts.find(p => /^[0-9]{2}[A-Z]$/.test(p)) || '';
        } else {
            const parts = name.split(' ');
            baseName = parts[0];
            code = parts.find(p => /^[0-9]{2}[A-Z]$/.test(p)) || '';
        }

        // Clean baseName from numbers if it's EF (e.g. "Português 9º" -> "Português")
        if (!isEM) {
            baseName = baseName.replace(/[0-9]º/g, '').trim();
        }

        if (isEM && code) {
            return `${baseName} ${code}`;
        }
        return baseName;
    };

    // Discipline Handlers
    const handleDisciplineSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!disciplineForm.name) {
            onShowToast('Nome é obrigatório');
            return;
        }

        const finalDisplayName = disciplineForm.displayName || generateDisplayName(disciplineForm.name);

        let success = false;
        if (editingDisciplineId) {
            success = await SupabaseService.updateDiscipline({
                id: editingDisciplineId,
                name: disciplineForm.name,
                displayName: finalDisplayName
            });
        } else {
            success = await SupabaseService.createDiscipline({
                name: disciplineForm.name,
                displayName: finalDisplayName
            });
        }

        if (success) {
            onShowToast(editingDisciplineId ? 'Disciplina atualizada com sucesso!' : 'Disciplina cadastrada com sucesso!');
            setShowDisciplineModal(false);
            setEditingDisciplineId(null);
            setDisciplineForm({ name: '', displayName: '' });
            loadData();
        } else {
            onShowToast(editingDisciplineId ? 'Erro ao atualizar disciplina' : 'Erro ao cadastrar disciplina');
        }
    };

    const startEditDiscipline = (disc: Discipline) => {
        setEditingDisciplineId(disc.id);
        setDisciplineForm({
            name: disc.name,
            displayName: disc.displayName || ''
        });
        setShowDisciplineModal(true);
    };

    const handleDeleteDiscipline = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta disciplina?')) return;
        const success = await SupabaseService.deleteDiscipline(id);
        if (success) {
            onShowToast('Disciplina excluída');
            loadData();
        } else {
            onShowToast('Erro ao excluir disciplina');
        }
    };

    const handleSyncAccounts = async () => {
        setSyncing(true);
        const { success, createdCount } = await SupabaseService.syncParentAccounts();
        setSyncing(false);
        if (success) {
            onShowToast(`✅ Sincronização concluída! ${createdCount} novas contas criadas.`);
        } else {
            onShowToast("Erro ao sincronizar contas.");
        }
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case UserRole.COORDINATOR: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case UserRole.TEACHER: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case UserRole.MONITOR: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    // Filtered Students
    const filteredStudents = students.filter(s => {
        const matchesClass = filterClass ? s.className === filterClass : true;
        const computedStatus = s.status || 'ACTIVE';
        const matchesStatus = computedStatus === filterStatus;
        return matchesClass && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Administração</h1>
                    <p className="text-gray-400 text-sm">Gerencie alunos, equipe e turmas</p>
                </div>

                <button
                    onClick={() => {
                        if (activeTab === 'STUDENTS') setShowStudentModal(true);
                        else if (activeTab === 'STAFF') setShowStaffModal(true);
                        else if (activeTab === 'CLASSES') setShowClassModal(true);
                        else if (activeTab === 'DISCIPLINES') setShowDisciplineModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all shadow-lg"
                >
                    <Plus size={20} />
                    {activeTab === 'STUDENTS' && 'Novo Aluno'}
                    {activeTab === 'STAFF' && 'Novo Membro'}
                    {activeTab === 'CLASSES' && 'Nova Turma'}
                    {activeTab === 'DISCIPLINES' && 'Nova Disciplina'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-800 pb-2">
                <button
                    onClick={() => setActiveTab('STUDENTS')}
                    className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeTab === 'STUDENTS'
                        ? 'text-emerald-500 border-b-2 border-emerald-500'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <GraduationCap size={20} />
                    Alunos
                </button>
                <button
                    onClick={() => setActiveTab('STAFF')}
                    className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeTab === 'STAFF'
                        ? 'text-emerald-500 border-b-2 border-emerald-500'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Users size={20} />
                    Equipe
                </button>
                <button
                    onClick={() => setActiveTab('CLASSES')}
                    className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeTab === 'CLASSES'
                        ? 'text-emerald-500 border-b-2 border-emerald-500'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <School size={20} />
                    Turmas
                </button>
                <button
                    onClick={() => setActiveTab('DISCIPLINES')}
                    className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeTab === 'DISCIPLINES'
                        ? 'text-emerald-500 border-b-2 border-emerald-500'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <BookOpen size={20} />
                    Disciplinas
                </button>
            </div>

            {/* Filter Bar (Students Tab Only) */}
            {activeTab === 'STUDENTS' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-3 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-bold text-gray-400 uppercase text-nowrap">Status:</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                            className="bg-[#1e293b] text-white border border-gray-700 rounded px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
                        >
                            <option value="ACTIVE">Ativos</option>
                            <option value="INACTIVE">Inativos</option>
                        </select>
                        <div className="w-px h-6 bg-gray-700 mx-2"></div>
                        <label className="text-sm font-bold text-gray-400 uppercase text-nowrap">Filtrar Turma:</label>
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="bg-[#1e293b] text-white border border-gray-700 rounded px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
                        >
                            <option value="">Todas as Turmas</option>
                            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>

                        {/* Missing Emails Warning */}
                        {students.filter(s => !s.parentEmail && (s.status === 'ACTIVE' || !s.status)).length > 0 && (
                            <div className="hidden lg:flex items-center gap-2 text-amber-500 text-xs bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                                <AlertCircle size={14} />
                                <span>{students.filter(s => !s.parentEmail && (s.status === 'ACTIVE' || !s.status)).length} alunos sem email</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAdvanceYearModal(true)}
                            className="flex items-center justify-center gap-2 px-4 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition-all border border-blue-500/30"
                        >
                            <CalendarRange size={14} />
                            Virada de Ano
                        </button>
                        <button
                            onClick={handleSyncAccounts}
                            disabled={syncing}
                            title="Criar contas de acesso para pais dos alunos já cadastrados"
                            className="flex items-center justify-center gap-2 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-all disabled:opacity-50 border border-gray-700"
                        >
                            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                            {syncing ? 'Sincronizando...' : 'Gerar Acessos para Pais'}
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Students Tab */}
                {activeTab === 'STUDENTS' && filteredStudents.map(student => (
                    <div key={student.id} className="bg-[#1e293b] rounded-xl border border-gray-700 p-4 hover:border-emerald-500/50 transition-all relative group">
                        <div className="absolute top-3 right-3">
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {student.className}
                            </span>
                        </div>

                        <div className="flex flex-col items-center text-center mt-6">
                            <UserAvatar
                                name={student.name}
                                photoUrl={student.photoUrl}
                                size="xl"
                                className="mb-3"
                            />

                            <h3 className="text-white font-bold mb-1">{student.name}</h3>

                            <div className="flex flex-col gap-1 w-full px-4 mb-2">
                                {student.parentName && (
                                    <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                        Responsável: {student.parentName}
                                    </p>
                                )}
                                {student.phone && (
                                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                        Tel: {student.phone}
                                    </p>
                                )}
                                {student.hourlyRate !== undefined && (
                                    <p className="text-[10px] text-yellow-500 font-bold flex items-center gap-1">
                                        R$ {student.hourlyRate}/hora
                                    </p>
                                )}
                            </div>

                            {student.parentEmail && (
                                <p className="text-xs text-gray-400 mb-2 truncate w-full px-4 italic">{student.parentEmail}</p>
                            )}
                            
                            <p className="text-[10px] text-gray-500">ID: {student.id.substring(0, 8)}</p>

                            <div className="mt-3">
                                {(!student.status || student.status === 'ACTIVE') ? (
                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                                        Ativo
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                        Inativo
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                                onClick={() => startEditStudent(student)}
                                className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded transition-all"
                            >
                                <Edit2 size={14} />
                            </button>
                            {(!student.status || student.status === 'ACTIVE') && (
                                <button
                                    onClick={() => confirmDeactivateStudent(student)}
                                    title="Desativar Aluno (Histórico Escolar)"
                                    className="p-1.5 bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white rounded transition-all"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            <button
                                onClick={() => handleDeleteStudent(student.id)}
                                title="Excluir Definitivamente"
                                className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Staff Tab */}
                {activeTab === 'STAFF' && staff.map(member => (
                    <div key={member.id} className="bg-[#1e293b] rounded-xl border border-gray-700 p-4 hover:border-emerald-500/50 transition-all relative group">
                        <div className="absolute top-3 right-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getRoleBadgeColor(member.role)}`}>
                                {member.role}
                            </span>
                        </div>

                        <div className="flex flex-col items-center text-center mt-6">
                            <UserAvatar
                                name={member.name}
                                photoUrl={member.photoUrl}
                                size="xl"
                                className="mb-3"
                            />

                            <h3 className="text-white font-bold mb-1">{member.name}</h3>
                            <p className="text-xs text-gray-400 mb-3">{member.email}</p>

                            {member.assignments && member.assignments.length > 0 && (
                                <div className="w-full space-y-1">
                                    {member.assignments.slice(0, 2).map((assignment, idx) => (
                                        <div key={idx} className="flex items-center gap-1 text-[10px] text-gray-400 bg-[#0f172a] px-2 py-1 rounded">
                                            <School size={10} className="text-emerald-500" />
                                            <span>{assignment.classId}</span>
                                            <span className="text-gray-600">•</span>
                                            <BookOpen size={10} className="text-orange-500" />
                                            <span>{assignment.subject}</span>
                                        </div>
                                    ))}
                                    {member.assignments.length > 2 && (
                                        <p className="text-[9px] text-gray-500">+{member.assignments.length - 2} mais</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                                onClick={() => startEditStaff(member)}
                                className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded transition-all"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDeleteStaff(member.id)}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Classes Tab */}
                {activeTab === 'CLASSES' && classes.map(classRoom => (
                    <div key={classRoom.id} className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 hover:border-emerald-500/50 transition-all relative group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                                <School size={32} className="text-purple-500" />
                            </div>

                            <h3 className="text-white font-bold text-lg mb-1">{classRoom.name}</h3>
                            <p className="text-sm text-gray-400">Período: {classRoom.period}</p>
                        </div>

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                                onClick={() => startEditClass(classRoom)}
                                className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded transition-all"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDeleteClass(classRoom.id)}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Disciplines Tab */}
                {activeTab === 'DISCIPLINES' && disciplines.map(discipline => (
                    <div key={discipline.id} className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 hover:border-emerald-500/50 transition-all relative group">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                                <BookOpen size={32} className="text-orange-500" />
                            </div>

                            <h3 className="text-white font-bold text-lg mb-1">{discipline.name}</h3>
                            <p className="text-xs text-gray-500">ID: {discipline.id.substring(0, 8)}</p>
                        </div>

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                                onClick={() => startEditDiscipline(discipline)}
                                className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded transition-all"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDeleteDiscipline(discipline.id)}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Advance Year Modal */}
            {showAdvanceYearModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 max-w-3xl w-full my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <CalendarRange className="text-blue-500" />
                                Virada de Ano / Promoção em Lote
                            </h2>
                            <button onClick={() => { setShowAdvanceYearModal(false); setSelectedStudentsForAdvance([]); }} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-[#0f172a] p-4 rounded-lg border border-gray-800">
                                <h3 className="text-emerald-500 font-bold mb-3">Origem</h3>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Selecione a Turma a Promover</label>
                                <select
                                    value={advanceYearFromClass}
                                    onChange={(e) => {
                                        setAdvanceYearFromClass(e.target.value);
                                        // Auto-Select All students from this class
                                        if (e.target.value) {
                                            const classStudents = students.filter(s => s.className === e.target.value && s.status === 'ACTIVE');
                                            setSelectedStudentsForAdvance(classStudents.map(s => s.id));
                                        } else {
                                            setSelectedStudentsForAdvance([]);
                                        }
                                    }}
                                    className="w-full bg-[#1e293b] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500"
                                >
                                    <option value="">Selecione...</option>
                                    {classes.map(c => <option key={`orig-${c.id}`} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="bg-[#0f172a] p-4 rounded-lg border border-gray-800">
                                <h3 className="text-blue-500 font-bold mb-3">Destino</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Turma de Destino</label>
                                        <select
                                            value={advanceYearToClass}
                                            onChange={(e) => setAdvanceYearToClass(e.target.value)}
                                            className="w-full bg-[#1e293b] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500"
                                        >
                                            <option value="">Selecione...</option>
                                            {classes.map(c => <option key={`dest-${c.id}`} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Ano Letivo</label>
                                        <input
                                            type="number"
                                            value={advanceYearTarget}
                                            onChange={(e) => setAdvanceYearTarget(parseInt(e.target.value))}
                                            className="w-full bg-[#1e293b] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {advanceYearFromClass && (
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-gray-300">
                                        Alunos Selecionados ({selectedStudentsForAdvance.length})
                                    </h3>
                                    <button
                                        onClick={() => {
                                            const classStudents = students.filter(s => s.className === advanceYearFromClass && s.status === 'ACTIVE');
                                            if (selectedStudentsForAdvance.length === classStudents.length) {
                                                setSelectedStudentsForAdvance([]);
                                            } else {
                                                setSelectedStudentsForAdvance(classStudents.map(s => s.id));
                                            }
                                        }}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition-all font-bold"
                                    >
                                        Marcar/Desmarcar Todos
                                    </button>
                                </div>
                                <div className="max-h-60 overflow-y-auto bg-[#0f172a] rounded-lg border border-gray-800 p-2 space-y-1">
                                    {students.filter(s => s.className === advanceYearFromClass && s.status === 'ACTIVE').map(student => (
                                        <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-[#1e293b] rounded cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentsForAdvance.includes(student.id)}
                                                onChange={() => toggleStudentSelectionForAdvance(student.id)}
                                                className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500 focus:ring-2"
                                            />
                                            <UserAvatar name={student.name} photoUrl={student.photoUrl} size="sm" />
                                            <span className="text-white text-sm flex-1">{student.name}</span>
                                        </label>
                                    ))}
                                    {students.filter(s => s.className === advanceYearFromClass && s.status === 'ACTIVE').length === 0 && (
                                        <p className="text-center text-gray-500 py-4 italic text-sm">Nenhum aluno ativo encontrado nesta turma.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button onClick={() => { setShowAdvanceYearModal(false); setSelectedStudentsForAdvance([]); }} className="flex-1 py-3 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 font-bold rounded-lg transition-all">
                                Cancelar
                            </button>
                            <button
                                onClick={handleAdvanceYear}
                                disabled={selectedStudentsForAdvance.length === 0 || !advanceYearToClass}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <CalendarRange size={20} />
                                Aprovar e Transferir ({selectedStudentsForAdvance.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Deactivate Modal */}
            {showDeactivateModal && studentToDeactivate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Desativar Aluno</h2>
                            <button onClick={() => setShowDeactivateModal(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-300 mb-2">
                                Você está prestes a desativar <strong>{studentToDeactivate.name}</strong>.
                                O histórico do aluno não será perdido.
                            </p>
                            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Motivo da Saída</label>
                            <select
                                value={deactivateReason}
                                onChange={(e) => setDeactivateReason(e.target.value)}
                                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                            >
                                <option value="MUDANCA_ESCOLA">Mudança de Escola</option>
                                <option value="CONCLUSAO">Conclusão de Curso</option>
                                <option value="EVASAO">Evasão</option>
                                <option value="OUTROS">Outros</option>
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowDeactivateModal(false)} className="flex-1 py-3 text-gray-400 hover:text-white font-bold transition-all">
                                Cancelar
                            </button>
                            <button
                                onClick={runDeactivateStudent}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-all"
                            >
                                Confirmar Desativação
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showStudentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{editingStudentId ? 'Editar Aluno' : 'Cadastrar Aluno'}</h2>
                            <button onClick={() => { setShowStudentModal(false); setEditingStudentId(null); setStudentForm({ name: '', parentEmail: '', parentName: '', hourlyRate: 0, phone: '', className: '', photoUrl: '', status: 'ACTIVE', inactiveReason: '', inactiveDate: '' }); }} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleStudentSubmit} className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <input
                                    type="file"
                                    ref={studentFileRef}
                                    onChange={(e) => handleFileChange(e, 'student')}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <div
                                    onClick={() => studentFileRef.current?.click()}
                                    className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center relative group cursor-pointer overflow-hidden bg-[#0f172a]"
                                >
                                    {studentForm.photoUrl ? (
                                        <img src={studentForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera size={32} className="text-gray-500" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                        <Plus size={20} className="text-white" />
                                    </div>
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome Completo</label>
                                <input
                                    type="text"
                                    value={studentForm.name}
                                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome do Responsável</label>
                                    <input
                                        type="text"
                                        value={studentForm.parentName}
                                        onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">WhatsApp/Tel</label>
                                    <input
                                        type="text"
                                        value={studentForm.phone}
                                        onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Email do Responsável</label>
                                    <input
                                        type="email"
                                        value={studentForm.parentEmail}
                                        onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Valor Hora/Aula (R$)</label>
                                    <input
                                        type="number"
                                        value={studentForm.hourlyRate}
                                        onChange={(e) => setStudentForm({ ...studentForm, hourlyRate: parseFloat(e.target.value) })}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Turma</label>
                                <select
                                    value={studentForm.className}
                                    onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    required
                                >
                                    <option value="">Selecione uma turma...</option>
                                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <BookOpen size={20} />
                                Salvar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Staff Modal */}
            {showStaffModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 max-w-md w-full my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{editingStaffId ? 'Editar Membro' : 'Cadastrar Membro'}</h2>
                            <button onClick={() => { setShowStaffModal(false); setEditingStaffId(null); setStaffForm({ role: UserRole.TEACHER, name: '', email: '', photoUrl: '', assignments: [] }); }} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleStaffSubmit} className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <input
                                    type="file"
                                    ref={staffFileRef}
                                    onChange={(e) => handleFileChange(e, 'staff')}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <div
                                    onClick={() => staffFileRef.current?.click()}
                                    className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center relative group cursor-pointer overflow-hidden bg-[#0f172a]"
                                >
                                    {staffForm.photoUrl ? (
                                        <img src={staffForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera size={32} className="text-gray-500" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                        <Plus size={20} className="text-white" />
                                    </div>
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Cargo</label>
                                <select
                                    value={staffForm.role}
                                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as UserRole })}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                >
                                    <option value={UserRole.TEACHER}>Professor</option>
                                    <option value={UserRole.COORDINATOR}>Coordenador</option>
                                    <option value={UserRole.MONITOR}>Monitor</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome</label>
                                <input
                                    type="text"
                                    value={staffForm.name}
                                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Email (Login)</label>
                                <input
                                    type="email"
                                    value={staffForm.email}
                                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>


                            {/* Atribuições de Aulas - Apenas para Professor e Coordenador */}
                            {staffForm.role !== UserRole.MONITOR && (
                                <div className="border border-gray-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                                            <School size={14} />
                                            Atribuições de Aulas
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addAssignment}
                                            className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center hover:bg-emerald-600 transition-all"
                                        >
                                            <Plus size={14} className="text-white" />
                                        </button>
                                    </div>

                                    {staffForm.assignments.length === 0 ? (
                                        <p className="text-xs text-gray-500 italic">Nenhuma atribuição.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {staffForm.assignments.map((assignment, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <select
                                                        value={assignment.classId}
                                                        onChange={(e) => updateAssignment(idx, 'classId', e.target.value)}
                                                        className="flex-1 bg-[#0f172a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500"
                                                    >
                                                        {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                    </select>
                                                    <select
                                                        value={assignment.subject}
                                                        onChange={(e) => updateAssignment(idx, 'subject', e.target.value)}
                                                        className="flex-1 bg-[#0f172a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500"
                                                    >
                                                        {disciplines.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAssignment(idx)}
                                                        className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}


                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                                <Lock size={16} className="text-yellow-500 mt-0.5" />
                                <p className="text-xs text-yellow-400">Senha padrão será definida como: <strong>123</strong></p>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <BookOpen size={20} />
                                Salvar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Class Modal */}
            {showClassModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{editingClassId ? 'Editar Turma' : 'Cadastrar Turma'}</h2>
                            <button onClick={() => { setShowClassModal(false); setEditingClassId(null); setClassForm({ name: '', period: 'Matutino', disciplineIds: [] }); }} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleClassSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome da Turma (EX: 9º ANO A)</label>
                                <input
                                    type="text"
                                    value={classForm.name}
                                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Período</label>
                                <select
                                    value={classForm.period}
                                    onChange={(e) => setClassForm({ ...classForm, period: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                >
                                    <option value="Matutino">Matutino</option>
                                    <option value="Vespertino">Vespertino</option>
                                    <option value="Noturno">Noturno</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2 mb-2">
                                    <BookOpen size={14} />
                                    Disciplinas Vinculadas
                                </label>
                                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 bg-[#0f172a] rounded-lg border border-gray-700">
                                    {disciplines.map(disc => (
                                        <label key={disc.id} className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={classForm.disciplineIds.includes(disc.id)}
                                                onChange={(e) => {
                                                    const newIds = e.target.checked
                                                        ? [...classForm.disciplineIds, disc.id]
                                                        : classForm.disciplineIds.filter(id => id !== disc.id);
                                                    setClassForm({ ...classForm, disciplineIds: newIds });
                                                }}
                                                className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-transparent"
                                            />
                                            <span className="text-sm text-gray-300">
                                                {disc.name} {disc.displayName ? `(${disc.displayName})` : ''}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <BookOpen size={20} />
                                Salvar
                            </button>
                        </form>
                    </div>
                </div >
            )}

            {/* Discipline Modal */}
            {
                showDisciplineModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">{editingDisciplineId ? 'Editar Disciplina' : 'Cadastrar Disciplina'}</h2>
                                <button onClick={() => { setShowDisciplineModal(false); setEditingDisciplineId(null); setDisciplineForm({ name: '', displayName: '' }); }} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleDisciplineSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome da Disciplina (EX: MATEMÁTICA 9º ANO EFII)</label>
                                    <input
                                        type="text"
                                        value={disciplineForm.name}
                                        onChange={(e) => {
                                            const newName = e.target.value;
                                            const autoDisplay = generateDisplayName(newName);
                                            setDisciplineForm({
                                                ...disciplineForm,
                                                name: newName,
                                                displayName: autoDisplay
                                            });
                                        }}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome para Exibição (EX: MATEMÁTICA)</label>
                                    <input
                                        type="text"
                                        value={disciplineForm.displayName}
                                        onChange={(e) => setDisciplineForm({ ...disciplineForm, displayName: e.target.value })}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                        placeholder="Como aparecerá nos registros..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <BookOpen size={20} />
                                    Salvar
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
