import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Freelancers } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Save, User } from 'lucide-react';
import { format } from 'date-fns';

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function FreelancerAvailabilityPage() {
  const [freelancers, setFreelancers] = useState<Freelancers[]>([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancers | null>(null);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('17:00');
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [blockedDatesText, setBlockedDatesText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    setIsLoading(true);
    try {
      const { items } = await BaseCrudService.getAll<Freelancers>('freelancers');
      setFreelancers(items);
    } catch (error) {
      console.error('Error fetching freelancers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFreelancerAvailability = (freelancer: Freelancers) => {
    setSelectedFreelancer(freelancer);
    
    // Load available days
    const days = freelancer.availableDays?.split(',').map(day => day.trim()) || [];
    setAvailableDays(days);
    
    // Load working hours
    if (freelancer.workingHoursStart) {
      setWorkingHoursStart(freelancer.workingHoursStart.toString());
    }
    if (freelancer.workingHoursEnd) {
      setWorkingHoursEnd(freelancer.workingHoursEnd.toString());
    }
    
    // Load blocked dates
    const blocked = freelancer.blockedDates?.split(',').map(date => date.trim()).filter(date => date) || [];
    setBlockedDatesText(blocked.join(', '));
    setBlockedDates(blocked.map(dateStr => new Date(dateStr)).filter(date => !isNaN(date.getTime())));
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setAvailableDays(prev => [...prev, day]);
    } else {
      setAvailableDays(prev => prev.filter(d => d !== day));
    }
  };

  const handleBlockedDateAdd = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (!blockedDates.some(d => d.toISOString().split('T')[0] === dateStr)) {
      const newBlockedDates = [...blockedDates, date];
      setBlockedDates(newBlockedDates);
      setBlockedDatesText(newBlockedDates.map(d => d.toISOString().split('T')[0]).join(', '));
    }
  };

  const handleBlockedDateRemove = (dateToRemove: Date) => {
    const newBlockedDates = blockedDates.filter(
      date => date.toISOString().split('T')[0] !== dateToRemove.toISOString().split('T')[0]
    );
    setBlockedDates(newBlockedDates);
    setBlockedDatesText(newBlockedDates.map(d => d.toISOString().split('T')[0]).join(', '));
  };

  const saveAvailability = async () => {
    if (!selectedFreelancer) return;

    setIsSaving(true);
    try {
      const updatedFreelancer: Partial<Freelancers> = {
        _id: selectedFreelancer._id,
        availableDays: availableDays.join(', '),
        workingHoursStart: workingHoursStart as any,
        workingHoursEnd: workingHoursEnd as any,
        blockedDates: blockedDates.map(d => d.toISOString().split('T')[0]).join(', ')
      };

      await BaseCrudService.update('freelancers', updatedFreelancer as any);
      
      // Update local state
      setFreelancers(prev => 
        prev.map(f => 
          f._id === selectedFreelancer._id 
            ? { ...f, ...updatedFreelancer }
            : f
        )
      );

      alert('Availability updated successfully!');
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error updating availability. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brightpink mx-auto mb-4"></div>
          <p className="text-secondary">Loading freelancers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-logoBlack to-[#2a2a2a]">
      <div className="max-w-[120rem] mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-logoGold">
              Freelancer Availability Management
            </h1>
            <p className="font-paragraph text-lg text-secondary/90 max-w-2xl mx-auto">
              Manage your working hours, available days, and blocked dates to control your booking schedule.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Freelancer Selection */}
            <Card className="bg-secondary border-logoGold/20 shadow-lg">
              <CardHeader className="bg-secondary border-b border-logoGold/20">
                <CardTitle className="text-logoBlack flex items-center gap-2 font-heading">
                  <User className="w-5 h-5" />
                  Select Freelancer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {freelancers.map((freelancer) => (
                  <motion.div
                    key={freelancer._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={selectedFreelancer?._id === freelancer._id ? "default" : "outline"}
                      className={`w-full justify-start text-left h-auto p-4 ${
                        selectedFreelancer?._id === freelancer._id
                          ? 'bg-logoGold text-logoBlack hover:bg-logoGold/90'
                          : 'border-logoGold/30 text-logoBlack hover:bg-logoGold/10'
                      }`}
                      onClick={() => loadFreelancerAvailability(freelancer)}
                    >
                      <div>
                        <div className="font-bold">{freelancer.fullName}</div>
                        <div className="text-sm opacity-70">{freelancer.serviceArea}, {freelancer.city}</div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Availability Settings */}
            <div className="lg:col-span-2 space-y-6">
              {selectedFreelancer ? (
                <>
                  {/* Available Days */}
                  <Card className="bg-secondary border-logoGold/20 shadow-lg">
                    <CardHeader className="bg-secondary border-b border-logoGold/20">
                      <CardTitle className="text-logoBlack font-heading">Available Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {daysOfWeek.map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={day}
                              checked={availableDays.includes(day)}
                              onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                              className="border-logoGold/30"
                            />
                            <Label htmlFor={day} className="text-logoBlack text-sm font-paragraph cursor-pointer">
                              {day}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Working Hours */}
                  <Card className="bg-secondary border-logoGold/20 shadow-lg">
                    <CardHeader className="bg-secondary border-b border-logoGold/20">
                      <CardTitle className="text-logoBlack flex items-center gap-2 font-heading">
                        <Clock className="w-5 h-5" />
                        Working Hours
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-logoBlack font-semibold">Start Time</Label>
                          <Input
                            type="time"
                            value={workingHoursStart}
                            onChange={(e) => setWorkingHoursStart(e.target.value)}
                            className="text-logoBlack bg-white border-logoGold/30 font-paragraph"
                          />
                        </div>
                        <div>
                          <Label className="text-logoBlack font-semibold">End Time</Label>
                          <Input
                            type="time"
                            value={workingHoursEnd}
                            onChange={(e) => setWorkingHoursEnd(e.target.value)}
                            className="text-logoBlack bg-white border-logoGold/30 font-paragraph"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blocked Dates */}
                  <Card className="bg-secondary border-logoGold/20 shadow-lg">
                    <CardHeader className="bg-secondary border-b border-logoGold/20">
                      <CardTitle className="text-logoBlack flex items-center gap-2 font-heading">
                        <CalendarIcon className="w-5 h-5" />
                        Blocked Dates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-logoBlack font-semibold">Add Blocked Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left border-logoGold/30 text-logoBlack hover:bg-logoGold/10">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Select date to block
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                onSelect={(date) => date && handleBlockedDateAdd(date)}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div>
                          <Label className="text-logoBlack font-semibold">Currently Blocked Dates</Label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {blockedDates.length > 0 ? (
                              blockedDates.map((date, index) => (
                                <div key={index} className="flex items-center justify-between bg-logoGold/10 p-2 rounded border border-logoGold/20">
                                  <span className="text-logoBlack text-sm font-paragraph">
                                    {format(date, 'PPP')}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleBlockedDateRemove(date)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-logoBlack/60 text-sm font-paragraph">No blocked dates</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={saveAvailability}
                      disabled={isSaving}
                      className="w-full bg-logoGold hover:bg-logoGold/90 text-logoBlack font-heading font-bold"
                      size="lg"
                    >
                      <Save className="mr-2 h-5 w-5" />
                      {isSaving ? 'Saving...' : 'Save Availability Settings'}
                    </Button>
                  </motion.div>
                </>
              ) : (
                <Card className="bg-secondary/5 border-secondary/20">
                  <CardContent className="py-12 text-center">
                    <User className="w-12 h-12 text-secondary/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-secondary mb-2">
                      Select a Freelancer
                    </h3>
                    <p className="text-secondary/60">
                      Choose a freelancer from the list to manage their availability settings.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}