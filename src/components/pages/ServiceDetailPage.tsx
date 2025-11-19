import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Services, Freelancers } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Clock, DollarSign, MapPin, Star, User } from 'lucide-react';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Services | null>(null);
  const [relatedFreelancers, setRelatedFreelancers] = useState<Freelancers[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!id) return;

      try {
        const serviceData = await BaseCrudService.getById<Services>('services', id);
        setService(serviceData);

        // Fetch freelancers who offer similar services
        const freelancersData = await BaseCrudService.getAll<Freelancers>('freelancers');
        const related = freelancersData.items.filter(freelancer => 
          freelancer.servicesOffered?.toLowerCase().includes(serviceData.categoryName?.toLowerCase() || '') ||
          freelancer.skills?.toLowerCase().includes(serviceData.categoryName?.toLowerCase() || '')
        ).slice(0, 4);
        
        setRelatedFreelancers(related);
      } catch (error) {
        console.error('Error fetching service details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-logoGold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-paragraph text-lg">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">Service Not Found</h1>
          <p className="font-paragraph text-primary-foreground/70 mb-6">
            The service you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="bg-logoGold text-logoBlack hover:bg-logoGold/90">
            <Link to="/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* Navigation */}
      <div className="bg-secondary text-secondary-foreground py-4">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Link>
          </Button>
        </div>
      </div>

      {/* Service Details */}
      <section className="py-12 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Service Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative rounded-lg overflow-hidden">
                <Image
                  src={service.serviceImage || 'https://static.wixstatic.com/media/d6d795_74a8b8756b814a7eaf8f1506d7821331~mv2.png?originWidth=576&originHeight=384'}
                  alt={service.serviceName || 'Service'}
                  width={600}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-brightpink text-[#3B3B3B]">
                    {service.categoryName}
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* Service Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-4">
                  {service.serviceName}
                </h1>
                <p className="font-paragraph text-lg text-secondary-foreground/70">
                  {service.description}
                </p>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-electricblue" />
                    <span className="font-paragraph text-sm text-secondary-foreground/70">Price</span>
                  </div>
                  <span className="font-heading text-2xl font-bold text-electricblue">
                    ₹{service.price || 'Varies'}
                  </span>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-palemint" />
                    <span className="font-paragraph text-sm text-secondary-foreground/70">Duration</span>
                  </div>
                  <span className="font-heading text-2xl font-bold">
                    {service.durationMinutes ? formatDuration(service.durationMinutes) : 'Flexible'}
                  </span>
                </div>
              </div>

              {/* Booking Status */}
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-logoGold" />
                  <span className="font-paragraph text-sm text-secondary-foreground/70">Availability</span>
                </div>
                <span className="font-paragraph text-lg">
                  {service.isBookable ? (
                    <span className="text-green-400">Available for booking</span>
                  ) : (
                    <span className="text-red-400">Currently unavailable</span>
                  )}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90 text-lg py-6"
                  disabled={!service.isBookable}
                >
                  <Link to={`/booking?service=${service._id}`}>
                    Book This Service
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg"
                  className="w-full border-secondary-foreground text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary"
                >
                  <Link to="/freelancers">
                    Browse Freelancers
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Freelancers */}
      {relatedFreelancers.length > 0 && (
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-4">
                Freelancers for This Service
              </h2>
              <p className="font-paragraph text-lg text-primary-foreground/70">
                Connect with skilled professionals who specialize in {service.categoryName?.toLowerCase()}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedFreelancers.map((freelancer, index) => (
                <motion.div
                  key={freelancer._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-secondary text-secondary-foreground hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="relative mb-4">
                        <Image
                          src={freelancer.profilePicture || 'https://static.wixstatic.com/media/d6d795_3f16dd2d2545485cae356a205e8cbe3a~mv2.png?originWidth=128&originHeight=128'}
                          alt={freelancer.fullName || 'Freelancer'}
                          width={80}
                          className="w-16 h-16 rounded-full mx-auto object-cover"
                        />
                      </div>
                      
                      <h3 className="font-heading text-lg font-semibold mb-2">
                        {freelancer.fullName}
                      </h3>
                      
                      <p className="font-paragraph text-sm text-secondary-foreground/70 mb-3 line-clamp-2">
                        {freelancer.skills}
                      </p>
                      
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="font-paragraph text-lg font-semibold text-brightpink">
                          ₹{freelancer.hourlyRate}/hr
                        </span>
                      </div>
                      
                      <Button 
                        asChild 
                        size="sm" 
                        className="w-full bg-electricblue hover:bg-electricblue/90"
                      >
                        <Link to={`/freelancers/${freelancer._id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button asChild variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link to="/freelancers">
                  View All Freelancers
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Service Features */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-4">
              What's Included
            </h2>
            <p className="font-paragraph text-lg text-secondary-foreground/70">
              Everything you need for a seamless service experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: User,
                title: "Professional Service",
                description: "Skilled freelancers vetted for quality and reliability"
              },
              {
                icon: MapPin,
                title: "Flexible Location",
                description: "Choose your location or visit the freelancer's workspace"
              },
              {
                icon: Star,
                title: "Quality Guarantee",
                description: "Satisfaction guaranteed with our quality assurance program"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-brightpink rounded-full flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-[#3B3B3B]" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="font-paragraph text-secondary-foreground/70">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}