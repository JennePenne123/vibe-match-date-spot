import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShareDateButtonProps {
  title: string;
  message?: string;
  url?: string;
  venueName?: string;
  dateTime?: string;
  className?: string;
  variant?: 'default' | 'compact';
}

const ShareDateButton: React.FC<ShareDateButtonProps> = ({
  title,
  message,
  url,
  venueName,
  dateTime,
  className,
  variant = 'default'
}) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.origin;
  
  const shareText = message || [
    `🎉 ${title}`,
    venueName && `📍 ${venueName}`,
    dateTime && `📅 ${dateTime}`,
    '',
    'Geplant mit VybePulse – der smartesten Date-App! 💜',
    shareUrl
  ].filter(Boolean).join('\n');

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleTelegramShare = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } catch (e) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: 'Link kopiert! 📋', description: 'Du kannst ihn jetzt teilen.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Kopieren fehlgeschlagen' });
    }
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className={className}>
            <Share2 className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleWhatsAppShare} className="gap-2">
            <MessageCircle className="w-4 h-4 text-green-600" />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTelegramShare} className="gap-2">
            <Share2 className="w-4 h-4 text-blue-500" />
            Telegram
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Kopiert!' : 'Link kopieren'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="w-4 h-4 mr-1.5" />
          Teilen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={handleWhatsAppShare} className="gap-2">
          <MessageCircle className="w-4 h-4 text-green-600" />
          Via WhatsApp teilen
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTelegramShare} className="gap-2">
          <Share2 className="w-4 h-4 text-blue-500" />
          Via Telegram teilen
        </DropdownMenuItem>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem onClick={handleNativeShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            Mehr Optionen...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Kopiert!' : 'Link kopieren'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareDateButton;
