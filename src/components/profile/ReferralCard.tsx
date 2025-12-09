import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Copy, Share2, Users, Gift, CheckCircle2, Clock } from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { REFERRAL_BADGES } from '@/services/referralService';

const ReferralCard: React.FC = () => {
  const { stats, loading, referralLink, copyReferralLink, copyReferralCode } = useReferral();
  const { toast } = useToast();

  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      toast({
        title: 'Link copied!',
        description: 'Share it with your friends to earn bonus points.',
      });
    } else {
      toast({
        title: 'Failed to copy',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = async () => {
    const success = await copyReferralCode();
    if (success) {
      toast({
        title: 'Code copied!',
        description: 'Share your referral code with friends.',
      });
    } else {
      toast({
        title: 'Failed to copy',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Find next badge milestone
  const getNextBadge = () => {
    const count = stats?.referralCount || 0;
    const badges = Object.values(REFERRAL_BADGES);
    return badges.find(b => b.threshold > count) || badges[badges.length - 1];
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const nextBadge = getNextBadge();
  const progress = nextBadge 
    ? Math.min(100, (stats.referralCount / nextBadge.threshold) * 100)
    : 100;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-card to-accent/5 border-border/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" />
            Referral Program
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {stats.referralPointsEarned} pts earned
          </Badge>
        </div>
        <CardDescription>
          Invite friends and earn rewards when they join
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Referral Code Display */}
        <div className="bg-background/80 rounded-lg p-4 border border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Your referral code</p>
          <div className="flex items-center justify-between">
            <code className="text-2xl font-mono font-bold tracking-wider text-primary">
              {stats.referralCode}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyCode}
              className="hover:bg-primary/10"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Share Button */}
        <Button 
          onClick={handleCopyLink} 
          className="w-full gap-2"
          variant="default"
        >
          <Share2 className="h-4 w-4" />
          Copy Referral Link
        </Button>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xl font-bold">{stats.referralCount}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xl font-bold">{stats.pendingReferrals}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold">{stats.completedReferrals}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Next Badge Progress */}
        {nextBadge && stats.referralCount < nextBadge.threshold && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Next badge: {nextBadge.icon} {nextBadge.name}
              </span>
              <span className="text-sm font-medium">
                {stats.referralCount}/{nextBadge.threshold}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Points Info */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Earn <span className="font-medium text-primary">25 pts</span> when friends sign up + 
            <span className="font-medium text-primary"> 50 pts</span> when they complete their first date!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
