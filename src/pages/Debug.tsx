import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VenueMatchingDebug } from '@/components/debug/VenueMatchingDebug';
import TestUserDebugPanel from '@/components/debug/TestUserDebugPanel';
import { VenueAPITester } from '@/components/debug/VenueAPITester';
import { EdgeFunctionTester } from '@/components/debug/EdgeFunctionTester';
import { HamburgVenueTest } from '@/components/debug/HamburgVenueTest';
import InvitationTestButton from '@/components/debug/InvitationTestButton';
import { PreferencesReset } from '@/components/debug/PreferencesReset';
import SessionStatusDebug from '@/components/debug/SessionStatusDebug';
import { SmartPlannerDebug } from '@/components/debug/SmartPlannerDebug';
import { TestDataControls } from '@/components/debug/TestDataControls';
import { VenueSearchTester } from '@/components/debug/VenueSearchTester';
import { AIAnalysisTestButton } from '@/components/debug/AIAnalysisTestButton';
import { AIAnalysisDebugPanel } from '@/components/date-planning/AIAnalysisDebugPanel';
import CompatibilityDebug from '@/components/debug/CompatibilityDebug';
import { Settings, Code, Database, Users, MapPin, Trophy, Calendar } from 'lucide-react';
import { GamificationTester } from '@/components/debug/GamificationTester';

const Debug: React.FC = () => {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Debug tools are only available in development mode.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Settings className="h-6 w-6" />
          Debug Tools
        </h1>
        <p className="text-muted-foreground">
          Development tools for testing and debugging the application
        </p>
      </div>

      {/* User & Test Data Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User & Test Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TestUserDebugPanel />
          <TestDataControls />
          <PreferencesReset />
        </CardContent>
      </Card>

      {/* Venue & Matching Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Venue Matching & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VenueMatchingDebug />
          <VenueAPITester />
          <VenueSearchTester />
          <HamburgVenueTest />
        </CardContent>
      </Card>

      {/* AI & Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            AI Analysis & Smart Planning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AIAnalysisTestButton />
          <SmartPlannerDebug currentStep="preferences" />
        </CardContent>
      </Card>

      {/* Gamification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Gamification & Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <GamificationTester />
        </CardContent>
      </Card>

      {/* Smart Planning & Sessions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Smart Planning & Collaborative Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SessionStatusDebug />
          <SmartPlannerDebug currentStep="preferences" />
          <AIAnalysisDebugPanel 
            sessionId={undefined}
            partnerId={undefined}
            currentStep="preferences"
            sessionData={undefined}
            userLocation={undefined}
            onAnalysisComplete={() => {}}
          />
          <AIAnalysisTestButton />
          <CompatibilityDebug 
            compatibilityScore={null}
            partnerId={undefined}
            userId={undefined}
          />
          <InvitationTestButton />
        </CardContent>
      </Card>

      {/* Backend & Database Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backend & Database Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EdgeFunctionTester />
          <SessionStatusDebug />
          <InvitationTestButton />
        </CardContent>
      </Card>
    </div>
  );
};

export default Debug;