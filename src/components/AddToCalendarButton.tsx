import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarPlus, Download, ExternalLink } from 'lucide-react';
import {
  CalendarEvent,
  downloadICSFile,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
} from '@/utils/calendarExport';

interface AddToCalendarButtonProps {
  event: CalendarEvent;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({
  event,
  variant = 'outline',
  size = 'sm',
  className = '',
}) => {
  const { t } = useTranslation();

  const handleGoogle = () => {
    window.open(getGoogleCalendarUrl(event), '_blank', 'noopener');
  };

  const handleOutlook = () => {
    window.open(getOutlookCalendarUrl(event), '_blank', 'noopener');
  };

  const handleICS = () => {
    downloadICSFile(event);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`gap-1.5 ${className}`}>
          <CalendarPlus className="w-4 h-4" />
          {t('calendar.addToCalendar', 'Add to Calendar')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-52">
        <DropdownMenuItem onClick={handleGoogle} className="gap-2 cursor-pointer">
          <ExternalLink className="w-3.5 h-3.5" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlook} className="gap-2 cursor-pointer">
          <ExternalLink className="w-3.5 h-3.5" />
          Outlook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleICS} className="gap-2 cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          {t('calendar.downloadICS', 'Apple / .ics File')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToCalendarButton;
