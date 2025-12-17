import { DateInvitation } from '@/types/index';
import { LucideIcon } from 'lucide-react';

export interface DateInviteCardProps {
  invitation: DateInvitation;
  direction: 'received' | 'sent';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export interface StatusConfig {
  icon: LucideIcon;
  variant: 'default' | 'destructive' | 'secondary';
  bgGradient: string;
  textColor: string;
  borderColor: string;
  label: string;
}

export interface DisplayData {
  friendName: string;
  friendAvatar?: string;
  relationLabel: string;
  dateType: string;
  timeProposed: string;
  location: string;
  address: string;
  venueImage: string;
  message: string;
  venueName: string;
  venueAddress: string;
  time: string;
  duration: string;
  estimatedCost: string;
  specialNotes: string;
}
