/**
 * RealtimeContextBanner
 * Shows the user which personalization signals are currently active
 * (weather, time-of-day, season, occasion, etc.)
 */

import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Zap, Clock, CalendarDays, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextBannerProps {
  userLocation?: { latitude: number; longitude: number } | null;
  occasion?: string | null;
  friendCount?: number;
  className?: string;
}

interface WeatherInfo {
  temp: number;
  code: number;
  label: string;
  isGood: boolean;
}

const OCCASION_LABELS: Record<string, string> = {
  first_date: '💕 Erstes Date',
  anniversary: '💍 Jahrestag',
  casual: '😊 Entspannt',
  birthday: '🎂 Geburtstag',
  friends_hangout: '🍻 Freunde-Treffen',
  special_celebration: '🥂 Besonderer Anlass',
};

function getTimeLabel(): { label: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return { label: 'Morgen-Modus', emoji: '🌅' };
  if (hour >= 11 && hour < 14) return { label: 'Lunch-Modus', emoji: '☀️' };
  if (hour >= 14 && hour < 17) return { label: 'Nachmittag', emoji: '🌤️' };
  if (hour >= 17 && hour < 20) return { label: 'Dinner-Modus', emoji: '🌆' };
  if (hour >= 20 && hour < 23) return { label: 'Abend-Modus', emoji: '🌙' };
  return { label: 'Late Night', emoji: '🌃' };
}

function getSeasonLabel(): { label: string; emoji: string } {
  const month = new Date().getMonth();
  if (month >= 3 && month <= 5) return { label: 'Frühling', emoji: '🌸' };
  if (month >= 6 && month <= 8) return { label: 'Sommer', emoji: '☀️' };
  if (month >= 9 && month <= 10) return { label: 'Herbst', emoji: '🍂' };
  return { label: 'Winter', emoji: '❄️' };
}

function getDayLabel(): string {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return days[new Date().getDay()];
}

function getWeatherIcon(code: number) {
  if (code >= 95) return <Zap className="w-3.5 h-3.5" />;
  if (code >= 71) return <Snowflake className="w-3.5 h-3.5" />;
  if (code >= 51) return <CloudRain className="w-3.5 h-3.5" />;
  if (code <= 3) return <Sun className="w-3.5 h-3.5" />;
  return <Cloud className="w-3.5 h-3.5" />;
}

const RealtimeContextBanner: React.FC<ContextBannerProps> = ({
  userLocation,
  occasion,
  friendCount = 0,
  className,
}) => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!userLocation?.latitude || !userLocation?.longitude) return;
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&current=temperature_2m,weather_code&timezone=auto`
        );
        if (!res.ok) return;
        const json = await res.json();
        const temp = json.current?.temperature_2m ?? 15;
        const code = json.current?.weather_code ?? 3;
        const BAD = new Set([51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]);
        const isGood = !BAD.has(code) && temp >= 10;
        const label = BAD.has(code)
          ? (code >= 95 ? 'Gewitter' : code >= 71 ? 'Schnee' : 'Regen')
          : (temp < 5 ? 'Kalt' : 'Schön');
        setWeather({ temp, code, label, isGood });
      } catch { /* silent */ }
    };
    fetchWeather();
  }, [userLocation?.latitude, userLocation?.longitude]);

  const time = getTimeLabel();
  const season = getSeasonLabel();
  const day = getDayLabel();

  const chips: { label: string; icon: React.ReactNode; color: string }[] = [];

  // Weather chip
  if (weather) {
    chips.push({
      label: `${Math.round(weather.temp)}°C · ${weather.label}`,
      icon: getWeatherIcon(weather.code),
      color: weather.isGood
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20'
        : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20',
    });
  }

  // Time chip
  chips.push({
    label: `${time.emoji} ${time.label}`,
    icon: <Clock className="w-3.5 h-3.5" />,
    color: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20',
  });

  // Day + Season chip
  chips.push({
    label: `${day} · ${season.emoji} ${season.label}`,
    icon: <CalendarDays className="w-3.5 h-3.5" />,
    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  });

  // Occasion chip
  if (occasion && OCCASION_LABELS[occasion]) {
    chips.push({
      label: OCCASION_LABELS[occasion],
      icon: <Sparkles className="w-3.5 h-3.5" />,
      color: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/20',
    });
  }

  // Friend count chip
  if (friendCount > 0) {
    chips.push({
      label: `${friendCount} Freunde einbezogen`,
      icon: <span className="text-xs">👥</span>,
      color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20',
    });
  }

  const visibleChips = expanded ? chips : chips.slice(0, 2);

  return (
    <div className={cn('rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-3', className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-2"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Personalisierung aktiv</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {chips.length} Signale
          </span>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
      </button>
      <div className="flex flex-wrap gap-1.5">
        {visibleChips.map((chip, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border',
              chip.color
            )}
          >
            {chip.icon}
            {chip.label}
          </div>
        ))}
        {!expanded && chips.length > 2 && (
          <div className="flex items-center px-2 py-1 rounded-full text-[11px] font-medium text-muted-foreground bg-muted/50 border border-border/30">
            +{chips.length - 2} mehr
          </div>
        )}
      </div>
    </div>
  );
};

export default RealtimeContextBanner;
