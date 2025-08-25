import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Users, 
  Star, 
  Heart, 
  Zap, 
  Globe, 
  Palette, 
  Sparkles,
  Brain,
  Target,
  Award,
  TrendingUp
} from 'lucide-react';

const UIDesignDemo = () => {
  const [progress, setProgress] = useState(65);
  const [isLearning, setIsLearning] = useState(true);

  // Color palette samples
  const colorPalette = [
    { name: 'Primary Blue', class: 'bg-primary', hsl: 'hsl(200, 85%, 70%)' },
    { name: 'Secondary Green', class: 'bg-secondary', hsl: 'hsl(100, 65%, 75%)' },
    { name: 'Accent Pink', class: 'bg-accent', hsl: 'hsl(320, 70%, 80%)' },
    { name: 'Accent Yellow', class: 'bg-accent-yellow', hsl: 'hsl(50, 100%, 80%)' },
    { name: 'Accent Purple', class: 'bg-accent-purple', hsl: 'hsl(270, 60%, 80%)' },
    { name: 'Accent Coral', class: 'bg-accent-coral', hsl: 'hsl(15, 85%, 78%)' },
  ];

  const learningCards = [
    {
      title: "AI Fundamentals",
      description: "Master the basics of artificial intelligence",
      progress: 85,
      icon: Brain,
      color: "bg-primary"
    },
    {
      title: "Creative Writing",
      description: "Enhance your storytelling skills",
      progress: 60,
      icon: BookOpen,
      color: "bg-secondary"
    },
    {
      title: "Problem Solving",
      description: "Develop critical thinking abilities",
      progress: 40,
      icon: Target,
      color: "bg-accent"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-secondary-light/10">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Palette className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Educational UI Design System
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A playful, colorful design system inspired by modern learning environments. 
            Perfect for educational apps, creative platforms, and user-friendly interfaces.
          </p>
        </div>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="interactive">Interactive</TabsTrigger>
          </TabsList>

          {/* Color Palette Tab */}
          <TabsContent value="colors" className="space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Color Palette
                </CardTitle>
                <CardDescription>
                  Soft, educational-friendly colors designed for learning environments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {colorPalette.map((color, index) => (
                    <div key={index} className="space-y-2 animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className={`w-full h-20 rounded-lg ${color.class} shadow-md hover:shadow-lg transition-shadow duration-200`} />
                      <div className="text-sm">
                        <p className="font-medium">{color.name}</p>
                        <code className="text-xs text-muted-foreground">{color.hsl}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gradient Demonstrations */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Gradient Examples</CardTitle>
                <CardDescription>Educational-themed gradients for backgrounds and accents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-20 rounded-lg bg-gradient-learning shadow-md hover:shadow-lg transition-shadow duration-200">
                    <div className="h-full flex items-center justify-center text-white font-medium">
                      Learning Gradient
                    </div>
                  </div>
                  <div className="h-20 rounded-lg bg-gradient-focus shadow-md hover:shadow-lg transition-shadow duration-200">
                    <div className="h-full flex items-center justify-center text-white font-medium">
                      Focus Gradient
                    </div>
                  </div>
                  <div className="h-20 rounded-lg bg-gradient-success shadow-md hover:shadow-lg transition-shadow duration-200">
                    <div className="h-full flex items-center justify-center text-white font-medium">
                      Success Gradient
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buttons */}
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Buttons</CardTitle>
                  <CardDescription>Various button styles with the new color palette</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button>Primary Action</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Badges */}
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>Status indicators and labels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Alert</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary">Learning</Badge>
                    <Badge className="bg-secondary">Completed</Badge>
                    <Badge className="bg-accent">Creative</Badge>
                    <Badge className="bg-accent-yellow text-foreground">Featured</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Inputs */}
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Form Elements</CardTitle>
                  <CardDescription>Input fields and form controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Search for courses..." />
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={isLearning} 
                      onCheckedChange={setIsLearning}
                      id="learning-mode" 
                    />
                    <label htmlFor="learning-mode" className="text-sm font-medium">
                      Learning Mode
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Progress Indicators</CardTitle>
                  <CardDescription>Track learning progress and achievements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Course Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProgress(Math.min(100, progress + 10))}
                  >
                    Increase Progress
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {learningCards.map((card, index) => {
                const IconComponent = card.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-all duration-200 hover-scale animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${card.color} text-white`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{card.title}</CardTitle>
                          <CardDescription className="text-sm">{card.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{card.progress}%</span>
                        </div>
                        <Progress value={card.progress} className="h-2" />
                        <Button className="w-full" variant="outline">
                          Continue Learning
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <Card className="bg-gradient-learning text-white animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Global Learning
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Connect with learners worldwide and share knowledge across borders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Avatar key={i} className="h-8 w-8 border-2 border-white">
                          <AvatarFallback className="text-xs">U{i}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-sm">+1.2K active learners</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-focus text-white animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievement System
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Earn badges and unlock new levels as you progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-300 fill-current" />
                    <Star className="h-5 w-5 text-yellow-300 fill-current" />
                    <Star className="h-5 w-5 text-yellow-300 fill-current" />
                    <Star className="h-5 w-5 text-white/50" />
                    <Star className="h-5 w-5 text-white/50" />
                    <span className="ml-2 text-sm">Level 3 Achiever</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Interactive Tab */}
          <TabsContent value="interactive" className="space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent-yellow" />
                  Interactive Elements
                </CardTitle>
                <CardDescription>
                  Hover effects, animations, and interactive components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hover Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Primary', 'Secondary', 'Accent'].map((type, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover-scale ${
                        index === 0 ? 'bg-primary text-white' :
                        index === 1 ? 'bg-secondary text-white' :
                        'bg-accent text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-5 w-5" />
                        <h3 className="font-semibold">{type} Card</h3>
                      </div>
                      <p className="text-sm opacity-90">Hover to see the scale effect</p>
                    </div>
                  ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Active Users', value: '12.5K', icon: Users, color: 'text-primary' },
                    { label: 'Courses', value: '450+', icon: BookOpen, color: 'text-secondary' },
                    { label: 'Completion Rate', value: '89%', icon: TrendingUp, color: 'text-accent' },
                    { label: 'Satisfaction', value: '4.9★', icon: Star, color: 'text-accent-yellow' },
                  ].map((stat, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow duration-200 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                      <CardContent className="p-4 text-center">
                        <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button className="bg-primary hover:bg-primary-dark transition-colors">
                    Start Learning
                  </Button>
                  <Button className="bg-secondary hover:bg-secondary-dark transition-colors">
                    Join Community
                  </Button>
                  <Button className="bg-accent hover:bg-accent/80 transition-colors">
                    Get Premium
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-muted-foreground animate-fade-in">
          <p>Educational UI Design System - Perfect for learning platforms, creative tools, and user-friendly applications</p>
        </div>
      </div>
    </div>
  );
};

export default UIDesignDemo;