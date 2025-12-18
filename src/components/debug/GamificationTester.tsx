import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Calendar, Gift, CheckCircle2, XCircle, Sparkles, PlayCircle } from 'lucide-react';
import { 
  createGamificationTestData,
  createComprehensiveTestData,
  triggerCheckCompletedDates, 
  triggerCalculateRewards,
  runFullGamificationTest,
  type TestRunResults
} from '@/services/testData/gamification';

export const GamificationTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [testRunResults, setTestRunResults] = useState<TestRunResults | null>(null);
  const [runningTest, setRunningTest] = useState(false);

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

  const handleRunFullTest = async () => {
    setRunningTest(true);
    setTestRunResults(null);
    setResults(null);
    
    try {
      const result = await runFullGamificationTest();
      setTestRunResults(result);
      setResults({
        type: 'full-test',
        success: result.overallSuccess,
        message: result.overallSuccess 
          ? '✅ All test phases completed successfully!' 
          : '⚠️ Some test phases had issues'
      });
    } catch (error) {
      setResults({
        type: 'full-test',
        success: false,
        message: `Failed to run full test: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    setRunningTest(false);
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
        {/* Automated Full Test */}
        <div className="space-y-2 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Automated Full Test Suite
          </h3>
          <Button
            onClick={handleRunFullTest}
            disabled={runningTest || loading}
            className="w-full"
            size="lg"
          >
            {runningTest ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Full Test Suite...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Run Full Test Suite (All 7 Phases)
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Automatically runs all test phases: Create data → Mark completed → Create feedback → Calculate rewards → Verify results → Test badges → Validate points
          </p>

          {/* Test Run Results */}
          {testRunResults && (
            <div className="space-y-4 mt-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-background">
                  <div className="text-2xl font-bold">{testRunResults.summary.totalDates}</div>
                  <div className="text-xs text-muted-foreground">Total Dates</div>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <div className="text-2xl font-bold">{testRunResults.summary.completedDates}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <div className="text-2xl font-bold">{testRunResults.summary.totalFeedback}</div>
                  <div className="text-xs text-muted-foreground">Feedback</div>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <div className="text-2xl font-bold">{testRunResults.summary.totalRewards}</div>
                  <div className="text-xs text-muted-foreground">Rewards</div>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <div className="text-2xl font-bold">{testRunResults.summary.usersWithPoints}</div>
                  <div className="text-xs text-muted-foreground">Users</div>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <div className="text-2xl font-bold">{testRunResults.summary.totalBadgesAwarded}</div>
                  <div className="text-xs text-muted-foreground">Badges</div>
                </div>
              </div>

              {/* Phase Results */}
              <div className="space-y-2">
                {testRunResults.phases.map((phase, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background">
                    <div className="flex items-center gap-3 flex-1">
                      {phase.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{phase.phase}</div>
                        <div className="text-xs text-muted-foreground truncate">{phase.message}</div>
                      </div>
                    </div>
                    {phase.duration && (
                      <Badge variant="outline" className="ml-2 flex-shrink-0">
                        {(phase.duration / 1000).toFixed(1)}s
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Duration */}
              <div className="text-center text-sm text-muted-foreground">
                Total test duration: {(testRunResults.totalDuration / 1000).toFixed(1)}s
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Manual Test Controls</h3>
        </div>

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
