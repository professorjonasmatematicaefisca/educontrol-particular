import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  Type, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronRight,
  ExternalLink,
  PlayCircle,
  Upload
} from 'lucide-react';
import { UserRole, Course, CourseItem, Discipline } from './types';
import { SupabaseService } from './services/supabaseService';

interface CoursesViewProps {
  onShowToast: (msg: string) => void;
  userEmail: string;
  userRole: UserRole;
}

export const CoursesView: React.FC<CoursesViewProps> = ({ onShowToast, userEmail, userRole }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'VIDEO' | 'PDF'>('VIDEO');
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseItems, setCourseItems] = useState<CourseItem[]>([]);

  // Form States
  const [courseData, setCourseData] = useState<Partial<Course>>({
    name: '',
    description: '',
    disciplineId: ''
  });

  const [itemData, setItemData] = useState<Partial<CourseItem>>({
    title: '',
    type: 'TEXT',
    contentUrl: '',
    textContent: '',
    order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesData, disciplinesData] = await Promise.all([
        SupabaseService.getCourses(),
        SupabaseService.getDisciplines()
      ]);
      setCourses(coursesData);
      setDisciplines(disciplinesData);
    } catch (error) {
      console.error('Error fetching courses data:', error);
      onShowToast('Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!courseData.name) {
      onShowToast('O nome do curso é obrigatório');
      return;
    }
    const success = await SupabaseService.saveCourse(courseData);
    if (success) {
      onShowToast(courseData.id ? 'Curso atualizado' : 'Curso criado');
      setShowCourseModal(false);
      fetchData();
    } else {
      onShowToast('Erro ao salvar curso');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este curso?')) {
      const success = await SupabaseService.deleteCourse(id);
      if (success) {
        onShowToast('Curso excluído');
        fetchData();
      }
    }
  };

  const openItemsManager = async (course: Course) => {
    setSelectedCourse(course);
    setLoading(true);
    const items = await SupabaseService.getCourseItems(course.id);
    setCourseItems(items);
    setLoading(false);
  };

  const handleSaveItem = async () => {
    if (!itemData.title || !selectedCourse) return;
    const success = await SupabaseService.saveCourseItem({
      ...itemData,
      courseId: selectedCourse.id,
      order: itemData.order || courseItems.length
    });
    if (success) {
      onShowToast('Item salvo');
      setShowItemModal(false);
      openItemsManager(selectedCourse);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Excluir este item?')) {
      const success = await SupabaseService.deleteCourseItem(id);
      if (success && selectedCourse) {
        onShowToast('Item removido');
        openItemsManager(selectedCourse);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const publicUrl = await SupabaseService.uploadPhoto(file, 'materials');
      if (publicUrl) {
        setItemData(prev => ({ ...prev, contentUrl: publicUrl }));
        onShowToast('Arquivo carregado com sucesso!');
      } else {
        onShowToast('Erro ao carregar arquivo.');
      }
      setIsUploading(false);
    }
  };

  const isEditor = userRole === UserRole.COORDINATOR || userRole === UserRole.TEACHER;

  const filteredItems = courseItems.filter(item => {
    if (activeTab === 'VIDEO') return item.type === 'VIDEO';
    if (activeTab === 'PDF') return item.type === 'PDF' || item.type === 'LINK' || item.type === 'TEXT';
    return true;
  });

  if (selectedCourse && !showCourseModal && !showItemModal) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedCourse(null)} className="p-2 bg-slate-800 rounded-xl text-gray-400 hover:text-white transition-all">
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">{selectedCourse.name}</h1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">{selectedCourse.description}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-2xl border border-slate-800 w-fit">
          <button 
            onClick={() => setActiveTab('VIDEO')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'VIDEO' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Video size={16} /> Videoaulas
          </button>
          <button 
            onClick={() => setActiveTab('PDF')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PDF' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <FileText size={16} /> Materiais PDF
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => (
                <div key={item.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                      {item.type === 'VIDEO' ? <Video size={24} /> : 
                       item.type === 'PDF' ? <FileText size={24} /> : 
                       item.type === 'LINK' ? <LinkIcon size={24} /> : <Type size={24} />}
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase text-sm">{item.title}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Item {idx + 1} • {item.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.contentUrl && (
                      <a href={item.contentUrl} target="_blank" rel="noreferrer" className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                        {item.type === 'VIDEO' ? <PlayCircle size={20} /> : <ExternalLink size={20} />}
                      </a>
                    )}
                    {isEditor && (
                      <>
                        <button onClick={() => { setItemData(item); setShowItemModal(true); }} className="p-3 bg-sky-500/10 text-sky-500 rounded-xl hover:bg-sky-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                          <Edit2 size={20} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[3rem] opacity-30">
                <BookOpen size={64} className="mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-sm">Nenhum conteúdo nesta categoria</p>
              </div>
            )}
            
            {isEditor && (
              <button 
                onClick={() => { setItemData({ title: '', type: activeTab, order: courseItems.length }); setShowItemModal(true); }}
                className="w-full py-6 border-2 border-dashed border-slate-800 rounded-[2.5rem] text-gray-500 font-black uppercase tracking-widest hover:border-emerald-500/50 hover:text-emerald-500 transition-all flex items-center justify-center gap-3"
              >
                <Plus size={24} /> Adicionar {activeTab === 'VIDEO' ? 'Videoaula' : 'Material'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <BookOpen className="text-emerald-500" size={20} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Nossos <span className="text-emerald-500">Cursos</span></h1>
          </div>
          <p className="text-xs text-gray-400 font-bold ml-10 uppercase tracking-widest">Acesse materiais exclusivos e videoaulas</p>
        </div>

        {isEditor && (
          <button 
            onClick={() => { setCourseData({ name: '', description: '', disciplineId: '' }); setShowCourseModal(true); }}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
          >
            <Plus size={20} /> Novo Curso
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map(course => (
          <div key={course.id} className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl group flex flex-col">
            <div className="h-48 bg-slate-800 relative overflow-hidden">
              {course.imageUrl ? (
                <img src={course.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={course.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-900/50 to-slate-900">
                  <BookOpen size={48} className="text-emerald-500/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">
                  {disciplines.find(d => d.id === course.disciplineId)?.name || 'Geral'}
                </span>
                <h3 className="text-xl font-black text-white mt-2 group-hover:text-emerald-400 transition-colors uppercase truncate">{course.name}</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between gap-6">
              <p className="text-gray-500 text-xs font-medium line-clamp-2 leading-relaxed italic">{course.description || 'Sem descrição definida para este curso.'}</p>
              
              <div className="flex items-center justify-between gap-3">
                <button 
                  onClick={() => openItemsManager(course)}
                  className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center"
                >
                  Acessar Conteúdo
                </button>
                {isEditor && (
                  <div className="flex gap-2">
                    <button onClick={() => { setCourseData(course); setShowCourseModal(true); }} className="p-3 bg-slate-800 text-gray-400 hover:text-white rounded-xl transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteCourse(course.id)} className="p-3 bg-slate-800 text-gray-400 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-800">
              <h3 className="text-xl font-black text-white mb-1 uppercase">{courseData.id ? 'Editar' : 'Novo'} Curso</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Informações básicas do curso</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nome do Curso</label>
                  <input 
                    type="text" 
                    value={courseData.name}
                    onChange={e => setCourseData({...courseData, name: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold placeholder:text-gray-600 focus:border-emerald-500/50 transition-all outline-none"
                    placeholder="Ex: Matemática Zero ao Topo"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Descrição</label>
                  <textarea 
                    value={courseData.description}
                    onChange={e => setCourseData({...courseData, description: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold placeholder:text-gray-600 focus:border-emerald-500/50 transition-all outline-none h-24 resize-none"
                    placeholder="Breve resumo sobre o curso..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Disciplina</label>
                  <select 
                    value={courseData.disciplineId}
                    onChange={e => setCourseData({...courseData, disciplineId: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none"
                  >
                    <option value="">Selecione uma disciplina</option>
                    {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-900/50 flex justify-end gap-4">
              <button onClick={() => setShowCourseModal(false)} className="px-6 py-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSaveCourse} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-emerald-600 transition-all">Salvar Curso</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-800">
              <h3 className="text-xl font-black text-white mb-1 uppercase">{itemData.id ? 'Editar' : 'Adicionar'} Conteúdo</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Aulas, PDFs ou Links</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Título do Conteúdo</label>
                  <input 
                    type="text" 
                    value={itemData.title}
                    onChange={e => setItemData({...itemData, title: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none"
                    placeholder="Ex: Aula 01 - Introdução"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tipo</label>
                    <select 
                      value={itemData.type}
                      onChange={e => setItemData({...itemData, type: e.target.value as any})}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none"
                    >
                      <option value="VIDEO">Vídeo (YouTube)</option>
                      <option value="PDF">Arquivo (PDF)</option>
                      <option value="LINK">Link Externo</option>
                      <option value="TEXT">Texto / Descrição</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Ordem</label>
                    <input 
                      type="number" 
                      value={itemData.order}
                      onChange={e => setItemData({...itemData, order: Number(e.target.value)})}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    {itemData.type === 'VIDEO' ? 'Link do YouTube (Vídeo ou Playlist)' : 
                     itemData.type === 'PDF' ? 'URL do PDF ou Upload' : 'URL / Link'}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={itemData.contentUrl}
                      onChange={e => setItemData({...itemData, contentUrl: e.target.value})}
                      className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none"
                      placeholder="https://..."
                    />
                    {itemData.type === 'PDF' && (
                      <label className="cursor-pointer p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                        <Upload size={20} />
                        <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
                      </label>
                    )}
                  </div>
                  {isUploading && (
                    <p className="text-[10px] text-emerald-500 font-bold uppercase mt-2 animate-pulse">Enviando arquivo...</p>
                  )}
                  {itemData.type === 'VIDEO' && itemData.contentUrl?.includes('youtube.com') && (
                    <p className="text-[10px] text-sky-500 font-bold uppercase mt-2">✨ Link do YouTube detectado</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-900/50 flex justify-end gap-4">
              <button onClick={() => setShowItemModal(false)} className="px-6 py-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSaveItem} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-emerald-600 transition-all">Salvar Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
