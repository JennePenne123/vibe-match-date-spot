import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Play, CheckCircle, XCircle, Clock, Loader2, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  runAILearningTest, 
  testSingleFeedback, 
  AILearningTestResults, 
  TestPhaseResult 
} from '@/services/testData/aiLearningTestData';
import { getUserLearningData, getUserPreferenceVectors } from '@/services/aiLearningService';

export const AILearningTester: React.FC = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<AILearningTestResults | null>(null);
  const [singleResult, setSingleResult] = useState<TestPhaseResult | null>(null);
  const [learningData, setLearningData] = useState<unknown[] | null>(null);
  const [preferenceVectors, setPreferenceVectors] = useState<unknown | null>(null);

  const runFullTest = async () => {
    if (!user?.id) return;
    setIsRunning(true);
    setResults(null);
    setSingleResult(null);
    
    try {
      const testResults = await runAILearningTest(user.id);
      setResults(testResults);
      console.log('🧪 AI Learning Test Results:', testResults);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleTest = async () => {
    if (!user?.id) return;
    setIsRunning(true);
    setSingleResult(null);
    
    try {
      const result = await testSingleFeedback(user.id);
      setSingleResult(result);
      console.log('🧪 Single Feedback Test:', result);
    } catch (error) {
      console.error('Single test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const viewLearningData = async () => {
    if (!user?.id) return;
    setIsRunning(true);
    
    try {
      const [data, vectors] = await Promise.all([
        getUserLearningData(user.id),
        getUserPreferenceVectors(user.id)
      ]);
      setLearningData(data);
      setPreferenceVectors(vectors);
      console.log('📊 Learning Data:', data);
      console.log('📊 Preference Vectors:', vectors);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsRunning(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Please log in to test AI learning pipeline
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Test Controls */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={runFullTest} disabled={isRunning} className="gap-2">
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Full Test Suite
        </Button>
        <Button onClick={runSingleTest} disabled={isRunning} variant="outline" className="gap-2">
          <Zap className="h-4 w-4" />
          Test Single Feedback
        </Button>
        <Button onClick={viewLearningData} disabled={isRunning} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          View Current Data
        </Button>
      </div>

      {/* Full Test Results */}
      {results && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Test Results
              </span>
              <Badge variant={results.overallSuccess ? 'default' : 'destructive'}>
                {results.overallSuccess ? 'PASSED' : 'FAILED'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phase Results */}
            <div className="space-y-2">
              {results.phases.map((phase, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {phase.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{phase.phase}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {phase.duration}ms
                      </span>
                    </div>
                    <p className="text-muted-foreground truncate">{phase.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Entries Created</p>
                <p className="font-semibold">{results.summary.entriesCreated}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Entries Verified</p>
                <p className="font-semibold">{results.summary.entriesVerified}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vectors Updated</p>
                <p className="font-semibold">{results.summary.vectorsUpdated ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Accuracy Change</p>
                <p className="font-semibold">{results.summary.accuracyImprovement}</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Total duration: {results.totalDuration}ms
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Test Result */}
      {singleResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Single Feedback Test</span>
              <Badge variant={singleResult.success ? 'default' : 'destructive'}>
                {singleResult.success ? 'SUCCESS' : 'FAILED'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{singleResult.message}</p>
            <p className="text-xs text-muted-foreground mt-2">Duration: {singleResult.duration}ms</p>
            {singleResult.data && (
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(singleResult.data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Learning Data */}
      {learningData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Current Learning Data ({learningData.length} entries)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(learningData.slice(0, 5), null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Preference Vectors */}
      {preferenceVectors && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Preference Vectors</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(preferenceVectors, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
