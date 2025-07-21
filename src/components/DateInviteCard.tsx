
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Check, X, DollarSign, Calendar, Info } from 'lucide-react';

interface DateInvite {
  id: string; // Changed from number to string
  friendName: string;
  friendAvatar: string;
  dateType: string;
  location: string;
  time: string;
  message: string;
  status: string;
  venueName: string;
  venueAddress: string;
  estimatedCost: string;
  duration: string;
  specialNotes: string;
  venueImage: string;
}

interface DateInviteCardProps {
  invitation: DateInvite;
  onAccept: (id: string) => void; // Changed from number to string
  onDecline: (id: string) => void; // Changed from number to string
}

const DateInviteCard = ({ invitation, onAccept, onDecline }: DateInviteCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-pink-400 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12 border-2 border-pink-200">
                <AvatarImage src={invitation.friendAvatar} alt={invitation.friendName} />
                <AvatarFallback className="bg-pink-100 text-pink-600">
                  {invitation.friendName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {invitation.friendName}
                  </h3>
                  <Badge className="text-xs text-pink-600 font-medium bg-pink-100">
                    {invitation.dateType}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{invitation.message}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {invitation.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {invitation.location}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-pink-200">
              <AvatarImage src={invitation.friendAvatar} alt={invitation.friendName} />
              <AvatarFallback className="bg-pink-100 text-pink-600">
                {invitation.friendName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-gray-900">{invitation.friendName}</div>
              <div className="text-sm text-gray-600 font-normal">invited you to a date</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Venue Image */}
          <div className="relative rounded-lg overflow-hidden">
            <img 
              src={invitation.venueImage} 
              alt={invitation.venueName}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-3 left-3">
              <Badge className="bg-pink-500 text-white">
                {invitation.dateType}
              </Badge>
            </div>
          </div>

          {/* Message */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-700 italic">"{invitation.message}"</p>
          </div>

          {/* Venue Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">{invitation.venueName}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{invitation.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{invitation.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{invitation.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{invitation.estimatedCost}</span>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <strong>Address:</strong> {invitation.venueAddress}
            </div>

            {invitation.specialNotes && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">Special Notes</div>
                    <div className="text-sm text-blue-700">{invitation.specialNotes}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                console.log('🎯 ACCEPT BUTTON CLICKED - ID:', invitation.id);
                onAccept(invitation.id);
                setIsOpen(false);
              }}
              className="flex-1 bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept Date
            </Button>
            <Button
              onClick={() => {
                console.log('🎯 DECLINE BUTTON CLICKED - ID:', invitation.id);
                onDecline(invitation.id);
                setIsOpen(false);
              }}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateInviteCard;
