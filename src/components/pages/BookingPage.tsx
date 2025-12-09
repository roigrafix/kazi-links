import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Services, Freelancers, Bookings, ServiceCategories, IndianLocations } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Image } from '@/components/ui/image';
import { CalendarIcon, Clock, DollarSign, MapPin, User, CreditCard, CheckCircle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { sendGridService } from '@/services/sendgridService';

interface BookingFormData {
  serviceName: string;
  freelancerName: string;
  bookingDate: Date | undefined;
  bookingTime: string;
  serviceLocationType: string;
  serviceAddress: string;
  houseFloorNo: string;
  street: string;
  area: string;
  postalCode: string;
  city: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  paymentAmount: number;
  serviceState: string;
  serviceCity: string;
  clientLocation: string;
  paymentMethod: 'card' | 'cash';
}

const PLATFORM_FEE_PERCENTAGE = 0.1;

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [services, setServices] = useState<Services[]>([]);
  const [categories, setCategories] = useState<ServiceCategories[]>([]);
  const [filteredServices, setFilteredServices] = useState<Services[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancers[]>([]);
  const [availableFreelancers, setAvailableFreelancers] = useState<Freelancers[]>([]);
  const [selectedService, setSelectedService] = useState<Services | null>(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancers | null>(null);
  
  const [locations, setLocations] = useState<IndianLocations[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<BookingFormData>({
    serviceName: '',
    freelancerName: '',
    bookingDate: undefined,
    bookingTime: '',
    serviceLocationType: 'client',
    serviceAddress: '',
    houseFloorNo: '',
    street: '',
    area: '',
    postalCode: '',
    city: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    paymentAmount: 0,
    serviceState: '',
    serviceCity: '',
    clientLocation: '',
    paymentMethod: 'card'
  });

  const calculateTotal = (amount: number) => {
    return amount + (amount * PLATFORM_FEE_PERCENTAGE);
  };

  const platformFee = formData.paymentAmount * PLATFORM_FEE_PERCENTAGE;
  const totalAmount = calculateTotal(formData.paymentAmount);

  const getAvailableTimeSlots = async (freelancer: Freelancers, date: Date): Promise<string[]> => {
    if (!freelancer || !date) return [];

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const availableDays = freelancer.availableDays?.split(',').map(day => day.trim()) || [];
    
    if (availableDays.length > 0 && !availableDays.includes(dayName)) {
      return [];
    }

    const blockedDates = freelancer.blockedDates?.split(',').map(date => date.trim()) || [];
    const dateString = date.toISOString().split('T')[0];
    
    if (blockedDates.includes(dateString)) {
      return [];
    }

    let startHour = 9;
    let endHour = 20;

    if (freelancer.workingHoursStart) {
      const startTime = freelancer.workingHoursStart.toString();
      startHour = parseInt(startTime.split(':')[0]);
    }

    if (freelancer.workingHoursEnd) {
      const endTime = freelancer.workingHoursEnd.toString();
      endHour = parseInt(endTime.split(':')[0]);
    }

    const allSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    try {
      const { items: existingBookings } = await BaseCrudService.getAll<Bookings>('bookings');
      
      const bookedSlots = existingBookings
        .filter(booking => {
          if (booking.freelancerName !== freelancer.fullName) return false;
          const bookingDate = new Date(booking.bookingDate || '');
          return bookingDate.toDateString() === date.toDateString() && 
                 booking.bookingStatus !== 'cancelled';
        })
        .map(booking => booking.bookingTime);

      return allSlots.filter(slot => !bookedSlots.includes(slot));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return allSlots;
    }
  };

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    const updateTimeSlots = async () => {
      if (selectedFreelancer && formData.bookingDate) {
        const slots = await getAvailableTimeSlots(selectedFreelancer, formData.bookingDate);
        setAvailableTimeSlots(slots);
        
        if (formData.bookingTime && !slots.includes(formData.bookingTime)) {
          setFormData(prev => ({ ...prev, bookingTime: '' }));
        }
      } else {
        setAvailableTimeSlots([]);
      }
    };

    updateTimeSlots();
  }, [selectedFreelancer, formData.bookingDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, freelancersData, categoriesData, locationsData] = await Promise.all([
          BaseCrudService.getAll<Services>('services', ['reference']),
          BaseCrudService.getAll<Freelancers>('freelancers'),
          BaseCrudService.getAll<ServiceCategories>('servicecategories'),
          BaseCrudService.getAll<IndianLocations>('indianlocations')
        ]);
        
        const bookableServices = servicesData.items.filter(service => service.isBookable);
        setServices(bookableServices);
        setFilteredServices(bookableServices);
        setFreelancers(freelancersData.items);
        setCategories(categoriesData.items.filter(cat => cat.isActive));
        setLocations(locationsData.items);
        
        const states = new Set<string>();
        const cities = new Set<string>();
        locationsData.items.forEach(location => {
          if (location.stateName) states.add(location.stateName);
          if (location.cityName) cities.add(location.cityName);
        });
        setAvailableStates(Array.from(states).sort());
        setAvailableCities(Array.from(cities).sort());

        const serviceId = searchParams.get('service');
        const freelancerId = searchParams.get('freelancer');

        if (serviceId) {
          const service = servicesData.items.find(s => s._id === serviceId);
          if (service) {
            setSelectedService(service);
            setFormData(prev => ({ 
              ...prev, 
              serviceName: service.serviceName || '',
              paymentAmount: service.price || 0
            }));
            
            const referencedFreelancers = servicesData.items
              .filter(s => s.serviceName === service.serviceName && s.reference)
              .map(s => s.reference as Freelancers)
              .filter(Boolean);
            
            if (referencedFreelancers.length > 0) {
              setAvailableFreelancers(referencedFreelancers);
            } else {
              setAvailableFreelancers(freelancersData.items);
            }
          }
        } else if (freelancerId) {
          const freelancer = freelancersData.items.find(f => f._id === freelancerId);
          if (freelancer) {
            setSelectedFreelancer(freelancer);
            setFormData(prev => ({ 
              ...prev, 
              freelancerName: freelancer.fullName || ''
            }));
            setAvailableFreelancers([freelancer]);
          }
        } else {
          setAvailableFreelancers(freelancersData.items);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  useEffect(() => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.categoryName === selectedCategory);
    }

    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(service => {
        const price = service.price || 0;
        if (max) {
          return price >= min && price <= max;
        } else {
          return price >= min;
        }
      });
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory, priceRange]);

  const handleServiceChange = (serviceId: string) => {
    const service = filteredServices.find(s => s._id === serviceId);
    if (service) {
      setSelectedService(service);
      setFormData(prev => ({ 
        ...prev, 
        serviceName: service.serviceName || '',
        paymentAmount: service.price || 0
      }));
      
      const referencedFreelancers = services
        .filter(s => s.serviceName === service.serviceName && s.reference)
        .map(s => s.reference as Freelancers)
        .filter(Boolean);
      
      if (formData.serviceState || formData.serviceCity) {
        filterFreelancersByLocation(formData.serviceState, formData.serviceCity);
      } else {
        if (referencedFreelancers.length > 0) {
          setAvailableFreelancers(referencedFreelancers);
        } else {
          setAvailableFreelancers(freelancers);
        }
      }
      
      setSelectedFreelancer(null);
      setFormData(prev => ({ ...prev, freelancerName: '' }));
    }
  };

  const handleFreelancerChange = (freelancerId: string) => {
    const freelancer = availableFreelancers.find(f => f._id === freelancerId);
    if (freelancer) {
      setSelectedFreelancer(freelancer);
      setFormData(prev => ({ 
        ...prev, 
        freelancerName: freelancer.fullName || ''
      }));
    }
  };

  const checkBookingConflict = async (freelancerId: string, date: Date, time: string): Promise<boolean> => {
    try {
      const { items: existingBookings } = await BaseCrudService.getAll<Bookings>('bookings');
      
      const conflict = existingBookings.some(booking => {
        if (booking.freelancerName !== selectedFreelancer?.fullName) return false;
        
        const bookingDate = new Date(booking.bookingDate || '');
        const isSameDate = bookingDate.toDateString() === date.toDateString();
        const isSameTime = booking.bookingTime === time;
        
        return isSameDate && isSameTime && booking.bookingStatus !== 'cancelled';
      });
      
      return conflict;
    } catch (error) {
      console.error('Error checking booking conflicts:', error);
      return false;
    }
  };

  const isFreelancerAvailable = (freelancer: Freelancers, date: Date, time: string): boolean => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const availableDays = freelancer.availableDays?.split(',').map(day => day.trim()) || [];
    
    if (availableDays.length > 0 && !availableDays.includes(dayName)) {
      return false;
    }

    const blockedDates = freelancer.blockedDates?.split(',').map(date => date.trim()) || [];
    const dateString = date.toISOString().split('T')[0];
    
    if (blockedDates.includes(dateString)) {
      return false;
    }

    if (freelancer.workingHoursStart && freelancer.workingHoursEnd) {
      const timeHour = parseInt(time.split(':')[0]);
      const startHour = freelancer.workingHoursStart ? parseInt(freelancer.workingHoursStart.toString().split(':')[0]) : 0;
      const endHour = freelancer.workingHoursEnd ? parseInt(freelancer.workingHoursEnd.toString().split(':')[0]) : 24;
      
      if (timeHour < startHour || timeHour >= endHour) {
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedFreelancer || !formData.bookingDate) {
      return;
    }

    const hasConflict = await checkBookingConflict(
      selectedFreelancer._id, 
      formData.bookingDate, 
      formData.bookingTime
    );

    if (hasConflict) {
      alert('This time slot is already booked. Please select a different time.');
      return;
    }

    if (!isFreelancerAvailable(selectedFreelancer, formData.bookingDate, formData.bookingTime)) {
      alert('The freelancer is not available at this time. Please select a different time slot.');
      return;
    }

    let serviceAddress = '';
    if (formData.serviceLocationType === 'freelancer') {
      serviceAddress = selectedFreelancer.fullAddress || 
                       `${selectedFreelancer.serviceArea || ''}, ${selectedFreelancer.city || ''}`.trim();
    } else {
      serviceAddress = `${formData.houseFloorNo}, ${formData.street}, ${formData.area}, ${formData.city} ${formData.postalCode}`;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      const referenceId = `REF-${dateStr}-${randomStr}`;

      const bookingData: Partial<Bookings> = {
        _id: crypto.randomUUID(),
        serviceName: formData.serviceName,
        freelancerName: formData.freelancerName,
        bookingDate: formData.bookingDate?.toISOString(),
        bookingTime: formData.bookingTime,
        serviceLocationType: formData.serviceLocationType,
        serviceAddress: serviceAddress,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        paymentAmount: totalAmount,
        transportationCost: 0,
        bookingStatus: 'pending',
        paymentStatus: 'pending',
        etaStatus: 'scheduled',
        serviceState: formData.serviceState,
        serviceCity: formData.serviceCity,
        clientLocation: formData.clientLocation
      };

      // Store booking data in sessionStorage for payment verification
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      sessionStorage.setItem('bookingReferenceId', referenceId);

      // Redirect to payment gateway
      redirectToPaymentGateway(bookingData as Bookings, referenceId);
    } catch (error) {
      console.error('Error preparing booking:', error);
      setIsSubmitting(false);
    }
  };

  const redirectToPaymentGateway = (bookingData: Bookings, referenceId: string) => {
    // Create payment gateway URL with booking details
    const paymentParams = new URLSearchParams({
      amount: (bookingData.paymentAmount! * 100).toString(),
      orderId: referenceId,
      customerName: bookingData.clientName || '',
      customerEmail: bookingData.clientEmail || '',
      customerPhone: bookingData.clientPhone || '',
      description: `${bookingData.serviceName} - ${bookingData.freelancerName}`,
      returnUrl: `${window.location.origin}/booking-confirmation`
    });

    // Redirect to payment gateway
    // Replace with your actual payment gateway URL
    window.location.href = `https://payment-gateway.example.com/checkout?${paymentParams.toString()}`;
  };

  const filterFreelancersByLocation = (state: string, city: string) => {
    if (!state && !city) {
      if (selectedService) {
        const referencedFreelancers = services
          .filter(s => s.serviceName === selectedService.serviceName && s.reference)
          .map(s => s.reference as Freelancers)
          .filter(Boolean);
        
        if (referencedFreelancers.length > 0) {
          setAvailableFreelancers(referencedFreelancers);
        } else {
          setAvailableFreelancers(freelancers);
        }
      } else {
        setAvailableFreelancers(freelancers);
      }
      return;
    }

    let baseFreelancers = freelancers;
    if (selectedService) {
      const referencedFreelancers = services
        .filter(s => s.serviceName === selectedService.serviceName && s.reference)
        .map(s => s.reference as Freelancers)
        .filter(Boolean);
      
      if (referencedFreelancers.length > 0) {
        baseFreelancers = referencedFreelancers;
      }
    }

    const filteredFreelancers = baseFreelancers.filter(freelancer => {
      const matchesState = state ? (
        freelancer.serviceStates?.toLowerCase().includes(state.toLowerCase()) ||
        freelancer.preferredStates?.toLowerCase().includes(state.toLowerCase())
      ) : true;

      const matchesCity = city ? (
        freelancer.serviceCities?.toLowerCase().includes(city.toLowerCase()) ||
        freelancer.preferredCities?.toLowerCase().includes(city.toLowerCase()) ||
        freelancer.city?.toLowerCase().includes(city.toLowerCase())
      ) : true;

      return matchesState && matchesCity;
    });

    setAvailableFreelancers(filteredFreelancers);
    
    if (selectedFreelancer && !filteredFreelancers.find(f => f._id === selectedFreelancer._id)) {
      setSelectedFreelancer(null);
      setFormData(prev => ({ ...prev, freelancerName: '' }));
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return selectedService && selectedFreelancer && formData.serviceState && formData.serviceCity;
      case 2:
        return formData.bookingDate && formData.bookingTime && 
               (formData.serviceLocationType === 'freelancer' || 
                (formData.houseFloorNo && formData.street && formData.area && 
                 formData.postalCode && formData.city));
      case 3:
        return formData.clientName && formData.clientEmail && formData.clientPhone;
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neonyellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-paragraph text-base sm:text-lg">Loading booking form...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md mx-auto w-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-[#3B3B3B]" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-4">Booking Confirmed!</h1>
          <p className="font-paragraph text-base sm:text-lg text-primary-foreground/80 mb-6">
            Your booking has been successfully created. You'll receive a confirmation email shortly.
          </p>
          <div className="space-y-3">
            <Button 
              asChild 
              size="lg" 
              className="w-full bg-neonyellow text-black hover:bg-neonyellow/90"
            >
              <button onClick={() => navigate('/tracking')}>
                Track Your Booking
              </button>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="w-full border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <button onClick={() => navigate('/')}>
                Back to Home
              </button>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* ... rest of the JSX remains the same ... */}
      <section className="py-8 sm:py-12 bg-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[100rem]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-logoBlack">
              Book Your Service
            </h1>
            <p className="font-paragraph text-lg sm:text-xl text-logoBlack/70">
              Complete your booking in just a few simple steps
            </p>
          </motion.div>

          <div className="flex justify-center mt-6 sm:mt-8">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                    currentStep >= step 
                      ? 'bg-logoGold text-logoBlack' 
                      : 'bg-logoBlack/20 text-logoBlack/60'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-8 sm:w-12 h-1 mx-1 sm:mx-2 ${
                      currentStep > step ? 'bg-logoGold' : 'bg-logoBlack/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-4xl">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {currentStep === 1 && (
              <Card className="bg-secondary text-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Select Service & Freelancer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ... Step 1 content remains the same ... */}
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="bg-secondary text-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Date, Time & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ... Step 2 content remains the same ... */}
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="bg-secondary text-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Contact & Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName">Full Name</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientPhone">Phone Number</Label>
                      <Input
                        id="clientPhone"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="clientEmail">Email Address</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 sm:p-6">
                    <h3 className="font-semibold mb-4">Booking Summary</h3>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span>Service:</span>
                        <span className="font-medium">{formData.serviceName}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span>Freelancer:</span>
                        <span className="font-medium">{formData.freelancerName}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span>Date & Time:</span>
                        <span className="font-medium">
                          {formData.bookingDate ? format(formData.bookingDate, "PPP") : ''} at {formData.bookingTime}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span>Service Cost:</span>
                        <span className="font-medium">₹{formData.paymentAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span>Platform Fee (10%):</span>
                        <span className="font-medium text-orange-600">₹{platformFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-3 flex flex-col sm:flex-row sm:justify-between gap-1 font-semibold text-lg">
                        <span>Total:</span>
                        <span className="text-brightpink">
                          ₹{totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Previous
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={!isStepValid() || isSubmitting}
                className="w-full sm:w-auto bg-neonyellow hover:bg-neonyellow/90 text-[#6b6969]"
              >
                {isSubmitting ? 'Processing...' : currentStep === 3 ? 'Proceed to Payment' : 'Next'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
