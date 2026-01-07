import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService, useMember } from '@/integrations';
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
import { CalendarIcon, Clock, DollarSign, MapPin, User, CreditCard, CheckCircle, Search, Filter, AlertCircle, Phone, Info } from 'lucide-react';
import { format } from 'date-fns';

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
  clientPhoneConfirm: string;
  paymentAmount: number;
  serviceState: string;
  serviceCity: string;
  clientLocation: string;
  paymentMethod: 'card' | 'cash';
  savedAddressId?: string;
  phoneVerified?: boolean;
}

const PLATFORM_FEE_PERCENTAGE = 0.05;

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { member, actions } = useMember();
  
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
  const [citiesByState, setCitiesByState] = useState<Record<string, string[]>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; address: string }>>([]);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
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
    clientPhoneConfirm: '',
    paymentAmount: 0,
    serviceState: '',
    serviceCity: '',
    clientLocation: '',
    paymentMethod: 'card',
    phoneVerified: false
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
        
        // Auto-populate email from logged-in member
        if (member?.loginEmail) {
          setFormData(prev => ({ ...prev, clientEmail: member.loginEmail || '' }));
        }
        
        // Load saved address from member profile
        if (member?.profile?.title) {
          setSavedAddresses([
            {
              id: 'saved-address',
              address: member.profile.title
            }
          ]);
        }
        
        const states = new Set<string>();
        const cities = new Set<string>();
        const citiesMap: Record<string, Set<string>> = {};
        
        locationsData.items.forEach(location => {
          if (location.stateName) {
            states.add(location.stateName);
            if (!citiesMap[location.stateName]) {
              citiesMap[location.stateName] = new Set<string>();
            }
            if (location.cityName) {
              citiesMap[location.stateName].add(location.cityName);
              cities.add(location.cityName);
            }
          }
        });
        
        // Convert Sets to sorted arrays
        const citiesByStateMap: Record<string, string[]> = {};
        Object.keys(citiesMap).forEach(state => {
          citiesByStateMap[state] = Array.from(citiesMap[state]).sort();
        });
        
        setAvailableStates(Array.from(states).sort());
        setAvailableCities(Array.from(cities).sort());
        setCitiesByState(citiesByStateMap);

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
  }, [searchParams, member]);

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
    // Check if user is signed in before confirming booking
    if (!member) {
      alert('Please sign in to confirm your booking.');
      actions.login();
      return;
    }

    // Validation checks
    if (!selectedService || !selectedFreelancer || !formData.bookingDate) {
      alert('Please complete all required fields.');
      return;
    }

    if (!formData.bookingTime) {
      alert('Please select a time slot.');
      return;
    }

    if (!formData.clientName || !formData.clientEmail || !formData.clientPhone) {
      alert('Please fill in all contact details.');
      return;
    }

    if (formData.clientPhone !== formData.clientPhoneConfirm) {
      alert('Phone numbers do not match. Please verify your phone number.');
      return;
    }

    if (formData.serviceLocationType === 'client' && 
        !formData.savedAddressId &&
        (!formData.houseFloorNo || !formData.street || !formData.area || !formData.city || !formData.postalCode)) {
      alert('Please fill in your complete address.');
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
    } else if (formData.savedAddressId) {
      const saved = savedAddresses.find(a => a.id === formData.savedAddressId);
      serviceAddress = saved?.address || '';
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
      alert('An error occurred while processing your booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  const redirectToPaymentGateway = (bookingData: Bookings, referenceId: string) => {
    // Simulate payment processing - in production, integrate with Razorpay, Stripe, etc.
    // For demo purposes, we'll redirect to confirmation page with success status
    
    // Create payment gateway URL with booking details
    const paymentParams = new URLSearchParams({
      payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`,
      order_id: referenceId,
      status: 'success', // In production, this comes from payment gateway
      amount: (bookingData.paymentAmount! * 100).toString(),
      customerName: bookingData.clientName || '',
      customerEmail: bookingData.clientEmail || '',
      customerPhone: bookingData.clientPhone || '',
      description: `${bookingData.serviceName} - ${bookingData.freelancerName}`
    });

    // Redirect to booking confirmation page
    // In production, replace with your actual payment gateway URL
    window.location.href = `/booking-confirmation?${paymentParams.toString()}`;
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
                formData.savedAddressId ||
                (formData.houseFloorNo && formData.street && formData.area && 
                 formData.postalCode && formData.city));
      case 3:
        return formData.clientName && formData.clientEmail && formData.clientPhone && 
               formData.clientPhoneConfirm && formData.clientPhone === formData.clientPhoneConfirm;
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
            <p className="font-paragraph text-lg sm:text-xl text-logoBlack">
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
              <Card className="bg-secondary text-logoBlack border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-logoBlack">
                    <User className="h-5 w-5" />
                    Select Service & Freelancer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sign-In Disclaimer */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">Important: Sign In Required</p>
                      <p className="text-sm text-blue-800 font-paragraph">
                        You must be signed in to your account before your booking can be confirmed. Please sign in or create an account to proceed with your booking. If you are already signed in, you can ignore this.
                      </p>
                    </div>
                  </div>

                  {/* Service Search & Filter */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="search" className="text-logoBlack font-semibold">Search Services</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="search"
                          placeholder="Search by service name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white text-logoBlack placeholder:text-gray-500 border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" className="text-logoBlack font-semibold">Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger id="category" className="bg-white text-logoBlack border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat._id} value={cat.categoryName || ''}>
                                {cat.categoryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="priceRange" className="text-logoBlack font-semibold">Price Range</Label>
                        <Select value={priceRange} onValueChange={setPriceRange}>
                          <SelectTrigger id="priceRange" className="bg-white text-logoBlack border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Prices</SelectItem>
                            <SelectItem value="0-500">₹0 - ₹500</SelectItem>
                            <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
                            <SelectItem value="1000-5000">₹1000 - ₹5000</SelectItem>
                            <SelectItem value="5000-999999">₹5000+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Service Selection */}
                  <div>
                    <Label htmlFor="service" className="text-logoBlack font-semibold">Select Service</Label>
                    <Select value={selectedService?._id || ''} onValueChange={handleServiceChange}>
                      <SelectTrigger id="service" className="bg-white text-logoBlack border-gray-300">
                        <SelectValue placeholder="Choose a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredServices.map((service) => (
                          <SelectItem key={service._id} value={service._id}>
                            {service.serviceName} - ₹{service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedService && (
                      <p className="text-sm text-logoBlack mt-2 font-paragraph">{selectedService.description}</p>
                    )}
                  </div>

                  {/* Location Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state" className="text-logoBlack font-semibold">State</Label>
                      <Select value={formData.serviceState} onValueChange={(state) => {
                        setFormData(prev => ({ ...prev, serviceState: state }));
                        filterFreelancersByLocation(state, formData.serviceCity);
                      }}>
                        <SelectTrigger id="state" className="bg-white text-logoBlack border-gray-300">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="city" className="text-logoBlack font-semibold">City</Label>
                      <Select value={formData.serviceCity} onValueChange={(city) => {
                        setFormData(prev => ({ ...prev, serviceCity: city }));
                        filterFreelancersByLocation(formData.serviceState, city);
                      }}>
                        <SelectTrigger id="city" className="bg-white text-logoBlack border-gray-300">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.serviceState ? (
                            citiesByState[formData.serviceState]?.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="all" disabled>
                              Please select a state first
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Freelancer Selection */}
                  <div>
                    <Label htmlFor="freelancer" className="text-logoBlack font-semibold">Select Freelancer</Label>
                    <Select value={selectedFreelancer?._id || ''} onValueChange={handleFreelancerChange}>
                      <SelectTrigger id="freelancer" className="bg-white text-logoBlack border-gray-300">
                        <SelectValue placeholder="Choose a freelancer" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFreelancers.map((freelancer) => (
                          <SelectItem key={freelancer._id} value={freelancer._id}>
                            {freelancer.fullName} - ₹{freelancer.hourlyRate}/hr
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedFreelancer && (
                      <div className="mt-3 p-3 bg-logoGold/10 rounded border border-logoGold/20">
                        <p className="text-sm font-semibold text-logoBlack">{selectedFreelancer.fullName}</p>
                        <p className="text-xs text-logoBlack/70 font-paragraph">{selectedFreelancer.bio}</p>
                        <p className="text-xs text-logoBlack/70 font-paragraph mt-1">Skills: {selectedFreelancer.skills}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="bg-secondary text-logoBlack border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-logoBlack">
                    <CalendarIcon className="h-5 w-5" />
                    Date, Time & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <Label className="text-logoBlack font-semibold">Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-white text-logoBlack border-gray-300 hover:bg-gray-50">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.bookingDate ? format(formData.bookingDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.bookingDate}
                          onSelect={(date) => setFormData(prev => ({ ...prev, bookingDate: date }))}
                          disabled={(date) => {
                            if (date < new Date()) return true;
                            if (!selectedFreelancer) return false;
                            
                            // Disable blocked dates
                            const blockedDates = selectedFreelancer.blockedDates?.split(',').map(d => d.trim()) || [];
                            const dateString = date.toISOString().split('T')[0];
                            return blockedDates.includes(dateString);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {selectedFreelancer && selectedFreelancer.blockedDates && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 mb-1">Unavailable Dates:</p>
                        <p className="text-xs text-red-600 font-paragraph">{selectedFreelancer.blockedDates}</p>
                      </div>
                    )}
                  </div>

                  {/* Time Selection */}
                  <div>
                    <Label htmlFor="time" className="text-logoBlack font-semibold">Select Time</Label>
                    <Select value={formData.bookingTime} onValueChange={(time) => setFormData(prev => ({ ...prev, bookingTime: time }))}>
                      <SelectTrigger id="time" className="bg-white text-logoBlack border-gray-300">
                        <SelectValue placeholder="Choose a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.length > 0 ? (
                          availableTimeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="all" disabled>
                            No available slots for this date
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service Location Type */}
                  <div>
                    <Label className="text-logoBlack font-semibold">Service Location</Label>
                    <RadioGroup value={formData.serviceLocationType} onValueChange={(value) => setFormData(prev => ({ ...prev, serviceLocationType: value }))}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="client" id="client" />
                        <Label htmlFor="client" className="font-normal cursor-pointer text-logoBlack">At my location (Client's address)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="freelancer" id="freelancer" />
                        <Label htmlFor="freelancer" className="font-normal cursor-pointer text-logoBlack">At freelancer's location</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Address Fields - Only show if client location selected */}
                  {formData.serviceLocationType === 'client' && (
                    <div className="space-y-4 p-4 bg-logoGold/10 rounded-lg border border-logoGold/20">
                      <h4 className="font-semibold text-sm text-logoBlack">Service Address</h4>
                      
                      {/* Saved Addresses Option */}
                      {savedAddresses.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-logoBlack font-semibold text-sm">Use Saved Address</Label>
                          <Select value={formData.savedAddressId || ''} onValueChange={(value) => {
                            if (value === 'new') {
                              setFormData(prev => ({ ...prev, savedAddressId: undefined, houseFloorNo: '', street: '', area: '', postalCode: '', city: '' }));
                            } else {
                              const saved = savedAddresses.find(a => a.id === value);
                              if (saved) {
                                setFormData(prev => ({ ...prev, savedAddressId: value, serviceAddress: saved.address, houseFloorNo: '', street: '', area: '', postalCode: '', city: '' }));
                              }
                            }
                          }}>
                            <SelectTrigger className="bg-white text-logoBlack border-gray-300">
                              <SelectValue placeholder="Select an address" />
                            </SelectTrigger>
                            <SelectContent>
                              {savedAddresses.map(addr => (
                                <SelectItem key={addr.id} value={addr.id}>
                                  {addr.address}
                                </SelectItem>
                              ))}
                              <SelectItem value="new">Enter New Address</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {/* Manual Address Entry - Show if no saved address selected */}
                      {!formData.savedAddressId && (
                        <div className="space-y-4">
                          <h5 className="font-semibold text-xs text-logoBlack/70">Enter Your Address</h5>
                          <div>
                            <Label htmlFor="houseFloor" className="text-logoBlack">House/Floor No.</Label>
                            <Input
                              id="houseFloor"
                              value={formData.houseFloorNo}
                              onChange={(e) => setFormData(prev => ({ ...prev, houseFloorNo: e.target.value }))}
                              placeholder="e.g., 123, Apt 4B"
                              className="bg-white text-logoBlack border-gray-300 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <Label htmlFor="street" className="text-logoBlack">Street Name</Label>
                            <Input
                              id="street"
                              value={formData.street}
                              onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                              placeholder="e.g., Main Street"
                              className="bg-white text-logoBlack border-gray-300 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <Label htmlFor="area" className="text-logoBlack">Area/Locality</Label>
                            <Input
                              id="area"
                              value={formData.area}
                              onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                              placeholder="e.g., Downtown"
                              className="bg-white text-logoBlack border-gray-300 placeholder:text-gray-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="city" className="text-logoBlack">City</Label>
                              <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="e.g., Bangalore"
                                className="bg-white text-logoBlack border-gray-300 placeholder:text-gray-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="postal" className="text-logoBlack">Postal Code</Label>
                              <Input
                                id="postal"
                                value={formData.postalCode}
                                onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                                placeholder="e.g., 560001"
                                className="bg-white text-logoBlack border-gray-300 placeholder:text-gray-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Freelancer Location Display - Postal Code Only */}
                  {formData.serviceLocationType === 'freelancer' && selectedFreelancer && (
                    <div className="p-4 bg-logoGold/10 rounded-lg border border-logoGold/20">
                      <h4 className="font-semibold text-sm text-logoBlack mb-2">Service Location</h4>
                      <p className="text-sm text-logoBlack font-paragraph">
                        <span className="font-semibold">Service Area:</span> {selectedFreelancer.serviceArea || 'Not specified'}
                      </p>
                      <p className="text-xs text-logoBlack/70 font-paragraph mt-2">
                        Full address will be provided after booking confirmation
                      </p>
                    </div>
                  )}
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
                      <Label htmlFor="clientEmail">Email Address</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                        title="Email is automatically populated from your account"
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-populated from your account</p>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-900">Phone Number Verification</h4>
                    
                    <div>
                      <Label htmlFor="clientPhone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Enter Phone Number
                      </Label>
                      <Input
                        id="clientPhone"
                        value={formData.clientPhone}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, clientPhone: e.target.value }));
                          setPhoneVerified(false);
                        }}
                        placeholder="Enter 10-digit phone number"
                        className="bg-white text-gray-700 border-gray-300"
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientPhoneConfirm" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Confirm Phone Number
                        {formData.clientPhone && formData.clientPhoneConfirm && formData.clientPhone === formData.clientPhoneConfirm && (
                          <span className="text-green-600 text-xs font-semibold">✓ Match</span>
                        )}
                        {formData.clientPhone && formData.clientPhoneConfirm && formData.clientPhone !== formData.clientPhoneConfirm && (
                          <span className="text-red-600 text-xs font-semibold">✗ Mismatch</span>
                        )}
                      </Label>
                      <Input
                        id="clientPhoneConfirm"
                        value={formData.clientPhoneConfirm}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientPhoneConfirm: e.target.value }))}
                        placeholder="Re-enter your phone number"
                        className={`bg-white text-gray-700 border-gray-300 ${
                          formData.clientPhone && formData.clientPhoneConfirm && formData.clientPhone === formData.clientPhoneConfirm
                            ? 'border-green-500 bg-green-50'
                            : formData.clientPhone && formData.clientPhoneConfirm && formData.clientPhone !== formData.clientPhoneConfirm
                            ? 'border-red-500 bg-red-50'
                            : ''
                        }`}
                      />
                      {formData.clientPhone && formData.clientPhoneConfirm && formData.clientPhone === formData.clientPhoneConfirm && (
                        <p className="text-xs text-green-600 mt-1 font-semibold">✓ Phone numbers match</p>
                      )}
                      {formData.clientPhone && formData.clientPhoneConfirm && formData.clientPhone !== formData.clientPhoneConfirm && (
                        <p className="text-xs text-red-600 mt-1 font-semibold">✗ Phone numbers do not match</p>
                      )}
                    </div>
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
                        <span>Platform fee & GST:</span>
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
