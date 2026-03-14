import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduledClass } from '../types';

interface ModernCalendarProps {
  classes: ScheduledClass[];
  onSelectClass?: (item: ScheduledClass) => void;
}

export const ModernCalendar: React.FC<ModernCalendarProps> = ({ classes, onSelectClass }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const getClassesForDay = (day: Date) => {
    return classes.filter(c => isSameDay(new Date(c.classDate + 'T00:00:00'), day));
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

          return (
            <div 
              key={day.toString()} 
              className={`min-h-[120px] p-2 border-r border-b border-slate-800/50 transition-all ${!isSelectedMonth ? 'opacity-20' : ''} ${isToday ? 'bg-emerald-500/5' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold ${isToday ? 'bg-emerald-500 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-500'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayClasses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onSelectClass?.(c)}
                    className={`w-full text-left p-1.5 rounded-md text-[9px] font-bold uppercase transition-all truncate border ${
                      c.status === 'COMPLETED' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                        : 'bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {c.status === 'COMPLETED' ? <CheckCircle size={8} /> : <Clock size={8} />}
                      {c.startTime}
                    </div>
                    <div className="truncate opacity-80">{c.studentName?.split(' ')[0]}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
