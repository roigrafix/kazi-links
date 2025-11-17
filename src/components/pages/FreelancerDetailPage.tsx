import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Freelancers, Services } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Mail, DollarSign, Star, Clock, MapPin, Calendar, User } from 'lucide-react';

export default function FreelancerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [freelancer, setFreelancer] = useState<Freelancers | null>(null);
  const [relatedServices, setRelatedServices] = useState<Services[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFreelancerDetails = async () => {
      if (!id) return;

      try {
        const freelancerData = await BaseCrudService.getById<Freelancers>('freelancers', id);
        setFreelancer(freelancerData);

        // Fetch related services based on freelancer's skills
        const servicesData = await BaseCrudService.getAll<Services>('services');
        const related = servicesData.items.filter(service => {
          if (!freelancerData.skills) return false;
          const skills = freelancerData.skills.toLowerCase();
          return service.categoryName?.toLowerCase().split(' ').some(word => 
            skills.includes(word)
          ) || service.serviceName?.toLowerCase().split(' ').some(word => 
            skills.includes(word)
          );
        }).slice(0, 4);
        
        setRelatedServices(related);
      } catch (error) {
        console.error('Error fetching freelancer details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFreelancerDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-logoGold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-paragraph text-lg">Loading freelancer profile...</p>
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">Freelancer Not Found</h1>
          <p className="font-paragraph text-primary-foreground/70 mb-6">
            The freelancer you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="bg-logoGold text-logoBlack hover:bg-logoGold/90">
            <Link to="/freelancers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Freelancers
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const skillsList = freelancer.skills ? freelancer.skills.split(',').map(skill => skill.trim()) : [];

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* Navigation */}
      <div className="bg-secondary text-secondary-foreground py-4">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/freelancers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Freelancers
            </Link>
          </Button>
        </div>
      </div>

      {/* Freelancer Profile */}
      <section className="py-12 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1"
            >
              <Card className="sticky top-6">
                <CardContent className="p-8 text-center">
                  {/* Profile Picture */}
                  <div className="relative inline-block mb-6">
                    <Image
                      src={freelancer.profilePicture || 'https://static.wixstatic.com/media/d6d795_f4a9becfe769480b8b24561692a3f637~mv2.png?originWidth=128&originHeight=128'}
                      alt={freelancer.fullName || 'Freelancer'}
                      width={150}
                      className="w-32 h-32 rounded-full object-cover mx-auto"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white"></div>
                  </div>

                  {/* Name and Contact */}
                  <h1 className="font-heading text-2xl font-bold mb-2">
                    {freelancer.fullName}
                  </h1>
                  
                  {freelancer.contactEmail && (
                    <div className="flex items-center justify-center gap-2 mb-4 text-secondary-foreground/70">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{freelancer.contactEmail}</span>
                    </div>
                  )}

                  {/* Rating and Rate */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-logoGold fill-current" />
                      <span className="font-semibold">4.8</span>
                      <span className="text-sm text-secondary-foreground/70">(24 reviews)</span>
                    </div>
                  </div>

                  <div className="bg-brightpink/10 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="h-5 w-5 text-logoGold" />
                      <span className="font-heading text-2xl font-bold text-logoGold">
                        ${freelancer.hourlyRate || 'Rate varies'}/hr
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full bg-logoGold text-logoBlack hover:bg-logoGold/90"
                    >
                      <Link to={`/booking?freelancer=${freelancer._id}`}>
                        Book Now
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="w-full"
                    >
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* About */}
              <div>
                <h2 className="font-heading text-2xl font-bold mb-4">About</h2>
                <p className="font-paragraph text-lg text-secondary-foreground/80 leading-relaxed">
                  {freelancer.bio || 'This freelancer has not provided a bio yet.'}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h2 className="font-heading text-2xl font-bold mb-4">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {skillsList.length > 0 ? skillsList.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-electricblue text-[#3B3B3B]">
                      {skill}
                    </Badge>
                  )) : (
                    <p className="text-secondary-foreground/70">No skills listed</p>
                  )}
                </div>
              </div>

              {/* Services Offered */}
              {freelancer.servicesOffered && (
                <div>
                  <h2 className="font-heading text-2xl font-bold mb-4">Services Offered</h2>
                  <p className="font-paragraph text-lg text-secondary-foreground/80 leading-relaxed">
                    {freelancer.servicesOffered}
                  </p>
                </div>
              )}

              {/* Availability */}
              {freelancer.availabilityDescription && (
                <div>
                  <h2 className="font-heading text-2xl font-bold mb-4">Availability</h2>
                  <div className="bg-palemint/10 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-palemint mt-1" />
                      <p className="font-paragraph text-secondary-foreground/80">
                        {freelancer.availabilityDescription}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div>
                <h2 className="font-heading text-2xl font-bold mb-4">Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-brightpink mb-1">24</div>
                    <div className="text-sm text-secondary-foreground/70">Projects Completed</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-electricblue mb-1">98%</div>
                    <div className="text-sm text-secondary-foreground/70">Success Rate</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-palemint mb-1">2h</div>
                    <div className="text-sm text-secondary-foreground/70">Avg Response</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-logoGold mb-1">4.8</div>
                    <div className="text-sm text-secondary-foreground/70">Rating</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Services */}
      {relatedServices.length > 0 && (
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
                Related Services
              </h2>
              <p className="font-paragraph text-lg text-primary-foreground/70">
                Services that match {freelancer.fullName}'s expertise
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedServices.map((service, index) => (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-secondary text-secondary-foreground hover:shadow-xl transition-all duration-300 h-full">
                    <CardContent className="p-4">
                      <div className="relative overflow-hidden rounded-lg mb-4">
                        <Image
                          src={service.serviceImage || 'https://static.wixstatic.com/media/d6d795_c5765f36dcf541c4908648ca7ed4004f~mv2.png?originWidth=192&originHeight=128'}
                          alt={service.serviceName || 'Service'}
                          width={250}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-brightpink text-[#3B3B3B] text-xs">
                            {service.categoryName}
                          </Badge>
                        </div>
                      </div>
                      
                      <h3 className="font-heading text-lg font-semibold mb-2 line-clamp-2">
                        {service.serviceName}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center gap-1 text-secondary-foreground/70">
                          <Clock className="h-3 w-3" />
                          {service.durationMinutes ? `${service.durationMinutes}min` : 'Flexible'}
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-electricblue">
                          <DollarSign className="h-3 w-3" />
                          {service.price ? `$${service.price}` : 'Varies'}
                        </div>
                      </div>
                      
                      <Button 
                        asChild 
                        size="sm" 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Link to={`/services/${service._id}`}>
                          View Service
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
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
              Client Reviews
            </h2>
            <p className="font-paragraph text-lg text-secondary-foreground/70">
              What clients say about working with {freelancer.fullName}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Johnson",
                rating: 5,
                comment: "Exceptional work quality and great communication throughout the project. Highly recommended!",
                project: "Website Design"
              },
              {
                name: "Mike Chen",
                rating: 5,
                comment: "Delivered exactly what we needed on time and within budget. Will definitely work together again.",
                project: "Mobile App Development"
              },
              {
                name: "Emily Davis",
                rating: 4,
                comment: "Professional service with attention to detail. Very satisfied with the final result.",
                project: "Logo Design"
              }
            ].map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-logoGold fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <p className="font-paragraph text-secondary-foreground/80 mb-4">
                      "{review.comment}"
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{review.name}</div>
                        <div className="text-sm text-secondary-foreground/70">{review.project}</div>
                      </div>
                      <User className="h-8 w-8 text-secondary-foreground/30" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}