import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Moon, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Import modern components
import {
  ModernVenueCard,
  ModernSearchBar,
  ModernFilterChips,
  ModernBottomNav,
  ModernRating,
  ModernPriceLevel,
  ModernDistanceBadge,
  ModernStatusBadge,
  ModernCategoryBadge,
  ModernCardSkeleton,
  ModernSkeletonGrid,
} from '@/design-system/components/modern';

import { modernColors, modernSpacing, modernTypography, modernGlass } from '@/design-system/tokens/modern';

const ModernDesignSystemDemo: React.FC = () => {
  const navigate = useNavigate();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [activeNav, setActiveNav] = useState('discover');
  const [searchValue, setSearchValue] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(id);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  // Sample venue data
  const sampleVenue = {
    id: '1',
    name: 'The Velvet Lounge',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=450&fit=crop',
    category: 'bars' as const,
    location: 'Downtown District, 123 Main St',
    rating: 4.7,
    reviewCount: 342,
    priceLevel: 3 as const,
    distance: '1.2 km',
    isOpen: true,
    closingTime: '2:00 AM',
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/90 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Modern Design System
              </h1>
              <p className="text-sm text-slate-400">Dark theme • Venue Discovery</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
            <Moon className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-slate-300">Dark Mode</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-2 bg-slate-800/50 p-2 rounded-2xl mb-8">
            {['Colors', 'Typography', 'Effects', 'Components', 'Cards', 'Interactions'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase()}
                className="flex-1 min-w-[100px] rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white transition-all duration-300"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            {/* Primary Colors */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Primary Colors</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: 'Primary', color: modernColors.primary.DEFAULT, tailwind: 'indigo-500' },
                  { name: 'Secondary', color: modernColors.secondary.DEFAULT, tailwind: 'violet-500' },
                  { name: 'Accent', color: modernColors.accent.DEFAULT, tailwind: 'pink-500' },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer"
                    onClick={() => copyToClipboard(item.color, item.name)}
                  >
                    <div
                      className="h-32 transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                      {copiedColor === item.name ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <Copy className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="p-4 bg-slate-800">
                      <p className="font-semibold text-slate-100">{item.name}</p>
                      <p className="text-sm text-slate-400">{item.color}</p>
                      <p className="text-xs text-slate-500">{item.tailwind}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Semantic Colors */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Semantic Colors</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: 'Success', color: modernColors.success.DEFAULT, tailwind: 'emerald-500' },
                  { name: 'Warning', color: modernColors.warning.DEFAULT, tailwind: 'amber-500' },
                  { name: 'Error', color: modernColors.error.DEFAULT, tailwind: 'red-500' },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer"
                    onClick={() => copyToClipboard(item.color, item.name)}
                  >
                    <div
                      className="h-24 transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="p-3 bg-slate-800">
                      <p className="font-semibold text-slate-100">{item.name}</p>
                      <p className="text-sm text-slate-400">{item.color}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Neutral Palette */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Neutral Palette</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(modernColors.neutrals).map(([name, color]) => (
                  <div
                    key={name}
                    className="group relative rounded-xl overflow-hidden cursor-pointer border border-slate-700"
                    onClick={() => copyToClipboard(color, name)}
                  >
                    <div
                      className="h-20 transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: color }}
                    />
                    <div className="p-2 bg-slate-800">
                      <p className="text-xs font-medium text-slate-300 capitalize truncate">{name}</p>
                      <p className="text-xs text-slate-500">{color}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Gradient Examples */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Gradients</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Primary Gradient', class: 'bg-gradient-to-r from-indigo-500 to-violet-500' },
                  { name: 'Accent Gradient', class: 'bg-gradient-to-r from-pink-500 to-rose-500' },
                  { name: 'Success Gradient', class: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
                  { name: 'Image Overlay', class: 'bg-gradient-to-t from-black/60 via-black/20 to-transparent' },
                ].map((item) => (
                  <div key={item.name} className="rounded-xl overflow-hidden">
                    <div className={cn('h-24', item.class)} />
                    <div className="p-3 bg-slate-800">
                      <p className="font-medium text-slate-200">{item.name}</p>
                      <code className="text-xs text-slate-400">{item.class}</code>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-8">
            {/* Headings */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Headings</h2>
              <div className="space-y-6 p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="text-xs text-slate-400 mb-2">H1 - 36px / Bold</p>
                  <h1 className="text-4xl font-bold text-slate-50">Discover Amazing Venues</h1>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">H2 - 30px / Bold</p>
                  <h2 className="text-3xl font-bold text-slate-50">Featured Locations</h2>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">H3 - 24px / Semibold</p>
                  <h3 className="text-2xl font-semibold text-slate-50">Popular This Week</h3>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">H4 - 20px / Semibold</p>
                  <h4 className="text-xl font-semibold text-slate-50">Near Your Location</h4>
                </div>
              </div>
            </section>

            {/* Body Text */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Body Text</h2>
              <div className="space-y-4 p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="text-xs text-slate-400 mb-2">Large - 18px</p>
                  <p className="text-lg text-slate-200">
                    Explore the best venues in your city with personalized recommendations.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Base - 16px</p>
                  <p className="text-base text-slate-300">
                    From cozy cafés to vibrant nightclubs, find your perfect spot.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Small - 14px</p>
                  <p className="text-sm text-slate-400">
                    Filter by category, price, and distance to narrow down your search.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Tiny - 12px</p>
                  <p className="text-xs text-slate-500">
                    Last updated 2 hours ago • 342 reviews
                  </p>
                </div>
              </div>
            </section>

            {/* Font Stack */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Font Family</h2>
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                <code className="text-sm text-slate-300 break-all">
                  {modernTypography.fontFamily}
                </code>
              </div>
            </section>
          </TabsContent>

          {/* Effects Tab */}
          <TabsContent value="effects" className="space-y-8">
            {/* Glass Morphism */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Glass Morphism</h2>
              <div 
                className="relative p-8 rounded-2xl overflow-hidden"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop)',
                  backgroundSize: 'cover',
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Card Glass', class: modernGlass.card },
                    { name: 'Header Glass', class: modernGlass.header },
                    { name: 'Button Glass', class: modernGlass.button },
                    { name: 'Input Glass', class: modernGlass.input },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className={cn('p-6 rounded-xl', item.class)}
                    >
                      <p className="font-semibold text-white">{item.name}</p>
                      <code className="text-xs text-white/70 block mt-2">{item.class}</code>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Shadows */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Shadows & Glows</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { name: 'Default Shadow', class: 'shadow-lg shadow-black/25' },
                  { name: 'Hover Shadow', class: 'shadow-2xl shadow-black/40' },
                  { name: 'Primary Glow', class: 'shadow-lg shadow-indigo-500/40 border border-indigo-500/30' },
                  { name: 'Accent Glow', class: 'shadow-lg shadow-pink-500/40 border border-pink-500/30' },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={cn(
                      'p-6 rounded-xl bg-slate-800 transition-all duration-300',
                      item.class
                    )}
                  >
                    <p className="font-medium text-slate-200">{item.name}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Loading Shimmer */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Loading States</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ModernCardSkeleton />
                <ModernCardSkeleton />
                <ModernCardSkeleton />
              </div>
            </section>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            {/* Search Bar */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Search Bar</h2>
              <div className="max-w-xl">
                <ModernSearchBar
                  value={searchValue}
                  onChange={setSearchValue}
                  filterCount={selectedFilters.length}
                  onFilterClick={() => {}}
                />
              </div>
            </section>

            {/* Filter Chips */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Filter Chips</h2>
              <ModernFilterChips
                selectedIds={selectedFilters}
                onChange={setSelectedFilters}
              />
              <p className="mt-4 text-sm text-slate-400">
                Selected: {selectedFilters.length > 0 ? selectedFilters.join(', ') : 'None'}
              </p>
            </section>

            {/* Rating & Price */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Ratings & Prices</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-slate-800/50 space-y-4">
                  <p className="text-sm text-slate-400">Rating Sizes</p>
                  <ModernRating rating={4.7} size="sm" reviewCount={42} />
                  <ModernRating rating={4.2} size="md" reviewCount={128} />
                  <ModernRating rating={3.5} size="lg" reviewCount={89} />
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 space-y-4">
                  <p className="text-sm text-slate-400">Price Levels</p>
                  <div className="flex items-center gap-4">
                    <ModernPriceLevel level={1} /> <span className="text-slate-400">Budget</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <ModernPriceLevel level={2} /> <span className="text-slate-400">Moderate</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <ModernPriceLevel level={3} /> <span className="text-slate-400">Upscale</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <ModernPriceLevel level={4} /> <span className="text-slate-400">Premium</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Status Badges */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Status Badges</h2>
              <div className="flex flex-wrap gap-4">
                <ModernStatusBadge status="open" closingTime="2:00 AM" />
                <ModernStatusBadge status="closingSoon" closingTime="30 min" />
                <ModernStatusBadge status="closed" />
              </div>
            </section>

            {/* Category Badges */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Category Badges</h2>
              <div className="flex flex-wrap gap-3">
                <ModernCategoryBadge category="restaurants" />
                <ModernCategoryBadge category="bars" />
                <ModernCategoryBadge category="clubs" />
                <ModernCategoryBadge category="cafes" />
                <ModernCategoryBadge category="liveMusic" />
                <ModernCategoryBadge category="events" />
              </div>
            </section>

            {/* Distance Badges */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Distance Badges</h2>
              <div className="flex flex-wrap gap-3">
                <ModernDistanceBadge distance="350 m" icon="walk" />
                <ModernDistanceBadge distance="1.2 km" icon="drive" />
                <ModernDistanceBadge distance="5.8 km" />
              </div>
            </section>

            {/* Bottom Navigation */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Bottom Navigation</h2>
              <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-700">
                <ModernBottomNav
                  activeId={activeNav}
                  onChange={setActiveNav}
                />
              </div>
            </section>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Venue Card</h2>
              <p className="text-slate-400 mb-6">
                Interactive venue card with glass morphism, hover effects, and favorite animation.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <ModernVenueCard {...sampleVenue} />
                <ModernVenueCard
                  id="2"
                  name="Rooftop Garden Café"
                  image="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=450&fit=crop"
                  category="cafes"
                  location="Arts District, 456 Park Ave"
                  rating={4.3}
                  reviewCount={189}
                  priceLevel={2}
                  distance="850 m"
                  isOpen={true}
                  closingTime="10:00 PM"
                />
                <ModernVenueCard
                  id="3"
                  name="Electric Underground"
                  image="https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&h=450&fit=crop"
                  category="clubs"
                  location="Warehouse District"
                  rating={4.9}
                  reviewCount={567}
                  priceLevel={4}
                  distance="2.3 km"
                  isOpen={false}
                />
              </div>
            </section>

            {/* Responsive Grid Preview */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Responsive Grid</h2>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
                    Mobile: 1 column
                  </span>
                  <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300">
                    Tablet (768px+): 2 columns
                  </span>
                  <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300">
                    Desktop (1024px+): 3 columns
                  </span>
                </div>
                <code className="block mt-4 text-xs text-slate-500">
                  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6
                </code>
              </div>
            </section>
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent value="interactions" className="space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Micro-interactions</h2>
              <p className="text-slate-400 mb-6">
                Click/tap the elements to see the animations in action.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Card Tap */}
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h3 className="font-semibold text-slate-200 mb-4">Card Tap Effect</h3>
                  <button
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold transition-transform active:scale-[0.98] hover:scale-[1.02]"
                  >
                    Tap me!
                  </button>
                  <code className="block mt-4 text-xs text-slate-500">
                    active:scale-[0.98] hover:scale-[1.02]
                  </code>
                </div>

                {/* Heart Bounce */}
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h3 className="font-semibold text-slate-200 mb-4">Heart Bounce</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Click the heart icon on any venue card above to see the bounce animation.
                  </p>
                  <code className="block text-xs text-slate-500">
                    animate-[heartBounce_400ms_ease-in-out]
                  </code>
                </div>

                {/* Filter Ripple */}
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h3 className="font-semibold text-slate-200 mb-4">Filter Ripple</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Click any filter chip in the Components tab to see the ripple effect.
                  </p>
                  <code className="block text-xs text-slate-500">
                    animate-[ripple_600ms_ease-out_forwards]
                  </code>
                </div>

                {/* Shimmer Loading */}
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h3 className="font-semibold text-slate-200 mb-4">Shimmer Loading</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    See the Effects tab for loading skeleton examples.
                  </p>
                  <code className="block text-xs text-slate-500">
                    animate-[shimmer_1.5s_ease-in-out_infinite]
                  </code>
                </div>
              </div>
            </section>

            {/* Transition Durations */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Transition Durations</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'Fast', duration: '150ms', class: 'duration-150' },
                  { name: 'Default', duration: '300ms', class: 'duration-300' },
                  { name: 'Slow', duration: '500ms', class: 'duration-500' },
                ].map((item) => (
                  <button
                    key={item.name}
                    className={cn(
                      'p-4 rounded-xl bg-slate-700 hover:bg-indigo-600 transition-colors text-center',
                      item.class
                    )}
                  >
                    <p className="font-semibold text-slate-200">{item.name}</p>
                    <p className="text-sm text-slate-400">{item.duration}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Accessibility */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-100">Accessibility</h2>
              <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
                    44px
                  </div>
                  <p className="text-slate-300">Minimum touch target size: 44×44px</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-700 border-2 border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900" />
                  <p className="text-slate-300">Focus indicator: 2px ring, 2px offset</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-50">Text</span>
                  <span className="text-slate-300">Secondary</span>
                  <span className="text-slate-400">Muted</span>
                  <p className="text-slate-500 ml-4">Contrast ratio: ≥4.5:1</p>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ModernDesignSystemDemo;
