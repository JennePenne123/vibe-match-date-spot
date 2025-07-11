import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, MapPin, Star, Clock, Users } from 'lucide-react';

interface TestResultsVisualizationProps {
  results: any;
}

export const TestResultsVisualization: React.FC<TestResultsVisualizationProps> = ({ results }) => {
  if (results.type === 'error') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-semibold">{results.message}</div>
          {results.details && (
            <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-auto">
              {JSON.stringify(results.details, null, 2)}
            </pre>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (results.type === 'google-places') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Google Places API Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant="default">Success</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Venues Found</span>
                <Badge variant="secondary">{results.venueCount}</Badge>
              </div>
            </div>
            
            {results.data?.venues && results.data.venues.length > 0 && (
              <div className="md:col-span-2">
                <h4 className="font-semibold mb-3">Found Venues:</h4>
                <div className="grid gap-3">
                  {results.data.venues.slice(0, 3).map((venue: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-card">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h5 className="font-medium">{venue.name}</h5>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {venue.address}
                          </div>
                          {venue.rating && (
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {venue.rating}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          {venue.cuisine_type && (
                            <Badge variant="outline" className="text-xs">{venue.cuisine_type}</Badge>
                          )}
                          {venue.price_range && (
                            <Badge variant="secondary" className="text-xs">{venue.price_range}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {results.data.venues.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      + {results.data.venues.length - 3} more venues
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.type === 'venue-scoring') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Venue Scoring Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* User Preferences Summary */}
            <div className="border rounded-lg p-3 bg-muted/50">
              <h4 className="font-semibold mb-2">User Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {results.userPrefs?.preferred_cuisines?.map((cuisine: string, index: number) => (
                  <Badge key={index} variant="default">{cuisine}</Badge>
                ))}
                {results.userPrefs?.preferred_vibes?.map((vibe: string, index: number) => (
                  <Badge key={index} variant="secondary">{vibe}</Badge>
                ))}
              </div>
            </div>

            {/* Top Venue */}
            {results.topVenue && (
              <div className="border rounded-lg p-3 bg-green-50 border-green-200">
                <h4 className="font-semibold mb-2 text-green-800">🏆 Top Scoring Venue</h4>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h5 className="font-medium">{results.topVenue.name}</h5>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {results.topVenue.address}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {results.topVenue.ai_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">AI Score</div>
                  </div>
                </div>
              </div>
            )}

            {/* All Venues */}
            <div>
              <h4 className="font-semibold mb-3">All Scored Venues</h4>
              <div className="space-y-2">
                {results.venues?.map((venue: any, index: number) => (
                  <div key={venue.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{venue.name}</div>
                        <div className="text-xs text-muted-foreground">{venue.cuisine_type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{venue.ai_score}%</div>
                      <div className={`w-20 h-2 rounded-full ${
                        venue.ai_score >= 70 ? 'bg-green-200' : 
                        venue.ai_score >= 40 ? 'bg-yellow-200' : 'bg-red-200'
                      }`}>
                        <div 
                          className={`h-full rounded-full ${
                            venue.ai_score >= 70 ? 'bg-green-500' : 
                            venue.ai_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${venue.ai_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.type === 'full-flow') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Full Recommendation Flow Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{results.count}</div>
                <div className="text-sm text-muted-foreground">Recommendations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.topRecommendation?.ai_score || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Top Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  <Clock className="h-6 w-6 mx-auto" />
                </div>
                <div className="text-sm text-muted-foreground">Generated</div>
              </div>
            </div>

            {results.topRecommendation && (
              <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <h4 className="font-semibold mb-2">🎯 Top Recommendation</h4>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium">{results.topRecommendation.name}</h5>
                      <div className="text-sm text-muted-foreground">{results.topRecommendation.address}</div>
                    </div>
                    <Badge variant="default">{results.topRecommendation.ai_score}%</Badge>
                  </div>
                  {results.topRecommendation.description && (
                    <p className="text-sm text-muted-foreground">{results.topRecommendation.description}</p>
                  )}
                </div>
              </div>
            )}

            {results.recommendations?.length > 1 && (
              <div>
                <h4 className="font-semibold mb-3">All Recommendations</h4>
                <div className="grid gap-2">
                  {results.recommendations.slice(1, 6).map((venue: any, index: number) => (
                    <div key={venue.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{venue.name}</span>
                      </div>
                      <Badge variant="outline">{venue.ai_score}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-muted p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Unknown Result Type:</h3>
      <pre className="text-sm overflow-auto">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );
};