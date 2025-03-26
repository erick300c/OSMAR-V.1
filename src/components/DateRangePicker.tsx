import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  onPeriodChange: (period: string) => void;
  selectedPeriod: string;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  onPeriodChange,
  selectedPeriod,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Fecha o calendário quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    
    // Se selecionou apenas uma data, não define automaticamente o fim do dia
    // Permite que o usuário selecione a segunda data
    onChange(dates);

    // Se selecionou as duas datas, define o fim do dia para a data final
    if (start && end) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      onChange([start, endOfDay]);
      
      // Fecha o calendário após selecionar o intervalo completo
      setTimeout(() => {
        setIsCalendarOpen(false);
      }, 300);
    }
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value;
    onPeriodChange(period);
    
    if (period === 'custom') {
      setIsCalendarOpen(true);
    } else {
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className={`flex gap-4 items-center relative ${className}`} ref={calendarRef}>
      <select
        value={selectedPeriod}
        onChange={handlePeriodChange}
        className="rounded-lg border-gray-300 shadow-sm px-4 py-2"
      >
        <option value="all">{t('dashboard.filters.allTime')}</option>
        <option value="daily">{t('dashboard.filters.daily')}</option>
        <option value="weekly">{t('dashboard.filters.weekly')}</option>
        <option value="monthly">{t('dashboard.filters.monthly')}</option>
        <option value="yearly">{t('dashboard.filters.yearly')}</option>
        <option value="custom">{t('dashboard.filters.custom')}</option>
      </select>

      {selectedPeriod === 'custom' && (
        <div className="flex items-center">
          <div 
            className="flex items-center bg-white rounded-lg shadow-sm p-2 cursor-pointer hover:bg-gray-50"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          >
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {startDate && endDate
                ? startDate.toLocaleDateString('pt-BR') === endDate.toLocaleDateString('pt-BR')
                  ? startDate.toLocaleDateString('pt-BR')
                  : `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`
                : startDate 
                  ? `${startDate.toLocaleDateString('pt-BR')} (${t('common.selectEndDate')})`
                  : t('common.selectDateRange')}
            </span>
          </div>

          {isCalendarOpen && (
            <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg shadow-lg p-4">
              <DatePicker
                selected={startDate}
                onChange={handleDateChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                inline
                maxDate={new Date()}
                locale="pt-BR"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
