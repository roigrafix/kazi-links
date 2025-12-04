import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService, useMember } from '@/integrations';
import { Bookings } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, DollarSign, Clock, MapPin, User, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function RefundPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { member } = useMember();
  const { toast } = useToast();

  const bookingRef = searchParams.get('bookingRef');
  const [booking, setBooking] = useState<Bookings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [refundReason, setRefundReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingRef) {
        setIsLoading(false);
        return;
      }

      try {
        const { items } = await BaseCrudService.getAll<Bookings>('bookings');
        const foundBooking = items.find(
          b => b.referenceId === bookingRef || b._id === bookingRef
        );
        
        if (foundBooking) {
          setBooking(foundBooking);
          // Pre-fill account holder name if user is logged in
          if (member?.contact?.firstName) {
            setAccountHolderName(
              `${member.contact.firstName} ${member.contact.lastName || ''}`.trim()
            );
          }
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [bookingRef, member]);

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking) {
      toast({
        title: 'Error',
        description: 'Booking information not found.',
        variant: 'destructive',
      });
      return;
    }

    if (!refundReason || !bankName || !accountNumber || !ifscCode || !accountHolderName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Here you would typically send this data to your backend
      // For now, we'll just show a success message
      console.log('Refund request submitted:', {
        bookingRef: booking.referenceId || booking._id,
        refundReason,
        additionalNotes,
        bankName,
        accountNumber,
        ifscCode,
        accountHolderName,
        refundAmount: booking.paymentAmount,
      });

      setSubmitted(true);
      toast({
        title: 'Success',
        description: 'Your refund request has been submitted. We will process it within 5-7 business days.',
      });

      // Redirect to tracking page after 3 seconds
      setTimeout(() => {
        navigate('/tracking');
      }, 3000);
    } catch (error) {
      console.error('Error submitting refund request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit refund request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Reference ID copied to clipboard.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-logoGold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-paragraph text-lg">Loading refund information...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground">
        <section className="py-16 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="font-heading text-4xl lg:text-6xl font-bold mb-6">
                Refund Request Submitted
              </h1>
              <p className="font-paragraph text-xl text-secondary-foreground/70 max-w-2xl mx-auto">
                Thank you for submitting your refund request
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-secondary text-secondary-foreground border-green-500/50">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="font-heading text-2xl font-bold mb-2">
                      Request Received
                    </h2>
                    <p className="text-secondary-foreground/70">
                      Your refund request has been successfully submitted
                    </p>
                  </div>

                  <div className="space-y-4 bg-white/5 rounded-lg p-6 mb-8">
                    <div>
                      <p className="text-xs text-secondary-foreground/70 mb-1">Reference ID</p>
                      <div className="flex items-center justify-between">
                        <p className="font-mono font-semibold text-logoGold">
                          {booking?.referenceId || booking?._id}
                        </p>
                        <button
                          onClick={() => copyToClipboard(booking?.referenceId || booking?._id || '')}
                          className="p-2 hover:bg-white/10 rounded transition"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-secondary-foreground/10">
                      <p className="text-xs text-secondary-foreground/70 mb-1">Refund Amount</p>
                      <p className="font-semibold text-lg text-logoGold">₹{booking?.paymentAmount}</p>
                    </div>
                    <div className="pt-4 border-t border-secondary-foreground/10">
                      <p className="text-xs text-secondary-foreground/70 mb-1">Processing Time</p>
                      <p className="font-semibold">5-7 Business Days</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg mb-8">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">What happens next?</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Our team will review your refund request</li>
                          <li>• You'll receive an email confirmation within 24 hours</li>
                          <li>• The refund will be processed to your bank account within 5-7 business days</li>
                          <li>• You can track your refund status using your reference ID</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      asChild
                      className="flex-1 bg-logoGold text-logoBlack hover:bg-logoGold/90"
                    >
                      <a href="/tracking">Back to Bookings</a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10"
                    >
                      <a href="/support">Contact Support</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* Header */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-heading text-4xl lg:text-6xl font-bold mb-6">
              Refund Request
            </h1>
            <p className="font-paragraph text-xl text-secondary-foreground/70 max-w-2xl mx-auto">
              Complete the form below to process your refund
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Booking Summary */}
            {booking && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-secondary text-secondary-foreground sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-secondary-foreground/70 mb-1">Service</p>
                      <p className="font-semibold">{booking.serviceName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-foreground/70 mb-1">Freelancer</p>
                      <p className="font-semibold">{booking.freelancerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-foreground/70 mb-1">Booking Date</p>
                      <p className="font-semibold">{format(new Date(booking.bookingDate || ''), 'PPP')}</p>
                    </div>
                    <div className="pt-4 border-t border-secondary-foreground/10">
                      <p className="text-xs text-secondary-foreground/70 mb-1">Refund Amount</p>
                      <p className="font-semibold text-xl text-logoGold">₹{booking.paymentAmount}</p>
                    </div>

                    {booking.referenceId && (
                      <div className="pt-4 border-t border-secondary-foreground/10">
                        <p className="text-xs text-secondary-foreground/70 mb-2">Reference ID</p>
                        <div className="flex items-center gap-2 bg-white/5 p-2 rounded">
                          <code className="font-mono text-sm font-semibold flex-1 text-logoGold">
                            {booking.referenceId}
                          </code>
                          <button
                            onClick={() => copyToClipboard(booking.referenceId || '')}
                            className="p-1 hover:bg-white/10 rounded transition"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Refund Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="bg-secondary text-secondary-foreground">
                <CardHeader>
                  <CardTitle>Refund Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitRefund} className="space-y-6">
                    {/* Refund Reason */}
                    <div>
                      <Label htmlFor="reason" className="text-secondary-foreground">
                        Reason for Refund *
                      </Label>
                      <Select value={refundReason} onValueChange={setRefundReason}>
                        <SelectTrigger id="reason" className="bg-white/5 border-secondary-foreground/20 text-secondary-foreground">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent className="bg-secondary text-secondary-foreground">
                          <SelectItem value="service-not-provided">Service Not Provided</SelectItem>
                          <SelectItem value="poor-quality">Poor Quality Service</SelectItem>
                          <SelectItem value="freelancer-cancelled">Freelancer Cancelled</SelectItem>
                          <SelectItem value="changed-mind">Changed Mind</SelectItem>
                          <SelectItem value="duplicate-booking">Duplicate Booking</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <Label htmlFor="notes" className="text-secondary-foreground">
                        Additional Notes
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Please provide any additional details about your refund request..."
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        className="bg-white/5 border-secondary-foreground/20 text-secondary-foreground min-h-24"
                      />
                    </div>

                    {/* Bank Details */}
                    <div className="space-y-4 pt-6 border-t border-secondary-foreground/10">
                      <h3 className="font-heading font-semibold">Bank Account Details</h3>

                      <div>
                        <Label htmlFor="accountHolder" className="text-secondary-foreground">
                          Account Holder Name *
                        </Label>
                        <Input
                          id="accountHolder"
                          type="text"
                          placeholder="Full name as per bank account"
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          className="bg-white/5 border-secondary-foreground/20 text-secondary-foreground"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bankName" className="text-secondary-foreground">
                          Bank Name *
                        </Label>
                        <Input
                          id="bankName"
                          type="text"
                          placeholder="e.g., HDFC Bank, ICICI Bank"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="bg-white/5 border-secondary-foreground/20 text-secondary-foreground"
                        />
                      </div>

                      <div>
                        <Label htmlFor="accountNumber" className="text-secondary-foreground">
                          Account Number *
                        </Label>
                        <Input
                          id="accountNumber"
                          type="text"
                          placeholder="Your bank account number"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="bg-white/5 border-secondary-foreground/20 text-secondary-foreground"
                        />
                      </div>

                      <div>
                        <Label htmlFor="ifsc" className="text-secondary-foreground">
                          IFSC Code *
                        </Label>
                        <Input
                          id="ifsc"
                          type="text"
                          placeholder="e.g., HDFC0001234"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                          className="bg-white/5 border-secondary-foreground/20 text-secondary-foreground"
                        />
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">Processing Information</p>
                          <ul className="space-y-1 text-xs">
                            <li>• Refunds are processed within 5-7 business days</li>
                            <li>• Please ensure your bank details are correct</li>
                            <li>• You'll receive a confirmation email shortly</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90 font-semibold"
                    >
                      {isSubmitting ? 'Processing...' : 'Submit Refund Request'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
