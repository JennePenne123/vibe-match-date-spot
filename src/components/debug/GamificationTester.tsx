import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trophy, Calendar, Gift, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { 
  createGamificationTestData,
  createComprehensiveTestData,
  triggerCheckCompletedDates, 
  triggerCalculateRewards 
} from '@/services/testData/gamificationTestData';

export const GamificationTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleCreateTestData = async () => {
    setLoading(true);
    setResults(null);
    
    const result = await createGamificationTestData();
    setResults({ type: 'test-data', ...result });
    
    setLoading(false);
  };

  const handleCreateComprehensiveData = async () => {
    setLoading(true);
    setResults(null);
    
    const result = await createComprehensiveTestData();
    setResults({ type: 'comprehensive-data', ...result });
    
    setLoading(false);
  };

  const handleCheckCompletedDates = async () => {
    setLoading(true);
    setResults(null);
    
    const result = await triggerCheckCompletedDates();
    setResults({ type: 'check-completed', ...result });
    
    setLoading(false);
  };

  const handleCalculateRewards = async () => {
    setLoading(true);
    setResults(null);
    
    const result = await triggerCalculateRewards();
    setResults({ type: 'calculate-rewards', ...result });
    
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Gamification System Testing
        </CardTitle>
        <CardDescription>
          Test the complete gamification flow: create test dates, mark them completed, and award points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Data Setup */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Step 1A: Create Basic Test Data</h3>
          <Button
            onClick={handleCreateTestData}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Create Basic Test Data
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Creates 3 simple completed dates for basic testing
          </p>
        </div>

        {/* Comprehensive Test Data */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Step 1B: Create Comprehensive Test Data ⭐</h3>
          <Button
            onClick={handleCreateComprehensiveData}
            disabled={loading}
            className="w-full"
            variant="default"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Comprehensive Test Data
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Creates 25+ dates covering all badge scenarios: streaks, milestones, perfect pairs, speed bonuses
          </p>
        </div>

        {/* Check Completed Dates */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Step 2: Check Completed Dates</h3>
          <Button
            onClick={handleCheckCompletedDates}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Trigger Check Completed Dates
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Manually runs the edge function that marks past dates as completed
          </p>
        </div>

        {/* Calculate Rewards */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Step 3: Calculate Rewards</h3>
          <Button
            onClick={handleCalculateRewards}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Trigger Calculate Rewards
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Manually runs the edge function that awards bonuses for mutual ratings
          </p>
        </div>

        {/* Results Display */}
        {results && (
          <Alert variant={results.success ? "default" : "destructive"}>
            <div className="flex items-start gap-2">
              {results.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <AlertDescription className="font-semibold">
                  {results.type === 'test-data' && 'Test Data Creation'}
                  {results.type === 'check-completed' && 'Check Completed Dates'}
                  {results.type === 'calculate-rewards' && 'Calculate Rewards'}
                </AlertDescription>
                <AlertDescription>
                  {results.message || (results.success ? 'Success!' : 'Failed')}
                </AlertDescription>
                
                {/* Show detailed results */}
                {results.data && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(results.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                {/* Show test dates */}
                {results.testDates && results.testDates.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {results.testDates.map((date: any, idx: number) => (
                      <div key={idx} className="text-xs bg-muted/50 p-2 rounded">
                        <div>Partner: {date.partner}</div>
                        <div>Time: {date.hoursAgo} hours ago</div>
                        <div className="text-muted-foreground truncate">ID: {date.id}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show comprehensive data results */}
                {results.results && (
                  <div className="mt-2 space-y-2">
                    <div className="text-xs font-semibold">Test Data Summary:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-xs bg-muted/50 p-2 rounded">
                        <div className="font-medium">🔥 Streak Dates</div>
                        <div className="text-muted-foreground">{results.results.streakDates.length} dates</div>
                      </div>
                      <div className="text-xs bg-muted/50 p-2 rounded">
                        <div className="font-medium">📊 Milestone Dates</div>
                        <div className="text-muted-foreground">{results.results.milestoneDates.length} dates</div>
                      </div>
                      <div className="text-xs bg-muted/50 p-2 rounded">
                        <div className="font-medium">⭐ Perfect Pairs</div>
                        <div className="text-muted-foreground">{results.results.perfectPairDates.length} dates</div>
                      </div>
                      <div className="text-xs bg-muted/50 p-2 rounded">
                        <div className="font-medium">⚡ Speed Bonus</div>
                        <div className="text-muted-foreground">{results.results.speedBonusDates.length} dates</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total: {results.totalDates} test dates created
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
