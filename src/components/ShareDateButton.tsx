// ============= Full file contents =============
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Copy, Check, Download, Link2, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { cardRef, generateImage } = useShareCardCapture();

  // Deep link to the venue detail page – fallback to current page
  const shareUrl = url || window.location.origin;
  const displayUrl = shareUrl.replace(/^https?:\/\//, '');

  const shareText = message || [
    `🎉 ${title}`,
    venueName && `📍 ${venueName}`,
    dateTime && `📅 ${dateTime}`,
    '',
    'Geplant mit H!Outz – der smartesten Date-App! 💜',
    shareUrl
  ].filter(Boolean).join('\n');

  const safeOpen = (targetUrl: string, label: string) => {
    const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      toast.error(t('shareSheet.popupBlocked', { label }), {
        description: t('shareSheet.linkCopiedInstead'),
      });
      navigator.clipboard.writeText(shareUrl).catch(() => {});
      setOpen(false);
    }
  };

  const handleWhatsAppShare = () => {
    safeOpen(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, 'WhatsApp');
    setOpen(false);
  };

  const handleTelegramShare = () => {
    safeOpen(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, 'Telegram');
    setOpen(false);
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

        if (blob && navigator.canShare?.({ files: [new File([blob], 'hioutz-share.png', { type: 'image/png' })] })) {
          const file = new File([blob], 'hioutz-share.png', { type: 'image/png' });
          await navigator.share({ title, text: shareText, url: shareUrl, files: [file] });
          setOpen(false);
          return;
        }
      }

      await navigator.share({ title, text: shareText, url: shareUrl });
      setOpen(false);
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
      toast.error(t('shareSheet.cardFailed'));
      return;
    }

    const cardUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = `hioutz-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(cardUrl);
    toast.success(t('shareSheet.cardDownloaded'));
    setOpen(false);
  };

  // Copies ONLY the deep link so friends can paste & open it instantly
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('shareSheet.copiedToast'), {
        description: t('shareSheet.copiedToastDesc'),
      });
      setTimeout(() => setCopied(false), 2000);
      setOpen(false);
    } catch {
      toast.error(t('shareSheet.copyFailed'));
    }
  };

  const shareOptions = [
    ...(typeof navigator !== 'undefined' && 'share' in navigator ? [{
      key: 'native',
      icon: <Smartphone className="w-5 h-5" />,
      label: generating ? t('shareSheet.generating') : t('shareSheet.nativeShare'),
      onClick: handleNativeShare,
      disabled: generating,
    }] : []),
    {
      key: 'whatsapp',
      icon: <MessageCircle className="w-5 h-5 text-green-600" />,
      label: 'WhatsApp',
      onClick: handleWhatsAppShare,
      disabled: false,
    },
    {
      key: 'telegram',
      icon: <Share2 className="w-5 h-5 text-sky-500" />,
      label: 'Telegram',
      onClick: handleTelegramShare,
      disabled: false,
    },
    ...(shareCardData ? [{
      key: 'card',
      icon: <Download className="w-5 h-5" />,
      label: generating ? t('shareSheet.generating') : t('shareSheet.saveCard'),
      onClick: handleDownloadCard,
      disabled: generating,
    }] : []),
  ];

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

      <Sheet open={open} onOpenChange={setOpen}>
        {variant === 'compact' ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('shareSheet.title')}
            className={className}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={className}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            {t('shareSheet.title')}
          </Button>
        )}
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border border-white/10 bg-card/95 backdrop-blur-xl px-5 pb-8 pt-2 max-w-md mx-auto"
        >
          <SheetHeader className="text-left space-y-1 pb-2">
            <SheetTitle className="text-lg font-semibold flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              {t('shareSheet.title')}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {venueName || title}
            </SheetDescription>
          </SheetHeader>

          {/* Deep link row – copy for instant friend access */}
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label={copied ? t('shareSheet.copied') : t('shareSheet.copyLink')}
            className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-background/60 px-4 py-3 text-left transition-all duration-300 hover:bg-background/80 hover:border-primary/40 active:scale-[0.98] mb-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-medium text-foreground">
                {copied ? t('shareSheet.copied') : t('shareSheet.copyLink')}
              </span>
              <span className="block text-xs text-muted-foreground truncate">
                {displayUrl}
              </span>
            </span>
            <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>

          {/* Share targets */}
          <div className="grid grid-cols-3 gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={option.onClick}
                disabled={option.disabled}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-background/60 px-2 py-4 transition-all duration-300 hover:bg-background/80 hover:border-primary/40 active:scale-[0.98] disabled:opacity-50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background border border-white/10">
                  {option.icon}
                </span>
                <span className="text-xs font-medium text-foreground text-center leading-tight">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ShareDateButton;
