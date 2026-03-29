import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Copy, Check, Image, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ShareCard, { useShareCardCapture, type ShareCardData } from '@/components/share/ShareCardGenerator';

interface ShareDateButtonProps {
  title: string;
  message?: string;
  url?: string;
  venueName?: string;
  dateTime?: string;
  className?: string;
  variant?: 'default' | 'compact';
  shareCardData?: ShareCardData;
}

const ShareDateButton: React.FC<ShareDateButtonProps> = ({
  title,
  message,
  url,
  venueName,
  dateTime,
  className,
  variant = 'default',
  shareCardData
}) => {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { cardRef, generateImage } = useShareCardCapture();

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
    if (!navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      // Try sharing with image if share card data is available
      if (shareCardData) {
        setGenerating(true);
        const blob = await generateImage();
        setGenerating(false);

        if (blob && navigator.canShare?.({ files: [new File([blob], 'vybepulse-share.png', { type: 'image/png' })] })) {
          const file = new File([blob], 'vybepulse-share.png', { type: 'image/png' });
          await navigator.share({ title, text: shareText, url: shareUrl, files: [file] });
          return;
        }
      }

      await navigator.share({ title, text: shareText, url: shareUrl });
    } catch (e) {
      // User cancelled or share failed
    }
  };

  const handleDownloadCard = async () => {
    if (!shareCardData) return;
    setGenerating(true);
    const blob = await generateImage();
    setGenerating(false);

    if (!blob) {
      toast({ variant: 'destructive', title: 'Bild konnte nicht erstellt werden' });
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vybepulse-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Share-Card heruntergeladen! 🎨' });
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

  const shareMenuItems = (
    <>
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <DropdownMenuItem onClick={handleNativeShare} className="gap-2" disabled={generating}>
          <Share2 className="w-4 h-4" />
          {generating ? 'Wird erstellt...' : 'Teilen'}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={handleWhatsAppShare} className="gap-2">
        <MessageCircle className="w-4 h-4 text-green-600" />
        WhatsApp
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleTelegramShare} className="gap-2">
        <Share2 className="w-4 h-4 text-blue-500" />
        Telegram
      </DropdownMenuItem>
      {shareCardData && (
        <DropdownMenuItem onClick={handleDownloadCard} className="gap-2" disabled={generating}>
          <Download className="w-4 h-4" />
          {generating ? 'Wird erstellt...' : 'Share-Card speichern'}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
        {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Kopiert!' : 'Link kopieren'}
      </DropdownMenuItem>
    </>
  );

  return (
    <>
      {/* Hidden share card for capture */}
      {shareCardData && (
        <div className="fixed -left-[9999px] -top-[9999px]" aria-hidden="true">
          <div ref={cardRef}>
            <ShareCard data={shareCardData} />
          </div>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === 'compact' ? (
            <Button variant="ghost" size="icon-sm" className={className}>
              <Share2 className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" className={className}>
              <Share2 className="w-4 h-4 mr-1.5" />
              Teilen
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {shareMenuItems}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default ShareDateButton;
