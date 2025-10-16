import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
}

export default function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'Code has been copied successfully',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const downloadCode = () => {
    const extensions: Record<string, string> = {
      typescript: 'ts',
      tsx: 'tsx',
      javascript: 'js',
      jsx: 'jsx',
      python: 'py',
      sql: 'sql',
      css: 'css',
      html: 'html',
    };

    const ext = extensions[language.toLowerCase()] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download started',
      description: `Downloading ${a.download}`,
    });
  };

  return (
    <div className="relative my-4 rounded-lg bg-secondary/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/20">
        <span className="text-sm font-mono text-muted-foreground">
          {filename || language}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={copyToClipboard}
            className="h-7 px-2"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={downloadCode}
            className="h-7 px-2"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono">{code}</code>
      </pre>
    </div>
  );
}
