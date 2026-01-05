import { Monitor, Moon, Sun, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const themeOptions = [
  {
    value: 'system',
    label: 'System',
    description: 'Automatically match your device',
    icon: Monitor,
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Always use light mode',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Always use dark mode',
    icon: Moon,
  },
];

export function ThemeSettingsCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Sun className="h-4 w-4 text-primary" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={theme}
          onValueChange={setTheme}
          className="space-y-3"
        >
          {themeOptions.map((option) => {
            const isSelected = theme === option.value;
            return (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
                  "hover:bg-accent/50",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-glow-sm scale-[1.02]" 
                    : "border-border/50"
                )}
              >
                <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <option.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary animate-scale-in" />
                )}
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

export default ThemeSettingsCard;
