import React, { useState } from 'react';
import { XCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScheduledClass, BankAccount } from './types';

interface FinancialReportModalProps {
  onClose: () => void;
  classes: ScheduledClass[];
  bankAccounts: BankAccount[];
}

export const FinancialReportModal: React.FC<FinancialReportModalProps> = ({ onClose, classes, bankAccounts }) => {
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [filterStudent, setFilterStudent] = useState('');

  const generatePDF = () => {
    let filtered = classes;

    if (filterStartDate) {
      filtered = filtered.filter(c => (c.classDate || c.paymentDueDate || '') >= filterStartDate);
    }
    if (filterEndDate) {
      filtered = filtered.filter(c => (c.classDate || c.paymentDueDate || '') <= filterEndDate);
    }
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(c => c.paymentStatus === filterStatus);
    }
    if (filterAccount !== 'ALL') {
      filtered = filtered.filter(c => c.paymentAccountId === filterAccount);
    }
    if (filterStudent.trim() !== '') {
      filtered = filtered.filter(c => c.studentName?.toLowerCase().includes(filterStudent.toLowerCase()));
    }

    filtered.sort((a, b) => {
      const dateA = a.paidAt || a.paymentDueDate || a.classDate || '';
      const dateB = b.paidAt || b.paymentDueDate || b.classDate || '';
      return dateB.localeCompare(dateA);
    });

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text('Relatório Financeiro', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);
    
    let filtersText = [];
    if (filterStartDate || filterEndDate) filtersText.push(`Período: ${filterStartDate ? new Date(filterStartDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'} até ${filterEndDate ? new Date(filterEndDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Fim'}`);
    if (filterStatus !== 'ALL') filtersText.push(`Status: ${filterStatus === 'PAID' ? 'Recebido' : 'Pendente'}`);
    if (filterAccount !== 'ALL') {
      const acc = bankAccounts.find(a => a.id === filterAccount);
      if (acc) filtersText.push(`Conta: ${acc.name}`);
    }
    if (filterStudent.trim() !== '') filtersText.push(`Aluno: ${filterStudent}`);
    
    if (filtersText.length > 0) {
      doc.text(`Filtros: ${filtersText.join(' | ')}`, 14, 36);
    }

    const tableData: any[][] = filtered.map(c => [
      c.studentName || '-',
      c.disciplineName || 'Aula Particular',
      new Date(c.classDate + 'T00:00:00').toLocaleDateString('pt-BR'),
      c.paymentDueDate ? new Date(c.paymentDueDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
      c.paymentStatus === 'PAID' ? (c.paidAt ? new Date(c.paidAt + 'T00:00:00').toLocaleDateString('pt-BR') : '-') : 'Pendente',
      (c.paymentStatus === 'PAID' && c.paymentAccountId) ? (bankAccounts.find(a => a.id === c.paymentAccountId)?.name || '-') : '-',
      `R$ ${(c.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    const totalValue = filtered.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
    const totalPaid = filtered.filter(c => c.paymentStatus === 'PAID').reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
    const totalPending = filtered.filter(c => c.paymentStatus === 'PENDING').reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

    tableData.push([
      { content: 'TOTAIS', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', textColor: [16, 185, 129] } }
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Aluno', 'Disciplina', 'Aula', 'Vencimento', 'Pagamento/Status', 'Conta', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 6: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 45;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Recebido: R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, finalY + 15);
    doc.text(`Total Pendente: R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, finalY + 22);

    doc.save(`relatorio-financeiro-${Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <div className="bg-[#0f172a] w-full max-w-xl rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight flex items-center gap-2">
              <Download size={20} className="text-emerald-500" />
              Relatório Financeiro
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Filtre os dados para gerar o PDF</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Data Inicial</label>
              <input 
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-emerald-500 transition-colors outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Data Final</label>
              <input 
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-emerald-500 transition-colors outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status</label>
              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-emerald-500 transition-colors outline-none"
              >
                <option value="ALL">Todos</option>
                <option value="PENDING">Pendentes</option>
                <option value="PAID">Recebidos</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Conta Bancária</label>
              <select 
                value={filterAccount}
                onChange={e => setFilterAccount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-emerald-500 transition-colors outline-none"
              >
                <option value="ALL">Todas as Contas</option>
                {bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Aluno (opcional)</label>
            <input 
              type="text"
              placeholder="Ex: João da Silva"
              value={filterStudent}
              onChange={e => setFilterStudent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-emerald-500 transition-colors outline-none"
            />
          </div>
        </div>

        <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => { generatePDF(); onClose(); }}
            className="px-6 py-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
          >
            <Download size={14} />
            Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
};
