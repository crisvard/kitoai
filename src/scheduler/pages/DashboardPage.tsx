import { useState } from 'react';
import Stats from '../components/Dashboard/Stats';
import Calendar from '../components/Dashboard/Calendar';
import Charts from '../components/Dashboard/Charts';
import DayAppointments from '../components/Dashboard/DayAppointments';
import ReportsPage from './ReportsPage';
import ProfessionalsPage from './ProfessionalsPage';

interface Appointment {
  id: string;
  customer_name: string;
  appointment_date: string;
  status: string;
  price: number;
  professional_name?: string;
  service_name?: string;
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [showDayView, setShowDayView] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showProfessionals, setShowProfessionals] = useState(false);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayView(true);
  };

  const handleProfessionalFilter = (professionalId: string | null) => {
    setSelectedProfessional(professionalId);
    setShowDayView(true);
  };

  const handleCloseDayView = () => {
    setShowDayView(false);
    setSelectedDate(null);
    setSelectedProfessional(null);
  };

  const handleReportsClick = () => {
    setShowReports(true);
  };

  const handleBackToDashboard = () => {
    setShowReports(false);
    setShowProfessionals(false);
  };

  const handleProfessionalsClick = () => {
    setShowProfessionals(true);
  };

  if (showReports) {
    return (
      <div className="min-h-screen">
        <div className="mb-4 p-4 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border-b border-white/10">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            ← Voltar ao Dashboard
          </button>
        </div>
        <ReportsPage />
      </div>
    );
  }

  if (showProfessionals) {
    return (
      <div className="min-h-screen">
        <div className="mb-4 p-4 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border-b border-white/10">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            ← Voltar ao Dashboard
          </button>
        </div>
        <ProfessionalsPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Análise completa dos seus agendamentos</p>
        </div>

        {!showDayView ? (
          <>
            <Stats onReportsClick={handleReportsClick} onProfessionalsClick={handleProfessionalsClick} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Calendar
                onDateClick={handleDateClick}
                onProfessionalFilter={handleProfessionalFilter}
              />
              <Charts />
            </div>
          </>
        ) : (
          <DayAppointments
            selectedDate={selectedDate}
            selectedProfessional={selectedProfessional}
            onClose={handleCloseDayView}
            onAppointmentUpdate={() => {
              // Refresh data when appointments are updated
              setSelectedDate(null);
              setSelectedProfessional(null);
              setShowDayView(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
