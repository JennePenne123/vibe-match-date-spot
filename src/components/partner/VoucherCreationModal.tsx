import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const voucherSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  code: z.string().min(3, 'Code must be at least 3 characters').max(50).regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
  discount_type: z.enum(['percentage', 'fixed', 'free_item']),
  discount_value: z.number().min(0.01, 'Discount value must be greater than 0'),
  venue_id: z.string().min(1, 'Venue is required'),
  valid_from: z.date(),
  valid_until: z.date(),
  max_redemptions: z.number().int().positive().optional().or(z.literal('')),
  min_booking_value: z.number().min(0).optional().or(z.literal('')),
  applicable_days: z.array(z.string()).min(1, 'Select at least one day'),
  applicable_times: z.array(z.string()).min(1, 'Select at least one time'),
  terms_conditions: z.string().max(2000).optional(),
}).refine((data) => data.valid_until > data.valid_from, {
  message: 'End date must be after start date',
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
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      title: '',
      description: '',
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      venue_id: '',
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      max_redemptions: '' as any,
      min_booking_value: '' as any,
      applicable_days: DAYS,
      applicable_times: TIMES,
      terms_conditions: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchVenues();
    }
  }, [open]);

  const fetchVenues = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get venues through partnerships
      const { data: partnerships, error: partnershipError } = await supabase
        .from('venue_partnerships')
        .select('venue_id')
        .eq('partner_id', user.id)
        .eq('status', 'active');

      if (partnershipError) throw partnershipError;

      if (!partnerships || partnerships.length === 0) {
        toast({
          title: 'No Venues Found',
          description: 'You need an active venue partnership to create vouchers.',
          variant: 'destructive',
        });
        return;
      }

      const venueIds = partnerships.map(p => p.venue_id);
      const { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select('id, name')
        .in('id', venueIds);

      if (venuesError) throw venuesError;
      setVenues(venuesData || []);

      // Auto-select first venue if only one
      if (venuesData && venuesData.length === 1) {
        form.setValue('venue_id', venuesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venues',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: VoucherFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('vouchers').insert({
        partner_id: user.id,
        venue_id: values.venue_id,
        title: values.title,
        description: values.description || null,
        code: values.code,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        valid_from: values.valid_from.toISOString(),
        valid_until: values.valid_until.toISOString(),
        max_redemptions: values.max_redemptions || null,
        min_booking_value: values.min_booking_value || null,
        applicable_days: values.applicable_days,
        applicable_times: values.applicable_times,
        terms_conditions: values.terms_conditions || null,
        status: 'active',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Voucher created successfully',
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating voucher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create voucher',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Voucher</DialogTitle>
          <DialogDescription>
            Create a special offer to attract couples to your venue
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="venue_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 20% Off Your Date Night" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what makes this offer special..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="DATENIGHT20" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>Uppercase letters, numbers, hyphens only</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage Off</SelectItem>
                        <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                        <SelectItem value="free_item">Free Item</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="discount_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch('discount_type') === 'percentage' ? 'Percentage (%)' : 
                     form.watch('discount_type') === 'fixed' ? 'Amount ($)' : 
                     'Value (for tracking, use 1)'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder={form.watch('discount_type') === 'free_item' ? '1' : '10'}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid From</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid Until</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_redemptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Redemptions (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Unlimited"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>Leave empty for unlimited</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_booking_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Booking Value (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="No minimum"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : '')}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="applicable_days"
              render={() => (
                <FormItem>
                  <FormLabel>Applicable Days</FormLabel>
                  <div className="grid grid-cols-4 gap-3">
                    {DAYS.map((day) => (
                      <FormField
                        key={day}
                        control={form.control}
                        name="applicable_days"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, day])
                                    : field.onChange(field.value?.filter((value) => value !== day));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal capitalize cursor-pointer">
                              {day.slice(0, 3)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applicable_times"
              render={() => (
                <FormItem>
                  <FormLabel>Applicable Times</FormLabel>
                  <div className="grid grid-cols-4 gap-3">
                    {TIMES.map((time) => (
                      <FormField
                        key={time}
                        control={form.control}
                        name="applicable_times"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(time)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, time])
                                    : field.onChange(field.value?.filter((value) => value !== time));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal capitalize cursor-pointer">
                              {time.replace('_', ' ')}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Valid for dine-in only, cannot be combined with other offers..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Voucher'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
