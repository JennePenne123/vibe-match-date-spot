import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Heart, Loader2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import SafeComponent from '@/components/SafeComponent';

import { usePreferencesState } from '@/hooks/usePreferencesState';
import {
  cuisines, allVibes, priceRanges, timePreferences, dietaryRequirements,
  durationModels, summaryText,
} from './preferences/preferencesData';
import { ChipGrid, Section } from './preferences/PreferenceChip';
import PreferencesConfirmScreen from './preferences/PreferencesConfirmScreen';
import DurationPicker from './preferences/DurationPicker';
import QuickStartTemplates from './preferences/QuickStartTemplates';
import DateTimePicker from './preferences/DateTimePicker';
import OccasionPicker from './preferences/OccasionPicker';
import MoodPicker from './preferences/MoodPicker';
import PriorityPicker from './preferences/PriorityPicker';
import { WaitingForPartner, AIAnalysisOverlay, RedirectingOverlay, SoloAIStatus } from './preferences/CollaborativeOverlays';

export interface PreferencesStepProps {
  sessionId: string;
  partnerId: string;
  partnerName: string;
  compatibilityScore: any;
  aiAnalyzing: boolean;
  onPreferencesComplete: (preferences: any) => void;
  initialProposedDate?: string;
  planningMode?: 'solo' | 'collaborative';
  collaborativeSession?: {
    hasUserSetPreferences: boolean;
    hasPartnerSetPreferences: boolean;
    canShowResults: boolean;
  };
  onManualContinue?: () => void;
  onDisplayVenues?: () => void;
  venueRecommendations?: any[];
}

