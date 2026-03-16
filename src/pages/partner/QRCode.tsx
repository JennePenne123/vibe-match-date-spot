import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { QrCode, ScanLine, Download, CheckCircle, XCircle, Handshake, Gift, Users, Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PartnerVenue {
  venue_id: string;
  venues: { name: string } | null;
}

interface ExclusiveVoucher {
  id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  code: string;
  status: string;
  valid_until: string;
  redeemed_at: string | null;
  created_at: string;
  offering_partner_id: string;
  receiving_partner_id: string;
  offering_venue_id: string | null;
}

interface ScanResult {
  status: 'success' | 'error' | 'already_connected';
  message: string;
  voucher?: {
    title: string;
    discount_value: number;
    code: string;
    venue_name: string;
  };
}

export default function PartnerQRCode({ defaultTab = 'my-qr' }: { defaultTab?: string }) {
  const { t } = useTranslation();
  const { role, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partnerVenues, setPartnerVenues] = useState<PartnerVenue[]>([]);
  const [receivedVouchers, setReceivedVouchers] = useState<ExclusiveVoucher[]>([]);
  const [offeredVouchers, setOfferedVouchers] = useState<ExclusiveVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [networkDiscount, setNetworkDiscount] = useState(15);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const DAILY_SCAN_LIMIT = 3;

  useEffect(() => {
    if (!roleLoading && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      // Fetch partner's venues
      const { data: venues } = await supabase
        .from('venue_partnerships')
        .select('venue_id, venues(name)')
        .eq('partner_id', user.id)
        .eq('status', 'active');

      const mappedVenues = (venues || []).map(v => ({
        venue_id: v.venue_id,
        venues: v.venues as unknown as { name: string } | null
      }));
      setPartnerVenues(mappedVenues);

      // Fetch own network discount setting
      const { data: partnerProfile } = await supabase
        .from('partner_profiles')
        .select('network_discount_value')
        .eq('user_id', user.id)
        .maybeSingle();

      if (partnerProfile?.network_discount_value != null) {
        setNetworkDiscount(Number(partnerProfile.network_discount_value));
      }

      // Fetch received exclusive vouchers
      const { data: received } = await supabase
        .from('partner_exclusive_vouchers')
        .select('*')
        .eq('receiving_partner_id', user.id)
        .order('created_at', { ascending: false });

      setReceivedVouchers((received as ExclusiveVoucher[]) || []);

      // Fetch offered exclusive vouchers
      const { data: offered } = await supabase
        .from('partner_exclusive_vouchers')
        .select('*')
        .eq('offering_partner_id', user.id)
        .order('created_at', { ascending: false });

      setOfferedVouchers((offered as ExclusiveVoucher[]) || []);

      // Fetch today's scan count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('partner_exclusive_vouchers')
        .select('*', { count: 'exact', head: true })
        .eq('receiving_partner_id', user.id)
        .gte('created_at', todayStart.toISOString());

      setDailyScansUsed(count || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate a unique partner QR code payload
  const generatePartnerQR = () => {
    if (!user) return '';
    return JSON.stringify({
      type: 'vybe_partner',
      partner_id: user.id,
      venues: partnerVenues.map(v => ({
        id: v.venue_id,
        name: v.venues?.name || 'Venue'
      })),
      discount: networkDiscount,
      ts: Date.now(),
    });
  };

  const saveNetworkDiscount = async () => {
    if (!user) return;
    setSavingDiscount(true);
    try {
      const { error } = await supabase
        .from('partner_profiles')
        .update({ network_discount_value: networkDiscount } as any)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({
        title: t('common.saved'),
        description: t('partner.qr.discountSaved'),
      });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('partner-identity-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `partner-qr-${user?.id?.slice(0, 8)}.png`;
      link.href = pngFile;
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const startScanner = () => {
    setScanResult(null);
    setScanning(true);
    setTimeout(() => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        },
        false
      );
      scanner.render(
        async (decodedText) => {
          scanner.clear();
          setScanning(false);
          await handleScanResult(decodedText);
        },
        () => {}
      );
      scannerRef.current = scanner;
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = async (decodedText: string) => {
    try {
      // Check daily scan limit
      if (dailyScansUsed >= DAILY_SCAN_LIMIT) {
        setScanResult({
          status: 'error',
          message: t('partner.qr.dailyLimitReached', { limit: DAILY_SCAN_LIMIT }),
        });
        return;
      }

      const data = JSON.parse(decodedText);

      // Only accept partner QR codes
      if (data.type !== 'vybe_partner') {
        setScanResult({ status: 'error', message: t('partner.qr.notPartnerCode') });
        return;
      }

      // Can't scan own code
      if (data.partner_id === user?.id) {
        setScanResult({ status: 'error', message: t('partner.qr.ownCode') });
        return;
      }

      // Verify the scanned user is actually a venue_partner
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.partner_id)
        .eq('role', 'venue_partner')
        .maybeSingle();

      if (!roleData) {
        setScanResult({ status: 'error', message: t('partner.qr.notPartnerCode') });
        return;
      }

      // Get offering partner's venue info
      const offeringVenueName = data.venues?.[0]?.name || 'Partner Venue';
      const offeringVenueId = data.venues?.[0]?.id || null;

      // Check if already connected
      if (offeringVenueId) {
        const { data: existing } = await supabase
          .from('partner_exclusive_vouchers')
          .select('id')
          .eq('offering_partner_id', data.partner_id)
          .eq('receiving_partner_id', user?.id || '')
          .eq('offering_venue_id', offeringVenueId)
          .maybeSingle();

        if (existing) {
          setScanResult({ status: 'already_connected', message: t('partner.qr.alreadyConnected') });
          return;
        }
      }

      // Get offering partner's configured discount
      let discountValue = data.discount || 15;
      
      // Fetch the latest from DB as authoritative source
      const { data: offeringProfile } = await supabase
        .from('partner_profiles')
        .select('network_discount_value')
        .eq('user_id', data.partner_id)
        .maybeSingle();

      if (offeringProfile?.network_discount_value != null) {
        discountValue = Number(offeringProfile.network_discount_value);
      }

      // Create exclusive partner voucher
      const voucherTitle = `Partner-Exklusiv: ${offeringVenueName}`;
      const voucherCode = `PX-${Date.now().toString(36).toUpperCase().slice(-6)}`;

      const { data: newVoucher, error } = await supabase
        .from('partner_exclusive_vouchers')
        .insert({
          offering_partner_id: data.partner_id,
          receiving_partner_id: user?.id || '',
          offering_venue_id: offeringVenueId,
          title: voucherTitle,
          description: t('partner.qr.exclusiveDesc', { venue: offeringVenueName }),
          discount_type: 'percentage',
          discount_value: discountValue,
          code: voucherCode,
        })
        .select()
        .single();

      if (error) throw error;

      setScanResult({
        status: 'success',
        message: t('partner.qr.connectionSuccess'),
        voucher: {
          title: voucherTitle,
          discount_value: discountValue,
          code: voucherCode,
          venue_name: offeringVenueName,
        },
      });

      toast({
        title: t('partner.qr.newPartnerVoucher'),
        description: `${discountValue}% ${t('partner.qr.atVenue')} ${offeringVenueName}`,
      });

      // Refresh data
      fetchData();
    } catch {
      setScanResult({ status: 'error', message: t('partner.qr.invalidQR') });
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
          {t('partner.qr.title')}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{t('partner.qr.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Handshake className="w-6 h-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{receivedVouchers.length}</div>
            <p className="text-xs text-muted-foreground">{t('partner.qr.received')}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Gift className="w-6 h-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{offeredVouchers.length}</div>
            <p className="text-xs text-muted-foreground">{t('partner.qr.offered')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-qr" className="gap-1 text-xs sm:text-sm">
            <QrCode className="w-4 h-4" />
            {t('partner.qr.myQR')}
          </TabsTrigger>
          <TabsTrigger value="scanner" className="gap-1 text-xs sm:text-sm">
            <ScanLine className="w-4 h-4" />
            {t('partner.qr.scanner')}
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="gap-1 text-xs sm:text-sm">
            <Gift className="w-4 h-4" />
            {t('partner.qr.myVouchers')}
          </TabsTrigger>
        </TabsList>

        {/* MY PARTNER QR CODE */}
        <TabsContent value="my-qr" className="space-y-4">
          <Card variant="glass" className="flex flex-col items-center py-6">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">{t('partner.qr.partnerCode')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {partnerVenues.length > 0
                  ? partnerVenues.map(v => v.venues?.name).join(', ')
                  : t('partner.qr.noVenuesLinked')}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-lg relative">
                <QRCodeSVG
                  id="partner-identity-qr"
                  value={generatePartnerQR()}
                  size={200}
                  level="H"
                  includeMargin
                  imageSettings={{
                    src: '',
                    x: undefined,
                    y: undefined,
                    height: 0,
                    width: 0,
                    excavate: false,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Handshake className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <Users className="w-3 h-3" />
                {t('partner.qr.exclusiveBadge')}
              </Badge>
              <p className="text-xs text-muted-foreground text-center max-w-[280px]">
                {t('partner.qr.shareHint')}
              </p>
              <Button variant="outline" onClick={handleDownloadQR} className="gap-2" size="sm">
                <Download className="w-4 h-4" />
                {t('partner.qr.download')}
              </Button>
            </CardContent>
          </Card>

          {/* Network Discount Settings */}
          <Card variant="glass">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">{t('partner.qr.discountSettings')}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('partner.qr.discountSettingsDesc')}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label htmlFor="network-discount" className="text-xs">
                    {t('partner.qr.discountLabel')}
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="network-discount"
                      type="number"
                      min={1}
                      max={100}
                      value={networkDiscount}
                      onChange={e => setNetworkDiscount(Math.min(100, Math.max(1, Number(e.target.value))))}
                      className="w-24"
                      inputSize="sm"
                    />
                    <span className="text-sm text-muted-foreground font-medium">%</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={saveNetworkDiscount}
                  disabled={savingDiscount}
                  className="mt-5"
                >
                  {savingDiscount ? '...' : t('common.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCANNER */}
        <TabsContent value="scanner" className="space-y-4">
          <Card variant="glass">
            <CardContent className="p-4 sm:p-6 space-y-4">
              {!scanning && !scanResult && (
                <div className="text-center py-6">
                  <ScanLine className="w-14 h-14 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">{t('partner.qr.scanTitle')}</h3>
                  <p className="text-sm text-muted-foreground mb-2 max-w-[280px] mx-auto">
                    {t('partner.qr.scanDesc')}
                  </p>
                  <Badge variant="outline" className="mb-4">
                    {t('partner.qr.scansRemaining', { count: Math.max(0, DAILY_SCAN_LIMIT - dailyScansUsed) })}
                  </Badge>
                  <Button onClick={startScanner} className="gap-2">
                    <ScanLine className="w-4 h-4" />
                    {t('partner.qr.startScan')}
                  </Button>
                </div>
              )}

              {scanning && (
                <div className="space-y-4">
                  <div id="qr-reader" className="rounded-xl overflow-hidden" />
                  <Button variant="outline" onClick={stopScanner} className="w-full">
                    {t('common.cancel')}
                  </Button>
                </div>
              )}

              {scanResult && (
                <div className="text-center py-4 space-y-4">
                  {scanResult.status === 'success' ? (
                    <>
                      <CheckCircle className="w-14 h-14 mx-auto text-emerald-500" />
                      <h3 className="text-lg font-bold">{scanResult.message}</h3>
                      {scanResult.voucher && (
                        <Card variant="elegant" className="text-left">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{scanResult.voucher.venue_name}</span>
                              <Badge>{scanResult.voucher.discount_value}%</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{scanResult.voucher.title}</p>
                            <code className="text-xs bg-muted px-2 py-1 rounded block text-center">
                              {scanResult.voucher.code}
                            </code>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : scanResult.status === 'already_connected' ? (
                    <>
                      <Handshake className="w-14 h-14 mx-auto text-amber-500" />
                      <h3 className="text-lg font-bold">{scanResult.message}</h3>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-14 h-14 mx-auto text-destructive" />
                      <h3 className="text-lg font-bold">{scanResult.message}</h3>
                    </>
                  )}
                  <Button onClick={() => { setScanResult(null); startScanner(); }} className="gap-2" size="sm">
                    <ScanLine className="w-4 h-4" />
                    {t('partner.qr.scanAgain')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MY EXCLUSIVE VOUCHERS */}
        <TabsContent value="vouchers" className="space-y-4">
          {receivedVouchers.length === 0 && offeredVouchers.length === 0 ? (
            <Card variant="elegant" className="text-center py-10">
              <CardContent>
                <Handshake className="w-14 h-14 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-1">{t('partner.qr.noExclusiveYet')}</h3>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                  {t('partner.qr.noExclusiveDesc')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {receivedVouchers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary" />
                    {t('partner.qr.receivedVouchers')} ({receivedVouchers.length})
                  </h3>
                  {receivedVouchers.map((v) => (
                    <Card key={v.id} variant="glass" className="hover:scale-[1.01] transition-transform">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{v.title}</p>
                            {v.description && (
                              <p className="text-xs text-muted-foreground truncate">{v.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v.code}</code>
                              <span className="text-xs text-muted-foreground">
                                {t('partner.qr.validUntil')} {format(new Date(v.valid_until), 'dd.MM.yyyy')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <Badge variant={v.status === 'active' ? 'default' : 'secondary'}>
                              {v.discount_value}%
                            </Badge>
                            {v.redeemed_at && (
                              <p className="text-xs text-muted-foreground mt-1">{t('partner.qr.redeemed')}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {offeredVouchers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    {t('partner.qr.offeredVouchers')} ({offeredVouchers.length})
                  </h3>
                  {offeredVouchers.map((v) => (
                    <Card key={v.id} variant="glass" className="opacity-80">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{v.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(v.created_at), 'dd.MM.yyyy')}
                            </p>
                          </div>
                          <Badge variant="outline">{v.discount_value}%</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
