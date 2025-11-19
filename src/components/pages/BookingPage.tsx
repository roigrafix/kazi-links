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

interface BookingFormData {
  serviceName: string;
  freelancerName: string;
  bookingDate: Date | undefined;
  bookingTime: string;
  serviceLocationType: string;
  serviceAddress: string;
  // Segmented address fields
  houseFloorNo: string;
  street: string;
  area: string;
  postalCode: string;
  city: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  paymentAmount: number;
  // Location fields
  serviceState: string;
  serviceCity: string;
  clientLocation: string;
}

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
  
  // Location data
  const [locations, setLocations] = useState<IndianLocations[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Filter states
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
    // Initialize segmented address fields
    houseFloorNo: '',
    street: '',
    area: '',
    postalCode: '',
    city: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    paymentAmount: 0,
    // Location fields
    serviceState: '',
    serviceCity: '',
    clientLocation: ''
  });

  // Generate available time slots based on freelancer availability and existing bookings
  const getAvailableTimeSlots = async (freelancer: Freelancers, date: Date): Promise<string[]> => {
    if (!freelancer || !date) return [];

    // Check if the day is available
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const availableDays = freelancer.availableDays?.split(',').map(day => day.trim()) || [];
    
    if (availableDays.length > 0 && !availableDays.includes(dayName)) {
      return []; // Freelancer not available on this day
    }

    // Check if the date is blocked
    const blockedDates = freelancer.blockedDates?.split(',').map(date => date.trim()) || [];
    const dateString = date.toISOString().split('T')[0];
    
    if (blockedDates.includes(dateString)) {
      return []; // Date is blocked
    }

    // Generate time slots based on working hours
    let startHour = 9; // Default start
    let endHour = 20; // Default end

    if (freelancer.workingHoursStart) {
      const startTime = freelancer.workingHoursStart.toString();
      startHour = parseInt(startTime.split(':')[0]);
    }

    if (freelancer.workingHoursEnd) {
      const endTime = freelancer.workingHoursEnd.toString();
      endHour = parseInt(endTime.split(':')[0]);
    }

    // Generate hourly slots
    const allSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    // Filter out booked slots
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

  // Update available time slots when freelancer or date changes
  useEffect(() => {
    const updateTimeSlots = async () => {
      if (selectedFreelancer && formData.bookingDate) {
        const slots = await getAvailableTimeSlots(selectedFreelancer, formData.bookingDate);
        setAvailableTimeSlots(slots);
        
        // Clear selected time if it's no longer available
        if (formData.bookingTime && !slots.includes(formData.bookingTime)) {
          setFormData(prev => ({ ...prev, bookingTime: '' }));
        }
      } else {
        setAvailableTimeSlots([]);
      }
    };

    updateTimeSlots();
  }, [selectedFreelancer, formData.bookingDate]);

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services with their referenced freelancers populated
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
        
        // Extract unique states and cities from locations
        const states = new Set<string>();
        const cities = new Set<string>();
        locationsData.items.forEach(location => {
          if (location.stateName) states.add(location.stateName);
          if (location.cityName) cities.add(location.cityName);
        });
        setAvailableStates(Array.from(states).sort());
        setAvailableCities(Array.from(cities).sort());

        // Pre-select service or freelancer from URL params
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
            
            // Get all freelancers referenced for this specific service
            const referencedFreelancers = servicesData.items
              .filter(s => s.serviceName === service.serviceName && s.reference)
              .map(s => s.reference as Freelancers)
              .filter(Boolean); // Remove any null/undefined references
            
            // If we have referenced freelancers, show only those; otherwise show all freelancers
            if (referencedFreelancers.length > 0) {
              setAvailableFreelancers(referencedFreelancers);
            } else {
              // Fallback to all freelancers if no specific references found
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

  // Filter services based on search term, category, and price range
  useEffect(() => {
    let filtered = services;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.categoryName === selectedCategory);
    }

    // Filter by price range
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
      
      // Get all freelancers referenced for this specific service
      const referencedFreelancers = services
        .filter(s => s.serviceName === service.serviceName && s.reference)
        .map(s => s.reference as Freelancers)
        .filter(Boolean); // Remove any null/undefined references
      
      // Apply location filtering if location is already selected
      if (formData.serviceState || formData.serviceCity) {
        filterFreelancersByLocation(formData.serviceState, formData.serviceCity);
      } else {
        // If we have referenced freelancers, show only those; otherwise show all freelancers
        if (referencedFreelancers.length > 0) {
          setAvailableFreelancers(referencedFreelancers);
        } else {
          // Fallback to all freelancers if no specific references found
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

  // Check for booking conflicts
  const checkBookingConflict = async (freelancerId: string, date: Date, time: string): Promise<boolean> => {
    try {
      const { items: existingBookings } = await BaseCrudService.getAll<Bookings>('bookings');
      
      // Check if there's already a booking for this freelancer at the same date and time
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

  // Check if freelancer is available on a specific date and time
  const isFreelancerAvailable = (freelancer: Freelancers, date: Date, time: string): boolean => {
    // Check if the day is in available days
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const availableDays = freelancer.availableDays?.split(',').map(day => day.trim()) || [];
    
    if (availableDays.length > 0 && !availableDays.includes(dayName)) {
      return false;
    }

    // Check if the date is in blocked dates
    const blockedDates = freelancer.blockedDates?.split(',').map(date => date.trim()) || [];
    const dateString = date.toISOString().split('T')[0];
    
    if (blockedDates.includes(dateString)) {
      return false;
    }

    // Check working hours (simplified check - you can enhance this)
    if (freelancer.workingHoursStart && freelancer.workingHoursEnd) {
      // This is a basic check - you might want to implement more sophisticated time comparison
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

    // Check for booking conflicts
    const hasConflict = await checkBookingConflict(
      selectedFreelancer._id, 
      formData.bookingDate, 
      formData.bookingTime
    );

    if (hasConflict) {
      alert('This time slot is already booked. Please select a different time.');
      return;
    }

    // Check freelancer availability
    if (!isFreelancerAvailable(selectedFreelancer, formData.bookingDate, formData.bookingTime)) {
      alert('The freelancer is not available at this time. Please select a different time slot.');
      return;
    }

    // Determine the service address based on location type
    let serviceAddress = '';
    if (formData.serviceLocationType === 'freelancer') {
      // Use freelancer's full address (this will be revealed after booking)
      serviceAddress = selectedFreelancer.fullAddress || 
                      `${selectedFreelancer.serviceArea || ''}, ${selectedFreelancer.city || ''}`.trim();
    } else {
      // Use client's address
      serviceAddress = `${formData.houseFloorNo}, ${formData.street}, ${formData.area}, ${formData.city} ${formData.postalCode}`;
    }

    setIsSubmitting(true);
    try {
      const bookingData: Partial<Bookings> = {
        _id: crypto.randomUUID(),
        serviceName: formData.serviceName,
        freelancerName: formData.freelancerName,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        serviceLocationType: formData.serviceLocationType,
        serviceAddress: serviceAddress,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        paymentAmount: formData.paymentAmount,
        transportationCost: 0, // Transportation cost will be sent via email
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        etaStatus: 'scheduled',
        // Location fields
        serviceState: formData.serviceState,
        serviceCity: formData.serviceCity,
        clientLocation: formData.clientLocation
      };

      await BaseCrudService.create('bookings', bookingData as any);
      setCurrentStep(4); // Success step
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterFreelancersByLocation = (state: string, city: string) => {
    if (!state && !city) {
      // If no location selected, show all freelancers
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

    // Get the base freelancers list (either service-specific or all)
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

    // Filter freelancers based on location
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
    
    // Clear selected freelancer if they're not in the filtered list
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
      {/* Header */}
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

          {/* Progress Steps */}
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
      {/* Booking Form */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-4xl">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Step 1: Service & Freelancer Selection */}
            {currentStep === 1 && (
              <Card className="bg-secondary text-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Select Service & Freelancer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Service Filters */}
                  <div className="bg-white/5 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <Filter className="h-4 w-4" />
                      Filter Services:
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search services..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>



                      {/* Category Filter */}
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="text-primary">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-[#FFFFFF] focus:text-[#FFFFFF]">All Categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category._id} value={category.categoryName || 'unknown'}>
                              {category.categoryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Price Range Filter */}
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger className="text-primary">
                          <SelectValue placeholder="Price Range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-[#FFFFFF] focus:text-[#FFFFFF]">All Prices</SelectItem>
                          <SelectItem value="0-50">₹0 - ₹50</SelectItem>
                          <SelectItem value="50-100">₹50 - ₹100</SelectItem>
                          <SelectItem value="100-200">₹100 - ₹200</SelectItem>
                          <SelectItem value="200-500">₹200 - ₹500</SelectItem>
                          <SelectItem value="500">₹500+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-sm text-gray-600">
                      {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
                    </div>
                  </div>

                  {/* Location Selection */}
                  <div>
                    <Label className="text-gray-800 mb-3 block">
                      Your Location (to find nearby freelancers)
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="serviceState" className="text-sm text-gray-700">
                          State *
                        </Label>
                        <Select 
                          value={formData.serviceState} 
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, serviceState: value, serviceCity: '' }));
                            // Filter freelancers based on selected state
                            filterFreelancersByLocation(value, '');
                          }}
                        >
                          <SelectTrigger className="text-secondary-foreground mt-1">
                            <SelectValue placeholder="Select your state" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStates.map(state => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="serviceCity" className="text-sm text-gray-700">
                          City *
                        </Label>
                        <Select 
                          value={formData.serviceCity} 
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, serviceCity: value }));
                            // Filter freelancers based on selected city
                            filterFreelancersByLocation(formData.serviceState, value);
                          }}
                          disabled={!formData.serviceState}
                        >
                          <SelectTrigger className="text-secondary-foreground mt-1">
                            <SelectValue placeholder={formData.serviceState ? "Select your city" : "Select state first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCities
                              .filter(city => {
                                // Filter cities based on selected state if available
                                if (!formData.serviceState) return true;
                                const cityLocation = locations.find(loc => 
                                  loc.cityName === city && loc.stateName === formData.serviceState
                                );
                                return cityLocation !== undefined;
                              })
                              .map(city => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Location Status */}
                    {formData.serviceState && formData.serviceCity && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Location selected: {formData.serviceCity}, {formData.serviceState}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Selection */}
                  <div>
                    <Label htmlFor="service" className="text-gray-800">Choose a Service</Label>
                    <Select value={selectedService?._id} onValueChange={handleServiceChange}>
                      <SelectTrigger className="text-primary">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredServices.map((service, index) => (
                          <SelectItem 
                            key={service._id} 
                            value={service._id || `service-${index}`}
                            className={index === 0 ? "text-[#FFFFFF] focus:text-[#FFFFFF]" : ""}
                          >
                            {service.serviceName} - ₹{service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Service Display */}
                  {selectedService && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <Image
                          src={selectedService.serviceImage || 'https://static.wixstatic.com/media/d6d795_ffa1fed9e894425c8bcef95e4d1a2af6~mv2.png?originWidth=128&originHeight=128'}
                          alt={selectedService.serviceName || 'Service'}
                          width={80}
                          className="w-16 h-16 rounded-lg object-cover mx-auto sm:mx-0"
                        />
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="font-semibold text-gray-800">{selectedService.serviceName}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {selectedService.description}
                          </p>
                          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              ₹{selectedService.price}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {selectedService.durationMinutes}min
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Freelancer Selection */}
                  {selectedService && (
                    <div className="shadow-none">
                      <Label htmlFor="freelancer" className="text-gray-800">Choose a Freelancer</Label>
                      {availableFreelancers.length > 0 ? (
                        <Select value={selectedFreelancer?._id} onValueChange={handleFreelancerChange}>
                          <SelectTrigger className="text-secondary-foreground">
                            <SelectValue placeholder="Select a freelancer" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFreelancers.map((freelancer, index) => (
                              <SelectItem 
                                key={freelancer._id} 
                                value={freelancer._id || `freelancer-${index}`}
                                className={index === 0 ? "text-[#FFFFFF] focus:text-[#FFFFFF]" : ""}
                              >
                                {freelancer.fullName} - ₹{freelancer.hourlyRate}/hr
                                {(freelancer.serviceArea || freelancer.city) && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({freelancer.serviceArea || freelancer.city})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">No freelancers available in your area</span>
                          </div>
                          <p className="text-sm text-yellow-700 mb-3">
                            {formData.serviceState || formData.serviceCity 
                              ? `No freelancers found for "${selectedService.serviceName}" in ${formData.serviceCity ? `${formData.serviceCity}, ` : ''}${formData.serviceState}. Try selecting a different location or browse all available freelancers.`
                              : 'Please select your location to find nearby freelancers.'
                            }
                          </p>

                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Freelancer Display */}
                  {selectedFreelancer && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <Image
                          src={selectedFreelancer.profilePicture || 'https://static.wixstatic.com/media/d6d795_a523e5f96c4b4c22a09bd966b6926006~mv2.png?originWidth=128&originHeight=128'}
                          alt={selectedFreelancer.fullName || 'Freelancer'}
                          width={60}
                          className="w-12 h-12 rounded-full object-cover mx-auto sm:mx-0"
                        />
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="font-semibold text-gray-800">{selectedFreelancer.fullName}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {selectedFreelancer.skills}
                          </p>
                          {/* Show service area if available */}
                          {(selectedFreelancer.serviceArea || selectedFreelancer.city) && (
                            <p className="text-sm text-gray-600 mb-2">
                              Service Area: {selectedFreelancer.serviceArea && selectedFreelancer.city 
                                ? `${selectedFreelancer.serviceArea}, ${selectedFreelancer.city}`
                                : selectedFreelancer.serviceArea || selectedFreelancer.city}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 text-sm">
                            <span className="text-brightpink font-semibold">
                              ₹{selectedFreelancer.hourlyRate}/hr
                            </span>
                            <span className="text-neonyellow">★ 4.8</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Date, Time & Location */}
            {currentStep === 2 && (
              <Card className="bg-secondary text-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Date, Time & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.bookingDate ? format(formData.bookingDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.bookingDate}
                          onSelect={(date) => setFormData(prev => ({ ...prev, bookingDate: date }))}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Selection */}
                  <div>
                    <Label>Select Time</Label>
                    <Select value={formData.bookingTime} onValueChange={(time) => setFormData(prev => ({ ...prev, bookingTime: time }))}>
                      <SelectTrigger className="text-secondary-foreground">
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.length > 0 ? (
                          availableTimeSlots.map((time, index) => (
                            <SelectItem 
                              key={time} 
                              value={time}
                              className={index === 0 ? "text-[#FFFFFF] focus:text-[#FFFFFF]" : ""}
                            >
                              {time}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="all" disabled>
                            {selectedFreelancer && formData.bookingDate 
                              ? "No available time slots" 
                              : "Select freelancer and date first"
                            }
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Type */}
                  <div>
                    <Label>Service Location</Label>
                    <RadioGroup 
                      value={formData.serviceLocationType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, serviceLocationType: value }))}
                      className="mt-2"
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="client" id="client" className="mt-1" />
                        <Label htmlFor="client" className="text-sm leading-relaxed">
                          At my location (transport cost will be sent via email)
                        </Label>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="freelancer" id="freelancer" className="mt-1" />
                        <Label htmlFor="freelancer" className="text-sm leading-relaxed">
                          At freelancer's location
                          {selectedFreelancer && (selectedFreelancer.serviceArea || selectedFreelancer.city) && (
                            <span className="block text-xs text-gray-500 mt-1">
                              Area: {selectedFreelancer.serviceArea && selectedFreelancer.city 
                                ? `${selectedFreelancer.serviceArea}, ${selectedFreelancer.city}`
                                : selectedFreelancer.serviceArea || selectedFreelancer.city}
                              <br />
                              <span className="text-orange-600">Exact address will be shared after booking confirmation</span>
                            </span>
                          )}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Address Fields - Only show for client location */}
                  {formData.serviceLocationType === 'client' && (
                    <div>
                      <Label className="text-gray-800 mb-3 block">
                        Your Address
                      </Label>
                      <div className="space-y-4">
                      {/* House/Floor No and Street */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="houseFloorNo" className="text-sm text-gray-700">
                            House/Floor No. *
                          </Label>
                          <Input
                            id="houseFloorNo"
                            placeholder="e.g., 123, 2nd Floor"
                            value={formData.houseFloorNo}
                            onChange={(e) => setFormData(prev => ({ ...prev, houseFloorNo: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="street" className="text-sm text-gray-700">
                            Street *
                          </Label>
                          <Input
                            id="street"
                            placeholder="e.g., Main Street"
                            value={formData.street}
                            onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Area */}
                      <div>
                        <Label htmlFor="area" className="text-sm text-gray-700">
                          Area/Neighborhood *
                        </Label>
                        <Input
                          id="area"
                          placeholder="e.g., Downtown, Business District"
                          value={formData.area}
                          onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      {/* Postal Code and City */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="postalCode" className="text-sm text-gray-700">
                            Postal Code *
                          </Label>
                          <Input
                            id="postalCode"
                            placeholder="e.g., 12345"
                            value={formData.postalCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city" className="text-sm text-gray-700">
                            City *
                          </Label>
                          <Input
                            id="city"
                            placeholder="e.g., New York"
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      </div>
                    </div>
                  )}

                  {/* Freelancer Location Info - Only show when freelancer location is selected */}
                  {formData.serviceLocationType === 'freelancer' && selectedFreelancer && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">Service at Freelancer's Location</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Service will be provided at the freelancer's location
                      </p>
                      {(selectedFreelancer.serviceArea || selectedFreelancer.city) && (
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Area:</strong> {selectedFreelancer.serviceArea && selectedFreelancer.city 
                            ? `${selectedFreelancer.serviceArea}, ${selectedFreelancer.city}`
                            : selectedFreelancer.serviceArea || selectedFreelancer.city}
                        </p>
                      )}
                      <p className="text-sm text-orange-600 font-medium">
                        📍 Exact address will be shared after booking confirmation
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Contact & Payment */}
            {currentStep === 3 && (
              <Card className="bg-secondary text-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Contact & Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contact Information */}
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

                  {/* Booking Summary */}
                  <div className="bg-white/5 rounded-lg p-4 sm:p-6">
                    <h3 className="font-semibold mb-4">Booking Summary</h3>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span>Service Location:</span>
                        <span className="font-medium">
                          {formData.serviceCity && formData.serviceState 
                            ? `${formData.serviceCity}, ${formData.serviceState}`
                            : 'Location not specified'
                          }
                        </span>
                      </div>
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
                        <span className="font-medium">₹{formData.paymentAmount}</span>
                      </div>
                      {formData.serviceLocationType === 'client' && (
                        <div className="text-sm text-gray-600 italic">
                          * Transportation cost will be sent via email on booking date
                        </div>
                      )}
                      <div className="border-t pt-3 flex flex-col sm:flex-row sm:justify-between gap-1 font-semibold text-lg">
                        <span>Total:</span>
                        <span className="text-brightpink">
                          ₹{formData.paymentAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label>Payment Method</Label>
                    <div className="bg-white/5 rounded-lg p-4 mt-2">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-electricblue" />
                        <span>Credit/Debit Card (Secure Payment)</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Your payment will be processed securely. You'll be charged after the service is completed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
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
                {isSubmitting ? 'Processing...' : currentStep === 3 ? 'Confirm Booking' : 'Next'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}