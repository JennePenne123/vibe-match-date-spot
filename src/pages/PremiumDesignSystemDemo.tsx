import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Display, Heading, Text, Caption } from '@/design-system/components/Typography';
import { Heart, Star, Sparkles, Palette, Type, Layers, Wand2, Eye } from 'lucide-react';

const PremiumDesignSystemDemo = () => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const currentColors = [
    { name: 'Primary 500', value: 'hsl(330, 81%, 60%)', class: 'bg-primary' },
    { name: 'Secondary 500', value: 'hsl(351, 86%, 55%)', class: 'bg-secondary' },
    { name: 'Accent 500', value: 'hsl(195, 87%, 45%)', class: 'bg-accent' },
    { name: 'Muted', value: 'hsl(210, 40%, 96%)', class: 'bg-muted' },
  ];

  const premiumColors = [
    { name: 'Rose Quartz', value: 'hsl(330, 85%, 95%)', class: 'bg-gradient-to-br from-pink-50 to-rose-100' },
    { name: 'Warm Blush', value: 'hsl(330, 75%, 88%)', class: 'bg-gradient-to-br from-pink-100 to-rose-200' },
    { name: 'Romantic Pink', value: 'hsl(330, 81%, 60%)', class: 'bg-gradient-to-br from-pink-400 to-rose-500' },
    { name: 'Deep Romance', value: 'hsl(330, 85%, 45%)', class: 'bg-gradient-to-br from-pink-600 to-rose-700' },
    { name: 'Champagne', value: 'hsl(45, 85%, 92%)', class: 'bg-gradient-to-br from-amber-50 to-yellow-100' },
    { name: 'Golden Hour', value: 'hsl(35, 75%, 75%)', class: 'bg-gradient-to-br from-amber-200 to-orange-300' },
  ];

  const shadowExamples = [
    { name: 'Subtle', class: 'shadow-sm' },
    { name: 'Medium', class: 'shadow-md' },
    { name: 'Large', class: 'shadow-lg' },
    { name: 'Elegant', class: 'shadow-[0_10px_30px_-10px_rgba(330,81%,60%,0.3)]' },
    { name: 'Romantic Glow', class: 'shadow-[0_0_40px_rgba(330,81%,60%,0.4)]' },
    { name: 'Glass Effect', class: 'shadow-[0_8px_32px_rgba(31,38,135,0.37)] backdrop-blur-md' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <Display size="lg" className="text-foreground">VybePulse Premium Design System</Display>
              <Text size="sm" className="text-muted-foreground">A comprehensive showcase of enhanced design tokens and components</Text>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-12">
        
        {/* Navigation Tabs */}
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Components
            </TabsTrigger>
            <TabsTrigger value="effects" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Effects
            </TabsTrigger>
            <TabsTrigger value="brand" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Brand
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            <div>
              <Heading size="h2" className="mb-6">Color Palette Enhancement</Heading>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Current Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Palette</CardTitle>
                    <CardDescription>VybePulse's existing color system</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-lg ${color.class} border shadow-sm`} />
                        <div>
                          <Text weight="medium">{color.name}</Text>
                          <Text size="sm" className="text-muted-foreground font-mono">{color.value}</Text>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Premium Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Premium Palette</CardTitle>
                    <CardDescription>Enhanced colors with sophisticated gradients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {premiumColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div 
                          className={`w-16 h-16 rounded-lg ${color.class} border shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer`}
                          onMouseEnter={() => setHoveredColor(color.name)}
                          onMouseLeave={() => setHoveredColor(null)}
                        />
                        <div>
                          <Text weight="medium">{color.name}</Text>
                          <Text size="sm" className="text-muted-foreground font-mono">{color.value}</Text>
                          {hoveredColor === color.name && (
                            <Badge variant="secondary" className="mt-1">Enhanced</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-8">
            <div>
              <Heading size="h2" className="mb-6">Premium Typography System</Heading>
              
              <div className="grid gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Enhanced Font Hierarchy</CardTitle>
                    <CardDescription>Refined typography with premium font stack and micro-typography</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <Display size="2xl" className="text-foreground">Display 2XL - Premium Headlines</Display>
                      <Display size="xl" className="text-foreground">Display XL - Hero Sections</Display>
                      <Display size="lg" className="text-foreground">Display LG - Major Headings</Display>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <Heading size="h1" className="text-foreground">Heading H1 - Page Titles</Heading>
                      <Heading size="h2" className="text-foreground">Heading H2 - Section Headers</Heading>
                      <Heading size="h3" className="text-foreground">Heading H3 - Subsections</Heading>
                      <Heading size="h4" className="text-foreground">Heading H4 - Component Titles</Heading>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <Text size="lg" className="text-foreground">Large Text - Important body content and descriptions</Text>
                      <Text size="base" className="text-foreground">Base Text - Standard body content for optimal readability</Text>
                      <Text size="sm" className="text-muted-foreground">Small Text - Secondary information and metadata</Text>
                      <Caption className="text-muted-foreground">CAPTION - LABELS AND FINE PRINT</Caption>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            <div>
              <Heading size="h2" className="mb-6">Premium Component Variants</Heading>
              
              <div className="grid gap-8">
                {/* Button Variants */}
                <Card>
                  <CardHeader>
                    <CardTitle>Enhanced Buttons</CardTitle>
                    <CardDescription>Premium button variants with elevation and glass effects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button variant="default">Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="premium" className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl transition-all duration-300">Premium</Button>
                      <Button variant="soft" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">Soft</Button>
                      <Button className="bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]">Glow Effect</Button>
                      <Button className="bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20">Glass</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Card Variants */}
                <Card>
                  <CardHeader>
                    <CardTitle>Premium Cards</CardTitle>
                    <CardDescription>Enhanced card designs with sophisticated effects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle>Elegant Card</CardTitle>
                          <CardDescription>Enhanced shadow system</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Text size="sm">Sophisticated layered shadows for depth</Text>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 shadow-[0_8px_30px_-10px_rgba(330,81%,60%,0.3)]">
                        <CardHeader>
                          <CardTitle>Brand Tinted</CardTitle>
                          <CardDescription>Subtle brand colors</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Text size="sm">Warm brand tints with romantic shadows</Text>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.37)]">
                        <CardHeader>
                          <CardTitle>Glass Morphism</CardTitle>
                          <CardDescription>Modern glass effect</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Text size="sm">Translucent with backdrop blur</Text>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Input Enhancements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Premium Inputs</CardTitle>
                    <CardDescription>Refined form controls with elegant focus states</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Text size="sm" weight="medium" className="mb-2">Standard Input</Text>
                          <Input placeholder="Enter your message..." />
                        </div>
                        <div>
                          <Text size="sm" weight="medium" className="mb-2">Premium Focus</Text>
                          <Input 
                            placeholder="Enhanced focus state..." 
                            className="focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Text size="sm" weight="medium" className="mb-2">Glass Style</Text>
                          <Input 
                            placeholder="Glass morphism input..." 
                            className="bg-white/10 backdrop-blur-md border-white/20 placeholder:text-muted-foreground/70"
                          />
                        </div>
                        <div>
                          <Text size="sm" weight="medium" className="mb-2">Romantic Glow</Text>
                          <Input 
                            placeholder="With romantic glow..." 
                            className="focus:shadow-[0_0_20px_rgba(330,81%,60%,0.3)] transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Effects Tab */}
          <TabsContent value="effects" className="space-y-8">
            <div>
              <Heading size="h2" className="mb-6">Advanced Visual Effects</Heading>
              
              <Card>
                <CardHeader>
                  <CardTitle>Shadow System</CardTitle>
                  <CardDescription>Layered shadows with brand-specific enhancements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {shadowExamples.map((shadow, index) => (
                      <div key={index} className="text-center">
                        <div className={`w-24 h-24 mx-auto mb-3 bg-white rounded-lg ${shadow.class} flex items-center justify-center`}>
                          <Heart className="w-6 h-6 text-primary" />
                        </div>
                        <Text size="sm" weight="medium">{shadow.name}</Text>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gradient System</CardTitle>
                  <CardDescription>Multi-stop romantic palettes for premium feel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-32 rounded-lg bg-gradient-to-r from-primary via-secondary to-accent shadow-lg flex items-center justify-center">
                      <Text className="text-white font-medium">Romantic Spectrum</Text>
                    </div>
                    <div className="h-32 rounded-lg bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 border border-primary/20 flex items-center justify-center">
                      <Text className="text-foreground font-medium">Subtle Brand Wash</Text>
                    </div>
                    <div className="h-32 rounded-lg bg-gradient-to-r from-amber-200 via-pink-200 to-purple-200 shadow-lg flex items-center justify-center">
                      <Text className="text-gray-800 font-medium">Sunset Romance</Text>
                    </div>
                    <div className="h-32 rounded-lg bg-gradient-to-br from-white/20 to-primary/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                      <Text className="text-foreground font-medium">Glass Gradient</Text>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Brand Tab */}
          <TabsContent value="brand" className="space-y-8">
            <div>
              <Heading size="h2" className="mb-6">Dating App Specific Features</Heading>
              
              <div className="grid gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Premium Badges & Status</CardTitle>
                    <CardDescription>Sophisticated indicators for dating app features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Badge className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">Premium Member</Badge>
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                        <Star className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                      <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg">Online</Badge>
                      <Badge className="bg-white/10 backdrop-blur-md border border-white/20 text-foreground">Recently Active</Badge>
                      <Badge className="bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                        <Heart className="w-3 h-3 mr-1" />
                        Super Like
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Intimate Spacing System</CardTitle>
                    <CardDescription>Comfortable layouts designed for dating interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
                        <Text weight="medium" className="mb-2">Intimate Content Spacing</Text>
                        <Text size="sm" className="text-muted-foreground mb-4">Optimized for personal conversations and romantic content</Text>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
                          <div>
                            <Text size="sm" weight="medium">Sarah, 28</Text>
                            <Text size="xs" className="text-muted-foreground">2 miles away</Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-8">
            <div>
              <Heading size="h2" className="mb-6">Real-World Application Preview</Heading>
              
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 shadow-[0_20px_50px_-10px_rgba(330,81%,60%,0.3)]">
                <CardHeader>
                  <CardTitle>Premium VybePulse Experience</CardTitle>
                  <CardDescription>How the enhanced design system elevates the user experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Mock Profile Card */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.37)]">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg" />
                        <div>
                          <Heading size="h4">Emma</Heading>
                          <Text size="sm" className="text-muted-foreground">25 • Designer</Text>
                          <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg mt-1">Online</Badge>
                        </div>
                      </div>
                      <Text size="sm" className="mb-4">Love trying new restaurants and cozy coffee shops. Looking for someone to share adventures with! ✨</Text>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl transition-all duration-300">
                          <Heart className="w-4 h-4 mr-1" />
                          Like
                        </Button>
                        <Button size="sm" variant="outline" className="backdrop-blur-md bg-white/10 border-white/20">
                          Pass
                        </Button>
                      </div>
                    </div>

                    {/* Mock Venue Card */}
                    <div className="bg-gradient-to-br from-white to-primary/5 rounded-xl p-6 border border-primary/10 shadow-[0_10px_30px_-10px_rgba(330,81%,60%,0.3)]">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Heading size="h4">The Garden Bistro</Heading>
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                            <Star className="w-3 h-3 mr-1" />
                            4.8
                          </Badge>
                        </div>
                        <Text size="sm" className="text-muted-foreground">Romantic • French • $$</Text>
                      </div>
                      <Text size="sm" className="mb-4">Intimate garden setting with candlelit tables. Perfect for a romantic first date with exceptional wine selection.</Text>
                      <Button size="sm" className="w-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl transition-all duration-300">
                        Book Date Here
                      </Button>
                    </div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 rounded-lg border border-primary/20">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <Text weight="medium" className="mb-2">Enhanced User Experience</Text>
                    <Text size="sm" className="text-muted-foreground">The premium design system creates a more sophisticated, trustworthy, and emotionally engaging experience for users finding love.</Text>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PremiumDesignSystemDemo;