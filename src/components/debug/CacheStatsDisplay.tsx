import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { venueCacheService } from '@/services/venueCacheService';
import { RefreshCw, Trash2, Database } from 'lucide-react';

export const CacheStatsDisplay = () => {
  const [stats, setStats] = useState({ hits: 0, misses: 0, size: 0 });
  const [hitRate, setHitRate] = useState(0);

  const refreshStats = () => {
    setStats(venueCacheService.getCacheStats());
    setHitRate(venueCacheService.getHitRate());
  };

  useEffect(() => {
    refreshStats();
    // Auto-refresh every 5 seconds
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    venueCacheService.clearCache();
    refreshStats();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Venue Cache Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entries:</span>
            <Badge variant="secondary">{stats.size}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hit Rate:</span>
            <Badge variant={hitRate > 50 ? "default" : "secondary"}>
              {hitRate}%
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hits:</span>
            <span className="text-green-600 font-medium">{stats.hits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Misses:</span>
            <span className="text-amber-600 font-medium">{stats.misses}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshStats}
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleClearCache}
            className="flex-1"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
