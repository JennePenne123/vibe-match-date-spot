import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
}

interface TaskProgressProps {
  steps: TaskStep[];
  title?: string;
}

export default function TaskProgress({ steps, title }: TaskProgressProps) {
  if (steps.length === 0) return null;

  return (
    <Card className="p-4 my-4">
      {title && <h3 className="font-semibold mb-4">{title}</h3>}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              {step.status === 'completed' && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {step.status === 'running' && (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              )}
              {step.status === 'failed' && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {step.status === 'pending' && (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Step {index + 1}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {step.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {step.description}
              </p>
              {step.output && (
                <div className="mt-2 p-2 rounded bg-secondary/20 text-xs font-mono">
                  {step.output}
                </div>
              )}
              {step.error && (
                <div className="mt-2 p-2 rounded bg-destructive/10 text-xs text-destructive">
                  {step.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
