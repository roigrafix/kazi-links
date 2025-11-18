import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Services, ServiceCategories } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image } from '@/components/ui/image';
import { Search, Clock, DollarSign, Filter } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<Services[]>([]);
  const [categories, setCategories] = useState<ServiceCategories[]>([]);
  const [filteredServices, setFilteredServices] = useState<Services[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, categoriesData] = await Promise.all([
          BaseCrudService.getAll<Services>('services'),
          BaseCrudService.getAll<ServiceCategories>('servicecategories')
        ]);
        
        setServices(servicesData.items.filter(service => service.isBookable));
        setCategories(categoriesData.items.filter(cat => cat.isActive));
        
        // Check for category filter from URL
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
          setSelectedCategory(categoryParam);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

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
              Professional Services
            </h1>
            <p className="font-paragraph text-xl text-secondary-foreground/70 max-w-2xl mx-auto">
              Discover a wide range of professional services from skilled freelancers
            </p>
          </motion.div>
        </div>
      </section>
      {/* Filters */}
      <section className="py-8 bg-secondary text-secondary-foreground border-b">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Filters:
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-foreground/50" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 text-primary">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[#3B3B3B] focus:text-[#3B3B3B]">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category._id} value={category.categoryName || ''}>
                      {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range Filter */}
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-full sm:w-48 text-primary">
                  <SelectValue placeholder="Price Range" className="text-[#3b3b3b]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[#3B3B3B] focus:text-[#3B3B3B]">All Prices</SelectItem>
                  <SelectItem value="0-50">$0 - $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100-200">$100 - $200</SelectItem>
                  <SelectItem value="200-500">$200 - $500</SelectItem>
                  <SelectItem value="500">$500+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-secondary-foreground/70">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </section>
      {/* Services Grid */}
      <section className="py-12 bg-primary">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-secondary/10 rounded-full flex items-center justify-center">
                <Search className="h-12 w-12 text-primary-foreground/50" />
              </div>
              <h3 className="font-heading text-2xl font-semibold mb-4">
                No services found
              </h3>
              <p className="font-paragraph text-primary-foreground/70 mb-6">
                Try adjusting your search criteria or browse all categories
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setPriceRange('all');
                }}
                className="bg-logoGold text-logoBlack hover:bg-logoGold/90"
              >
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 bg-secondary text-secondary-foreground h-full">
                    <CardContent className="p-0 h-full flex flex-col">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <Image
                          src={service.serviceImage || 'https://static.wixstatic.com/media/d6d795_0a81e526af374d3f992384f3f0b88147~mv2.png?originWidth=256&originHeight=192'}
                          alt={service.serviceName || 'Service'}
                          width={300}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-brightpink text-[#3B3B3B] px-2 py-1 rounded-full text-xs font-medium">
                            {service.categoryName}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-heading text-lg font-semibold mb-2 line-clamp-2">
                          {service.serviceName}
                        </h3>
                        
                        <p className="font-paragraph text-sm text-secondary-foreground/70 mb-4 line-clamp-3 flex-1">
                          {service.description}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-secondary-foreground/70">
                              <Clock className="h-4 w-4" />
                              {service.durationMinutes ? formatDuration(service.durationMinutes) : 'Duration varies'}
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-electricblue">
                              <DollarSign className="h-4 w-4" />
                              {service.price ? `$${service.price}` : 'Price varies'}
                            </div>
                          </div>
                          
                          <Button 
                            asChild 
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Link to={`/services/${service._id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem] text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="font-paragraph text-lg text-secondary-foreground/70 mb-6">
              Browse our freelancers directly or contact us for custom service requests
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/freelancers">
                  Browse Freelancers
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/booking">
                  Request Custom Service
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}