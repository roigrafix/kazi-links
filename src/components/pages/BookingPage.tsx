import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Services, Freelancers, Bookings } from '@/entities';
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
import { CalendarIcon, Clock, DollarSign, MapPin, User, CreditCard, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface BookingFormData {
  serviceName: string;
  freelancerName: string;
  bookingDate: Date | undefined;
  bookingTime: string;
  serviceLocationType: string;
  serviceAddress: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  paymentAmount: number;
  transportationCost: number;
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [services, setServices] = useState<Services[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancers[]>([]);
  const [availableFreelancers, setAvailableFreelancers] = useState<Freelancers[]>([]);
  const [selectedService, setSelectedService] = useState<Services | null>(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancers | null>(null);
  
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
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    paymentAmount: 0,
    transportationCost: 0
  });

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, freelancersData] = await Promise.all([
          BaseCrudService.getAll<Services>('services'),
          BaseCrudService.getAll<Freelancers>('freelancers')
        ]);
        
        setServices(servicesData.items.filter(service => service.isBookable));
        setFreelancers(freelancersData.items);

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
            // Filter freelancers based on service category
            const related = freelancersData.items.filter(f => 
              f.skills?.toLowerCase().includes(service.categoryName?.toLowerCase() || '') ||
              f.servicesOffered?.toLowerCase().includes(service.categoryName?.toLowerCase() || '')
            );
            setAvailableFreelancers(related);
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

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s._id === serviceId);
    if (service) {
      setSelectedService(service);
      setFormData(prev => ({ 
        ...prev, 
        serviceName: service.serviceName || '',
        paymentAmount: service.price || 0
      }));
      
      // Filter freelancers based on service
      const related = freelancers.filter(f => 
        f.skills?.toLowerCase().includes(service.categoryName?.toLowerCase() || '') ||
        f.servicesOffered?.toLowerCase().includes(service.categoryName?.toLowerCase() || '')
      );
      setAvailableFreelancers(related);
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

  const calculateTransportationCost = () => {
    if (formData.serviceLocationType === 'freelancer') {
      return 0;
    }
    // Simple calculation based on service type and location
    const baseCost = selectedService?.price ? selectedService.price * 0.1 : 10;
    return Math.round(baseCost);
  };

  useEffect(() => {
    const transportCost = calculateTransportationCost();
    setFormData(prev => ({ ...prev, transportationCost: transportCost }));
  }, [formData.serviceLocationType, selectedService]);

  const handleSubmit = async () => {
    if (!selectedService || !selectedFreelancer || !formData.bookingDate) {
      return;
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
        serviceAddress: formData.serviceAddress,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        paymentAmount: formData.paymentAmount + formData.transportationCost,
        transportationCost: formData.transportationCost,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        etaStatus: 'scheduled'
      };

      await BaseCrudService.create('bookings', bookingData as any);
      setCurrentStep(4); // Success step
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setIsSubmitting(false);
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
        return selectedService && selectedFreelancer;
      case 2:
        return formData.bookingDate && formData.bookingTime && formData.serviceAddress;
      case 3:
        return formData.clientName && formData.clientEmail && formData.clientPhone;
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neonyellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-paragraph text-lg">Loading booking form...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-4">Booking Confirmed!</h1>
          <p className="font-paragraph text-lg text-primary-foreground/80 mb-6">
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
      <section className="py-12 bg-secondary">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-heading text-4xl lg:text-5xl font-bold mb-4 text-logoBlack">
              Book Your Service
            </h1>
            <p className="font-paragraph text-xl text-logoBlack/70">
              Complete your booking in just a few simple steps
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step 
                      ? 'bg-logoGold text-logoBlack' 
                      : 'bg-logoBlack/20 text-logoBlack/60'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
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
      <section className="py-12">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
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
                  {/* Service Selection */}
                  <div>
                    <Label htmlFor="service" className="text-gray-800">Choose a Service</Label>
                    <Select value={selectedService?._id || ''} onValueChange={handleServiceChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service._id} value={service._id}>
                            {service.serviceName} - ${service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Service Display */}
                  {selectedService && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <Image
                          src={selectedService.serviceImage || 'https://static.wixstatic.com/media/d6d795_ffa1fed9e894425c8bcef95e4d1a2af6~mv2.png?originWidth=128&originHeight=128'}
                          alt={selectedService.serviceName || 'Service'}
                          width={80}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{selectedService.serviceName}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {selectedService.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${selectedService.price}
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
                  {availableFreelancers.length > 0 && (
                    <div>
                      <Label htmlFor="freelancer" className="text-gray-800">Choose a Freelancer</Label>
                      <Select value={selectedFreelancer?._id || ''} onValueChange={handleFreelancerChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a freelancer" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFreelancers.map(freelancer => (
                            <SelectItem key={freelancer._id} value={freelancer._id}>
                              {freelancer.fullName} - ${freelancer.hourlyRate}/hr
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Selected Freelancer Display */}
                  {selectedFreelancer && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <Image
                          src={selectedFreelancer.profilePicture || 'https://static.wixstatic.com/media/d6d795_a523e5f96c4b4c22a09bd966b6926006~mv2.png?originWidth=128&originHeight=128'}
                          alt={selectedFreelancer.fullName || 'Freelancer'}
                          width={60}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{selectedFreelancer.fullName}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {selectedFreelancer.skills}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-brightpink font-semibold">
                              ${selectedFreelancer.hourlyRate}/hr
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
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
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="client" id="client" />
                        <Label htmlFor="client">At my location (additional transport cost applies)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="freelancer" id="freelancer" />
                        <Label htmlFor="freelancer">At freelancer's location</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address">
                      {formData.serviceLocationType === 'client' ? 'Your Address' : 'Meeting Address'}
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Enter the full address..."
                      value={formData.serviceAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceAddress: e.target.value }))}
                    />
                  </div>

                  {/* Transportation Cost */}
                  {formData.serviceLocationType === 'client' && (
                    <div className="bg-neonyellow/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-neonyellow" />
                        <span className="font-semibold">Transportation Cost</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Additional cost for freelancer travel to your location
                      </p>
                      <span className="text-lg font-bold text-neonyellow">
                        +${formData.transportationCost}
                      </span>
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
                  <div className="grid md:grid-cols-2 gap-4">
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
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Booking Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span>{formData.serviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Freelancer:</span>
                        <span>{formData.freelancerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date & Time:</span>
                        <span>
                          {formData.bookingDate ? format(formData.bookingDate, "PPP") : ''} at {formData.bookingTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Cost:</span>
                        <span>${formData.paymentAmount}</span>
                      </div>
                      {formData.transportationCost > 0 && (
                        <div className="flex justify-between">
                          <span>Transportation:</span>
                          <span>+${formData.transportationCost}</span>
                        </div>
                      )}
                      <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span className="text-brightpink">
                          ${formData.paymentAmount + formData.transportationCost}
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
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Previous
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={!isStepValid() || isSubmitting}
                className="bg-neonyellow hover:bg-neonyellow/90 text-[#6b6969]"
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