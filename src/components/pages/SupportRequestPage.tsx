import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { HeadphonesIcon, AlertTriangleIcon, RefreshCwIcon, MessageSquareIcon, ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SupportRequestPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    requestType: '',
    subject: '',
    description: '',
    priority: 'medium'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate form submission
    toast({
      title: "Support Request Submitted",
      description: "We've received your request and will get back to you within 24 hours.",
    });

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      requestType: '',
      subject: '',
      description: '',
      priority: 'medium'
    });
  };

  const requestTypes = [
    {
      value: 'customer-service',
      label: 'Customer Service',
      icon: HeadphonesIcon,
      description: 'General inquiries and assistance'
    },
    {
      value: 'missing-service',
      label: 'Report Missing Service',
      icon: AlertTriangleIcon,
      description: 'Report a service that should be available'
    },
    {
      value: 'refund',
      label: 'Request Refund',
      icon: RefreshCwIcon,
      description: 'Request a refund for a service'
    },
    {
      value: 'complaint',
      label: 'Submit Complaint',
      icon: MessageSquareIcon,
      description: 'File a complaint about a service or experience'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-logoBlack text-logoCream py-16">
        <div className="max-w-[100rem] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link 
              to="/services" 
              className="inline-flex items-center gap-2 text-logoGold hover:text-logoCream transition-colors mb-6"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Services
            </Link>
            <h1 className="text-5xl font-heading font-bold mb-4">
              Support Request
            </h1>
            <p className="text-xl font-paragraph max-w-3xl mx-auto">
              Need help? We're here to assist you with any questions, concerns, or requests you may have.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Request Type Selection */}
      <section className="py-16">
        <div className="max-w-[100rem] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-heading font-bold text-center mb-8 text-foreground">
              What can we help you with?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {requestTypes.map((type, index) => {
                const IconComponent = type.icon;
                return (
                  <motion.div
                    key={type.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        formData.requestType === type.value 
                          ? 'ring-2 ring-logoGold bg-logoGold/5' 
                          : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => handleInputChange('requestType', type.value)}
                    >
                      <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-4 w-12 h-12 bg-logoGold/10 rounded-full flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-logoGold" />
                        </div>
                        <CardTitle className="text-lg font-heading">{type.label}</CardTitle>
                        <CardDescription className="font-paragraph">
                          {type.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Support Form */}
          {formData.requestType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl font-heading">
                    Submit Your Request
                  </CardTitle>
                  <CardDescription className="font-paragraph">
                    Please provide as much detail as possible to help us assist you better.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-paragraph">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                          className="font-paragraph"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-paragraph">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                          className="font-paragraph"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="font-paragraph">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="font-paragraph"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority" className="font-paragraph">Priority Level</Label>
                        <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                          <SelectTrigger className="font-paragraph">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="font-paragraph">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        required
                        placeholder="Brief summary of your request"
                        className="font-paragraph"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="font-paragraph">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        required
                        placeholder="Please provide detailed information about your request..."
                        rows={6}
                        className="font-paragraph"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        size="lg"
                        className="bg-logoGold hover:bg-logoGold/90 text-logoBlack font-paragraph font-medium"
                      >
                        Submit Request
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-secondary">
        <div className="max-w-[100rem] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl font-heading font-bold mb-8 text-foreground">
              Other Ways to Reach Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-logoGold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HeadphonesIcon className="w-6 h-6 text-logoGold" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">Phone Support</h3>
                <p className="font-paragraph text-foreground/80">1-800-SUPPORT</p>
                <p className="font-paragraph text-sm text-foreground/60">Mon-Fri 9AM-6PM EST</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-logoGold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquareIcon className="w-6 h-6 text-logoGold" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">Live Chat</h3>
                <p className="font-paragraph text-foreground/80">Available 24/7</p>
                <p className="font-paragraph text-sm text-foreground/60">Instant assistance</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-logoGold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangleIcon className="w-6 h-6 text-logoGold" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">Emergency</h3>
                <p className="font-paragraph text-foreground/80">1-800-URGENT</p>
                <p className="font-paragraph text-sm text-foreground/60">24/7 emergency line</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}