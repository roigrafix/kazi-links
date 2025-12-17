import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService, useMember } from '@/integrations';
import { ServiceCategories, Freelancers } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
import { ArrowRight, Star, Users, Calendar, MapPin, LogIn } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, actions } = useMember();
  const [categories, setCategories] = useState<ServiceCategories[]>([]);
  const [featuredFreelancers, setFeaturedFreelancers] = useState<Freelancers[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, freelancersData] = await Promise.all([
          BaseCrudService.getAll<ServiceCategories>('servicecategories'),
          BaseCrudService.getAll<Freelancers>('freelancers')
        ]);
        
        setCategories(categoriesData.items.filter(cat => cat.isActive).slice(0, 6));
        setFeaturedFreelancers(freelancersData.items.slice(0, 4));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* Hero Section - Inspired by the image layout */}
      <section className="relative w-full max-w-[120rem] mx-auto min-h-screen flex items-center overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-6">
                <h1 className="font-heading text-6xl lg:text-8xl font-bold leading-tight">
                  KaziLinks
                  <span className="block text-4xl lg:text-5xl font-medium mt-2">
                    Connect. Create. Collaborate.
                  </span>
                </h1>
                
                <p className="font-paragraph text-xl lg:text-2xl text-primary-foreground/80 max-w-lg">
                  Where talented freelancers meet clients who need exceptional services. 
                  From programming to photography, find your perfect match.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-logoGold text-logoBlack hover:bg-logoGold/90 text-lg px-8 py-6"
                >
                  <Link to="/services">
                    Browse Services <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                
                {isAuthenticated ? (
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg"
                    className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-6"
                  >
                    <Link to="/freelancers">
                      Find Freelancers
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    onClick={() => actions.login()}
                    variant="outline" 
                    size="lg"
                    className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-6"
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign Up
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Right Content - Circular Elements inspired by the image */}
            <div className="relative h-[600px] hidden lg:block">
              <motion.div 
                className="absolute top-16 right-12 w-32 h-32 bg-logoGold rounded-full flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <div className="text-center text-logoBlack font-heading font-bold">
                  <div className="text-2xl">500+</div>
                  <div className="text-sm">Freelancers</div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute top-48 left-8 w-24 h-24 bg-electricblue rounded-full flex items-center justify-center"
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                <div className="text-center text-[#3B3B3B] font-heading font-bold">
                  <div className="text-lg">24/7</div>
                  <div className="text-xs">Support</div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute bottom-32 right-4 w-28 h-28 bg-logoCream rounded-full flex items-center justify-center"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                <div className="text-center text-logoBlack font-heading font-bold">
                  <div className="text-xl">100+</div>
                  <div className="text-sm">Services</div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute bottom-8 left-16 w-20 h-20 bg-logoGold rounded-full flex items-center justify-center"
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                <Star className="h-8 w-8 text-logoBlack" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories Section */}
      <section className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-4xl lg:text-6xl font-bold mb-6">
              Popular Service Categories
            </h2>
            <p className="font-paragraph text-xl text-secondary-foreground/70 max-w-2xl mx-auto">
              Discover a wide range of professional services from skilled freelancers
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <Image
                          src={category.categoryImage || 'https://static.wixstatic.com/media/d6d795_94b37e5959234373a8d283760576486b~mv2.png?originWidth=384&originHeight=192'}
                          alt={category.categoryName || 'Service category'}
                          width={400}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                      </div>
                      <div className="p-6">
                        <h3 className="font-heading text-xl font-semibold mb-2">
                          {category.categoryName}
                        </h3>
                        <p className="font-paragraph text-secondary-foreground/70 mb-4 line-clamp-2">
                          {category.categoryDescription}
                        </p>
                        <Button 
                          asChild 
                          variant="outline" 
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                        >
                          <Link to={`/services?category=${encodeURIComponent(category.categoryName || '')}`}>
                            Explore Services
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/services">
                View All Categories <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Freelancers Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-4xl lg:text-6xl font-bold mb-6">
              Featured Freelancers
            </h2>
            <p className="font-paragraph text-xl text-primary-foreground/70 max-w-2xl mx-auto">
              Meet our top-rated professionals ready to bring your projects to life
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredFreelancers.map((freelancer, index) => (
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
                          src={freelancer.profilePicture || 'https://static.wixstatic.com/media/d6d795_e2107d0e136346f8afd1fdc1ba06d7d0~mv2.png?originWidth=128&originHeight=128'}
                          alt={freelancer.fullName || 'Freelancer'}
                          width={120}
                          className="w-20 h-20 rounded-full mx-auto object-cover"
                        />
                      </div>
                      <h3 className="font-heading text-lg font-semibold mb-2">
                        {freelancer.fullName}
                      </h3>
                      <p className="font-paragraph text-sm text-secondary-foreground/70 mb-3 line-clamp-2">
                        {freelancer.skills}
                      </p>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="font-paragraph text-lg font-semibold text-logoGold">
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
          )}

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/freelancers">
                View All Freelancers <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-4xl lg:text-6xl font-bold mb-6">
              How It Works
            </h2>
            <p className="font-paragraph text-xl text-secondary-foreground/70 max-w-2xl mx-auto">
              Getting started is simple. Follow these easy steps to connect with the perfect freelancer.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Users,
                title: "Browse & Select",
                description: "Explore our categories and find the perfect freelancer for your project needs.",
                color: "logoGold"
              },
              {
                icon: Calendar,
                title: "Book & Schedule",
                description: "Choose your preferred date, time, and location. Our system handles availability automatically.",
                color: "electricblue"
              },
              {
                icon: MapPin,
                title: "Track & Connect",
                description: "Get real-time ETA updates and connect directly with your chosen freelancer.",
                color: "logoCream"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  step.color === 'logoGold' ? 'bg-logoGold' :
                  step.color === 'electricblue' ? 'bg-electricblue' : 'bg-logoCream'
                }`}>
                  <step.icon className={`h-8 w-8 ${
                    step.color === 'logoCream' || step.color === 'logoGold' ? 'text-logoBlack' : 'text-[#3B3B3B]'
                  }`} />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-4">
                  {step.title}
                </h3>
                <p className="font-paragraph text-secondary-foreground/70">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem] text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-4xl lg:text-6xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="font-paragraph text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied clients who have found their perfect freelancer match through KaziLinks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-logoGold text-logoBlack hover:bg-logoGold/90 text-lg px-8 py-6"
              >
                <Link to="/services">
                  Start Browsing Services
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-6"
              >
                <Link to="/booking">
                  Book Now
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>


    </div>
  );
}