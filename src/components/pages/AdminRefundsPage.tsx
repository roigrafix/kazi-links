import { useEffect, useState } from 'react';
import { BaseCrudService } from '@/integrations';
import { RefundRequests } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequests[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const { items } = await BaseCrudService.getAll<RefundRequests>('refunds');
      setRefunds(items || []);
    } catch (error) {
      console.error('Error loading refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await BaseCrudService.update<RefundRequests>('refunds', {
        _id: id,
        status: newStatus,
      });
      setEditingId(null);
      loadRefunds();
    } catch (error) {
      console.error('Error updating refund status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await BaseCrudService.delete('refunds', id);
      loadRefunds();
    } catch (error) {
      console.error('Error deleting refund:', error);
    }
  };

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = 
      refund.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-logoBlack to-[#2a2a2a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-logoGold mb-2">Refund Management</h1>
          <p className="text-secondary/90 font-paragraph text-lg">Manage and track all refund requests from clients</p>
        </div>

        <Card className="mb-6 border-0 shadow-lg bg-secondary">
          <CardHeader className="bg-secondary border-b border-logoGold/20">
            <CardTitle className="text-logoBlack font-heading text-xl">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by client name, email, or booking reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-logoGold/30 bg-white text-logoBlack placeholder:text-logoBlack/50 font-paragraph"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-logoGold/30 bg-white text-logoBlack font-paragraph">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-base text-logoBlack flex items-center font-paragraph font-semibold">
                Total: <span className="font-bold ml-2 text-logoGold">{filteredRefunds.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg overflow-hidden bg-secondary">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-logoGold/10 border-b-2 border-logoGold">
                <TableRow>
                  <TableHead className="font-heading font-bold text-logoBlack">Client Name</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Email</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Booking Ref</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Amount</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Reason</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Status</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Date</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-logoBlack/60 font-paragraph">
                      No refund requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRefunds.map((refund) => (
                    <TableRow key={refund._id} className="hover:bg-logoGold/5 border-b border-logoGold/10">
                      <TableCell className="font-paragraph font-semibold text-logoBlack">{refund.clientName}</TableCell>
                      <TableCell className="font-paragraph text-sm text-logoBlack/80">{refund.clientEmail}</TableCell>
                      <TableCell className="font-paragraph text-sm text-logoBlack/80">{refund.bookingReference}</TableCell>
                      <TableCell className="font-paragraph font-bold text-logoBlack">₹{refund.refundAmount?.toFixed(2)}</TableCell>
                      <TableCell className="font-paragraph text-sm text-logoBlack/80 max-w-xs truncate">{refund.refundReason}</TableCell>
                      <TableCell>
                        {editingId === refund._id ? (
                          <Select value={editStatus} onValueChange={setEditStatus}>
                            <SelectTrigger className="w-32 h-8 text-xs bg-white text-logoBlack border-logoGold/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Approved">Approved</SelectItem>
                              <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={`${getStatusColor(refund.status)} border-0 font-semibold`}>
                            {refund.status || 'Pending'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-paragraph text-sm text-logoBlack/80">
                        {refund.requestDate ? format(new Date(refund.requestDate), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {editingId === refund._id ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-logoGold hover:bg-logoGold/90 text-logoBlack h-8 font-semibold"
                                onClick={() => handleStatusUpdate(refund._id, editStatus)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-logoGold/30 text-logoBlack hover:bg-logoGold/10"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-logoGold/30 text-logoBlack hover:bg-logoGold/10"
                                onClick={() => {
                                  setEditingId(refund._id);
                                  setEditStatus(refund.status || 'Pending');
                                }}
                              >
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="h-8 bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-secondary border-logoGold/20">
                                  <AlertDialogTitle className="text-logoBlack font-heading">Delete Refund Request</AlertDialogTitle>
                                  <AlertDialogDescription className="text-logoBlack/70 font-paragraph">
                                    Are you sure you want to delete this refund request? This action cannot be undone.
                                  </AlertDialogDescription>
                                  <div className="flex gap-3 justify-end">
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(refund._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
