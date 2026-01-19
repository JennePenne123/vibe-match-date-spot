import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  DollarSign, 
  Activity, 
  Clock, 
  Database,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { apiUsageService } from '@/services/apiUsageService';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

interface ApiUsageStats {
  totalCalls: number;
  totalCost: number;
  cacheHitRate: number;
  avgResponseTime: number;
  byApi: { name: string; calls: number; cost: number }[];
  recentCalls: {
    id: string;
    api_name: string;
    endpoint: string | null;
    response_status: number | null;
    response_time_ms: number | null;
    estimated_cost: number | null;
    cache_hit: boolean | null;
    created_at: string | null;
  }[];
  dailyTrends: { date: string; calls: number; cost: number }[];
}

const API_COLORS: Record<string, string> = {
  google_places: '#4285F4',
  foursquare: '#F94877',
  openai: '#10A37F',
  supabase: '#3ECF8E',
  default: '#6B7280',
};

const chartConfig = {
  calls: { label: 'API Calls', color: 'hsl(var(--primary))' },
  cost: { label: 'Cost ($)', color: 'hsl(var(--destructive))' },
};

export const ApiUsageDashboard: React.FC = () => {
  const [stats, setStats] = useState<ApiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch daily summary from the service
      const dailySummary = await apiUsageService.getDailySummary();

      // Fetch recent calls directly
      const { data: recentCalls, error: recentError } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (recentError) throw recentError;

      // Fetch daily trends from the view
      const { data: dailyData, error: dailyError } = await supabase
        .from('api_usage_daily')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);

      if (dailyError) throw dailyError;

      // Aggregate stats by API
      const apiAggregates: Record<string, { calls: number; cost: number }> = {};
      let totalCalls = 0;
      let totalCost = 0;
      let cacheHits = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;

      if (recentCalls) {
        recentCalls.forEach((call) => {
          const apiName = call.api_name || 'unknown';
          if (!apiAggregates[apiName]) {
            apiAggregates[apiName] = { calls: 0, cost: 0 };
          }
          apiAggregates[apiName].calls++;
          apiAggregates[apiName].cost += Number(call.estimated_cost) || 0;
          totalCalls++;
          totalCost += Number(call.estimated_cost) || 0;
          if (call.cache_hit) cacheHits++;
          if (call.response_time_ms) {
            totalResponseTime += call.response_time_ms;
            responseTimeCount++;
          }
        });
      }

      // Use daily summary if available for more accurate totals
      if (dailySummary) {
        totalCalls = dailySummary.totalCalls;
        totalCost = dailySummary.totalCost;
      }

      const byApi = Object.entries(apiAggregates).map(([name, data]) => ({
        name,
        calls: data.calls,
        cost: data.cost,
      }));

      const dailyTrends = (dailyData || []).map((d) => ({
        date: d.date || '',
        calls: Number(d.total_calls) || 0,
        cost: Number(d.total_cost) || 0,
      })).reverse();

      setStats({
        totalCalls,
        totalCost,
        cacheHitRate: totalCalls > 0 ? (cacheHits / totalCalls) * 100 : 0,
        avgResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
        byApi,
        recentCalls: recentCalls || [],
        dailyTrends,
      });

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching API usage stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const formatTime = (ms: number) => {
    return `${Math.round(ms)}ms`;
  };

  const getApiColor = (apiName: string) => {
    return API_COLORS[apiName] || API_COLORS.default;
  };

  const getStatusBadge = (status: number | null) => {
    if (!status) return <Badge variant="outline">N/A</Badge>;
    if (status >= 200 && status < 300) {
      return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">{status}</Badge>;
    }
    if (status >= 400) {
      return <Badge variant="destructive">{status}</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading API usage data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>Error: {error}</span>
        <Button variant="ghost" size="sm" onClick={fetchStats} className="ml-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats || stats.totalCalls === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            No API usage data yet. Data will appear when API calls are logged.
          </p>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Try searching for venues on the Smart Date Planning page to generate API usage data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Calls</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalCalls}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Est. Cost</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatCost(stats.totalCost)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Cache Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.cacheHitRate.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-muted-foreground">Avg Response</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatTime(stats.avgResponseTime)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-api">By API</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Bar Chart - Calls by API */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Calls by API</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.byApi.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <BarChart data={stats.byApi}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="calls" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart - Cost Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.byApi.length > 0 && stats.totalCost > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <PieChart>
                      <Pie
                        data={stats.byApi.filter(a => a.cost > 0)}
                        dataKey="cost"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {stats.byApi.map((entry) => (
                          <Cell key={entry.name} fill={getApiColor(entry.name)} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No cost data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="by-api">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {stats.byApi.map((api) => (
                  <div key={api.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getApiColor(api.name) }}
                      />
                      <span className="font-medium">{api.name}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>{api.calls} calls</span>
                      <span className="text-muted-foreground">{formatCost(api.cost)}</span>
                    </div>
                  </div>
                ))}
                {stats.byApi.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No API data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                7-Day Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.dailyTrends.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <LineChart data={stats.dailyTrends}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="calls" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No trend data available yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">API</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-right py-2 px-2">Time</th>
                      <th className="text-right py-2 px-2">Cost</th>
                      <th className="text-center py-2 px-2">Cache</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentCalls.map((call) => (
                      <tr key={call.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getApiColor(call.api_name) }}
                            />
                            <span className="truncate max-w-[120px]">{call.api_name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">{getStatusBadge(call.response_status)}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">
                          {call.response_time_ms ? formatTime(call.response_time_ms) : '-'}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {call.estimated_cost ? formatCost(Number(call.estimated_cost)) : '-'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {call.cache_hit ? (
                            <Badge className="bg-green-500/20 text-green-700 text-xs">HIT</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">MISS</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {stats.recentCalls.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted-foreground">
                          No recent API calls
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
