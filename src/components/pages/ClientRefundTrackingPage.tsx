import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { RefundRequests, Bookings } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function ClientRefundTrackingPage() {
  const { member } = useMember();
  const [refunds, setRefunds] = useState<RefundRequests[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const { items } = await BaseCrudService.getAll<RefundRequests>('refunds');
      // Filter refunds by client email
      const clientRefunds = items?.filter(r => r.clientEmail === member?.loginEmail) || [];
      setRefunds(clientRefunds);
    } catch (error) {
      console.error('Error loading refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRefunds = refunds.filter(refund => {
    return (
      refund.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

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

  const getStatusMessage = (status?: string) => {
    switch (status) {
      case 'Approved':
        return 'Your refund has been approved and will be processed soon.';
      case 'Rejected':
        return 'Your refund request has been rejected. Please contact support for more information.';
      case 'Pending':
        return 'Your refund request is being reviewed. We will update you soon.';
      default:
        return 'Your refund request status is unknown.';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-logoBlack mb-2">Refund Tracking</h1>
          <p className="text-gray-600">Track the status of your refund requests</p>
        </div>

        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="pt-6">
            <Input
              placeholder="Search by booking reference or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-300"
            />
          </CardContent>
        </Card>

        {filteredRefunds.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-heading font-semibold text-gray-700 mb-2">No Refund Requests</h3>
              <p className="text-gray-600">You don't have any refund requests yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredRefunds.map((refund) => (
              <Card key={refund._id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getStatusIcon(refund.status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-heading font-semibold text-logoBlack">
                          Booking Reference: {refund.bookingReference}
                        </h3>
                        <p className="text-gray-600 font-paragraph text-sm mt-1">
                          {getStatusMessage(refund.status)}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(refund.status)} border-0 whitespace-nowrap`}>
                      {refund.status || 'Pending'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 pt-4 border-t">
                    <div>
                      <h4 className="font-heading font-semibold text-sm text-gray-700 mb-3">Request Details</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 font-paragraph">Refund Amount</p>
                          <p className="font-heading font-bold text-lg text-logoBlack">₹{refund.refundAmount?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-paragraph">Request Date</p>
                          <p className="font-paragraph text-sm">
                            {refund.requestDate ? format(new Date(refund.requestDate), 'MMM dd, yyyy') : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-heading font-semibold text-sm text-gray-700 mb-3">Your Information</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 font-paragraph">Name</p>
                          <p className="font-paragraph text-sm">{refund.clientName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-paragraph">Email</p>
                          <p className="font-paragraph text-sm">{refund.clientEmail}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {refund.refundReason && (
                    <div className="pt-4 border-t">
                      <h4 className="font-heading font-semibold text-sm text-gray-700 mb-2">Reason for Refund</h4>
                      <p className="font-paragraph text-sm text-gray-700 whitespace-pre-wrap">{refund.refundReason}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-9">
                          View Full Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Refund Request Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 font-paragraph mb-1">Status</p>
                              <Badge className={`${getStatusColor(refund.status)} border-0`}>
                                {refund.status || 'Pending'}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-paragraph mb-1">Refund Amount</p>
                              <p className="font-heading font-bold text-lg">₹{refund.refundAmount?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-paragraph mb-1">Booking Reference</p>
                              <p className="font-paragraph text-sm">{refund.bookingReference}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-paragraph mb-1">Request Date</p>
                              <p className="font-paragraph text-sm">
                                {refund.requestDate ? format(new Date(refund.requestDate), 'MMM dd, yyyy hh:mm a') : '-'}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 font-paragraph mb-2">Client Information</p>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                              <p className="font-paragraph"><span className="text-gray-600">Name:</span> {refund.clientName}</p>
                              <p className="font-paragraph"><span className="text-gray-600">Email:</span> {refund.clientEmail}</p>
                            </div>
                          </div>

                          {refund.refundReason && (
                            <div>
                              <p className="text-xs text-gray-500 font-paragraph mb-2">Reason for Refund</p>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-paragraph text-sm whitespace-pre-wrap">{refund.refundReason}</p>
                              </div>
                            </div>
                          )}

                          {refund.status === 'Rejected' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-sm text-red-800 font-paragraph">
                                If you have questions about this decision, please contact our support team.
                              </p>
                            </div>
                          )}

                          {refund.status === 'Approved' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <p className="text-sm text-green-800 font-paragraph">
                                Your refund has been approved. The amount will be credited to your original payment method within 5-7 business days.
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
