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
import { QrCode, ScanLine, Download, CheckCircle, XCircle, Gift } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface ActiveVoucher {
  id: string;
  code: string;
  title: string;
  discount_type: string;
  discount_value: number;
  venue_id: string;
  venues: { name: string } | null;
}

interface ScanResult {
  status: 'success' | 'error' | 'already_redeemed';
  message: string;
  voucher?: {
    title: string;
    discount_type: string;
    discount_value: number;
    venue_name: string;
  };
}

export default function PartnerQRCode() {
  const { t } = useTranslation();
  const { role, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<ActiveVoucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<ActiveVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!roleLoading && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('vouchers')
        .select('id, code, title, discount_type, discount_value, venue_id, venues(name)')
        .eq('partner_id', currentUser.id)
        .eq('status', 'active')
        .gt('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map(v => ({
        ...v,
        venues: v.venues as unknown as { name: string } | null
      }));
      setVouchers(mapped);
      if (mapped.length > 0) setSelectedVoucher(mapped[0]);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRData = (voucher: ActiveVoucher) => {
    return JSON.stringify({
      type: 'vybe_voucher',
      voucher_id: voucher.id,
      code: voucher.code,
      partner_id: user?.id,
    });
  };

  const handleDownloadQR = () => {
    if (!selectedVoucher) return;
    const svg = document.getElementById('partner-qr-code');
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
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${selectedVoucher.code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const startScanner = () => {
    setScanResult(null);
    setScanning(true);

    // Small delay to let the DOM render the container
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
        (error) => {
          // Scan error - ignore, keep scanning
        }
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
      const data = JSON.parse(decodedText);

      if (data.type !== 'vybe_voucher') {
        setScanResult({ status: 'error', message: t('partner.qr.invalidQR') });
        return;
      }

      // Look up voucher
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('id, title, discount_type, discount_value, status, valid_until, max_redemptions, current_redemptions, venue_id, venues(name)')
        .eq('id', data.voucher_id)
        .eq('code', data.code)
        .maybeSingle();

      if (error || !voucher) {
        setScanResult({ status: 'error', message: t('partner.qr.voucherNotFound') });
        return;
      }

      if (voucher.status !== 'active') {
        setScanResult({ status: 'error', message: t('partner.qr.voucherInactive') });
        return;
      }

      if (new Date(voucher.valid_until) < new Date()) {
        setScanResult({ status: 'error', message: t('partner.qr.voucherExpired') });
        return;
      }

      if (voucher.max_redemptions && voucher.current_redemptions >= voucher.max_redemptions) {
        setScanResult({ status: 'error', message: t('partner.qr.maxRedemptions') });
        return;
      }

      // Check if this user already redeemed
      const { data: existing } = await supabase
        .from('voucher_redemptions')
        .select('id')
        .eq('voucher_id', voucher.id)
        .eq('user_id', user?.id || '')
        .maybeSingle();

      if (existing) {
        setScanResult({ status: 'already_redeemed', message: t('partner.qr.alreadyRedeemed') });
        return;
      }

      // Redeem the voucher
      const { error: redeemError } = await supabase
        .from('voucher_redemptions')
        .insert({
          voucher_id: voucher.id,
          user_id: user?.id || '',
          discount_applied: voucher.discount_value,
          status: 'redeemed',
        });

      if (redeemError) throw redeemError;

      const venueName = (voucher.venues as unknown as { name: string })?.name || 'Unknown';

      setScanResult({
        status: 'success',
        message: t('partner.qr.redeemSuccess'),
        voucher: {
          title: voucher.title,
          discount_type: voucher.discount_type,
          discount_value: voucher.discount_value,
          venue_name: venueName,
        },
      });

      toast({
        title: t('partner.qr.redeemed'),
        description: `${voucher.title} - ${venueName}`,
      });
    } catch {
      setScanResult({ status: 'error', message: t('partner.qr.invalidQR') });
    }
  };

  // Cleanup scanner on unmount
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
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
          {t('partner.qr.title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('partner.qr.subtitle')}</p>
      </div>

      <Tabs defaultValue="my-qr" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-qr" className="gap-2">
            <QrCode className="w-4 h-4" />
            {t('partner.qr.myQR')}
          </TabsTrigger>
          <TabsTrigger value="scanner" className="gap-2">
            <ScanLine className="w-4 h-4" />
            {t('partner.qr.scanner')}
          </TabsTrigger>
        </TabsList>

        {/* MY QR CODE TAB */}
        <TabsContent value="my-qr" className="space-y-4">
          {vouchers.length === 0 ? (
            <Card variant="elegant" className="text-center py-12">
              <CardContent>
                <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">{t('partner.qr.noVouchers')}</h3>
                <p className="text-muted-foreground mb-4">{t('partner.qr.noVouchersDesc')}</p>
                <Button onClick={() => navigate('/partner/vouchers')}>
                  {t('partner.qr.createVoucher')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Voucher selector */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {vouchers.map((v) => (
                  <Button
                    key={v.id}
                    variant={selectedVoucher?.id === v.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedVoucher(v)}
                    className="whitespace-nowrap"
                  >
                    {v.title}
                  </Button>
                ))}
              </div>

              {selectedVoucher && (
                <Card variant="glass" className="flex flex-col items-center py-8">
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{selectedVoucher.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedVoucher.venues?.name || 'Venue'}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {selectedVoucher.code}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-lg">
                      <QRCodeSVG
                        id="partner-qr-code"
                        value={generateQRData(selectedVoucher)}
                        size={220}
                        level="H"
                        includeMargin
                      />
                    </div>
                    <Button variant="outline" onClick={handleDownloadQR} className="gap-2">
                      <Download className="w-4 h-4" />
                      {t('partner.qr.download')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* SCANNER TAB */}
        <TabsContent value="scanner" className="space-y-4">
          <Card variant="glass">
            <CardContent className="p-6 space-y-4">
              {!scanning && !scanResult && (
                <div className="text-center py-8">
                  <ScanLine className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">{t('partner.qr.scanTitle')}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{t('partner.qr.scanDesc')}</p>
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
                <div className="text-center py-6 space-y-4">
                  {scanResult.status === 'success' ? (
                    <>
                      <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                      <h3 className="text-xl font-bold text-green-600">{scanResult.message}</h3>
                      {scanResult.voucher && (
                        <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                          <p className="font-semibold">{scanResult.voucher.title}</p>
                          <p className="text-sm text-muted-foreground">{scanResult.voucher.venue_name}</p>
                          <Badge>
                            {scanResult.voucher.discount_type === 'percentage'
                              ? `${scanResult.voucher.discount_value}%`
                              : scanResult.voucher.discount_type === 'fixed'
                              ? `$${scanResult.voucher.discount_value}`
                              : 'Free Item'}
                          </Badge>
                        </div>
                      )}
                    </>
                  ) : scanResult.status === 'already_redeemed' ? (
                    <>
                      <XCircle className="w-16 h-16 mx-auto text-amber-500" />
                      <h3 className="text-xl font-bold text-amber-600">{scanResult.message}</h3>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-16 h-16 mx-auto text-destructive" />
                      <h3 className="text-xl font-bold text-destructive">{scanResult.message}</h3>
                    </>
                  )}
                  <Button onClick={() => { setScanResult(null); startScanner(); }} className="gap-2">
                    <ScanLine className="w-4 h-4" />
                    {t('partner.qr.scanAgain')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
