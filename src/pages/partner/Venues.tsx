import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Globe, Plus } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface Partnership {
  id: string;
  status: string;
  created_at: string;
  venue_id: string;
  venues: {
    name: string;
    address: string;
    cuisine_type: string;
    phone: string;
    website: string;
    rating: number;
  };
}

export default function PartnerVenues() {
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    fetchPartnerships();
  }, []);

  const fetchPartnerships = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('venue_partnerships')
        .select('*, venues(*)')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartnerships(data || []);
    } catch (error) {
      console.error('Error fetching partnerships:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venues',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
            My Venues
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your venue partnerships
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Request Partnership
        </Button>
      </div>

      {partnerships.length === 0 ? (
        <Card variant="elegant" className="text-center py-12">
          <CardContent>
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No venues yet</h3>
            <p className="text-muted-foreground mb-6">
              Request partnership with a venue to start managing vouchers and offers
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Request Your First Partnership
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {partnerships.map((partnership) => (
            <Card key={partnership.id} variant="glass" className="hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{partnership.venues.name}</CardTitle>
                    <Badge 
                      variant={partnership.status === 'active' ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {partnership.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{partnership.venues.rating}</div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{partnership.venues.address}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Cuisine:</span>
                  <Badge variant="outline">{partnership.venues.cuisine_type}</Badge>
                </div>

                {partnership.venues.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{partnership.venues.phone}</span>
                  </div>
                )}

                {partnership.venues.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={partnership.venues.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                {partnership.status === 'active' && (
                  <Button className="w-full mt-4" variant="outline">
                    Manage Venue
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
