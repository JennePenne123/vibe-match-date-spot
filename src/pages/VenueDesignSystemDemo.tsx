import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Brain, MapPin, Star, Clock, Car, Footprints, ThumbsUp, ThumbsDown, Sparkles, CheckCircle, SkipForward, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { VenueScore } from '@/design-system/components/VenueScore';
import { VenueTag, CuisineTag, VibeTag, FeatureTag, TimeTag } from '@/design-system/components/VenueTag';
import {
  venueScoreTokens,
  venueStatusTokens,
  venuePriceTokens,
  venueMarkerTokens,
  venueConfidenceTokens,
  venueFeedbackTokens,
} from '@/design-system/tokens/venue';

const VenueDesignSystemDemo: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Venue Design System</h1>
              <p className="text-sm text-muted-foreground">Discovery-focused component library</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="colors" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="map">Map Elements</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            {/* Score Colors */}
            <Card>
              <CardHeader>
                <CardTitle>AI Score Colors</CardTitle>
                <CardDescription>Color tokens for AI match score indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(venueScoreTokens).map(([key, tokens]) => (
                    <div key={key} className="space-y-2">
                      <div className={`h-20 rounded-lg ${tokens.bg} ${tokens.border} border flex items-center justify-center`}>
                        <span className={`text-2xl font-bold ${tokens.text}`}>
                          {tokens.threshold}%+
                        </span>
                      </div>
                      <p className="text-sm font-medium capitalize">{key}</p>
                      <p className="text-xs text-muted-foreground">{tokens.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Status Colors</CardTitle>
                <CardDescription>Venue operational status indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(venueStatusTokens).map(([key, tokens]) => (
                    <div key={key} className="space-y-2">
                      <div className={`h-16 rounded-lg ${tokens.bg} flex items-center justify-center gap-2`}>
                        <Clock className={`h-5 w-5 ${tokens.icon}`} />
                        <span className={`font-medium ${tokens.text}`}>{tokens.label}</span>
                      </div>
                      <p className="text-sm font-medium capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Price Level Colors</CardTitle>
                <CardDescription>Visual hierarchy for price ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(venuePriceTokens).map(([key, tokens]) => (
                    <div key={key} className="space-y-2 text-center">
                      <div className="h-16 rounded-lg bg-muted flex items-center justify-center">
                        <span className={`text-2xl font-bold ${tokens.text}`}>{tokens.symbol}</span>
                      </div>
                      <p className="text-sm font-medium capitalize">{key}</p>
                      <p className="text-xs text-muted-foreground">{tokens.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Map Marker Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Map Marker Colors</CardTitle>
                <CardDescription>Score-based marker color palette</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(venueMarkerTokens.colors).map(([key, color]) => (
                    <div key={key} className="space-y-2 text-center">
                      <div 
                        className="h-16 w-16 mx-auto rounded-full shadow-lg" 
                        style={{ backgroundColor: color }}
                      />
                      <p className="text-sm font-medium capitalize">{key}</p>
                      <code className="text-xs text-muted-foreground">{color}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Venue Typography Scale</CardTitle>
                <CardDescription>Type hierarchy for venue displays</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Venue Name (Detail)</p>
                  <p className="text-[28px] font-bold leading-tight">The Rustic Kitchen & Bar</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Venue Name (Card)</p>
                  <p className="text-lg font-semibold leading-snug">The Rustic Kitchen & Bar</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A cozy farm-to-table restaurant featuring seasonal menus, craft cocktails, and a warm, inviting atmosphere perfect for date nights.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Metadata</p>
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> 0.8 mi
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" /> 4.7
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" /> 5 min
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Score Badge</p>
                  <div className="flex items-center gap-2">
                    <Badge className="text-sm font-bold bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300">
                      <Brain className="h-3 w-3 mr-1" /> 92%
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted">Italian</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted">Romantic</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted">Date Night</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            {/* VenueScore Component */}
            <Card>
              <CardHeader>
                <CardTitle>VenueScore Component</CardTitle>
                <CardDescription>AI match score display with confidence indicator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">Overlay (Default)</p>
                    <div className="relative bg-muted h-32 rounded-lg">
                      <VenueScore score={92} confidence={85} contextBonus={5} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">Inline</p>
                    <VenueScore score={78} confidence={72} variant="inline" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">Compact</p>
                    <VenueScore score={65} variant="compact" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">Large</p>
                    <VenueScore score={88} confidence={90} contextBonus={8} variant="large" />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Excellent (85+)</p>
                    <VenueScore score={92} variant="inline" showConfidence={false} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Good (70-84)</p>
                    <VenueScore score={76} variant="inline" showConfidence={false} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Fair (55-69)</p>
                    <VenueScore score={62} variant="inline" showConfidence={false} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Low (&lt;55)</p>
                    <VenueScore score={45} variant="inline" showConfidence={false} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VenueTag Component */}
            <Card>
              <CardHeader>
                <CardTitle>VenueTag Component</CardTitle>
                <CardDescription>Category and feature tags with semantic colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">By Category</p>
                  <div className="flex flex-wrap gap-2">
                    <CuisineTag label="Italian" />
                    <CuisineTag label="Japanese" />
                    <VibeTag label="Romantic" />
                    <VibeTag label="Cozy" />
                    <FeatureTag label="Outdoor Seating" />
                    <TimeTag label="Dinner" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">Sizes</p>
                  <div className="flex items-center gap-2">
                    <VenueTag label="Small" size="sm" category="cuisine" />
                    <VenueTag label="Medium" size="md" category="cuisine" />
                    <VenueTag label="Large" size="lg" category="cuisine" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">Variants</p>
                  <div className="flex items-center gap-2">
                    <VenueTag label="Default" variant="default" category="vibe" />
                    <VenueTag label="Outline" variant="outline" category="vibe" />
                    <VenueTag label="Filled" variant="filled" category="vibe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">Interactive</p>
                  <div className="flex items-center gap-2">
                    <VenueTag label="Click me" category="feature" onClick={() => alert('Clicked!')} />
                    <VenueTag label="Selected" category="feature" selected />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Status Badges</CardTitle>
                <CardDescription>Venue operational status indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(venueStatusTokens).map(([key, tokens]) => (
                    <div key={key} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tokens.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${tokens.icon.replace('text-', 'bg-')}`} />
                      <span className={`text-sm font-medium ${tokens.text}`}>{tokens.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Confidence Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Confidence Indicators</CardTitle>
                <CardDescription>AI prediction confidence levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6">
                  {Object.entries(venueConfidenceTokens).map(([key, tokens]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${tokens.color}`} />
                      <span className="text-sm font-medium">{tokens.label}</span>
                      <span className="text-xs text-muted-foreground">({tokens.threshold}%+)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Travel Time Pills */}
            <Card>
              <CardHeader>
                <CardTitle>Travel Time Pills</CardTitle>
                <CardDescription>Drive and walk time indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">5 min</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
                    <Footprints className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">15 min</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sage-100 dark:bg-sage-950/40">
                    <Car className="h-4 w-4 text-sage-600 dark:text-sage-400" />
                    <span className="text-sm font-medium text-sage-700 dark:text-sage-300">Nearby</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Venue Card Variants</CardTitle>
                <CardDescription>Different card layouts for various contexts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Standard Card Preview */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">Standard Card (Grid View)</p>
                  <div className="max-w-sm">
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 bg-gradient-to-br from-sage-200 to-sand-200 dark:from-sage-900 dark:to-sand-900">
                        <VenueScore score={88} confidence={82} />
                        <Button size="icon" variant="ghost" className="absolute top-3 right-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900">
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">The Rustic Kitchen</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> 0.8 mi away
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500" /> 4.7
                          </span>
                          <span className="text-sage-600 dark:text-sage-400 font-medium">$$</span>
                          <Badge variant="outline" className="bg-sage-50 dark:bg-sage-950/40 text-sage-700 dark:text-sage-300 border-sage-200 dark:border-sage-800">
                            Open Now
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <CuisineTag label="Italian" size="sm" />
                          <VibeTag label="Romantic" size="sm" />
                        </div>
                        <Button className="w-full bg-primary hover:bg-primary/90">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Compact Card Preview */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">Compact Card (List View)</p>
                  <div className="max-w-md">
                    <Card className="p-3 hover:shadow-md transition-shadow">
                      <div className="flex gap-3">
                        <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-sage-200 to-sand-200 dark:from-sage-900 dark:to-sand-900 flex-shrink-0">
                          <VenueScore score={76} variant="compact" className="absolute -top-1 -left-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">Café Milano</h3>
                          <p className="text-xs text-muted-foreground">0.3 mi • Italian • $$</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-0.5 text-xs">
                              <Star className="h-3 w-3 text-amber-500" /> 4.5
                            </span>
                            <span className="text-xs text-sage-600 dark:text-sage-400">Open</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* AI-Enhanced Card Preview */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">AI-Enhanced Card</p>
                  <div className="max-w-lg">
                    <Card className="overflow-hidden border-primary/20">
                      <div className="relative h-40 bg-gradient-to-br from-sage-200 to-terracotta-200 dark:from-sage-900 dark:to-terracotta-900">
                        <VenueScore score={92} confidence={88} contextBonus={5} />
                      </div>
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">Harvest Table</h3>
                          <p className="text-sm text-muted-foreground">Farm-to-table dining with seasonal menus</p>
                        </div>
                        
                        {/* AI Reasoning Section */}
                        <div className="p-3 rounded-lg bg-sage-50/50 dark:bg-sage-950/30 border border-sage-200 dark:border-sage-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Why this matches</span>
                          </div>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Both of you love farm-to-table dining</li>
                            <li>• Perfect for your preferred romantic vibe</li>
                            <li>• Within your preferred price range</li>
                          </ul>
                        </div>

                        {/* Feedback Buttons */}
                        <div className="grid grid-cols-4 gap-2">
                          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 hover:bg-primary/10">
                            <Sparkles className="h-4 w-4 mb-1" />
                            <span className="text-[10px]">Love it</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 hover:bg-sage-100 dark:hover:bg-sage-900/40">
                            <ThumbsUp className="h-4 w-4 mb-1" />
                            <span className="text-[10px]">Like</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 hover:bg-green-100 dark:hover:bg-green-900/40">
                            <CheckCircle className="h-4 w-4 mb-1" />
                            <span className="text-[10px]">Visited</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 hover:bg-red-100 dark:hover:bg-red-900/40">
                            <ThumbsDown className="h-4 w-4 mb-1" />
                            <span className="text-[10px]">Not for me</span>
                          </Button>
                        </div>

                        <Button className="w-full bg-primary hover:bg-primary/90">
                          Select This Venue
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Map Elements Tab */}
          <TabsContent value="map" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Map Markers</CardTitle>
                <CardDescription>Score-based venue markers for map display</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-8">
                  {Object.entries(venueMarkerTokens.colors).map(([key, color]) => (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <div 
                        className="relative w-10 h-10 rounded-full rounded-br-none rotate-45 shadow-lg border-2 border-white dark:border-gray-800"
                        style={{ backgroundColor: color }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center -rotate-45 text-white text-xs font-bold">
                          {key === 'excellent' ? '92' : key === 'good' ? '76' : key === 'fair' ? '62' : '45'}
                        </span>
                      </div>
                      <p className="text-sm font-medium capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cluster Markers</CardTitle>
                <CardDescription>Grouped venue indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-8">
                  {Object.entries(venueMarkerTokens.cluster).map(([key, config]) => (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <div 
                        className="rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                        style={{ 
                          width: config.size, 
                          height: config.size,
                          background: config.bg,
                        }}
                      >
                        {key === 'small' ? '3' : key === 'medium' ? '7' : '15'}
                      </div>
                      <p className="text-sm font-medium capitalize">{key}</p>
                      <p className="text-xs text-muted-foreground">{config.size}px</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Map Popup</CardTitle>
                <CardDescription>Venue information popup for map markers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs bg-card border border-border rounded-lg shadow-lg p-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">The Rustic Kitchen</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> 123 Main St
                      </p>
                    </div>
                    <VenueScore score={88} variant="compact" />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" /> 4.7
                    </span>
                    <span className="text-sage-600 dark:text-sage-400 font-medium">$$</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 p-2 rounded bg-muted">
                      <Car className="h-3 w-3" />
                      <span>5 min</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded bg-muted">
                      <Footprints className="h-3 w-3" />
                      <span>15 min</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Car className="h-3 w-3 mr-1" /> Drive
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Footprints className="h-3 w-3 mr-1" /> Walk
                    </Button>
                  </div>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-xs">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Button Grid</CardTitle>
                <CardDescription>User feedback actions for venue cards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">4-Column Grid (Compact)</p>
                  <div className="max-w-md grid grid-cols-4 gap-2">
                    {['superLike', 'like', 'visited', 'dislike'].map((type) => {
                      const token = venueFeedbackTokens[type as keyof typeof venueFeedbackTokens];
                      const icons = {
                        superLike: Sparkles,
                        like: ThumbsUp,
                        visited: CheckCircle,
                        dislike: ThumbsDown,
                      };
                      const Icon = icons[type as keyof typeof icons];
                      const isActive = selectedFeedback === type;
                      
                      return (
                        <Button 
                          key={type}
                          variant="ghost" 
                          size="sm"
                          className={`flex-col h-auto py-2 ${isActive ? token.active : token.default}`}
                          onClick={() => setSelectedFeedback(isActive ? null : type)}
                        >
                          <Icon className="h-4 w-4 mb-1" />
                          <span className="text-[10px] capitalize">{type === 'superLike' ? 'Love' : type}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">Full Feedback Panel</p>
                  <div className="max-w-md grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-auto py-3 justify-start gap-3 hover:bg-sage-50 dark:hover:bg-sage-950/40 hover:border-sage-300 dark:hover:border-sage-700">
                      <Eye className="h-5 w-5 text-sage-600 dark:text-sage-400" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Interested</p>
                        <p className="text-xs text-muted-foreground">Save for later</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 justify-start gap-3 hover:bg-green-50 dark:hover:bg-green-950/40 hover:border-green-300 dark:hover:border-green-700">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Visited</p>
                        <p className="text-xs text-muted-foreground">Been here before</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 justify-start gap-3 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300 dark:hover:border-amber-700">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Maybe Later</p>
                        <p className="text-xs text-muted-foreground">Not right now</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-auto py-3 justify-start gap-3 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-700">
                      <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Not for me</p>
                        <p className="text-xs text-muted-foreground">Hide this venue</p>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">AI Learning Note</p>
                  <div className="max-w-md p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Your feedback helps improve future recommendations
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Button States</CardTitle>
                <CardDescription>Visual states for feedback buttons</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(venueFeedbackTokens).map(([type, token]) => {
                    const icons = {
                      superLike: Sparkles,
                      like: ThumbsUp,
                      visited: CheckCircle,
                      dislike: ThumbsDown,
                      skip: SkipForward,
                    };
                    const Icon = icons[type as keyof typeof icons];
                    
                    return (
                      <div key={type} className="space-y-2">
                        <p className="text-xs text-muted-foreground capitalize">{type}</p>
                        <div className="space-y-1">
                          <Button variant="ghost" size="sm" className={`w-full justify-start ${token.default}`}>
                            <Icon className="h-4 w-4 mr-2" /> Default
                          </Button>
                          <Button variant="ghost" size="sm" className={`w-full justify-start ${token.active}`}>
                            <Icon className="h-4 w-4 mr-2" /> Active
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default VenueDesignSystemDemo;
