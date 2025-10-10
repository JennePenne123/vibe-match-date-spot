import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Play } from 'lucide-react';
import { DateRatingModal } from '@/components/rating/DateRatingModal';
import { DateRatingPrompt } from '@/components/DateRatingPrompt';
import { PendingRatingsCard } from '@/components/home/PendingRatingsCard';

const RatingDemo: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            Date Rating System Demo
          </h1>
          <p className="text-muted-foreground">
            Test the new gamified date rating system with multi-step feedback
          </p>
        </div>

        {/* Quick Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Modal Demo</CardTitle>
            <CardDescription>
              Open the rating modal to see all 5 steps and points calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setModalOpen(true)}
              size="lg"
              className="w-full gap-2"
            >
              <Play className="h-5 w-5" />
              Open Rating Modal
            </Button>
          </CardContent>
        </Card>

        {/* Pending Ratings Card Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Ratings Widget</CardTitle>
            <CardDescription>
              This card will appear on the home page when users have completed dates to rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PendingRatingsCard />
          </CardContent>
        </Card>

        {/* Rating Prompt Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Prompt Component</CardTitle>
            <CardDescription>
              This appears for individual completed dates in the invitations section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DateRatingPrompt
              invitationId="demo-invitation-id"
              onRatingComplete={() => console.log('Rating completed!')}
            />
          </CardContent>
        </Card>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle>System Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">🎯 Rating Steps</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Overall experience with sentiment</li>
                  <li>Venue-specific rating with tags</li>
                  <li>AI accuracy rating (optional)</li>
                  <li>Detailed feedback text (optional)</li>
                  <li>Recommendations (optional)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">🏆 Gamification</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>10 pts: Basic rating</li>
                  <li>+5 pts: AI accuracy bonus</li>
                  <li>+10 pts: Detailed feedback</li>
                  <li>+15 pts: Complete all questions</li>
                  <li>+5 pts: Speed bonus (24h)</li>
                  <li>+20 pts: Both partners rate</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">✨ User Experience</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Progress bar with step indicator</li>
                  <li>Real-time points preview</li>
                  <li>Smooth animations between steps</li>
                  <li>Skip options for optional steps</li>
                  <li>Visual feedback indicators</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">📊 Data Collection</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Overall & venue ratings</li>
                  <li>AI accuracy metrics</li>
                  <li>Qualitative feedback text</li>
                  <li>Recommendation indicators</li>
                  <li>Streak & timing tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Home Page</h4>
              <p className="text-sm text-muted-foreground">
                Add <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;PendingRatingsCard /&gt;</code> to show pending ratings
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Invitations Page</h4>
              <p className="text-sm text-muted-foreground">
                Add <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;DateRatingPrompt /&gt;</code> for completed dates
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Profile Page</h4>
              <p className="text-sm text-muted-foreground">
                Display points, badges, and streak using data from <code className="bg-muted px-1 py-0.5 rounded text-xs">user_points</code> table
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Modal */}
      <DateRatingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        invitationId="demo-invitation-id"
        partnerName="Alex Johnson"
        venueName="Il Siciliano"
        onSuccess={() => {
          console.log('Demo rating submitted!');
        }}
      />
    </div>
  );
};

export default RatingDemo;
