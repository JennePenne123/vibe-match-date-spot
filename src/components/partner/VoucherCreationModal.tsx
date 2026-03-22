import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const voucherSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/),
  discount_type: z.enum(['percentage', 'fixed', 'free_item']),
  discount_value: z.number().min(0.01),
  venue_ids: z.array(z.string()).min(1),
  valid_from: z.date(),
  valid_until: z.date(),
  max_redemptions: z.number().int().positive().optional().or(z.literal('')),
  min_booking_value: z.number().min(0).optional().or(z.literal('')),
  applicable_days: z.array(z.string()).min(1),
  applicable_times: z.array(z.string()).min(1),
  terms_conditions: z.string().max(2000).optional(),
}).refine((data) => data.valid_until > data.valid_from, {
  path: ['valid_until'],
});

type VoucherFormValues = z.infer<typeof voucherSchema>;

interface VoucherCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Venue {
  id: string;
  name: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIMES = ['breakfast', 'lunch', 'dinner', 'late_night'];

export default function VoucherCreationModal({ open, onOpenChange, onSuccess }: VoucherCreationModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      title: '', description: '', code: '', discount_type: 'percentage',
      discount_value: 10, venue_ids: [], valid_from: new Date(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      max_redemptions: '' as any, min_booking_value: '' as any,
      applicable_days: DAYS, applicable_times: TIMES, terms_conditions: '',
    },
  });

  useEffect(() => {
    if (open) fetchVenues();
  }, [open]);

  const fetchVenues = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: partnerships, error: partnershipError } = await supabase
        .from('venue_partnerships').select('venue_id')
        .eq('partner_id', user.id).eq('status', 'active');

      if (partnershipError) throw partnershipError;

      if (!partnerships || partnerships.length === 0) {
        toast({ title: t('partner.voucherForm.noVenuesFound'), description: t('partner.voucherForm.noVenuesDesc'), variant: 'destructive' });
        return;
      }

      const venueIds = partnerships.map(p => p.venue_id);
      const { data: venuesData, error: venuesError } = await supabase
        .from('venues').select('id, name').in('id', venueIds);

      if (venuesError) throw venuesError;
      setVenues(venuesData || []);

      if (venuesData && venuesData.length === 1) {
        form.setValue('venue_ids', [venuesData[0].id]);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({ title: t('common.error'), description: t('partner.voucherForm.loadFailed'), variant: 'destructive' });
    }
  };

  const onSubmit = async (values: VoucherFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const inserts = values.venue_ids.map((venueId) => ({
        partner_id: user.id, venue_id: venueId, title: values.title,
        description: values.description || null,
        code: values.venue_ids.length > 1 ? `${values.code}-${venueId.slice(0, 4).toUpperCase()}` : values.code,
        discount_type: values.discount_type, discount_value: values.discount_value,
        valid_from: values.valid_from.toISOString(), valid_until: values.valid_until.toISOString(),
        max_redemptions: values.max_redemptions || null, min_booking_value: values.min_booking_value || null,
        applicable_days: values.applicable_days, applicable_times: values.applicable_times,
        terms_conditions: values.terms_conditions || null, status: 'active',
      }));

      const { error } = await supabase.from('vouchers').insert(inserts);
      if (error) throw error;

      toast({
        title: t('common.success'),
        description: values.venue_ids.length > 1
          ? t('partner.voucherForm.createdMulti', { count: values.venue_ids.length })
          : t('partner.voucherForm.createdSuccess'),
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating voucher:', error);
      toast({ title: t('common.error'), description: error.message || t('partner.voucherForm.createFailed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const discountTypeLabel = () => {
    const dt = form.watch('discount_type');
    if (dt === 'percentage') return t('partner.voucherForm.discountPercentage');
    if (dt === 'fixed') return t('partner.voucherForm.discountAmount');
    return t('partner.voucherForm.discountTracking');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('partner.voucherForm.createTitle')}</DialogTitle>
          <DialogDescription>{t('partner.voucherForm.createSubtitle')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="venue_ids"
              render={() => (
                <FormItem>
                  <FormLabel>{t('partner.voucherForm.venues')} {venues.length > 1 && `(${form.watch('venue_ids')?.length || 0}/${venues.length} ${t('partner.voucherForm.venuesSelected')})`}</FormLabel>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {venues.length > 1 && (
                      <div className="flex items-center space-x-2 pb-2 border-b mb-1">
                        <Checkbox
                          checked={form.watch('venue_ids')?.length === venues.length}
                          onCheckedChange={(checked) => form.setValue('venue_ids', checked ? venues.map(v => v.id) : [])}
                        />
                        <span className="text-sm font-medium">{t('partner.voucherForm.selectAll')}</span>
                      </div>
                    )}
                    {venues.map((venue) => (
                      <FormField key={venue.id} control={form.control} name="venue_ids"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(venue.id)}
                                onCheckedChange={(checked) => checked
                                  ? field.onChange([...(field.value || []), venue.id])
                                  : field.onChange(field.value?.filter((id: string) => id !== venue.id))}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer text-sm">{venue.name}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormDescription>
                    {venues.length > 1 ? t('partner.voucherForm.venuesMulti') : t('partner.voucherForm.venuesSingle')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('partner.voucherForm.title')}</FormLabel>
                  <FormControl><Input placeholder={t('partner.voucherForm.titlePlaceholder')} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('partner.voucherForm.description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('partner.voucherForm.descPlaceholder')} className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('partner.voucherForm.voucherCode')}</FormLabel>
                    <FormControl>
                      <Input placeholder="DATENIGHT20" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormDescription>{t('partner.voucherForm.codeHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('partner.voucherForm.discountType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">{t('partner.voucherForm.percentage')}</SelectItem>
                        <SelectItem value="fixed">{t('partner.voucherForm.fixedAmount')}</SelectItem>
                        <SelectItem value="free_item">{t('partner.voucherForm.freeItem')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField control={form.control} name="discount_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{discountTypeLabel()}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01"
                      placeholder={form.watch('discount_type') === 'free_item' ? '1' : '10'}
                      {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="valid_from"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('partner.voucherForm.validFrom')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : t('partner.voucherForm.pickDate')}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="valid_until"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('partner.voucherForm.validUntil')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : t('partner.voucherForm.pickDate')}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange}
                          disabled={(date) => date < new Date()} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="max_redemptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('partner.voucherForm.maxRedemptions')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t('common.unlimited')}
                        {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>{t('partner.voucherForm.leaveEmpty')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="min_booking_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('partner.voucherForm.minBookingValue')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder={t('common.noMinimum')}
                        {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : '')} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField control={form.control} name="applicable_days"
              render={() => (
                <FormItem>
                  <FormLabel>{t('partner.voucherForm.applicableDays')}</FormLabel>
                  <div className="grid grid-cols-4 gap-3">
                    {DAYS.map((day) => (
                      <FormField key={day} control={form.control} name="applicable_days"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value?.includes(day)}
                                onCheckedChange={(checked) => checked
                                  ? field.onChange([...field.value, day])
                                  : field.onChange(field.value?.filter((value) => value !== day))} />
                            </FormControl>
                            <FormLabel className="font-normal capitalize cursor-pointer">{day.slice(0, 3)}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="applicable_times"
              render={() => (
                <FormItem>
                  <FormLabel>{t('partner.voucherForm.applicableTimes')}</FormLabel>
                  <div className="grid grid-cols-4 gap-3">
                    {TIMES.map((time) => (
                      <FormField key={time} control={form.control} name="applicable_times"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value?.includes(time)}
                                onCheckedChange={(checked) => checked
                                  ? field.onChange([...field.value, time])
                                  : field.onChange(field.value?.filter((value) => value !== time))} />
                            </FormControl>
                            <FormLabel className="font-normal capitalize cursor-pointer">{time.replace('_', ' ')}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="terms_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('partner.voucherForm.termsConditions')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('partner.voucherForm.termsPlaceholder')} className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.creating') : t('partner.voucherForm.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
