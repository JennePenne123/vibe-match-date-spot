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
  discount_type: z.enum(['percentage', 'fixed', 'free_item']),
  discount_value: z.number().min(0.01, 'Discount value must be greater than 0'),
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

interface Voucher {
  id: string;
  title: string;
  description: string | null;
  code: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  max_redemptions: number | null;
  min_booking_value: number | null;
  applicable_days: string[];
  applicable_times: string[];
  terms_conditions: string | null;
}

interface VoucherEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucher: Voucher | null;
  onSuccess: () => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIMES = ['breakfast', 'lunch', 'dinner', 'late_night'];

export default function VoucherEditModal({ open, onOpenChange, voucher, onSuccess }: VoucherEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      title: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      max_redemptions: '' as any,
      min_booking_value: '' as any,
      applicable_days: DAYS,
      applicable_times: TIMES,
      terms_conditions: '',
    },
  });

  useEffect(() => {
    if (voucher && open) {
      form.reset({
        title: voucher.title,
        description: voucher.description || '',
        discount_type: voucher.discount_type as 'percentage' | 'fixed' | 'free_item',
        discount_value: voucher.discount_value,
        valid_from: new Date(voucher.valid_from),
        valid_until: new Date(voucher.valid_until),
        max_redemptions: voucher.max_redemptions || '' as any,
        min_booking_value: voucher.min_booking_value || '' as any,
        applicable_days: voucher.applicable_days,
        applicable_times: voucher.applicable_times,
        terms_conditions: voucher.terms_conditions || '',
      });
    }
  }, [voucher, open, form]);

  const onSubmit = async (values: VoucherFormValues) => {
    if (!voucher) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({
          title: values.title,
          description: values.description || null,
          discount_type: values.discount_type,
          discount_value: values.discount_value,
          valid_from: values.valid_from.toISOString(),
          valid_until: values.valid_until.toISOString(),
          max_redemptions: values.max_redemptions || null,
          min_booking_value: values.min_booking_value || null,
          applicable_days: values.applicable_days,
          applicable_times: values.applicable_times,
          terms_conditions: values.terms_conditions || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', voucher.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Voucher updated successfully',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating voucher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update voucher',
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
          <DialogTitle>Edit Voucher</DialogTitle>
          <DialogDescription>
            Update your voucher details. Code cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {voucher && (
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">Voucher Code</p>
                <p className="font-mono font-semibold">{voucher.code}</p>
              </div>
            )}

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

              <FormField
                control={form.control}
                name="discount_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch('discount_type') === 'percentage' ? 'Percentage (%)' : 
                       form.watch('discount_type') === 'fixed' ? 'Amount ($)' : 
                       'Value'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  <div className="grid grid-cols-2 gap-3">
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
                      placeholder="Any restrictions or conditions..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
