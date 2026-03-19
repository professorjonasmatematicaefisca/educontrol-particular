import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Calendar as CalendarIcon, Star } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduledClass, UserRole } from '../types';
import { getHoliday } from '../utils/holidays';

interface ModernCalendarProps {
  classes: ScheduledClass[];
  onSelectClass?: (item: ScheduledClass) => void;
  onRescheduleClass?: (classId: string, newDate: string, isCopy?: boolean) => void;
  userRole?: UserRole;
}

export const ModernCalendar: React.FC<ModernCalendarProps> = ({ classes, onSelectClass, onRescheduleClass, userRole }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const getClassesForDay = (day: Date) => {
    return classes.filter(c => isSameDay(new Date(c.classDate + 'T00:00:00'), day));
  };

  const handleDragStart = (e: React.DragEvent, classId: string) => {
    e.dataTransfer.setData('classId', classId);
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const classId = e.dataTransfer.getData('classId');
    const isCopy = e.ctrlKey;
    if (classId && onRescheduleClass && (userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR)) {
      const newDate = format(day, 'yyyy-MM-dd');
      onRescheduleClass(classId, newDate, isCopy);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getStudentColor = (studentId: string) => {
    const colors = [
      { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/20' },
      { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400', hover: 'hover:bg-sky-500/20' },
      { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', hover: 'hover:bg-amber-500/20' },
      { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', hover: 'hover:bg-rose-500/20' },
      { bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-400', hover: 'hover:bg-teal-500/20' },
      { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', hover: 'hover:bg-cyan-500/20' },
      { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', hover: 'hover:bg-orange-500/20' },
      { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', hover: 'hover:bg-blue-500/20' },
      { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400', hover: 'hover:bg-slate-500/20' },
    ];
    
    // Simple hash to pick a color based on studentId
    const hash = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-xl shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
        <div>
          <h3 className="text-xl font-black text-white capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Calendário de Aulas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 hover:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-gray-400 transition-all">
            Hoje
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/20">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
          <div key={day} className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-slate-900/10">
        {days.map((day, i) => {
          const dayClasses = getClassesForDay(day);
          const isSelectedMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const holidayName = getHoliday(day);

          return (
            <div 
              key={day.toString()} 
              onDrop={(e) => handleDrop(e, day)}
              onDragOver={handleDragOver}
              className={`min-h-[120px] p-2 border-r border-b border-slate-800/50 transition-all ${!isSelectedMonth ? 'opacity-20' : ''} ${isToday ? 'bg-emerald-500/5' : ''} ${holidayName ? 'bg-amber-500/5' : ''} hover:bg-white/5 transition-colors group/cell`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold ${isToday ? 'bg-emerald-500 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-500'}`}>
                  {format(day, 'd')}
                </span>
                {holidayName && (
                  <div className="flex items-center gap-1 text-amber-500 animate-pulse">
                    <Star size={10} fill="currentColor" />
                  </div>
                )}
              </div>
              
              {holidayName && (
                <div className="mb-2 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] font-black text-amber-500 uppercase truncate">
                  {holidayName}
                </div>
              )}

              <div className="space-y-1">
                {dayClasses.map(c => {
                  const studentColor = getStudentColor(c.studentId);
                  return (
                    <button
                      key={c.id}
                      draggable={userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR}
                      onDragStart={(e) => (userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) ? handleDragStart(e, c.id) : null}
                      onClick={() => onSelectClass?.(c)}
                      className={`w-full text-left p-1.5 rounded-md text-[9px] font-bold uppercase transition-all truncate border ${(userRole === UserRole.TEACHER || userRole === UserRole.COORDINATOR) ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${studentColor.bg} ${studentColor.border} ${studentColor.text} ${studentColor.hover} ${
                        c.status === 'COMPLETED' ? 'opacity-60 grayscale-[0.3]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {c.status === 'COMPLETED' ? <CheckCircle size={8} /> : <Clock size={8} />}
                        {c.startTime}
                      </div>
                      <div className="truncate opacity-80">{c.studentName?.split(' ')[0]}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
