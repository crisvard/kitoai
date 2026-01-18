import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: Date;
  placeholder?: string;
  disabledDates?: string[]; // Array of YYYY-MM-DD dates that should be disabled
  hasAppointments?: Set<string>; // Set of YYYY-MM-DD dates that have appointments (for visual indication)
}

export default function DatePicker({ value, onChange, minDate, placeholder = "Selecione uma data", disabledDates = [], hasAppointments = new Set() }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);

  useEffect(() => {
    if (value) {
      // Parse date string as local date to avoid timezone issues
      const [year, month, day] = value.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateSelect = (date: Date) => {
    // Create a new date object to avoid timezone issues
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(selectedDate);
    onChange(selectedDate.toISOString().split('T')[0]); // Formato YYYY-MM-DD para o form
    setIsOpen(false);
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Adicionar dias do mês anterior para completar a primeira semana
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push(prevDate);
    }

    // Adicionar dias do mês atual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Adicionar dias do próximo mês para completar a última semana
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push(nextDate);
    }

    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    // Check if date is before minDate
    if (minDate) {
      const minDateOnly = new Date(minDate);
      minDateOnly.setHours(0, 0, 0, 0);
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      if (dateOnly < minDateOnly) {
        return true;
      }
    }

    // Check if date is in disabledDates array
    const dateString = date.toISOString().split('T')[0];
    return disabledDates.includes(dateString);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
        <input
          type="text"
          value={formatDate(selectedDate)}
          onClick={() => setIsOpen(!isOpen)}
          readOnly
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 cursor-pointer focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
        />
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl z-[10000] max-w-[320px] transform scale-95 origin-top-left">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-gray-600">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>

            <h3 className="text-sm font-semibold text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 p-2 pt-0">
            {getDaysInMonth(currentMonth).map((date, index) => {
              const disabled = isDateDisabled(date);
              const today = isToday(date);
              const selected = isSelected(date);
              const currentMonthDay = isCurrentMonth(date);
              const hasApts = hasAppointments.has(date.toISOString().split('T')[0]);

              return (
                <button
                  key={index}
                  onClick={() => !disabled && handleDateSelect(date)}
                  disabled={disabled}
                  className={`
                    h-8 w-8 text-xs font-medium rounded transition-all relative
                    ${selected
                      ? 'bg-[#c4d82e] text-black'
                      : today
                        ? 'bg-blue-600 text-white'
                        : currentMonthDay
                          ? disabled
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-white hover:bg-gray-700'
                          : 'text-gray-500'
                    }
                    ${!selected && !today && currentMonthDay && !disabled ? 'hover:bg-gray-700' : ''}
                  `}
                  title={hasApts && !disabled ? 'Este dia tem agendamentos' : disabled ? 'Data desabilitada' : ''}
                >
                  {date.getDate()}
                  {today && !selected && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-blue-400 rounded-full" />
                  )}
                  {hasApts && !selected && !today && (
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}