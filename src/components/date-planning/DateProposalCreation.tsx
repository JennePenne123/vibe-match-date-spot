import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Send } from 'lucide-react';
import { useDateProposals } from '@/hooks/useDateProposals';
import { useToast } from '@/hooks/use-toast';

interface DateProposalCreationProps {
  recipientId: string;
  recipientName: string;
  onProposalSent: () => void;
  onBack: () => void;
}

const DateProposalCreation: React.FC<DateProposalCreationProps> = ({
  recipientId,
  recipientName,
  onProposalSent,
  onBack
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  
  const { createProposal, loading } = useDateProposals();
  const { toast } = useToast();

  const handleSubmit = async () => {
    
    if (!title || !proposedDate || !proposedTime) {
      toast({
        title: t('dateProposal.missingInfo'),
        description: t('dateProposal.fillRequired'),
        variant: "destructive"
      });
      return;
    }

    try {
      const dateTime = new Date(`${proposedDate}T${proposedTime}`);
      const proposal = await createProposal(recipientId, dateTime, title, message);
      
      if (proposal) {
        toast({
          title: t('dateProposal.proposalSent'),
          description: t('dateProposal.proposalSentTo', { name: recipientName }),
          variant: "default"
        });
        onProposalSent();
      }
    } catch (error) {
      console.error('[DateProposalCreation] Error sending proposal:', error);
      toast({
        title: 'Fehler',
        description: 'Proposal konnte nicht gesendet werden. Bitte versuche es erneut.',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('dateProposal.title')}</h2>
        <p className="text-muted-foreground">
          {t('dateProposal.subtitle', { name: recipientName })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('dateProposal.details')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleSubmit();
            }}
          >
            <div>
              <Label htmlFor="title">{t('dateProposal.dateTitle')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('dateProposal.titlePlaceholder')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">{t('dateProposal.proposedDate')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">{t('dateProposal.proposedTime')}</Label>
                <Input
                  id="time"
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">{t('dateProposal.messageLabel')}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('dateProposal.messagePlaceholder')}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                {t('common.back')}
              </Button>
              <Button
                type="button"
                disabled={loading}
                className="flex-1"
                onClick={() => {
                  void handleSubmit();
                }}
              >
                {loading ? (
                  t('dateProposal.sending')
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('dateProposal.sendProposal')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DateProposalCreation;
