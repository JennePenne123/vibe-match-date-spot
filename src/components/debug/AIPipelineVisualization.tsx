import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Play, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight,
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Circle,
  SkipForward,
  Workflow,
  Clock,
  DollarSign,
  Database
} from 'lucide-react';
import { usePipelineVisualization, PipelineStage, PipelineStatus } from '@/hooks/usePipelineVisualization';
import { useAuth } from '@/contexts/AuthContext';

const StatusIcon: React.FC<{ status: PipelineStatus }> = ({ status }) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'loading':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case 'skipped':
      return <SkipForward className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

const StatusBadge: React.FC<{ status: PipelineStatus }> = ({ status }) => {
  const variants: Record<PipelineStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    idle: 'outline',
    loading: 'default',
    success: 'secondary',
    error: 'destructive',
    skipped: 'outline'
  };

  return (
    <Badge variant={variants[status]} className="text-xs">
      {status}
    </Badge>
  );
};

const StageCard: React.FC<{ stage: PipelineStage }> = ({ stage }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`
      border rounded-lg p-3 transition-colors
      ${stage.status === 'success' ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' : ''}
      ${stage.status === 'error' ? 'border-destructive/30 bg-destructive/5' : ''}
      ${stage.status === 'loading' ? 'border-primary/30 bg-primary/5' : ''}
      ${stage.status === 'idle' || stage.status === 'skipped' ? 'border-muted' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon status={stage.status} />
          <span className="font-medium text-sm">{stage.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {stage.duration && (
            <span className="text-xs text-muted-foreground">
              {stage.duration}ms
            </span>
          )}
          <StatusBadge status={stage.status} />
        </div>
      </div>

      {(stage.data || stage.error) && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-2 h-6 text-xs">
              {isOpen ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
              Details
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="text-xs bg-muted/50 rounded p-2 font-mono overflow-x-auto">
              {stage.error ? (
                <span className="text-destructive">{stage.error}</span>
              ) : (
                <pre>{JSON.stringify(stage.data, null, 2)}</pre>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

const PipelineFlowDiagram: React.FC<{ stages: PipelineStage[] }> = ({ stages }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 justify-center py-4">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div className={`
            px-3 py-1.5 rounded-full text-xs font-medium
            ${stage.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
            ${stage.status === 'error' ? 'bg-destructive/20 text-destructive' : ''}
            ${stage.status === 'loading' ? 'bg-primary/20 text-primary animate-pulse' : ''}
            ${stage.status === 'idle' ? 'bg-muted text-muted-foreground' : ''}
            ${stage.status === 'skipped' ? 'bg-muted/50 text-muted-foreground line-through' : ''}
          `}>
            {stage.name.split(' ')[0]}
          </div>
          {index < stages.length - 1 && (
            <span className="text-muted-foreground">→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export const AIPipelineVisualization: React.FC = () => {
  const { user } = useAuth();
  const { stages, isRunning, metrics, runPipeline, resetPipeline } = usePipelineVisualization();
  const [showArchitecture, setShowArchitecture] = useState(false);

  const handleRunPipeline = async () => {
    if (!user?.id) {
      console.error('No user logged in');
      return;
    }
    
    await runPipeline(user.id, undefined, undefined);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Workflow className="h-5 w-5" />
          AI Recommendation Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flow Diagram */}
        <PipelineFlowDiagram stages={stages} />

        {/* Metrics Summary */}
        {metrics.totalDuration > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics.totalDuration}ms</div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Database className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics.apiCalls}</div>
              <div className="text-xs text-muted-foreground">API Calls</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics.cacheHits}</div>
              <div className="text-xs text-muted-foreground">Cache Hits</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">${metrics.estimatedCost.toFixed(3)}</div>
              <div className="text-xs text-muted-foreground">Est. Cost</div>
            </div>
          </div>
        )}

        {/* Stage Details */}
        <div className="space-y-2">
          {stages.map(stage => (
            <StageCard key={stage.id} stage={stage} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleRunPipeline} 
            disabled={isRunning || !user?.id}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Pipeline
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={resetPipeline}
            disabled={isRunning}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Architecture Diagram Toggle */}
        <Collapsible open={showArchitecture} onOpenChange={setShowArchitecture}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full text-sm">
              {showArchitecture ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              View Architecture Diagram
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="bg-muted/30 rounded-lg p-4 text-xs font-mono overflow-x-auto">
              <pre className="text-muted-foreground whitespace-pre-wrap">
{`┌─────────────────────────────────────────────────────────────┐
│                 AI RECOMMENDATION PIPELINE                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌─────────────────┐    ┌────────────┐  │
│  │    User      │───→│   Preferences   │───→│  Location  │  │
│  │  Preferences │    │   Validation    │    │ Resolution │  │
│  └──────────────┘    └─────────────────┘    └────────────┘  │
│                              │                      │        │
│                              ▼                      ▼        │
│                    ┌─────────────────┐    ┌────────────────┐│
│                    │  Compatibility  │    │  Venue Search  ││
│                    │   Analysis (AI) │    │ (Multi-Source) ││
│                    └─────────────────┘    └────────────────┘│
│                              │                      │        │
│                              │     ┌───────────┐    │        │
│                              └────→│    AI     │←───┘        │
│                                    │  Scoring  │             │
│                                    └───────────┘             │
│                                          │                   │
│                                          ▼                   │
│                              ┌─────────────────────┐         │
│                              │   Recommendations   │         │
│                              │   (Sorted & Ranked) │         │
│                              └─────────────────────┘         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Data Sources:                                                │
│ • Google Places API ($0.017/call)                           │
│ • Foursquare API (free tier)                                │
│ • Database Cache (free)                                     │
│ • AI Edge Function ($0.01/call)                             │
└─────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {!user?.id && (
          <p className="text-sm text-muted-foreground text-center">
            Please log in to run the pipeline
          </p>
        )}
      </CardContent>
    </Card>
  );
};
