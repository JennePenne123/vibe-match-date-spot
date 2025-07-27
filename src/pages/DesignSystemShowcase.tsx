import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Display, Heading, Text, Caption } from '@/design-system/components/Typography';
import { Heart, Star, MapPin, Calendar, Users, Camera } from 'lucide-react';

const DesignSystemShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Display className="mb-4">DateSpot Design System</Display>
          <Text size="lg" className="text-muted-foreground max-w-2xl mx-auto">
            A comprehensive design system showcasing our enhanced typography, colors, components, and interactions.
          </Text>
        </div>

        {/* Typography Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Typography System</CardTitle>
            <CardDescription>Brand fonts and text hierarchy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Caption className="text-muted-foreground mb-2">Display Font (Playfair Display)</Caption>
              <Display>Find Your Perfect Date Spot</Display>
            </div>
            <div>
              <Caption className="text-muted-foreground mb-2">Headings (Inter)</Caption>
              <div className="space-y-2">
                <Heading as="h1">Heading XL - Main Page Titles</Heading>
                <Heading as="h2">Heading LG - Section Headers</Heading>
                <Heading as="h3">Heading MD - Component Titles</Heading>
                <Heading as="h4">Heading SM - Card Headers</Heading>
              </div>
            </div>
            <div>
              <Caption className="text-muted-foreground mb-2">Body Text (Inter)</Caption>
              <div className="space-y-2">
                <Text size="lg">Large body text for important descriptions and introductions</Text>
                <Text size="base">Base body text for general content and paragraphs</Text>
                <Text size="sm">Small text for secondary information and metadata</Text>
                <Caption>Caption text for labels, timestamps, and fine print</Caption>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Variants */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Button System</CardTitle>
            <CardDescription>Enhanced button variants with premium effects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Heading as="h4">Primary Variants</Heading>
                <div className="space-y-2">
                  <Button variant="default" size="lg" className="w-full">
                    <Heart className="w-4 h-4 mr-2" />
                    Find Love
                  </Button>
                  <Button variant="premium" size="lg" className="w-full">
                    <Star className="w-4 h-4 mr-2" />
                    Premium Experience
                  </Button>
                  <Button variant="premium" size="lg" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Plan Your Date
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Heading as="h4">Secondary Variants</Heading>
                <div className="space-y-2">
                  <Button variant="secondary" size="default" className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Browse Venues
                  </Button>
                  <Button variant="outline" size="default" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Invite Friends
                  </Button>
                  <Button variant="ghost" size="default" className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    View Gallery
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Heading as="h4">Sizes & States</Heading>
                <div className="space-y-2">
                  <Button size="xs" className="w-full">Extra Small</Button>
                  <Button size="sm" className="w-full">Small</Button>
                  <Button size="default" className="w-full">Medium</Button>
                  <Button size="lg" className="w-full">Large</Button>
                  <Button disabled className="w-full">Disabled</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color System */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Brand colors and semantic meanings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Heading as="h4" className="mb-4">Brand Colors</Heading>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary shadow-sm"></div>
                    <div>
                      <Text size="sm" weight="medium">Primary</Text>
                      <Caption className="text-muted-foreground">Main brand color</Caption>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary shadow-sm"></div>
                    <div>
                      <Text size="sm" weight="medium">Secondary</Text>
                      <Caption className="text-muted-foreground">Accent color</Caption>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent shadow-sm"></div>
                    <div>
                      <Text size="sm" weight="medium">Accent</Text>
                      <Caption className="text-muted-foreground">Highlight color</Caption>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Heading as="h4" className="mb-4">Semantic Colors</Heading>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-success shadow-sm"></div>
                    <div>
                      <Text size="sm" weight="medium">Success</Text>
                      <Caption className="text-muted-foreground">Positive actions</Caption>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warning shadow-sm"></div>
                    <div>
                      <Text size="sm" weight="medium">Warning</Text>
                      <Caption className="text-muted-foreground">Caution states</Caption>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-destructive shadow-sm"></div>
                    <div>
                      <Text size="sm" weight="medium">Error</Text>
                      <Caption className="text-muted-foreground">Error states</Caption>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Heading as="h4" className="mb-4">Neutral Colors</Heading>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background border shadow-sm"></div>
                    <div>
                      <Text size="sm" weight="medium">Background</Text>
                      <Caption className="text-muted-foreground">Page background</Caption>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-card border shadow-sm"></div>
                    <div>
                      <Text size="sm" weight="medium">Card</Text>
                      <Caption className="text-muted-foreground">Surface color</Caption>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted shadow-sm"></div>
                    <div>
                      <Text size="sm" weight="medium">Muted</Text>
                      <Caption className="text-muted-foreground">Subtle backgrounds</Caption>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Components Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Component Examples</CardTitle>
            <CardDescription>How our design system looks in real components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Venue Card Example */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Heading as="h4">Romantic Bistro</Heading>
                    <Badge variant="secondary">93% Match</Badge>
                  </div>
                  <Text size="sm" className="text-muted-foreground mb-3">
                    Cozy Italian restaurant with candlelit tables
                  </Text>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>0.5 mi</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-warning" />
                      <span>4.8</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Card Example */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary"></div>
                    <div>
                      <Heading as="h4">Sarah Chen</Heading>
                      <Text size="sm" className="text-muted-foreground">Active 2h ago</Text>
                    </div>
                  </div>
                  <Text size="sm" className="mb-4">
                    Loves trying new restaurants and outdoor adventures. Always up for a good coffee chat!
                  </Text>
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Send Friend Request
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Card Example */}
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Display className="text-primary mb-2">24</Display>
                    <Heading as="h4" className="mb-2">Perfect Matches</Heading>
                    <Text size="sm" className="text-muted-foreground mb-4">
                      Found this month
                    </Text>
                    <Button variant="premium" size="sm" className="w-full">
                      <Star className="w-4 h-4 mr-2" />
                      View All Matches
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Spacing & Layout */}
        <Card>
          <CardHeader>
            <CardTitle>Spacing System</CardTitle>
            <CardDescription>Consistent spacing scale across the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 text-right">
                  <Caption>XS (4px)</Caption>
                </div>
                <div className="h-4 w-4 bg-primary rounded"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-right">
                  <Caption>SM (8px)</Caption>
                </div>
                <div className="h-4 w-8 bg-primary rounded"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-right">
                  <Caption>MD (16px)</Caption>
                </div>
                <div className="h-4 w-16 bg-primary rounded"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-right">
                  <Caption>LG (24px)</Caption>
                </div>
                <div className="h-4 w-24 bg-primary rounded"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-right">
                  <Caption>XL (32px)</Caption>
                </div>
                <div className="h-4 w-32 bg-primary rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesignSystemShowcase;