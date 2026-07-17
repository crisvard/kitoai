import { useState } from 'react';
import { useScheduler } from '../contexts/SchedulerContext';
import CustomersManager from '../components/Settings/CustomersManager';

export default function CustomersPage() {
  const { setCurrentView } = useScheduler();

  const handleNavigateToAppointments = (customer: any) => {
    // Save customer data to sessionStorage for AppointmentsPage to pick up
    sessionStorage.setItem('prefillCustomer', JSON.stringify(customer));
    // Navigate to appointments view
    setCurrentView('appointments');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Clientes</h1>
          <p className="text-gray-400">Gerencie seus clientes e seus pacotes</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6">
            <CustomersManager onNavigateToAppointments={handleNavigateToAppointments} />
          </div>
        </div>
      </div>
    </div>
  );
}