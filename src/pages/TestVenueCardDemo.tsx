import React from 'react';
import TestVenueCard from '@/components/TestVenueCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Venue } from '@/types';

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Venue Card Demo</h1>
        <p className="text-muted-foreground">
          Testing the new venue card design based on the reference image
        </p>
      </div>

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

      {/* Original reference info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Reference Design Info</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>This component recreates the design pattern from your reference image:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Partner names at the top with date type badge</li>
            <li>Venue name with star rating</li>
            <li>Date/time with clock icon</li>
            <li>Category with list icon</li>
            <li>Avatar photos on the right side</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestVenueCardDemo;