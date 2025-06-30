"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, X } from "lucide-react";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DatePicker({ date, onDateChange, placeholder = "Wybierz datę" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);

  const handleDateSelect = (dateString: string) => {
    const newDate = new Date(dateString);
    setSelectedDate(newDate);
    onDateChange(newDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    onDateChange(undefined);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL');
  };

  const getCurrentMonthDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day));
    }
    return dates;
  };

  const getNextMonthDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day));
    }
    return dates;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    return date < today;
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 min-w-[100px] justify-start h-6 text-xs"
        >
          <Calendar className="w-3 h-3" />
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </Button>
        {selectedDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 h-6 w-6"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3 min-w-[260px]">
          <div className="space-y-3">
            {/* Bieżący miesiąc */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
                {new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(day => (
                  <div key={day} className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                    {day}
                  </div>
                ))}
                {getCurrentMonthDates().map((date, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDateSelect(date.toISOString().split('T')[0])}
                    disabled={isPast(date)}
                    className={`
                      h-6 w-6 p-0 text-xs
                      ${isToday(date) ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                      ${isSelected(date) ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                      ${isPast(date) ? 'text-gray-400 dark:text-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                    `}
                  >
                    {date.getDate()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Następny miesiąc */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
                {new Date(new Date().getFullYear(), new Date().getMonth() + 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(day => (
                  <div key={day} className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                    {day}
                  </div>
                ))}
                {getNextMonthDates().map((date, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDateSelect(date.toISOString().split('T')[0])}
                    className={`
                      h-6 w-6 p-0 text-xs
                      ${isSelected(date) ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                      hover:bg-gray-100 dark:hover:bg-gray-700
                    `}
                  >
                    {date.getDate()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Szybkie opcje */}
            <div className="border-t pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleDateSelect(tomorrow.toISOString().split('T')[0]);
                  }}
                  className="text-xs h-6"
                >
                  Jutro
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    handleDateSelect(nextWeek.toISOString().split('T')[0]);
                  }}
                  className="text-xs h-6"
                >
                  Za tydzień
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 