const PreferencesStep: React.FC<PreferencesStepProps> = (props) => {
  const {
    partnerName, aiAnalyzing, initialProposedDate,
    planningMode = 'solo', collaborativeSession,
    onDisplayVenues, venueRecommendations = [],
  } = props;

  const state = usePreferencesState(props);
  const { t } = useTranslation();

  const {
    flowState, loading, hasSubmitted, onboardingPrefs, onboardingLoaded,
    selectedDuration, selectedCuisines, selectedVibes, selectedPriceRange,
    selectedTimePreferences, maxDistance, setMaxDistance, selectedDietary,
    selectedDate, selectedTime,
    selectedOccasion, setSelectedOccasion,
    selectedMood, setSelectedMood,
    priorityWeights, setPriorityWeights,
    autoNavigating, timeoutTriggered, openSections,
    durationModel, filteredVibes, filteredTemplates, learnedTemplate, status,
    toggleCuisine, toggleVibe, togglePrice, toggleTime, toggleDietary,
    isTemplateActive, applyTemplate, selectDuration,
    handleKeepPreferences, handleCustomize,
    handleDateChange, handleTimeChange, handleDisplayVenues,
    toggleSection, submitPreferences,
    user,
  } = state;

  // ── Loading ──────────────────────────────────────────────────────
  if (!onboardingLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // ── Confirm screen ──────────────────────────────────────────────
  if (flowState === 'confirm' && onboardingPrefs) {
    return (
      <PreferencesConfirmScreen
        onboardingPrefs={onboardingPrefs}
        onKeep={handleKeepPreferences}
        onCustomize={handleCustomize}
      />
    );
  }

  // ── Customize screen ──────────────────────────────────────────
  return (
    <SafeComponent>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Dein Date planen</h2>
          </div>
          {planningMode === 'collaborative' && (
            <div className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-full', status.userCompleted ? 'bg-primary' : 'bg-muted-foreground/30')} />
              <div className={cn('w-2 h-2 rounded-full', status.partnerCompleted ? 'bg-primary' : 'bg-muted-foreground/30')} />
            </div>
          )}
        </div>

        {/* Duration */}
        <DurationPicker selectedDuration={selectedDuration} onSelectDuration={selectDuration} />

        {/* Occasion */}
        <OccasionPicker selectedOccasion={selectedOccasion} onSelectOccasion={setSelectedOccasion} />

        {/* Mood */}
        <MoodPicker selectedMood={selectedMood} onSelectMood={setSelectedMood} />

        {/* Priority Weights */}
        <PriorityPicker weights={priorityWeights} onChangeWeights={setPriorityWeights} />

        {/* Quick Start + Sections — only after duration selected */}
        {selectedDuration && (
          <>
            <QuickStartTemplates
              templates={filteredTemplates}
              learnedTemplate={learnedTemplate}
              isTemplateActive={isTemplateActive}
              onApplyTemplate={applyTemplate}
              onApplyLearnedTemplate={applyTemplate}
            />

            {/* Accordion Sections */}
            <div className="space-y-2">
              <Section id="cuisine" icon={<span className="text-sm">🍽️</span>} title="Küche"
                summary={summaryText(selectedCuisines, cuisines)} count={selectedCuisines.length}
                open={openSections.includes('cuisine')} onToggle={() => toggleSection('cuisine')}>
                <ChipGrid items={cuisines} selected={selectedCuisines} onToggle={toggleCuisine} />
              </Section>

              <Section id="vibes" icon={<span className="text-sm">✨</span>} title="Vibe"
                summary={summaryText(selectedVibes, allVibes)} count={selectedVibes.length}
                open={openSections.includes('vibes')} onToggle={() => toggleSection('vibes')}>
                {durationModel?.excludeVibes.length ? (
                  <p className="text-xs text-muted-foreground mb-2 italic">Einige Vibes basierend auf Zeitmodell ausgeblendet</p>
                ) : null}
                <ChipGrid items={filteredVibes} selected={selectedVibes} onToggle={toggleVibe} />
              </Section>

              <Section id="budget" icon={<span className="text-sm">💰</span>} title="Budget"
                summary={summaryText(selectedPriceRange, priceRanges)} count={selectedPriceRange.length}
                open={openSections.includes('budget')} onToggle={() => toggleSection('budget')}>
                <ChipGrid items={priceRanges} selected={selectedPriceRange} onToggle={togglePrice} />
              </Section>

              <Section id="time" icon={<span className="text-sm">🕐</span>} title="Tageszeit"
                summary={summaryText(selectedTimePreferences, timePreferences)} count={selectedTimePreferences.length}
                open={openSections.includes('time')} onToggle={() => toggleSection('time')}>
                <ChipGrid items={timePreferences} selected={selectedTimePreferences} onToggle={toggleTime} />
              </Section>

              <Section id="advanced" icon={<Settings className="w-4 h-4 text-muted-foreground" />} title="Erweitert"
                summary={`${maxDistance} km${selectedDietary.length > 0 ? ` · ${selectedDietary.length} Diät` : ''}`} count={selectedDietary.length}
                open={openSections.includes('advanced')} onToggle={() => toggleSection('advanced')}>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Entfernung</p>
                    <Slider value={[maxDistance]} onValueChange={v => setMaxDistance(v[0])} max={50} min={1} step={1} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>1 km</span>
                      <span className="font-medium text-foreground">{maxDistance} km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Diät / Unverträglichkeiten</p>
                    <ChipGrid items={dietaryRequirements} selected={selectedDietary} onToggle={toggleDietary} />
                  </div>
                </div>
              </Section>
            </div>
          </>
        )}

        {/* Date & Time Picker */}
        <DateTimePicker
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          initialProposedDate={initialProposedDate}
          onDateChange={handleDateChange}
          onTimeChange={handleTimeChange}
        />

        {/* Selection summary */}
        {(selectedCuisines.length > 0 || selectedVibes.length > 0) && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border">
            <p className="text-xs font-medium text-muted-foreground">Deine Auswahl</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedDuration && (
                <Badge variant="outline" className="text-xs">
                  {durationModels.find(d => d.id === selectedDuration)?.emoji} {durationModels.find(d => d.id === selectedDuration)?.title}
                </Badge>
              )}
              {selectedCuisines.slice(0, 3).map(c => <Badge key={c} variant="outline" className="text-xs">{cuisines.find(x => x.id === c)?.emoji} {c}</Badge>)}
              {selectedCuisines.length > 3 && <Badge variant="outline" className="text-xs">+{selectedCuisines.length - 3}</Badge>}
              {selectedVibes.slice(0, 3).map(v => <Badge key={v} variant="outline" className="text-xs">{allVibes.find(x => x.id === v)?.emoji} {v}</Badge>)}
              {selectedVibes.length > 3 && <Badge variant="outline" className="text-xs">+{selectedVibes.length - 3}</Badge>}
            </div>
          </div>
        )}

        {/* Spacer for sticky button */}
        <div className="h-16" />
      </div>

      {/* Sticky bottom button */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-3 -mx-1 flex items-center gap-3 z-10">
        {onboardingPrefs && (
          <Button onClick={() => state.setFlowState('confirm')} variant="outline" className="active:scale-[0.97] transition-transform">
            Zurück
          </Button>
        )}
        <Button onClick={submitPreferences} disabled={loading || !selectedDuration} className="flex-1 h-12 text-base font-semibold active:scale-[0.97] transition-transform">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichern...</> : '🚀 Los geht\'s'}
        </Button>
      </div>

      {/* Collaborative: Waiting for partner */}
      {planningMode === 'collaborative' && collaborativeSession && status.userCompleted && hasSubmitted && !status.partnerCompleted && (
        <WaitingForPartner
          partnerName={partnerName}
          sessionId={props.sessionId}
          userCompleted={status.userCompleted}
          partnerCompleted={status.partnerCompleted}
          currentUserName={user?.name || 'Du'}
        />
      )}

      {/* AI Analysis Overlay */}
      {planningMode === 'collaborative' && collaborativeSession?.hasUserSetPreferences && collaborativeSession?.hasPartnerSetPreferences && hasSubmitted && aiAnalyzing && (
        <AIAnalysisOverlay timeoutTriggered={timeoutTriggered} />
      )}

      {/* Redirecting Overlay */}
      {planningMode === 'collaborative' && collaborativeSession?.hasUserSetPreferences && collaborativeSession?.hasPartnerSetPreferences && hasSubmitted && !aiAnalyzing && (
        <RedirectingOverlay
          autoNavigating={autoNavigating}
          venueCount={venueRecommendations.length}
          onDisplayVenues={handleDisplayVenues}
        />
      )}

      {/* Solo mode AI status */}
      {planningMode !== 'collaborative' && aiAnalyzing && <SoloAIStatus />}
    </SafeComponent>
  );
};

export default PreferencesStep;
