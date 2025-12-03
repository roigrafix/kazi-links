import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Freelancers, Bookings, ClientReviews } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';
import { Star, ArrowLeft, CheckCircle } from 'lucide-react';
import { sendGridService } from '@/services/sendgridService';

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking');
  
  const [booking, setBooking] = useState<Bookings | null>(null);
  const [freelancer, setFreelancer] = useState<Freelancers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Review form state
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch booking details
        const bookingData = await BaseCrudService.getById<Bookings>('bookings', bookingId);
        setBooking(bookingData);
        
        // Pre-fill client name from booking
        if (bookingData.clientName) {
          setClientName(bookingData.clientName);
        }

        // Find the freelancer by name (since we don't have direct reference)
        if (bookingData.freelancerName) {
          const freelancersData = await BaseCrudService.getAll<Freelancers>('freelancers');
          const matchedFreelancer = freelancersData.items.find(
            f => f.fullName === bookingData.freelancerName
          );
          if (matchedFreelancer) {
            setFreelancer(matchedFreelancer);
          }
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !freelancer || rating === 0) return;

    setIsSubmitting(true);
    try {
      const reviewData = {
        _id: crypto.randomUUID(),
        clientName,
        rating,
        reviewTitle,
        reviewContent,
        reviewDate: new Date(),
        freelancerId: freelancer._id,
        bookingId: booking._id,
      };

      await BaseCrudService.create('clientreviews', reviewData);
      
      // Send review notification email to freelancer
      await sendGridService.sendReviewNotification({
        freelancerName: freelancer.fullName || 'Freelancer',
        freelancerEmail: freelancer.contactEmail || 'noreply@servicebooking.com',
        clientName: clientName,
        rating: rating,
        reviewTitle: reviewTitle,
        reviewContent: reviewContent,
        serviceName: booking.serviceName || 'Service'
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-logoGold border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="font-paragraph text-lg font-medium">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingId || !booking) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-6 text-primary-foreground">Invalid Review Request</h1>
          <p className="font-paragraph text-lg text-primary-foreground/80 mb-8 leading-relaxed">
            No valid booking found for this review.
          </p>
          <Button asChild className="bg-logoGold text-logoBlack hover:bg-logoGold/90 font-semibold py-3 text-base">
            <Link to="/">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto"
        >
          <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-8" />
          <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-6 text-primary-foreground">Review Submitted!</h1>
          <p className="font-paragraph text-lg text-primary-foreground/80 mb-8 leading-relaxed">
            Thank you for your feedback. Your review helps other clients make informed decisions.
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90 font-semibold py-3 text-base">
              <Link to={`/freelancers/${freelancer?._id}`}>
                View Freelancer Profile
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full font-semibold py-3 text-base border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* Navigation */}
      <div className="bg-secondary text-secondary-foreground py-6 border-b border-secondary-foreground/10">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <Button asChild variant="ghost" className="font-semibold text-base hover:bg-secondary-foreground/10">
            <Link to="/tracking">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Tracking
            </Link>
          </Button>
        </div>
      </div>

      {/* Review Form */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-12">
              <h1 className="font-heading text-4xl lg:text-5xl font-bold mb-6 text-secondary-foreground">
                Write a Review
              </h1>
              <p className="font-paragraph text-xl text-secondary-foreground/75 leading-relaxed">
                Share your experience with {freelancer?.fullName || 'this freelancer'}
              </p>
            </div>

            {/* Booking Summary */}
            <Card className="mb-10 bg-white/5 border-secondary-foreground/20">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading text-2xl text-secondary-foreground">Service Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start gap-6">
                  {freelancer?.profilePicture && (
                    <Image
                      src={freelancer.profilePicture}
                      alt={freelancer.fullName || 'Freelancer'}
                      width={100}
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-heading text-2xl font-semibold mb-3 text-secondary-foreground">
                      {booking.serviceName}
                    </h3>
                    <p className="font-paragraph text-lg text-secondary-foreground/75 mb-4">
                      with {freelancer?.fullName || booking.freelancerName}
                    </p>
                    <div className="space-y-2 text-base text-secondary-foreground/70">
                      <p><strong>Date:</strong> {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                      <p><strong>Status:</strong> <span className="capitalize font-semibold text-secondary-foreground">{booking.bookingStatus}</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Form */}
            <Card className="bg-white/5 border-secondary-foreground/20">
              <CardContent className="p-10">
                <form onSubmit={handleSubmitReview} className="space-y-8">
                  {/* Client Name */}
                  <div>
                    <Label htmlFor="clientName" className="text-lg font-semibold text-secondary-foreground mb-3 block">
                      Your Name
                    </Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      className="text-base py-3 px-4 bg-white/10 border-secondary-foreground/30 text-secondary-foreground placeholder:text-secondary-foreground/50"
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <Label className="text-lg font-semibold text-secondary-foreground mb-4 block">
                      Rating
                    </Label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="p-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-logoGold rounded-lg"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`h-10 w-10 transition-colors ${
                              star <= (hoveredRating || rating)
                                ? 'text-logoGold fill-current'
                                : 'text-gray-400'
                            }`}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-4 text-lg font-semibold text-secondary-foreground">
                          {rating} star{rating !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <Label htmlFor="reviewTitle" className="text-lg font-semibold text-secondary-foreground mb-3 block">
                      Review Title
                    </Label>
                    <Input
                      id="reviewTitle"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Summarize your experience"
                      required
                      className="text-base py-3 px-4 bg-white/10 border-secondary-foreground/30 text-secondary-foreground placeholder:text-secondary-foreground/50"
                    />
                  </div>

                  {/* Review Content */}
                  <div>
                    <Label htmlFor="reviewContent" className="text-lg font-semibold text-secondary-foreground mb-3 block">
                      Your Review
                    </Label>
                    <Textarea
                      id="reviewContent"
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Tell others about your experience with this freelancer..."
                      rows={7}
                      required
                      className="text-base py-3 px-4 bg-white/10 border-secondary-foreground/30 text-secondary-foreground placeholder:text-secondary-foreground/50 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90 font-bold py-4 text-lg rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}