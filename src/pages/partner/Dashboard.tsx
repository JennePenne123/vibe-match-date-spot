import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Users, Gift } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PartnerDashboard() {
  const { role, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, loading, navigate]);

  if (loading) {
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
            Partner Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your venues and vouchers
          </p>
        </div>
        <Badge variant="default" className="text-sm">
          <Sparkles className="w-3 h-3 mr-1" />
          Venue Partner
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Vouchers</CardTitle>
            <Gift className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active offers</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Vouchers claimed</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">New bookings</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Managed Venues</CardTitle>
            <Sparkles className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Active partnerships</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="elegant">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <h3 className="font-semibold">Connect Your Venue</h3>
              <p className="text-sm text-muted-foreground">
                Request partnership with your venue to start creating offers
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <h3 className="font-semibold">Create Vouchers</h3>
              <p className="text-sm text-muted-foreground">
                Design attractive offers to entice couples planning dates at your venue
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <h3 className="font-semibold">Track Performance</h3>
              <p className="text-sm text-muted-foreground">
                Monitor redemptions and optimize your offers for better results
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
