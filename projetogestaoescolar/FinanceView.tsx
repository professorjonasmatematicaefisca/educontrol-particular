import React from 'react';
import { UserRole } from './types';
import { DollarSign } from 'lucide-react';

interface FinanceViewProps {
  userEmail: string;
  userRole: UserRole;
  onShowToast: (msg: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  userEmail,
  userRole,
  onShowToast
}) => {
  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-hidden relative">
      <div className="p-6 pb-24 lg:pb-6 flex-1 overflow-y-auto w-full">
        <div className="max-w-[1920px] mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <DollarSign className="text-emerald-400" size={28} />
                Gestão de Lançamentos
              </h2>
              <p className="text-gray-400 mt-1">Controle de receitas, despesas e relatórios financeiros (Fase 1 pronta).</p>
            </div>
          </div>

          <div className="bg-[#1a1936] rounded-xl border border-gray-800 p-8 flex items-center justify-center min-h-[400px]">
             <p className="text-gray-400">Em construção: Tabela de lançamentos e formulários...</p>
          </div>

        </div>
      </div>
    </div>
  );
};
