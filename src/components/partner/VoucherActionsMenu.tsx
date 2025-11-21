import { useState } from 'react';
import { MoreVertical, Edit, Power, BarChart3, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoucherActionsMenuProps {
  voucherId: string;
  voucherTitle: string;
  currentStatus: string;
  currentRedemptions: number;
  validUntil: string;
  onEdit: () => void;
  onViewAnalytics: () => void;
  onSuccess: () => void;
}

export default function VoucherActionsMenu({
  voucherId,
  voucherTitle,
  currentStatus,
  currentRedemptions,
  validUntil,
  onEdit,
  onViewAnalytics,
  onSuccess,
}: VoucherActionsMenuProps) {
  const { toast } = useToast();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      // Check if voucher is expired when trying to activate
      if (newStatus === 'active' && new Date(validUntil) < new Date()) {
        toast({
          title: 'Cannot Activate',
          description: 'This voucher has expired. Please edit the expiry date first.',
          variant: 'destructive',
        });
        setShowActivateDialog(false);
        return;
      }

      const { error } = await supabase
        .from('vouchers')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', voucherId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Voucher ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });

      setShowDeactivateDialog(false);
      setShowActivateDialog(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update voucher status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vouchers')
        .delete()
        .eq('id', voucherId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Voucher deleted successfully',
      });

      setShowDeleteDialog(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting voucher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete voucher',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isExpired = new Date(validUntil) < new Date();
  const canDelete = currentRedemptions === 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={onViewAnalytics}>
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              if (currentStatus === 'active') {
                setShowDeactivateDialog(true);
              } else {
                setShowActivateDialog(true);
              }
            }}
          >
            <Power className="mr-2 h-4 w-4" />
            {currentStatus === 'active' ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Deactivate Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent users from seeing or redeeming "{voucherTitle}".
              You can reactivate it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {loading ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Dialog */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make "{voucherTitle}" visible to users and allow redemptions.
              {isExpired && ' Note: This voucher has expired. Please update the expiry date first.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus} disabled={loading || isExpired}>
              {loading ? 'Activating...' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{voucherTitle}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
