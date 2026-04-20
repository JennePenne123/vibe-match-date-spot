import React, { useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MapPin, Sparkles } from 'lucide-react'

type CategoryId = 'culture' | 'activity' | 'nightlife'

type Preset = { id: string; name: string; lat: number; lng: number }

const PRESETS: Preset[] = [
  { id: 'hamburg', name: 'Hamburg', lat: 53.5511, lng: 9.9937 },
  { id: 'berlin', name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { id: 'muenchen', name: 'München', lat: 48.1351, lng: 11.5820 },
  { id: 'koeln', name: 'Köln', lat: 50.9375, lng: 6.9603 },
  { id: 'frankfurt', name: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
]

type RunResult = {
  total_saved: number
  per_category: Record<string, { fetched: number; saved: number }>
  location: { latitude: number; longitude: number; radius_km: number }
}

const VenueDiscovery: React.FC = () => {
  const { toast } = useToast()
  const [lat, setLat] = useState<string>('53.5511')
  const [lng, setLng] = useState<string>('9.9937')
  const [radius, setRadius] = useState<string>('25')
  const [categories, setCategories] = useState<Record<CategoryId, boolean>>({
    culture: true,
    activity: true,
    nightlife: true,
  })
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)

  const selectedCategories = useMemo(
    () => (Object.entries(categories).filter(([, v]) => v).map(([k]) => k) as CategoryId[]),
    [categories],
  )

  const applyPreset = (p: Preset) => {
    setLat(String(p.lat))
    setLng(String(p.lng))
  }

  const toggle = (id: CategoryId) =>
    setCategories((prev) => ({ ...prev, [id]: !prev[id] }))

  const run = async () => {
    const latNum = Number(lat)
    const lngNum = Number(lng)
    const radiusNum = Number(radius)
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      toast({ title: 'Ungültige Koordinaten', variant: 'destructive' })
      return
    }
    if (selectedCategories.length === 0) {
      toast({ title: 'Mindestens eine Kategorie wählen', variant: 'destructive' })
      return
    }

    setRunning(true)
    setResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('backfill-activities', {
        body: {
          latitude: latNum,
          longitude: lngNum,
          radius_km: radiusNum,
          categories: selectedCategories,
        },
      })
      if (error) throw error
      setResult(data as RunResult)
      toast({
        title: 'Backfill abgeschlossen',
        description: `${data?.total_saved ?? 0} Venues gespeichert`,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      toast({ title: 'Backfill fehlgeschlagen', description: msg, variant: 'destructive' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Venue Discovery
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Importiert gezielt Kultur-, Aktivitäts- und Nightlife-Venues aus OpenStreetMap für eine
          gewählte Region. Erweitert die Datenbasis für situative Empfehlungen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Region & Reichweite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.id} variant="outline" size="sm" onClick={() => applyPreset(p)}>
                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                {p.name}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="lat">Breitengrad</Label>
              <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lng">Längengrad</Label>
              <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="radius">Radius (km, max 50)</Label>
              <Input id="radius" type="number" min={1} max={50} value={radius}
                onChange={(e) => setRadius(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Kategorien</Label>
            <div className="flex flex-wrap gap-4">
              {(['culture', 'activity', 'nightlife'] as CategoryId[]).map((id) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={categories[id]} onCheckedChange={() => toggle(id)} />
                  <span className="text-sm capitalize">
                    {id === 'culture' ? 'Kultur' : id === 'activity' ? 'Aktivität' : 'Nightlife'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={run} disabled={running} className="w-full md:w-auto">
            {running ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importiere…</>
            ) : (
              'Backfill starten'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ergebnis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {result.location.latitude.toFixed(4)}, {result.location.longitude.toFixed(4)} · {result.location.radius_km} km
              </Badge>
              <Badge>{result.total_saved} gespeichert</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(result.per_category).map(([cat, stats]) => (
                <div key={cat} className="rounded-lg border border-border/50 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {cat === 'culture' ? 'Kultur' : cat === 'activity' ? 'Aktivität' : 'Nightlife'}
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {stats.saved} <span className="text-sm text-muted-foreground">/ {stats.fetched}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">gespeichert / gefunden</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default VenueDiscovery