import React from 'react';
import TestVenueCard from '@/components/TestVenueCard';
import VenueCard from '@/components/VenueCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Venue } from '@/types';
import { mockVenues } from '@/data/mockVenues';

const TestVenueCardDemo = () => {
  // Sample venue data matching the reference design
  const sampleVenue: Venue = {
    id: 'test-1',
    name: 'Boucherie Union Square',
    rating: 4.9,
    address: '99 7th Ave S, New York, NY 10014',
    cuisine: 'French',
    price_range: '$$$',
    image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop'
  };

  const handleAccept = () => {
    console.log('Invitation accepted!');
  };

  const handleDecline = () => {
    console.log('Invitation declined!');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Venue Card Demo</h1>
        <p className="text-muted-foreground">
          Testing the new venue card design with invitation-style layout, accept/decline buttons, and gradient backgrounds
        </p>
      </div>

      {/* Original TestVenueCard Examples */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Original TestVenueCard Components</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Example 1: Default design */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Example 1: Default</CardTitle>
            </CardHeader>
            <CardContent>
              <TestVenueCard venue={sampleVenue} />
            </CardContent>
          </Card>

          {/* Example 2: Different date type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Example 2: Romantic Date</CardTitle>
            </CardHeader>
            <CardContent>
              <TestVenueCard 
                venue={sampleVenue}
                partnerNames={["Sarah", "Mike"]}
                dateType="Romantic date"
                dateTime="Tomorrow, 19:30"
                category="Fine Dining"
              />
            </CardContent>
          </Card>

          {/* Example 3: Group date */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Example 3: Group Date</CardTitle>
            </CardHeader>
            <CardContent>
              <TestVenueCard 
                venue={{
                  ...sampleVenue,
                  name: "Brooklyn Bowl",
                  rating: 4.5,
                  cuisine: "American"
                }}
                partnerNames={["Alex", "Jordan"]}
                dateType="Group hangout"
                dateTime="Friday, 20:00"
                category="Bowling & Drinks"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New VenueCard with Invitation Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">New VenueCard with Invitation Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Example 1: Double date invitation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Double Date Invitation</CardTitle>
            </CardHeader>
            <CardContent>
              <VenueCard 
                venue={mockVenues[0]}
                showInvitationActions={true}
                partnerNames={["Emma", "James"]}
                dateType="Double date"
                dateTime="Saturday, 19:00"
                category="Italian Dining"
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            </CardContent>
          </Card>

          {/* Example 2: Romantic date */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Romantic Date</CardTitle>
            </CardHeader>
            <CardContent>
              <VenueCard 
                venue={mockVenues[1]}
                showInvitationActions={true}
                partnerNames={["Sophie"]}
                dateType="Romantic date"
                dateTime="Friday, 20:30"
                category="Japanese Cuisine"
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            </CardContent>
          </Card>

          {/* Example 3: Group hangout */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group Hangout</CardTitle>
            </CardHeader>
            <CardContent>
              <VenueCard 
                venue={mockVenues[2]}
                showInvitationActions={true}
                partnerNames={["Alex", "Jordan", "Sam"]}
                dateType="Group hangout"
                dateTime="Tonight, 21:00"
                category="Mexican & Cocktails"
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Regular VenueCard with gradient background */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Regular VenueCard (with gradient background)</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockVenues.slice(0, 3).map((venue) => (
            <Card key={venue.id}>
              <CardContent className="p-2">
                <VenueCard venue={venue} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Reference design info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Updated Design Features</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>The VenueCard component now includes:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><strong>Invitation Mode:</strong> Partner names, date type badge, and accept/decline buttons</li>
            <li><strong>Gradient Background:</strong> Subtle gradient from background to muted/20 for visual depth</li>
            <li><strong>Avatar Support:</strong> Partner profile pictures or initials</li>
            <li><strong>Enhanced Actions:</strong> Accept/decline buttons with proper styling</li>
            <li><strong>Semantic Design:</strong> Uses design system tokens for consistent theming</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestVenueCardDemo;