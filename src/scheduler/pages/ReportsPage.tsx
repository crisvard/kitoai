import { useState, useEffect } from 'react';
import { useSchedulerAuth } from '../contexts/SchedulerAuthContext';
import CommissionDetailedReports from '../components/Reports/CommissionDetailedReports';
import CombinedReports from '../components/Reports/CombinedReports';

type ReportView = 'commissions_detailed' | 'combined_reports';

export default function ReportsPage() {
  const { user } = useSchedulerAuth();
  const [selectedView, setSelectedView] = useState<ReportView>('commissions_detailed');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadReportData();
  }, [user, selectedView]);


  const loadReportData = async () => {
    // No data loading needed for commissions_detailed view
    setLoading(false);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Relatórios de Vendas</h1>
        <p className="text-gray-400">Análise detalhada de pacotes e serviços</p>
      </div>

      {/* View Tabs */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-4 mb-8">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedView('commissions_detailed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              selectedView === 'commissions_detailed'
                ? 'bg-[#c4d82e] text-black shadow-lg shadow-[#c4d82e]/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:shadow-md hover:shadow-white/20'
            }`}
          >
            Comissões Detalhadas
          </button>
          <button
            onClick={() => setSelectedView('combined_reports')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              selectedView === 'combined_reports'
                ? 'bg-[#c4d82e] text-black shadow-lg shadow-[#c4d82e]/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:shadow-md hover:shadow-white/20'
            }`}
          >
            Relatório Consolidado
          </button>
        </div>
      </div>





      {selectedView === 'commissions_detailed' && (
        <CommissionDetailedReports />
      )}

      {selectedView === 'combined_reports' && (
        <CombinedReports />
      )}


    </div>
  );
}