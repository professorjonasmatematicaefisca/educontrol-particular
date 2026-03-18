import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserPlus, Users, School, BookOpen, X, Plus, Camera, Lock, Trash2, GraduationCap, Edit2, RefreshCw, Mail, AlertCircle, CalendarRange, DollarSign, TrendingUp, CreditCard, Search, Calendar, Filter, CheckCircle, XCircle, Clock, ChevronDown, ImageIcon, Upload, Save, Banknote, Settings, FileText, CloudOff, Share2, Copy } from 'lucide-react';
import { SupabaseService } from './services/supabaseService';
import { Student, Teacher, ClassRoom, Discipline, UserRole, TeacherClassAssignment, ScheduledClass, BankAccount } from './types';
import { UserAvatar } from './components/UserAvatar';

interface AdminPanelProps {
    onShowToast: (msg: string) => void;
    userEmail: string;
    userRole: UserRole;
}

type MainTabType = 'REGISTRATIONS' | 'CONFIG' | 'FINANCIAL';
type SubTabType = 'STUDENTS' | 'PARENTS' | 'STAFF' | 'CLASSES' | 'DISCIPLINES' | 'LOGO' | 'ACCOUNTS' | 'SUMMARY';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onShowToast, userEmail, userRole }) => {
    const [activeMainTab, setActiveMainTab] = useState<MainTabType>('REGISTRATIONS');
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('STUDENTS');
    const [loading, setLoading] = useState(true);

    // Data State
    const [students, setStudents] = useState<Student[]>([]);
    const [parents, setParents] = useState<import('./types').User[]>([]);
    const [staff, setStaff] = useState<Teacher[]>([]);
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

    // Institutional Logo State (from Settings)
    const [logoUrl, setLogoUrl] = useState('');
    const logoFileInputRef = React.useRef<HTMLInputElement>(null);

    // Financial State (from FinancialView)
    const [financialClasses, setFinancialClasses] = useState<ScheduledClass[]>([]);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [filterAccount, setFilterAccount] = useState('ALL');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedFinancialClass, setSelectedFinancialClass] = useState<ScheduledClass | null>(null);

    // Bank Account Form State (from Settings)
    const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountImage, setNewAccountImage] = useState('');
    const bankFileInputRef = React.useRef<HTMLInputElement>(null);

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
        parentId: '',
        parentEmail: '', 
        parentName: '', 
        billing_day: 1,
        billing_period: 'MONTHLY' as 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'PER_CLASS',
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
    const [disciplineForm, setDisciplineForm] = useState({ name: '', displayName: '', whiteboardBackgroundUrl: '' });

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

    useEffect(() => {
        if (activeMainTab === 'FINANCIAL') {
            fetchFinancialData();
        }
        if (activeMainTab === 'CONFIG') {
            loadLogo();
        }
    }, [activeMainTab, filterMonth]);

    const loadLogo = async () => {
        const cachedLogo = localStorage.getItem('educontrol_school_logo');
        if (cachedLogo) setLogoUrl(cachedLogo);
        const dbLogo = await SupabaseService.getSetting('school_logo');
        if (dbLogo && dbLogo !== cachedLogo) {
            setLogoUrl(dbLogo);
            localStorage.setItem('educontrol_school_logo', dbLogo);
        }
    };

    const fetchFinancialData = async () => {
        try {
            const startOfMonth = `${filterMonth}-01`;
            const endOfMonth = `${filterMonth}-31`;
            const data = await SupabaseService.getScheduledClasses(startOfMonth, endOfMonth);
            setFinancialClasses(data);
        } catch (error) {
            onShowToast('Erro ao carregar dados financeiros');
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [fetchedStudents, fetchedParents, fetchedTeachers, fetchedClasses, fetchedDisciplines, fetchedBankAccounts] = await Promise.all([
                SupabaseService.getStudents(true),
                SupabaseService.getParents(),
                SupabaseService.getTeachers(),
                SupabaseService.getClasses(),
                SupabaseService.getDisciplines(),
                SupabaseService.getBankAccounts()
            ]);
            setStudents(fetchedStudents);
            setParents(fetchedParents);
            setStaff(fetchedTeachers);
            setClasses(fetchedClasses);
            setDisciplines(fetchedDisciplines);
            setBankAccounts(fetchedBankAccounts);
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
                parentId: studentForm.parentId,
                parentEmail: studentForm.parentEmail,
                parentName: studentForm.parentName,
                billing_day: studentForm.billing_day,
                billing_period: studentForm.billing_period,
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
                parentId: studentForm.parentId,
                parentEmail: studentForm.parentEmail,
                parentName: studentForm.parentName,
                billing_day: studentForm.billing_day,
                billing_period: studentForm.billing_period,
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
                parentId: '',
                parentEmail: '', 
                parentName: '', 
                billing_day: 1,
                billing_period: 'MONTHLY',
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
            parentId: student.parentId || '',
            parentEmail: student.parentEmail,
            parentName: student.parentName || '',
            billing_day: student.billing_day || 1,
            billing_period: student.billing_period || 'MONTHLY',
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

    // Institutional Logo Handlers
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogoUrl(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveLogo = async () => {
        localStorage.setItem('educontrol_school_logo', logoUrl);
        const success = await SupabaseService.updateSetting('school_logo', logoUrl);
        if (success) {
            onShowToast("Logomarca escolar salva globalmente!");
        } else {
            onShowToast("Logomarca salva localmente (erro ao sincronizar).");
        }
    };

    const handleRemoveLogo = async () => {
        localStorage.removeItem('educontrol_school_logo');
        await SupabaseService.updateSetting('school_logo', '');
        setLogoUrl('');
        onShowToast("Logomarca removida globalmente.");
    };

    // Financial Handlers
    const handleConfirmPayment = async (accountId: string) => {
        if (!selectedFinancialClass) return;
        try {
            const success = await SupabaseService.confirmPayment(selectedFinancialClass.id, accountId);
            if (success) {
                onShowToast('Pagamento confirmado com sucesso');
                setShowPaymentModal(false);
                fetchFinancialData();
            }
        } catch (error) {
            onShowToast('Erro ao confirmar pagamento');
        }
    };

    // Bank Account Handlers
    const handleAddBankAccount = async () => {
        if (!newAccountName) {
            onShowToast("Informe o nome da conta.");
            return;
        }
        const success = await SupabaseService.saveBankAccount({
            id: editingBankAccount?.id,
            name: newAccountName,
            imageUrl: newAccountImage
        });
        if (success) {
            onShowToast(editingBankAccount ? "Conta atualizada!" : "Conta cadastrada com sucesso!");
            setNewAccountName('');
            setNewAccountImage('');
            setEditingBankAccount(null);
            loadData();
        } else {
            onShowToast("Erro ao salvar conta.");
        }
    };

    const handleDeleteBankAccount = async (id: string) => {
        if (!confirm("Excluir esta conta?")) return;
        const success = await SupabaseService.deleteBankAccount(id);
        if (success) {
            onShowToast("Conta removida.");
            if (editingBankAccount?.id === id) {
                setEditingBankAccount(null);
                setNewAccountName('');
                setNewAccountImage('');
            }
            loadData();
        }
    };

    const handleBankImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const publicUrl = await SupabaseService.uploadPhoto(file, 'banks');
            if (publicUrl) {
                setNewAccountImage(publicUrl);
                onShowToast("Logomarca do banco carregada.");
            } else {
                onShowToast("Erro ao carregar imagem do banco.");
            }
        }
    };

    const startEditBankAccount = (account: BankAccount) => {
        setEditingBankAccount(account);
        setNewAccountName(account.name);
        setNewAccountImage(account.imageUrl || '');
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
                displayName: finalDisplayName,
                whiteboardBackgroundUrl: disciplineForm.whiteboardBackgroundUrl
            });
        } else {
            success = await SupabaseService.createDiscipline({
                name: disciplineForm.name,
                displayName: finalDisplayName,
                whiteboardBackgroundUrl: disciplineForm.whiteboardBackgroundUrl
            });
        }

        if (success) {
            onShowToast(editingDisciplineId ? 'Disciplina atualizada com sucesso!' : 'Disciplina cadastrada com sucesso!');
            setShowDisciplineModal(false);
            setEditingDisciplineId(null);
            setDisciplineForm({ name: '', displayName: '', whiteboardBackgroundUrl: '' });
            loadData();
        } else {
            onShowToast(editingDisciplineId ? 'Erro ao atualizar disciplina' : 'Erro ao cadastrar disciplina');
        }
    };

    const startEditDiscipline = (disc: Discipline) => {
        setEditingDisciplineId(disc.id);
        setDisciplineForm({
            name: disc.name,
            displayName: disc.displayName || '',
            whiteboardBackgroundUrl: disc.whiteboardBackgroundUrl || ''
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
                    <p className="text-gray-400 text-sm">Gerencie a instituição em um só lugar</p>
                </div>

                {activeMainTab === 'REGISTRATIONS' && (
                    <button
                        onClick={() => {
                            if (activeSubTab === 'STUDENTS') setShowStudentModal(true);
                            else if (activeSubTab === 'STAFF') setShowStaffModal(true);
                            else if (activeSubTab === 'CLASSES') setShowClassModal(true);
                            else if (activeSubTab === 'DISCIPLINES') setShowDisciplineModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all shadow-lg"
                    >
                        <Plus size={20} />
                        {activeSubTab === 'STUDENTS' && 'Novo Aluno'}
                        {activeSubTab === 'STAFF' && 'Novo Membro'}
                        {activeSubTab === 'CLASSES' && 'Nova Turma'}
                        {activeSubTab === 'DISCIPLINES' && 'Nova Disciplina'}
                    </button>
                )}
            </div>

            {/* Level 1 Tabs (Main Sections) */}
            <div className="flex items-center gap-4 bg-[#0f172a] p-1.5 rounded-2xl border border-gray-800 w-fit">
                <button
                    onClick={() => { setActiveMainTab('REGISTRATIONS'); setActiveSubTab('STUDENTS'); }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeMainTab === 'REGISTRATIONS'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <GraduationCap size={18} />
                    Cadastros
                </button>
                <button
                    onClick={() => { setActiveMainTab('FINANCIAL'); setActiveSubTab('ACCOUNTS'); }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeMainTab === 'FINANCIAL'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Banknote size={18} />
                    Financeiro
                </button>
                <button
                    onClick={() => { setActiveMainTab('CONFIG'); setActiveSubTab('LOGO'); }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeMainTab === 'CONFIG'
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Settings size={18} />
                    Configurações
                </button>
            </div>

            {/* Level 2 Tabs (Sub Sections) */}
            <div className="flex items-center gap-6 border-b border-gray-800 pb-2">
                {activeMainTab === 'REGISTRATIONS' && (
                    <>
                        <button
                            onClick={() => setActiveSubTab('STUDENTS')}
                            className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeSubTab === 'STUDENTS'
                                ? 'text-emerald-500 border-b-2 border-emerald-500'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <UserPlus size={18} />
                            Alunos
                        </button>
                        <button
                            onClick={() => setActiveSubTab('PARENTS')}
                            className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeSubTab === 'PARENTS'
                                ? 'text-emerald-500 border-b-2 border-emerald-500'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Users size={18} />
                            Responsáveis
                        </button>
                        <button
                            onClick={() => setActiveSubTab('STAFF')}
                            className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeSubTab === 'STAFF'
                                ? 'text-emerald-500 border-b-2 border-emerald-500'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Users size={18} />
                            Equipe
                        </button>
                        <button
                            onClick={() => setActiveSubTab('CLASSES')}
                            className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeSubTab === 'CLASSES'
                                ? 'text-emerald-500 border-b-2 border-emerald-500'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <School size={18} />
                            Turmas
                        </button>
                        <button
                            onClick={() => setActiveSubTab('DISCIPLINES')}
                            className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeSubTab === 'DISCIPLINES'
                                ? 'text-emerald-500 border-b-2 border-emerald-500'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <BookOpen size={18} />
                            Disciplinas
                        </button>
                    </>
                )}

                {activeMainTab === 'FINANCIAL' && (
                    <>
                        <button
                            onClick={() => setActiveSubTab('ACCOUNTS')}
                            className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeSubTab === 'ACCOUNTS'
                                ? 'text-blue-500 border-b-2 border-blue-500'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <CreditCard size={18} />
                            Contas Bancárias
                        </button>
                    </>
                )}

                {activeMainTab === 'CONFIG' && (
                    <>
                        <button
                            onClick={() => setActiveSubTab('LOGO')}
                            className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${activeSubTab === 'LOGO'
                                ? 'text-purple-500 border-b-2 border-purple-500'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <ImageIcon size={18} />
                            Logomarca da Instituição
                        </button>
                    </>
                )}
            </div>

            {/* Filter Bar (Registrations > Students Only) */}
            {activeMainTab === 'REGISTRATIONS' && activeSubTab === 'STUDENTS' && (
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

            {/* Content Area */}
            <div className="space-y-6">
                {/* 1. REGISTRATIONS SECTION */}
                {activeMainTab === 'REGISTRATIONS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Students Sub-Tab */}
                        {activeSubTab === 'STUDENTS' && filteredStudents.map(student => (
                            <div key={student.id} className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 hover:border-emerald-500/50 transition-all group relative">
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => confirmDeactivateStudent(student)}
                                        className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Desativar Aluno"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                    <button
                                        onClick={() => startEditStudent(student)}
                                        className="p-2 text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <UserAvatar name={student.name} photoUrl={student.photoUrl} size="lg" />
                                    <div>
                                        <h3 className="text-white font-bold text-sm uppercase truncate max-w-[150px]">{student.name}</h3>
                                        <p className="text-xs text-gray-400 font-medium">{student.className}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${student.status === 'INACTIVE' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase">{student.status === 'INACTIVE' ? 'Inativo' : 'Ativo'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-2">
                                    {student.parentName && (
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                            <Users size={12} className="text-gray-600" />
                                            <span className="truncate">{student.parentName}</span>
                                        </div>
                                    )}
                                    {student.parentEmail && (
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                            <Mail size={12} className="text-gray-600" />
                                            <span className="truncate">{student.parentEmail}</span>
                                        </div>
                                    )}
                                    {student.phone && (
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                            <Lock size={12} className="text-gray-600" />
                                            <span>{student.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <DollarSign size={12} className="text-emerald-500" />
                                        <span className="font-bold text-emerald-500/80">R$ {student.hourlyRate?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / hora</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Parents Sub-Tab */}
                        {activeSubTab === 'PARENTS' && parents.map(parent => (
                            <div key={parent.id} className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 hover:border-emerald-500/50 transition-all group relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm uppercase truncate max-w-[150px]">{parent.name}</h3>
                                        <p className="text-xs text-gray-400 font-medium truncate max-w-[150px]">{parent.email}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Filhos Vinculados:</span>
                                        <span className="text-[10px] text-emerald-500 font-bold">{students.filter(s => s.parentId === parent.id || s.parentEmail === parent.email).length}</span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {students.filter(s => s.parentId === parent.id || s.parentEmail === parent.email).map(s => (
                                            <span key={s.id} className="px-2 py-0.5 bg-gray-800 rounded text-[9px] text-gray-300">{s.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Staff Sub-Tab */}
                        {activeSubTab === 'STAFF' && staff.map(member => (
                            <div key={member.id} className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 hover:border-emerald-500/50 transition-all group relative">
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => startEditStaff(member)}
                                        className="p-2 text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteStaff(member.id)}
                                        className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <UserAvatar name={member.name} photoUrl={member.photoUrl} size="lg" />
                                    <div>
                                        <h3 className="text-white font-bold text-sm uppercase truncate max-w-[150px]">{member.name}</h3>
                                        <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded mt-1 uppercase">
                                            {member.role === UserRole.TEACHER ? 'Professor' : member.role === UserRole.COORDINATOR ? 'Coordenador' : 'Monitor'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <Mail size={12} className="text-gray-600" />
                                        <span className="truncate">{member.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <School size={12} className="text-gray-600" />
                                        <span>{member.assignments.length} Turmas Atribuídas</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Classes Sub-Tab */}
                        {activeSubTab === 'CLASSES' && classes.map(classRoom => (
                            <div key={classRoom.id} className="bg-[#0f172a] border border-gray-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all group relative">
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => startEditClass(classRoom)}
                                        className="p-2 text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClass(classRoom.id)}
                                        className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                                        <School size={32} />
                                    </div>
                                    <h3 className="text-white font-bold text-lg uppercase mb-1">{classRoom.name}</h3>
                                    <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">{classRoom.period}</p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between items-center">
                                    <div className="text-center flex-1 border-r border-gray-800">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Alunos</p>
                                        <p className="text-white font-bold">{students.filter(s => s.className === classRoom.name && s.status === 'ACTIVE').length}</p>
                                    </div>
                                    <div className="text-center flex-1">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Disciplinas</p>
                                        <p className="text-white font-bold">{classRoom.disciplineIds.length}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Disciplines Sub-Tab */}
                        {activeSubTab === 'DISCIPLINES' && disciplines.map(discipline => (
                            <div key={discipline.id} className="bg-[#0f172a] border border-gray-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all group relative">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                                        <BookOpen size={32} />
                                    </div>
                                    <h3 className="text-white font-bold text-lg uppercase mb-1">{discipline.displayName || discipline.name}</h3>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest truncate max-w-full mb-2">{discipline.name}</p>
                                    
                                    {discipline.whiteboardBackgroundUrl ? (
                                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                            <FileText size={10} />
                                            <span>PDF Ativo</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-[10px] text-gray-600 font-bold bg-gray-800/20 px-2 py-0.5 rounded-full border border-gray-800">
                                            <CloudOff size={10} />
                                            <span>Sem PDF</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-center gap-3">
                                    <button
                                        onClick={() => startEditDiscipline(discipline)}
                                        className="p-2.5 text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all bg-blue-500/5 rounded-lg"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDiscipline(discipline.id)}
                                        className="p-2.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-red-500/5 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. FINANCIAL SECTION */}
                {activeMainTab === 'FINANCIAL' && (
                    <div className="space-y-8">
                        {/* Summary Sub-Tab */}
                        {activeSubTab === 'SUMMARY' && (
                            <>
                                {/* Financial Stats Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 Transition-opacity"><TrendingUp size={100} /></div>
                                        <p className="text-emerald-500 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Faturamento Recebido</p>
                                        <h4 className="text-4xl font-black text-white">
                                            R$ {financialClasses.filter(c => c.status === 'COMPLETED' && c.paymentStatus === 'PAID').reduce((acc, curr) => acc + (curr.totalValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h4>
                                    </div>

                                    <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 Transition-opacity"><Clock size={100} /></div>
                                        <p className="text-amber-500 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Aguardando Pagamento</p>
                                        <h4 className="text-4xl font-black text-white">
                                            R$ {financialClasses.filter(c => c.status === 'COMPLETED' && c.paymentStatus === 'PENDING').reduce((acc, curr) => acc + (curr.totalValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h4>
                                    </div>

                                    <div className="bg-emerald-500 p-8 rounded-[2.5rem] shadow-[0_0_30px_rgba(16,185,129,0.2)] relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-20"><Search size={100} className="text-white" /></div>
                                        <p className="text-emerald-900 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Total do Período</p>
                                        <h4 className="text-4xl font-black text-white">
                                            R$ {financialClasses.filter(c => c.status === 'COMPLETED').reduce((acc, curr) => acc + (curr.totalValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h4>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 px-3">
                                            <Calendar size={16} className="text-emerald-500" />
                                            <input
                                                type="month"
                                                value={filterMonth}
                                                onChange={(e) => setFilterMonth(e.target.value)}
                                                className="bg-transparent border-none text-white text-sm font-bold focus:ring-0 outline-none"
                                            />
                                        </div>
                                        <div className="h-8 w-[1px] bg-slate-800 hidden md:block" />
                                        <div className="flex items-center gap-2 px-3">
                                            <Filter size={16} className="text-emerald-500" />
                                            <select
                                                value={filterAccount}
                                                onChange={(e) => setFilterAccount(e.target.value)}
                                                className="bg-transparent border-none text-white text-sm font-bold focus:ring-0 outline-none"
                                            >
                                                <option value="ALL">Todas as Contas</option>
                                                {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                                    <div className="p-8 border-b border-slate-800 bg-slate-900/80">
                                        <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tight">Confirmar Recebimentos</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Clique para atribuir o pagamento a uma conta</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-900/20">
                                                    <th className="p-6">Data</th>
                                                    <th className="p-6">Aluno</th>
                                                    <th className="p-6">Valor</th>
                                                    <th className="p-6 text-right">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/50">
                                                {financialClasses.filter(c => c.status === 'COMPLETED' && c.paymentStatus === 'PENDING').map(c => (
                                                    <tr key={c.id} className="hover:bg-slate-800/30 transition-all group">
                                                        <td className="p-6 text-gray-400 font-bold text-sm">
                                                            {new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                        </td>
                                                        <td className="p-6">
                                                            <span className="text-white font-black text-sm uppercase tracking-tight">{c.studentName}</span>
                                                        </td>
                                                        <td className="p-6">
                                                            <span className="text-amber-500 font-black text-sm">R$ {(c.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <button
                                                                onClick={() => { setSelectedFinancialClass(c); setShowPaymentModal(true); }}
                                                                className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest Transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
                                                            >
                                                                Confirmar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {financialClasses.filter(c => c.status === 'COMPLETED' && c.paymentStatus === 'PENDING').length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-20 text-center text-gray-500 uppercase text-xs font-bold italic opacity-30">Nenhuma aula pendente</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Accounts Sub-Tab */}
                        {activeSubTab === 'ACCOUNTS' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4 bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">
                                        {editingBankAccount ? 'Editar Conta' : 'Nova Conta Bancária'}
                                    </h3>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Nome da Conta / Banco</label>
                                        <input
                                            type="text"
                                            value={newAccountName}
                                            onChange={e => setNewAccountName(e.target.value)}
                                            className="w-full bg-[#1e293b] border border-gray-700 rounded-xl p-4 text-white outline-none focus:border-emerald-500 text-sm"
                                            placeholder="Ex: Banco Itaú, Pix CNPJ, etc"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Imagem / Logo do Banco</label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => bankFileInputRef.current?.click()}
                                                className="w-20 h-20 bg-white/5 border border-dashed border-gray-700 rounded-2xl flex items-center justify-center text-gray-500 hover:text-emerald-500 hover:border-emerald-500/50 Transition-all overflow-hidden"
                                            >
                                                {newAccountImage ? (
                                                    <img src={newAccountImage} className="w-full h-full object-contain" alt="" />
                                                ) : (
                                                    <Upload size={24} />
                                                )}
                                            </button>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Use logos<br />quadradas (1:1)</p>
                                        </div>
                                        <input type="file" ref={bankFileInputRef} onChange={handleBankImageUpload} className="hidden" accept="image/*" />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        {editingBankAccount && (
                                            <button
                                                onClick={() => {
                                                    setEditingBankAccount(null);
                                                    setNewAccountName('');
                                                    setNewAccountImage('');
                                                }}
                                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl Transition-all"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                        <button
                                            onClick={handleAddBankAccount}
                                            className={`flex-[2] ${editingBankAccount ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'} text-[#0f172a] font-black uppercase tracking-widest py-4 rounded-xl Transition-all shadow-lg`}
                                        >
                                            {editingBankAccount ? 'Salvar Alterações' : 'Adicionar Conta'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Contas Ativas</h3>
                                    <div className="space-y-3">
                                        {bankAccounts.map(account => (
                                            <div key={account.id} className="flex items-center justify-between p-5 bg-[#1e293b]/50 border border-gray-800 rounded-2xl group hover:border-blue-500/50 Transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-white/5 shadow-inner">
                                                        {account.imageUrl ? (
                                                            <img src={account.imageUrl} className="w-full h-full object-contain" alt="" />
                                                        ) : (
                                                            <DollarSign size={20} className="text-gray-500" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-black text-white uppercase tracking-tight">{account.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => startEditBankAccount(account)}
                                                        className="p-2.5 text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 Transition-all bg-blue-500/5 rounded-lg"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBankAccount(account.id)}
                                                        className="p-2.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 Transition-all bg-red-500/5 rounded-lg"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. CONFIGURATION SECTION */}
                {activeMainTab === 'CONFIG' && (
                    <div className="max-w-4xl">
                        {activeSubTab === 'LOGO' && (
                            <div className="space-y-6">
                            <div className="bg-[#0f172a] border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
                                <div className="flex items-center gap-4 mb-8 border-b border-gray-800/50 pb-6 relative z-10">
                                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 shadow-inner">
                                        <ImageIcon size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Logomarca da <span className="text-purple-500">Instituição</span></h2>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Personalize a identidade do sistema e relatórios</p>
                                    </div>
                                </div>

                                <div className="space-y-10 relative z-10">
                                    <div className="flex flex-col items-center justify-center w-full">
                                        {logoUrl ? (
                                            <div className="relative group w-full flex flex-col items-center gap-8">
                                                <div className="w-full max-w-sm bg-white/95 rounded-3xl p-10 border border-white/20 flex justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-sm Transition-transform hover:scale-[1.02]">
                                                    <img src={logoUrl} alt="Logo Preview" className="max-h-32 object-contain" />
                                                </div>
                                                <div className="flex gap-4 w-full max-w-md">
                                                    <button
                                                        onClick={handleRemoveLogo}
                                                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black py-4 rounded-2xl flex justify-center items-center gap-3 Transition-all border border-red-500/20 uppercase text-xs tracking-widest shadow-lg"
                                                    >
                                                        <Trash2 size={18} /> Remover
                                                    </button>
                                                    <button
                                                        onClick={() => logoFileInputRef.current?.click()}
                                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl flex justify-center items-center gap-3 Transition-all border border-white/10 uppercase text-xs tracking-widest shadow-lg"
                                                    >
                                                        <Upload size={18} /> Alterar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => logoFileInputRef.current?.click()}
                                                className="w-full h-56 border-2 border-dashed border-gray-800 hover:border-purple-500/50 bg-white/[0.02] hover:bg-purple-500/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-purple-400 Transition-all cursor-pointer group"
                                            >
                                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 Transition-colors">
                                                    <Upload size={32} />
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm font-black uppercase tracking-widest block mb-1">Carregar Logomarca</span>
                                                    <span className="text-[10px] font-bold text-gray-600 block px-6">Envie arquivos PNG com fundo transparente para melhor resultado</span>
                                                </div>
                                            </button>
                                        )}
                                        <input
                                            type="file"
                                            ref={logoFileInputRef}
                                            onChange={handleLogoUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>

                                    {logoUrl && (
                                        <button
                                            onClick={handleSaveLogo}
                                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 Transition-all shadow-xl shadow-purple-900/40 uppercase tracking-[0.2em] transform active:scale-95"
                                        >
                                            <Save size={20} />
                                            Salvar Configurações
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* New Card for Link */}
                            <div className="bg-[#0f172a] border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                                <div className="flex items-center gap-4 mb-4 border-b border-gray-800/50 pb-6 relative z-10">
                                     <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                                         <Share2 size={28} />
                                     </div>
                                     <div>
                                         <h2 className="text-2xl font-black text-white uppercase tracking-tight">Compartilhar <span className="text-emerald-500">Acesso</span></h2>
                                         <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Link do portal para alunos</p>
                                     </div>
                                </div>
                                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mt-6">
                                    <div className="flex-1 w-full bg-[#1e293b] border border-gray-700 rounded-xl p-4 text-white text-sm truncate">
                                        https://projetogestaoescolar.vercel.app
                                    </div>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(`Acesse o Portal do Aluno: https://projetogestaoescolar.vercel.app\nLogin: Seu Nome + Sobrenome\nSenha padrão: 2026`);
                                            onShowToast('Link e instruções copiados!');
                                        }}
                                        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg text-sm uppercase tracking-widest whitespace-nowrap"
                                    >
                                        <Copy size={20} /> Copiar Link e Instruções
                                    </button>
                                </div>
                            </div>
                            </div>
                        )}
                    </div>
                )}
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
                            <button onClick={() => { setShowStudentModal(false); setEditingStudentId(null); setStudentForm({ name: '', parentId: '', parentEmail: '', parentName: '', billing_day: 1, billing_period: 'MONTHLY', hourlyRate: 0, phone: '', className: '', photoUrl: '', status: 'ACTIVE', inactiveReason: '', inactiveDate: '' }); }} className="text-gray-400 hover:text-white">
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

                            <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Responsável Registrado (Opcional)</label>
                                    <select
                                        value={studentForm.parentId}
                                        onChange={(e) => {
                                            const p = parents.find(x => x.id === e.target.value);
                                            setStudentForm({ 
                                                ...studentForm, 
                                                parentId: e.target.value,
                                                parentName: p ? p.name : studentForm.parentName,
                                                parentEmail: p ? p.email : studentForm.parentEmail
                                            });
                                        }}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    >
                                        <option value="">-- Vincular Responsável Exitente --</option>
                                        {parents.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1 italic">Se não selecionar, um novo acesso será criado com os dados abaixo.</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nome do Responsável</label>
                                    <input
                                        type="text"
                                        value={studentForm.parentName}
                                        onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                        placeholder="Nome para exibição"
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
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Email do Responsável</label>
                                    <input
                                        type="email"
                                        value={studentForm.parentEmail}
                                        onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                                <div className="col-span-2">
                                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <DollarSign size={12} /> Configurações Financeiras
                                    </h4>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Período de Faturamento</label>
                                    <select
                                        value={studentForm.billing_period}
                                        onChange={(e) => setStudentForm({ ...studentForm, billing_period: e.target.value as any })}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    >
                                        <option value="MONTHLY">Mensal</option>
                                        <option value="BIWEEKLY">Quinzenal</option>
                                        <option value="WEEKLY">Semanal</option>
                                        <option value="PER_CLASS">Por Aula</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Dia do Vencimento</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={studentForm.billing_day}
                                        onChange={(e) => setStudentForm({ ...studentForm, billing_day: parseInt(e.target.value) })}
                                        className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div className="col-span-2">
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
                                <button onClick={() => { setShowDisciplineModal(false); setEditingDisciplineId(null); setDisciplineForm({ name: '', displayName: '', whiteboardBackgroundUrl: '' }); }} className="text-gray-400 hover:text-white">
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

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">PDF de Fundo da Lousa (A4)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={disciplineForm.whiteboardBackgroundUrl || ''}
                                            readOnly
                                            className="flex-1 bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 text-white text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                                            placeholder="Nenhum PDF selecionado"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'application/pdf';
                                                input.onchange = async (e) => {
                                                    const file = (e.target as HTMLInputElement).files?.[0];
                                                    if (file) {
                                                        const url = await SupabaseService.uploadPhoto(file, 'whiteboard');
                                                        if (url) {
                                                            setDisciplineForm({ ...disciplineForm, whiteboardBackgroundUrl: url });
                                                            onShowToast('PDF de fundo carregado com sucesso!');
                                                        } else {
                                                            onShowToast('Erro ao carregar PDF');
                                                        }
                                                    }
                                                };
                                                input.click();
                                            }}
                                            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/10"
                                        >
                                            <Upload size={18} />
                                        </button>
                                        {disciplineForm.whiteboardBackgroundUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setDisciplineForm({ ...disciplineForm, whiteboardBackgroundUrl: '' })}
                                                className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all border border-red-500/20"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
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
                    </div>
                )
            }
        </div >
    );
};
