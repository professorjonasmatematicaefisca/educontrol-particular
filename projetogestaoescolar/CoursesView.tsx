import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Video, 
  FileText, 
  ChevronRight,
  ExternalLink,
  PlayCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Users,
  Layout,
  Settings,
  X,
  Lock,
  Eye
} from 'lucide-react';
import { UserRole, Course, CourseModule, CourseLesson, Discipline, Student } from './types';
import { SupabaseService } from './services/supabaseService';

interface CoursesViewProps {
  onShowToast: (msg: string) => void;
  userEmail: string;
  userRole: UserRole;
}

export const CoursesView: React.FC<CoursesViewProps> = ({ onShowToast, userEmail, userRole }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // App State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [studentId, setStudentId] = useState<string | null>(null);

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Form States
  const [courseForm, setCourseForm] = useState<Partial<Course>>({});
  const [moduleForm, setModuleForm] = useState<Partial<CourseModule>>({});
  const [lessonForm, setLessonForm] = useState<Partial<CourseLesson>>({});
  const [courseAccessIds, setCourseAccessIds] = useState<string[]>([]);

  const isEditor = userRole === UserRole.COORDINATOR || userRole === UserRole.TEACHER;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      // Se for aluno, precisamos do ID dele
      let currentStudentId = null;
      if (userRole === UserRole.STUDENT) {
        const student = await SupabaseService.getStudentByEmail(userEmail);
        if (student) {
          currentStudentId = student.id;
          setStudentId(student.id);
          const progress = await SupabaseService.getStudentCourseProgress(student.id);
          setCompletedLessons(progress);
        }
      }

      const [coursesData, disciplinesData] = await Promise.all([
        SupabaseService.getCourses(currentStudentId),
        SupabaseService.getDisciplines()
      ]);

      setCourses(coursesData);
      setDisciplines(disciplinesData);

      if (isEditor) {
        const studentsData = await SupabaseService.getStudents();
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error fetching courses data:', error);
      onShowToast('Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    const coursesData = await SupabaseService.getCourses(studentId || undefined);
    setCourses(coursesData);
    if (selectedCourse) {
      const updated = coursesData.find(c => c.id === selectedCourse.id);
      if (updated) setSelectedCourse(updated);
    }
  };

  // --- COURSE ACTIONS ---
  const handleSaveCourse = async () => {
    if (!courseForm.name) return onShowToast('Nome obrigatório');
    const success = await SupabaseService.saveCourse(courseForm);
    if (success) {
      onShowToast('Curso salvo');
      setShowCourseModal(false);
      fetchData();
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Excluir curso e todo conteúdo?')) {
      if (await SupabaseService.deleteCourse(id)) {
        onShowToast('Curso excluído');
        fetchData();
      }
    }
  };

  // --- MODULE ACTIONS ---
  const handleSaveModule = async () => {
    if (!moduleForm.title || !selectedCourse) return;
    const success = await SupabaseService.saveCourseModule({
      ...moduleForm,
      courseId: selectedCourse.id,
      order: moduleForm.order || (selectedCourse.modules?.length || 0)
    });
    if (success) {
      onShowToast('Módulo salvo');
      setShowModuleModal(false);
      fetchData();
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (window.confirm('Excluir módulo?')) {
      if (await SupabaseService.deleteCourseModule(id)) {
        onShowToast('Módulo excluído');
        fetchData();
      }
    }
  };

  // --- LESSON ACTIONS ---
  const handleSaveLesson = async () => {
    if (!lessonForm.title || !lessonForm.moduleId) return;
    const success = await SupabaseService.saveCourseLesson(lessonForm);
    if (success) {
      onShowToast('Aula salva');
      setShowLessonModal(false);
      fetchData();
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (window.confirm('Excluir aula?')) {
      if (await SupabaseService.deleteCourseLesson(id)) {
        onShowToast('Aula excluída');
        fetchData();
      }
    }
  };

  const toggleLessonCompletion = async (lessonId: string) => {
    if (!studentId) return;
    const success = await SupabaseService.markLessonAsCompleted(studentId, lessonId);
    if (success) {
      setCompletedLessons(prev => {
        const next = new Set(prev);
        next.add(lessonId);
        return next;
      });
      onShowToast('Aula concluída!');
    }
  };

  // --- ACCESS ACTIONS ---
  const openAccessManager = async (course: Course) => {
    setCourseForm(course);
    const authorized = await SupabaseService.getCourseAuthorizedStudents(course.id);
    setCourseAccessIds(authorized);
    setShowAccessModal(true);
  };

  const toggleAccess = async (studentIdToToggle: string) => {
    if (!courseForm.id) return;
    const hasAccess = courseAccessIds.includes(studentIdToToggle);
    const success = await SupabaseService.toggleCourseAccess(courseForm.id, studentIdToToggle, !hasAccess);
    if (success) {
      setCourseAccessIds(prev => 
        hasAccess ? prev.filter(id => id !== studentIdToToggle) : [...prev, studentIdToToggle]
      );
    }
  };

  // --- RENDER HELPERS ---
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return <div className="p-20 text-center text-white animate-pulse font-black uppercase tracking-widest">Carregando Unverso de Conhecimento...</div>;

  // VIEW: VIDEO PLAYER / LESSON CONTENT
  if (activeLesson) {
    const ytId = activeLesson.type === 'VIDEO' && activeLesson.contentUrl ? getYouTubeId(activeLesson.contentUrl) : null;
    
    return (
      <div className="max-w-6xl mx-auto space-y-8 px-4 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveLesson(null)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-all font-black uppercase text-xs">
            <ChevronRight className="rotate-180" size={16} /> Voltar para o curso
          </button>
          {studentId && !completedLessons.has(activeLesson.id) && (
            <button 
              onClick={() => toggleLessonCompletion(activeLesson.id)}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] hover:scale-105 transition-all"
            >
              <CheckCircle2 size={16} /> Marcar como concluída
            </button>
          )}
          {completedLessons.has(activeLesson.id) && (
            <div className="flex items-center gap-2 text-emerald-500 font-black uppercase text-[10px]">
              <CheckCircle2 size={16} /> Concluída
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="aspect-video bg-black flex items-center justify-center">
            {ytId ? (
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} 
                title={activeLesson.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : activeLesson.type === 'PDF' ? (
              <iframe src={activeLesson.contentUrl} width="100%" height="100%" className="border-none"></iframe>
            ) : (
              <div className="text-center p-20">
                <Layout size={64} className="mx-auto text-slate-800 mb-4" />
                <p className="text-gray-500 font-black uppercase tracking-widest">Este conteúdo não pode ser exibido diretamente.</p>
                {activeLesson.contentUrl && (
                  <a href={activeLesson.contentUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs">
                    Abrir em nova aba <ExternalLink size={16} />
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="p-8">
            <h1 className="text-2xl font-black text-white uppercase mb-2">{activeLesson.title}</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{selectedCourse?.name}</p>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: COURSE CURRICULUM
  if (selectedCourse) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 px-4 animate-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedCourse(null)} className="p-3 bg-slate-800 rounded-2xl text-gray-400 hover:text-white transition-all">
              <ChevronRight className="rotate-180" size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white uppercase leading-none">{selectedCourse.name}</h1>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-2">{selectedCourse.description}</p>
            </div>
          </div>
          {isEditor && (
            <button 
              onClick={() => { setModuleForm({ title: '', order: selectedCourse.modules?.length || 0 }); setShowModuleModal(true); }}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-emerald-500/20"
            >
              <Plus size={16} className="inline mr-2" /> Novo Módulo
            </button>
          )}
        </div>

        <div className="space-y-6">
          {selectedCourse.modules?.map((module, mIdx) => (
            <div key={module.id} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden">
              <div className="p-6 bg-slate-800/50 flex items-center justify-between border-b border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  <span className="text-emerald-500 mr-2">Módulo {mIdx + 1}</span> 
                  {module.title}
                </h3>
                {isEditor && (
                  <div className="flex gap-2">
                    <button onClick={() => { setLessonForm({ moduleId: module.id, title: '', type: 'VIDEO', order: module.lessons?.length || 0 }); setShowLessonModal(true); }} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Plus size={16} /></button>
                    <button onClick={() => { setModuleForm(module); setShowModuleModal(true); }} className="p-2 bg-sky-500/10 text-sky-500 rounded-lg hover:bg-sky-500 hover:text-white transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteModule(module.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <div className="divide-y divide-slate-800/50">
                {module.lessons?.map((lesson, lIdx) => (
                  <div key={lesson.id} className="p-5 flex items-center justify-between group hover:bg-slate-800/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${completedLessons.has(lesson.id) ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-gray-400'}`}>
                        {lesson.type === 'VIDEO' ? <Video size={18} /> : <FileText size={18} />}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase mb-1">{lesson.title}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Aula {lIdx + 1} • {lesson.duration || '5 min'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveLesson(lesson)}
                        className="px-5 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        {completedLessons.has(lesson.id) ? 'Reassistir' : 'Começar'}
                      </button>
                      {isEditor && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setLessonForm(lesson); setShowLessonModal(true); }} className="p-2 text-gray-500 hover:text-sky-500"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 text-gray-500 hover:text-rose-500"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!module.lessons || module.lessons.length === 0) && (
                  <div className="p-10 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest italic">Este módulo ainda não possui aulas.</div>
                )}
              </div>
            </div>
          ))}
          {(!selectedCourse.modules || selectedCourse.modules.length === 0) && (
            <div className="p-20 text-center bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[3rem] opacity-30">
              <BookOpen size={64} className="mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-sm">Nenhum módulo cadastrado</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // VIEW: MAIN GALLERY
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-3 bg-emerald-500/10 rounded-2xl"><BookOpen className="text-emerald-500" size={24} /></div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Universo <span className="text-emerald-500">EduControl</span></h1>
          </div>
          <p className="text-xs text-gray-500 font-bold ml-14 uppercase tracking-[0.2em] italic">Tecnologia e Educação em um só lugar</p>
        </div>

        {isEditor && (
          <button 
            onClick={() => { setCourseForm({ name: '', description: '', disciplineId: '' }); setShowCourseModal(true); }} 
            className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] font-black transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-3"
          >
            <Plus size={20} className="transition-transform group-hover:rotate-90" /> NOVO CURSO
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map(course => (
          <div key={course.id} className="bg-slate-900/60 border border-slate-800 rounded-[3rem] overflow-hidden flex flex-col group hover:border-emerald-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10">
            <div className="h-56 bg-slate-800 relative overflow-hidden">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={course.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-900/20 to-slate-900"><BookOpen size={64} className="opacity-10 text-emerald-500" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-8 right-8">
                <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg tracking-widest">{disciplines.find(d => d.id === course.disciplineId)?.name || 'Geral'}</span>
                <h3 className="text-xl font-black text-white mt-2 uppercase tracking-tight leading-tight">{course.name}</h3>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-between gap-8">
              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider leading-relaxed line-clamp-2">{course.description || 'Domine novos conhecimentos com este curso estruturado.'}</p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedCourse(course)} 
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white hover:text-emerald-500 shadow-lg shadow-emerald-500/10"
                >
                  ACESSAR CURSO
                </button>
                {isEditor && (
                  <div className="flex gap-2">
                    <button onClick={() => openAccessManager(course)} className="p-4 bg-slate-800 text-gray-500 hover:text-white rounded-2xl transition-all"><Users size={18} /></button>
                    <button onClick={() => { setCourseForm(course); setShowCourseModal(true); }} className="p-4 bg-slate-800 text-gray-500 hover:text-sky-500 rounded-2xl transition-all"><Edit2 size={18} /></button>
                    <button onClick={() => handleDeleteCourse(course.id)} className="p-4 bg-slate-800 text-gray-500 hover:text-rose-500 rounded-2xl transition-all"><Trash2 size={18} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="py-32 text-center opacity-20">
          <BookOpen size={80} className="mx-auto mb-6 text-emerald-500" />
          <h2 className="text-2xl font-black uppercase tracking-[0.3em]">Nenhum curso disponível</h2>
          <p className="text-xs font-bold uppercase mt-2">Novos conhecimentos estão sendo preparados para você</p>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] w-full max-w-xl rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">{courseForm.id ? 'Editar' : 'Criar Novo'} Curso</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-gray-500 hover:text-white transition-all"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título do Curso</label>
                <input type="text" value={courseForm.name || ''} onChange={e => setCourseForm({...courseForm, name: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold focus:border-emerald-500 transition-all outline-none" placeholder="Ex: Matemática Zero ao Topo" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Descrição Curta</label>
                <textarea value={courseForm.description || ''} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold h-24 focus:border-emerald-500 transition-all outline-none resize-none" placeholder="O que o aluno aprenderá?" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Disciplina</label>
                  <select value={courseForm.disciplineId || ''} onChange={e => setCourseForm({...courseForm, disciplineId: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer">
                    <option value="">Geral</option>
                    {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">URL da Imagem Capa</label>
                  <input type="text" value={courseForm.thumbnailUrl || ''} onChange={e => setCourseForm({...courseForm, thumbnailUrl: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-emerald-500 transition-all" placeholder="YouTube URL ou link" />
                </div>
              </div>
            </div>
            <div className="p-10 bg-slate-900/50 flex justify-end gap-4">
              <button onClick={() => setShowCourseModal(false)} className="px-8 py-4 bg-slate-800 text-gray-400 hover:text-white rounded-2xl font-black uppercase text-xs transition-all">Cancelar</button>
              <button onClick={handleSaveCourse} className="px-12 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-500/20">Salvar Curso</button>
            </div>
          </div>
        </div>
      )}

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[160] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] w-full max-w-md rounded-[3rem] border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Gerenciar Módulo</h3>
              <button onClick={() => setShowModuleModal(false)} className="text-gray-500 hover:text-white transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-4">
              <input type="text" value={moduleForm.title || ''} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-4 text-white font-bold outline-none" placeholder="Nome do Módulo" />
              <input type="number" value={moduleForm.order || 0} onChange={e => setModuleForm({...moduleForm, order: Number(e.target.value)})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-4 text-white font-bold outline-none" placeholder="Ordem de exibição" />
            </div>
            <div className="p-8 bg-slate-900/50 flex justify-end gap-4">
              <button onClick={handleSaveModule} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs">Salvar Módulo</button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[170] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] w-full max-w-lg rounded-[3rem] border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Gerenciar Conteúdo</h3>
              <button onClick={() => setShowLessonModal(false)} className="text-gray-500 hover:text-white transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <input type="text" value={lessonForm.title || ''} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-4 text-white font-bold outline-none" placeholder="Título da Aula" />
              <div className="grid grid-cols-2 gap-4">
                <select value={lessonForm.type || 'VIDEO'} onChange={e => setLessonForm({...lessonForm, type: e.target.value as any})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-4 text-white font-bold outline-none">
                  <option value="VIDEO">Vídeo (YouTube)</option>
                  <option value="PDF">Arquivo PDF</option>
                  <option value="LINK">Link Externo</option>
                </select>
                <input type="text" value={lessonForm.duration || ''} onChange={e => setLessonForm({...lessonForm, duration: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-4 text-white font-bold outline-none" placeholder="Duração (ex: 15min)" />
              </div>
              <input type="text" value={lessonForm.contentUrl || ''} onChange={e => setLessonForm({...lessonForm, contentUrl: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-4 text-white font-bold outline-none" placeholder="URL do YouTube ou Material" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Ordem da Aula:</span>
                <input type="number" value={lessonForm.order || 0} onChange={e => setLessonForm({...lessonForm, order: Number(e.target.value)})} className="w-20 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-white font-bold outline-none" />
              </div>
            </div>
            <div className="p-8 bg-slate-900/50 flex justify-end gap-4">
              <button onClick={handleSaveLesson} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs">Salvar Conteúdo</button>
            </div>
          </div>
        </div>
      )}

      {/* Access Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[180] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] w-full max-w-2xl h-[80vh] flex flex-col rounded-[3.5rem] border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Liberar Acesso</h3>
                <p className="text-emerald-500 text-[10px] font-black uppercase mt-1 tracking-widest">Curso: {courseForm.name}</p>
              </div>
              <button onClick={() => setShowAccessModal(false)} className="text-gray-500 hover:text-white transition-all"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map(student => {
                  const isAuthorized = courseAccessIds.includes(student.id);
                  return (
                    <button 
                      key={student.id} 
                      onClick={() => toggleAccess(student.id)}
                      className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-300 ${isAuthorized ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className="relative">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} className="w-12 h-12 rounded-2xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-gray-500 font-bold uppercase text-xs">{student.name.charAt(0)}</div>
                        )}
                        {isAuthorized && (
                          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-[#0f172a]"><CheckCircle2 size={12} /></div>
                        )}
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className={`text-xs font-black uppercase truncate ${isAuthorized ? 'text-white' : 'text-gray-400'}`}>{student.name}</p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{student.className}</p>
                      </div>
                      {isAuthorized ? <Eye className="ml-auto text-emerald-500" size={16} /> : <Lock className="ml-auto text-gray-600" size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-10 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{courseAccessIds.length} Alunos autorizados</span>
              <button onClick={() => setShowAccessModal(false)} className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-500/20">Concluir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
