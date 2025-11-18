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
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-logoGold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-paragraph text-lg">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingId || !booking) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">Invalid Review Request</h1>
          <p className="font-paragraph text-primary-foreground/70 mb-6">
            No valid booking found for this review.
          </p>
          <Button asChild className="bg-logoGold text-logoBlack hover:bg-logoGold/90">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
          <h1 className="font-heading text-2xl font-bold mb-4">Review Submitted!</h1>
          <p className="font-paragraph text-primary-foreground/70 mb-6">
            Thank you for your feedback. Your review helps other clients make informed decisions.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90">
              <Link to={`/freelancers/${freelancer?._id}`}>
                View Freelancer Profile
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
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
      <div className="bg-secondary text-secondary-foreground py-4">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/tracking">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tracking
            </Link>
          </Button>
        </div>
      </div>

      {/* Review Form */}
      <section className="py-12 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-4">
                Write a Review
              </h1>
              <p className="font-paragraph text-lg text-secondary-foreground/70">
                Share your experience with {freelancer?.fullName || 'this freelancer'}
              </p>
            </div>

            {/* Booking Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {freelancer?.profilePicture && (
                    <Image
                      src={freelancer.profilePicture}
                      alt={freelancer.fullName || 'Freelancer'}
                      width={80}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-semibold mb-1">
                      {booking.serviceName}
                    </h3>
                    <p className="text-secondary-foreground/70 mb-2">
                      with {freelancer?.fullName || booking.freelancerName}
                    </p>
                    <div className="text-sm text-secondary-foreground/60">
                      <p>Date: {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}</p>
                      <p>Status: {booking.bookingStatus}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Form */}
            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  {/* Client Name */}
                  <div>
                    <Label htmlFor="clientName">Your Name</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <Label>Rating</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="p-1 transition-colors"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= (hoveredRating || rating)
                                ? 'text-logoGold fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-secondary-foreground/70">
                        {rating > 0 && `${rating} star${rating !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <Label htmlFor="reviewTitle">Review Title</Label>
                    <Input
                      id="reviewTitle"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Summarize your experience"
                      required
                    />
                  </div>

                  {/* Review Content */}
                  <div>
                    <Label htmlFor="reviewContent">Your Review</Label>
                    <Textarea
                      id="reviewContent"
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Tell others about your experience with this freelancer..."
                      rows={5}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90"
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