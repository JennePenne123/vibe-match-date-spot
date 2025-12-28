import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
          {themeOptions.map((option) => (
            <Label
              key={option.value}
              htmlFor={option.value}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 cursor-pointer transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <option.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

export default ThemeSettingsCard;
