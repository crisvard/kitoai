import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSchedulerAuth } from '../../contexts/SchedulerAuthContext';
import { Clock, Save, CheckCircle, Calendar, ChevronRight } from 'lucide-react';

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

interface WorkingHour {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  is_available: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

const INTERVALS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '60 minutos' }
];

export default function WorkingHoursManager() {
  const { user } = useSchedulerAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedInterval, setSelectedInterval] = useState<number>(30);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<'days' | 'hours' | 'manage'>('days');
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [configMode, setConfigMode] = useState<'single' | 'multiple'>('multiple');
  const [existingHours, setExistingHours] = useState<WorkingHour[]>([]);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    if (selectedProfessional && selectedDay !== null) {
      loadWorkingHours();
    }
  }, [selectedProfessional, selectedDay]);

  useEffect(() => {
    if (selectedProfessional) {
      loadExistingHours();
    }
  }, [selectedProfessional]);

  useEffect(() => {
    generateTimeSlots();
  }, [selectedInterval]);

  // Ensure working hours are loaded when entering hours tab
  useEffect(() => {
    if (activeTab === 'hours') {
      if (selectedProfessional && selectedDay !== null) {
        // Single mode - load working hours for the specific day
        loadWorkingHours();
      }
      // Always clear selections when entering hours tab in multiple mode
      if (configMode === 'multiple') {
        setSelectedSlots(new Set());
        setWorkingHours([]);
      }
    }
  }, [activeTab, selectedProfessional, selectedDay, configMode]);

  // Clear selections when changing tabs or modes
  useEffect(() => {
    if (activeTab !== 'hours') {
      setSelectedSlots(new Set());
    }
  }, [activeTab]);

  useEffect(() => {
    if (configMode === 'multiple') {
      // Clear all selections when switching to multiple mode
      setSelectedSlots(new Set());
      setWorkingHours([]); // Also clear working hours since no specific day is selected
    }
  }, [configMode]);

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, name, specialty')
        .eq('user_id', user?.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error loading professionals:', error);
    }
  };

  const loadWorkingHours = async () => {
    if (!selectedProfessional || selectedDay === null) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professional_working_hours')
        .select('*')
        .eq('professional_id', selectedProfessional)
        .eq('day_of_week', selectedDay)
        .eq('user_id', user?.id);

      if (error) throw error;

      setWorkingHours(data || []);
    } catch (error) {
      console.error('Error loading working hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingHours = async () => {
    if (!selectedProfessional) return;

    try {
      const { data, error } = await supabase
        .from('professional_working_hours')
        .select('*')
        .eq('professional_id', selectedProfessional)
        .eq('user_id', user?.id)
        .eq('is_available', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      setExistingHours(data || []);
      setSelectedForDeletion(new Set()); // Reset selection
    } catch (error) {
      console.error('Error loading existing hours:', error);
      setExistingHours([]);
    }
  };


  const generateTimeSlots = () => {
    const slots: string[] = [];
    const totalMinutes = 24 * 60;

    for (let minutes = 0; minutes < totalMinutes; minutes += selectedInterval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      const startTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      const endMinutes = minutes + selectedInterval;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      slots.push(`${startTime}-${endTime}`);
    }

    setAvailableSlots(slots);
  };

  const isSlotAlreadyConfigured = (slot: string) => {
    if (!selectedProfessional || selectedDay === null) return false;

    // Check if this slot is already configured for the selected professional and day
    return workingHours.some(hour => {
      // Remove seconds from database times (HH:MM:SS -> HH:MM)
      const startTime = hour.start_time.substring(0, 5); // "10:00:00" -> "10:00"
      const endTime = hour.end_time.substring(0, 5);     // "10:30:00" -> "10:30"
      const configuredSlot = `${startTime}-${endTime}`;
      return configuredSlot === slot && hour.is_available;
    });
  };

  const toggleSlotSelection = (slot: string) => {
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(slot)) {
      newSelected.delete(slot);
    } else {
      newSelected.add(slot);
    }
    setSelectedSlots(newSelected);
  };

  const toggleDaySelection = (day: number) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(day)) {
      newSelected.delete(day);
    } else {
      newSelected.add(day);
    }
    setSelectedDays(newSelected);
  };

  const toggleSelectAllDays = () => {
    if (selectedDays.size === 7) {
      setSelectedDays(new Set());
    } else {
      setSelectedDays(new Set([0, 1, 2, 3, 4, 5, 6]));
    }
  };

  const toggleHourForDeletion = (hourId: string) => {
    const newSelected = new Set(selectedForDeletion);
    if (newSelected.has(hourId)) {
      newSelected.delete(hourId);
    } else {
      newSelected.add(hourId);
    }
    setSelectedForDeletion(newSelected);
  };

  const toggleSelectAllForDeletion = () => {
    if (selectedForDeletion.size === existingHours.length) {
      setSelectedForDeletion(new Set());
    } else {
      const allIds = existingHours.map(hour => hour.id);
      setSelectedForDeletion(new Set(allIds));
    }
  };

  const deleteSelectedHours = async () => {
    if (selectedForDeletion.size === 0) return;

    try {
      setDeleting(true);

      for (const hourId of selectedForDeletion) {
        const { error } = await supabase
          .from('professional_working_hours')
          .delete()
          .eq('id', hourId)
          .eq('user_id', user?.id);

        if (error) throw error;
      }

      alert(`${selectedForDeletion.size} horário${selectedForDeletion.size > 1 ? 's' : ''} excluído${selectedForDeletion.size > 1 ? 's' : ''} com sucesso!`);

      // Reload data
      loadExistingHours();
      loadWorkingHours();
      setSelectedForDeletion(new Set());
    } catch (error) {
      console.error('Error deleting hours:', error);
      alert('Erro ao excluir horários. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const saveWorkingHours = async () => {
    if (!selectedProfessional) return;

    const daysToSave = configMode === 'single' ? [selectedDay] : Array.from(selectedDays);

    if (daysToSave.length === 0) {
      alert('Selecione pelo menos um dia da semana.');
      return;
    }

    try {
      setSaving(true);

      for (const day of daysToSave) {
        await supabase
          .from('professional_working_hours')
          .delete()
          .eq('professional_id', selectedProfessional)
          .eq('day_of_week', day)
          .eq('user_id', user?.id);
      }

      const workingHoursToInsert: any[] = [];
      for (const day of daysToSave) {
        Array.from(selectedSlots).forEach(slot => {
          const [startTime, endTime] = slot.split('-');
          workingHoursToInsert.push({
            professional_id: selectedProfessional,
            day_of_week: day,
            start_time: startTime,
            end_time: endTime,
            interval_minutes: selectedInterval,
            is_available: true,
            user_id: user?.id
          });
        });
      }

      if (workingHoursToInsert.length > 0) {
        const { error } = await supabase
          .from('professional_working_hours')
          .insert(workingHoursToInsert);

        if (error) throw error;
      }

      alert(`Horários salvos com sucesso para ${daysToSave.length} dia${daysToSave.length > 1 ? 's' : ''}!`);
      if (configMode === 'single') {
        loadWorkingHours();
      }
    } catch (error) {
      console.error('Error saving working hours:', error);
      alert('Erro ao salvar horários. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const formatSlot = (slot: string) => {
    const [startTime, endTime] = slot.split('-');
    return `${startTime} - ${endTime}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#c4d82e]/20 p-3 rounded-full">
          <Clock className="w-6 h-6 text-[#c4d82e]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Horários Disponíveis</h2>
          <p className="text-gray-400">Configure os horários de trabalho de cada profissional</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Profissional
          </label>
          <select
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#c4d82e] focus:ring-1 focus:ring-[#c4d82e]"
          >
            <option value="">Selecione um profissional</option>
            {professionals.map(professional => (
              <option key={professional.id} value={professional.id}>
                {professional.name} - {professional.specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Modo de Configuração
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setConfigMode('multiple')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                configMode === 'multiple'
                  ? 'bg-[#c4d82e] text-black'
                  : 'bg-[#2a2a2a] text-gray-300 hover:bg-gray-700'
              }`}
            >
              Múltiplos Dias
            </button>
            <button
              onClick={() => setConfigMode('single')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                configMode === 'single'
                  ? 'bg-[#c4d82e] text-black'
                  : 'bg-[#2a2a2a] text-gray-300 hover:bg-gray-700'
              }`}
            >
              Dia Individual
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex border-b border-gray-600">
            <button
              onClick={() => setActiveTab('days')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'days'
                  ? 'border-[#c4d82e] text-[#c4d82e]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Selecionar Dias
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'hours'
                  ? 'border-[#c4d82e] text-[#c4d82e]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              Configurar Horários
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'manage'
                  ? 'border-[#c4d82e] text-[#c4d82e]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              Gerenciar Horários
            </button>
          </div>
        </div>

        {activeTab === 'days' && configMode === 'multiple' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Selecione os Dias</h3>
              <button
                onClick={toggleSelectAllDays}
                className="px-4 py-2 bg-[#2a2a2a] hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
              >
                {selectedDays.size === 7 ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-hidden">
              {DAYS_OF_WEEK.map(day => (
                <label
                  key={day.value}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedDays.has(day.value)
                      ? 'bg-[#c4d82e]/20 border border-[#c4d82e]/50'
                      : 'bg-[#2a2a2a] border border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDays.has(day.value)}
                    onChange={() => toggleDaySelection(day.value)}
                    className="w-4 h-4 text-[#c4d82e] bg-gray-800 border-gray-600 rounded focus:ring-[#c4d82e] focus:ring-2"
                  />
                  <span className={`text-sm font-medium ${
                    selectedDays.has(day.value) ? 'text-[#c4d82e]' : 'text-gray-300'
                  }`}>
                    {day.label}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveTab('hours')}
                disabled={selectedDays.size === 0}
                className="px-6 py-3 bg-gradient-to-r from-[#c4d82e] to-[#b8d025] hover:from-[#b8d025] hover:to-[#c4d82e] text-black rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#c4d82e]/25 hover:shadow-[#c4d82e]/40 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo: Configurar Horários
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'days' && configMode === 'single' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Selecione o Dia</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-hidden">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    selectedDay === day.value
                      ? 'bg-[#c4d82e] text-black'
                      : 'bg-[#2a2a2a] text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveTab('hours')}
                className="px-6 py-3 bg-gradient-to-r from-[#c4d82e] to-[#b8d025] hover:from-[#b8d025] hover:to-[#c4d82e] text-black rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#c4d82e]/25 hover:shadow-[#c4d82e]/40 flex items-center gap-2"
              >
                Próximo: Configurar Horários
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Intervalo de Tempo
              </label>
              <select
                value={selectedInterval}
                onChange={(e) => setSelectedInterval(parseInt(e.target.value))}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#c4d82e] focus:ring-1 focus:ring-[#c4d82e]"
              >
                {INTERVALS.map(interval => (
                  <option key={interval.value} value={interval.value}>
                    {interval.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {configMode === 'multiple'
                    ? `Horários para ${selectedDays.size} dia${selectedDays.size > 1 ? 's' : ''} selecionado${selectedDays.size > 1 ? 's' : ''}`
                    : `Horários para ${DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label || 'Dia selecionado'}`
                  }
                </h3>
                <div className="text-sm text-gray-400">
                  Intervalo: {INTERVALS.find(i => i.value === selectedInterval)?.label}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {availableSlots.map(slot => {
                    const isAlreadyConfigured = configMode === 'single' && isSlotAlreadyConfigured(slot);
                    const isSelected = selectedSlots.has(slot);

                    return (
                      <button
                        key={slot}
                        onClick={() => !isAlreadyConfigured && toggleSlotSelection(slot)}
                        disabled={isAlreadyConfigured}
                        className={`
                          relative p-3 text-xs font-medium rounded-lg border transition-all transform
                          ${isAlreadyConfigured
                            ? 'bg-[#c4d82e]/20 border-[#c4d82e]/50 text-[#c4d82e] cursor-not-allowed opacity-75'
                            : isSelected
                              ? 'bg-gradient-to-r from-[#c4d82e] to-[#b8d025] text-black border-[#c4d82e] shadow-md hover:scale-105'
                              : 'bg-[#2a2a2a] text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500 hover:scale-105'
                          }
                        `}
                        title={isAlreadyConfigured ? 'Horário já configurado' : 'Clique para selecionar'}
                      >
                        <div className="text-center">
                          <div className="font-semibold">{formatSlot(slot)}</div>
                        </div>
                        {isAlreadyConfigured && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#c4d82e] rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-3 h-3 text-black" />
                          </div>
                        )}
                        {isSelected && !isAlreadyConfigured && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                            <CheckCircle className="w-3 h-3 text-[#c4d82e]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-6 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-[#c4d82e] to-[#b8d025] border border-[#c4d82e] rounded"></div>
                  <span>Selecionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#c4d82e]/20 border border-[#c4d82e]/50 rounded opacity-75"></div>
                  <span>Já Configurado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#2a2a2a] border border-gray-600 rounded"></div>
                  <span>Disponível</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setActiveTab('days')}
                className="px-6 py-3 bg-[#2a2a2a] hover:bg-gray-700 text-gray-300 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Voltar
              </button>
              <button
                onClick={saveWorkingHours}
                disabled={saving || !selectedProfessional || selectedSlots.size === 0}
                className="px-6 py-3 bg-gradient-to-r from-[#c4d82e] to-[#b8d025] hover:from-[#b8d025] hover:to-[#c4d82e] text-black rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#c4d82e]/25 hover:shadow-[#c4d82e]/40 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Horários
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Horários Configurados por Dia
              </h3>
              {existingHours.length > 0 && (
                <button
                  onClick={toggleSelectAllForDeletion}
                  className="px-4 py-2 bg-[#2a2a2a] hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  {selectedForDeletion.size === existingHours.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                </button>
              )}
            </div>

            {selectedProfessional ? (
              <div className="space-y-6">
                {DAYS_OF_WEEK.map(day => {
                  const dayHours = existingHours.filter(hour => hour.day_of_week === day.value);

                  return (
                    <div key={day.value} className="space-y-3">
                      <h4 className="text-md font-medium text-gray-300 border-b border-gray-600 pb-2">
                        {day.label}
                      </h4>

                      {dayHours.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {dayHours.map(hour => {
                            const slotKey = `${hour.start_time}-${hour.end_time}`;
                            return (
                              <button
                                key={hour.id}
                                onClick={() => toggleHourForDeletion(hour.id)}
                                className={`
                                  relative p-3 text-xs font-medium rounded-lg border transition-all transform hover:scale-105
                                  ${selectedForDeletion.has(hour.id)
                                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                    : 'bg-[#c4d82e]/20 border-[#c4d82e]/50 text-[#c4d82e]'
                                  }
                                `}
                              >
                                <div className="text-center">
                                  <div className="font-semibold">{formatSlot(slotKey)}</div>
                                </div>
                                {selectedForDeletion.has(hour.id) && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
                                    <CheckCircle className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Nenhum horário configurado
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex items-center gap-6 text-xs text-gray-400 pt-4 border-t border-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#c4d82e]/20 border border-[#c4d82e]/50 rounded"></div>
                    <span>Configurado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded"></div>
                    <span>Selecionado para Exclusão</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  Selecione um profissional para visualizar os horários configurados.
                </p>
              </div>
            )}

            {selectedForDeletion.size > 0 && (
              <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex-1">
                  <p className="text-red-400 font-medium">
                    {selectedForDeletion.size} horário{selectedForDeletion.size > 1 ? 's' : ''} selecionado{selectedForDeletion.size > 1 ? 's' : ''} para exclusão
                  </p>
                  <p className="text-sm text-red-300">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
                <button
                  onClick={deleteSelectedHours}
                  disabled={deleting}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Excluir Selecionados
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}