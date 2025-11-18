import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Freelancers } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image } from '@/components/ui/image';
import { Search, DollarSign, Filter, Mail, Star } from 'lucide-react';

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<Freelancers[]>([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState<Freelancers[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [rateRange, setRateRange] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Extract unique skills for filter
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const { items } = await BaseCrudService.getAll<Freelancers>('freelancers');
        setFreelancers(items);
        
        // Extract unique skills
        const skills = new Set<string>();
        items.forEach(freelancer => {
          if (freelancer.skills) {
            freelancer.skills.split(',').forEach(skill => {
              skills.add(skill.trim());
            });
          }
        });
        setAvailableSkills(Array.from(skills).slice(0, 10)); // Limit to 10 skills
      } catch (error) {
        console.error('Error fetching freelancers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFreelancers();
  }, []);

  useEffect(() => {
    let filtered = freelancers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(freelancer =>
        freelancer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.skills?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.servicesOffered?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by skill
    if (skillFilter !== 'all') {
      filtered = filtered.filter(freelancer =>
        freelancer.skills?.toLowerCase().includes(skillFilter.toLowerCase())
      );
    }

    // Filter by rate range
    if (rateRange !== 'all') {
      const [min, max] = rateRange.split('-').map(Number);
      filtered = filtered.filter(freelancer => {
        const rate = freelancer.hourlyRate || 0;
        if (max) {
          return rate >= min && rate <= max;
        } else {
          return rate >= min;
        }
      });
    }

    setFilteredFreelancers(filtered);
  }, [freelancers, searchTerm, skillFilter, rateRange]);

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
              Talented Freelancers
            </h1>
            <p className="font-paragraph text-xl text-secondary-foreground/70 max-w-2xl mx-auto">
              Connect with skilled professionals ready to bring your projects to life
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
                  placeholder="Search freelancers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Skill Filter */}
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="w-full sm:w-48 text-secondary-foreground">
                  <SelectValue placeholder="All Skills" className="text-[#3b3b3b]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[#FFFFFF] focus:text-[#FFFFFF]">All Skills</SelectItem>
                  {availableSkills.map((skill, index) => (
                    <SelectItem key={skill || `skill-${index}`} value={skill || `skill-${index}`}>
                      {skill || 'Unknown Skill'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Rate Range Filter */}
              <Select value={rateRange} onValueChange={setRateRange}>
                <SelectTrigger className="w-full sm:w-48 text-secondary-foreground">
                  <SelectValue placeholder="Hourly Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[#FFFFFF] focus:text-[#FFFFFF]">All Rates</SelectItem>
                  <SelectItem value="0-25">$0 - $25/hr</SelectItem>
                  <SelectItem value="25-50">$25 - $50/hr</SelectItem>
                  <SelectItem value="50-100">$50 - $100/hr</SelectItem>
                  <SelectItem value="100-200">$100 - $200/hr</SelectItem>
                  <SelectItem value="200">$200+/hr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-secondary-foreground/70">
              {filteredFreelancers.length} freelancer{filteredFreelancers.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </section>
      {/* Freelancers Grid */}
      <section className="py-12 bg-primary">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredFreelancers.length === 0 ? (
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
                No freelancers found
              </h3>
              <p className="font-paragraph text-primary-foreground/70 mb-6">
                Try adjusting your search criteria or browse all freelancers
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSkillFilter('all');
                  setRateRange('all');
                }}
                className="bg-logoGold text-logoBlack hover:bg-logoGold/90"
              >
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFreelancers.map((freelancer, index) => (
                <motion.div
                  key={freelancer._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 bg-secondary text-secondary-foreground h-full">
                    <CardContent className="p-6 h-full flex flex-col">
                      {/* Profile Picture */}
                      <div className="text-center mb-4">
                        <div className="relative inline-block">
                          <Image
                            src={freelancer.profilePicture || 'https://static.wixstatic.com/media/d6d795_086a6963988d4ca1993d33e9ec18b9c7~mv2.png?originWidth=128&originHeight=128'}
                            alt={freelancer.fullName || 'Freelancer'}
                            width={80}
                            className="w-20 h-20 rounded-full object-cover mx-auto"
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
                        </div>
                      </div>
                      
                      {/* Name and Contact */}
                      <div className="text-center mb-4">
                        <h3 className="font-heading text-lg font-semibold mb-1">
                          {freelancer.fullName}
                        </h3>
                        {freelancer.contactEmail && (
                          <div className="flex items-center justify-center gap-1 text-sm text-secondary-foreground/70">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{freelancer.contactEmail}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Skills */}
                      <div className="mb-4 flex-1">
                        <h4 className="font-paragraph text-sm font-medium mb-2 text-secondary-foreground/70">
                          Skills
                        </h4>
                        <p className="font-paragraph text-sm line-clamp-2">
                          {freelancer.skills || 'No skills listed'}
                        </p>
                      </div>
                      
                      {/* Bio */}
                      {freelancer.bio && (
                        <div className="mb-4 flex-1">
                          <h4 className="font-paragraph text-sm font-medium mb-2 text-secondary-foreground/70">
                            About
                          </h4>
                          <p className="font-paragraph text-sm text-secondary-foreground/80 line-clamp-3">
                            {freelancer.bio}
                          </p>
                        </div>
                      )}
                      
                      {/* Services Offered */}
                      {freelancer.servicesOffered && (
                        <div className="mb-4">
                          <h4 className="font-paragraph text-sm font-medium mb-2 text-secondary-foreground/70">
                            Services
                          </h4>
                          <p className="font-paragraph text-sm text-secondary-foreground/80 line-clamp-2">
                            {freelancer.servicesOffered}
                          </p>
                        </div>
                      )}
                      
                      {/* Rate and Actions */}
                      <div className="space-y-3 mt-auto">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-logoGold fill-current" />
                            <span className="font-paragraph text-sm">4.8</span>
                          </div>
                          <div className="flex items-center gap-1 font-semibold text-logoGold">
                            <DollarSign className="h-4 w-4" />
                            <span>{freelancer.hourlyRate || 'Rate varies'}/hr</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            asChild 
                            size="sm"
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Link to={`/freelancers/${freelancer._id}`}>
                              View Profile
                            </Link>
                          </Button>
                          
                          <Button 
                            asChild 
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Link to={`/booking?freelancer=${freelancer._id}`}>
                              Book Now
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
              Ready to Start Your Project?
            </h2>
            <p className="font-paragraph text-lg text-secondary-foreground/70 mb-6">
              Browse our services or book a consultation with one of our freelancers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/services">
                  Browse Services
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/booking">
                  Book Consultation
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}