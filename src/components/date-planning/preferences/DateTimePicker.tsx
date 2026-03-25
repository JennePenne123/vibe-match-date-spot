import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  selectedDate?: Date;
  selectedTime: string;
  initialProposedDate?: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

const DateTimePicker: React.FC<Props> = ({ selectedDate, selectedTime, initialProposedDate, onDateChange, onTimeChange }) => (
  <div className="space-y-3">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wann geht's los?</p>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Datum</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('w-full justify-start text-left font-normal h-10', !selectedDate && 'text-muted-foreground')}>
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate text-xs">{selectedDate ? format(selectedDate, 'dd.MM.yy') : 'Wählen'}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single" selected={selectedDate}
              onSelect={onDateChange}
              disabled={d => d < new Date()} initialFocus className="pointer-events-auto"
              defaultMonth={selectedDate || (initialProposedDate ? new Date(initialProposedDate) : undefined)}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Uhrzeit</label>
        <Select value={selectedTime} onValueChange={onTimeChange}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Wählen" /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => {
              const h = i.toString().padStart(2, '0');
              return <SelectItem key={`${h}:00`} value={`${h}:00`}>{h}:00</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);

export default DateTimePicker;
