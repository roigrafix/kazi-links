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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-logoBlack text-white py-20">
        <div className="max-w-[100rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link 
              to="/services" 
              className="inline-flex items-center gap-3 text-logoGold hover:text-white transition-colors mb-8 text-lg font-medium"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Services
            </Link>
            <h1 className="text-6xl font-heading font-bold mb-6 leading-tight">
              Support Request
            </h1>
            <p className="text-2xl font-paragraph max-w-4xl mx-auto leading-relaxed text-gray-100">
              Need help? We're here to assist you with any questions, concerns, or requests you may have.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Request Type Selection */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[100rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-4xl font-heading font-bold text-center mb-12 text-gray-900 leading-tight">
              What can we help you with?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                      className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 h-full ${
                        formData.requestType === type.value 
                          ? 'ring-4 ring-logoGold border-logoGold bg-logoGold/5' 
                          : 'border-gray-200 hover:border-logoGold/50 hover:bg-white'
                      }`}
                      onClick={() => handleInputChange('requestType', type.value)}
                    >
                      <CardHeader className="text-center pb-6 pt-8">
                        <div className="mx-auto mb-6 w-16 h-16 bg-logoGold/15 rounded-full flex items-center justify-center">
                          <IconComponent className="w-8 h-8 text-logoGold" />
                        </div>
                        <CardTitle className="text-xl font-heading font-semibold mb-3 text-gray-900 leading-tight">
                          {type.label}
                        </CardTitle>
                        <CardDescription className="font-paragraph text-base text-gray-700 leading-relaxed">
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
              <Card className="max-w-5xl mx-auto border-2 border-gray-200 shadow-lg bg-white">
                <CardHeader className="pb-8 pt-10">
                  <CardTitle className="text-3xl font-heading font-bold text-gray-900 mb-4">
                    Submit Your Request
                  </CardTitle>
                  <CardDescription className="font-paragraph text-lg text-gray-700 leading-relaxed">
                    Please provide as much detail as possible to help us assist you better.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-10">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="font-paragraph text-base font-semibold text-gray-900">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                          className="font-paragraph text-base h-12 border-2 border-gray-300 focus:border-logoGold"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="email" className="font-paragraph text-base font-semibold text-gray-900">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                          className="font-paragraph text-base h-12 border-2 border-gray-300 focus:border-logoGold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="phone" className="font-paragraph text-base font-semibold text-gray-900">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="font-paragraph text-base h-12 border-2 border-gray-300 focus:border-logoGold"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="priority" className="font-paragraph text-base font-semibold text-gray-900">
                          Priority Level
                        </Label>
                        <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                          <SelectTrigger className="font-paragraph text-base h-12 border-2 border-gray-300 focus:border-logoGold">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low" className="text-base">Low</SelectItem>
                            <SelectItem value="medium" className="text-base">Medium</SelectItem>
                            <SelectItem value="high" className="text-base">High</SelectItem>
                            <SelectItem value="urgent" className="text-base">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="space-y-3">
                      <Label htmlFor="subject" className="font-paragraph text-base font-semibold text-gray-900">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        required
                        placeholder="Brief summary of your request"
                        className="font-paragraph text-base h-12 border-2 border-gray-300 focus:border-logoGold"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="font-paragraph text-base font-semibold text-gray-900">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        required
                        placeholder="Please provide detailed information about your request..."
                        rows={8}
                        className="font-paragraph text-base border-2 border-gray-300 focus:border-logoGold leading-relaxed"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-6">
                      <Button 
                        type="submit" 
                        size="lg"
                        className="bg-logoGold hover:bg-logoGold/90 text-logoBlack font-paragraph font-semibold text-lg px-8 py-4 h-auto"
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
      <section className="py-20 bg-white">
        <div className="max-w-[100rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-heading font-bold mb-12 text-gray-900 leading-tight">
              Other Ways to Reach Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-logoGold/15 rounded-full flex items-center justify-center mx-auto mb-6">
                  <HeadphonesIcon className="w-8 h-8 text-logoGold" />
                </div>
                <h3 className="text-2xl font-heading font-semibold mb-4 text-gray-900">Phone Support</h3>
                <p className="font-paragraph text-lg text-gray-800 font-medium mb-2">1-800-SUPPORT</p>
                <p className="font-paragraph text-base text-gray-600">Mon-Fri 9AM-6PM EST</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-logoGold/15 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquareIcon className="w-8 h-8 text-logoGold" />
                </div>
                <h3 className="text-2xl font-heading font-semibold mb-4 text-gray-900">Live Chat</h3>
                <p className="font-paragraph text-lg text-gray-800 font-medium mb-2">Available 24/7</p>
                <p className="font-paragraph text-base text-gray-600">Instant assistance</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-logoGold/15 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangleIcon className="w-8 h-8 text-logoGold" />
                </div>
                <h3 className="text-2xl font-heading font-semibold mb-4 text-gray-900">Emergency</h3>
                <p className="font-paragraph text-lg text-gray-800 font-medium mb-2">1-800-URGENT</p>
                <p className="font-paragraph text-base text-gray-600">24/7 emergency line</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}