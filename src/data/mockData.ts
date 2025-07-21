
export interface DateInvite {
  id: string;
  friendName: string;
  friendAvatar: string;
  dateType: string;
  location: string;
  time: string;
  message: string;
  status: string;
  venueName: string;
  venueAddress: string;
  estimatedCost: string;
  duration: string;
  specialNotes: string;
  venueImage: string;
}

export const mockFriendInvitations: DateInvite[] = [
  {
    id: '1',
    friendName: 'Sarah Chen',
    friendAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    dateType: 'Coffee & Brunch',
    location: 'Downtown',
    time: '2:00 PM Today',
    message: 'Want to try that new cafe we talked about?',
    status: 'pending',
    venueName: 'Sunset Rooftop Cafe',
    venueAddress: '123 Main St, Downtown',
    estimatedCost: '$25-35 per person',
    duration: '2-3 hours',
    specialNotes: 'They have the best avocado toast in the city! Perfect spot for catching up.',
    venueImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    friendName: 'Mike Johnson',
    friendAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    dateType: 'Dinner & Movies',
    location: 'Uptown',
    time: '7:30 PM Tomorrow',
    message: 'New restaurant just opened! Should be amazing 🍽️',
    status: 'pending',
    venueName: 'The Garden Bistro',
    venueAddress: '456 Oak Ave, Uptown',
    estimatedCost: '$45-60 per person',
    duration: '3-4 hours',
    specialNotes: 'Award-winning chef, romantic atmosphere. Movie theater is just 2 blocks away!',
    venueImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
  },
  {
    id: '3',
    friendName: 'Emma Wilson',
    friendAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    dateType: 'Art Gallery',
    location: 'Arts District',
    time: '3:00 PM Saturday',
    message: 'There\'s a new exhibition opening this weekend!',
    status: 'pending',
    venueName: 'Modern Art Gallery',
    venueAddress: '789 Creative Blvd, Arts District',
    estimatedCost: '$15-20 per person',
    duration: '2-3 hours',
    specialNotes: 'Contemporary art exhibition featuring local artists. Wine tasting included!',
    venueImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
  }
];
