
import React from 'react';

interface InvitationState {
  accepted: string[];
  declined: string[];
}

interface InvitationStatusProps {
  invitationState: InvitationState;
}

const InvitationStatus: React.FC<InvitationStatusProps> = ({ invitationState }) => {
  const { accepted, declined } = invitationState;
  const hasActivity = accepted.length > 0 || declined.length > 0;

  if (!hasActivity) return null;

  return (
    <div className="text-center text-sm text-gray-500 pt-4 space-y-1">
      {accepted.length > 0 && (
        <p className="text-green-600 flex items-center justify-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center">
            ✓
          </span>
          {accepted.length} invitation{accepted.length !== 1 ? 's' : ''} accepted
        </p>
      )}
      {declined.length > 0 && (
        <p className="text-red-600 flex items-center justify-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center">
            ✗
          </span>
          {declined.length} invitation{declined.length !== 1 ? 's' : ''} declined
        </p>
      )}
    </div>
  );
};

export default InvitationStatus;
