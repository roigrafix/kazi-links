import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Bookings } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, User, Phone, Mail, MapPin, Settings, Search, Filter, Edit, Save, X, CheckCircle, Navigation, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Bookings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [etaFilter, setEtaFilter] = useState('all');
  const [editingBooking, setEditingBooking] = useState<Bookings | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Booking status options
  const bookingStatuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'completed', label: 'Completed', color: 'bg-purple-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  ];

  // ETA/Live status options
  const etaStatuses = [
    { value: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'text-blue-400' },
    { value: 'on-the-way', label: 'On the Way', icon: Navigation, color: 'text-orange-400' },
    { value: 'arrived', label: 'Arrived', icon: CheckCircle, color: 'text-green-400' },
    { value: 'in-service', label: 'In Service', icon: User, color: 'text-purple-400' },
    { value: 'completed', label: 'Service Completed', icon: CheckCircle, color: 'text-green-500' },
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, etaFilter]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { items } = await BaseCrudService.getAll<Bookings>('bookings');
      // Sort by creation date, newest first
      const sortedBookings = items.sort((a, b) => {
        const dateA = new Date(a._createdDate || 0);
        const dateB = new Date(b._createdDate || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setBookings(sortedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.bookingStatus === statusFilter);
    }

    // ETA filter
    if (etaFilter !== 'all') {
      filtered = filtered.filter(booking => booking.etaStatus === etaFilter);
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, field: 'bookingStatus' | 'etaStatus', value: string) => {
    setIsUpdating(true);
    try {
      await BaseCrudService.update('bookings', {
        _id: bookingId,
        [field]: value
      });

      // Update local state
      setBookings(prev => prev.map(booking =>
        booking._id === bookingId ? { ...booking, [field]: value } : booking
      ));

      // Auto-update related statuses
      if (field === 'bookingStatus' && value === 'completed') {
        // When booking is completed, set ETA to completed as well
        await BaseCrudService.update('bookings', {
          _id: bookingId,
          etaStatus: 'completed'
        });
        setBookings(prev => prev.map(booking =>
          booking._id === bookingId ? { ...booking, etaStatus: 'completed' } : booking
        ));
      }

    } catch (error) {
      console.error('Error updating booking:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const bulkUpdateStatus = async (bookingIds: string[], field: 'bookingStatus' | 'etaStatus', value: string) => {
    setIsUpdating(true);
    try {
      for (const id of bookingIds) {
        await BaseCrudService.update('bookings', {
          _id: id,
          [field]: value
        });
      }
      await fetchBookings(); // Refresh data
    } catch (error) {
      console.error('Error bulk updating bookings:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = bookingStatuses.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-500';
  };

  const getETAInfo = (etaStatus: string) => {
    const statusConfig = etaStatuses.find(s => s.value === etaStatus);
    return statusConfig || { value: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'text-blue-400' };
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not specified';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPP');
  };

  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return 'Not specified';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPP p');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-logoGold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-paragraph text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* Header */}
      <section className="py-8 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-2">
                Admin Dashboard
              </h1>
              <p className="font-paragraph text-lg text-secondary-foreground/70">
                Manage booking statuses and live tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-logoGold" />
              <span className="text-sm">Total Bookings: {bookings.length}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-6 bg-secondary/50 text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-foreground/50" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Booking Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by booking status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Booking Statuses</SelectItem>
                {bookingStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ETA Status Filter */}
            <Select value={etaFilter} onValueChange={setEtaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by live status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Live Statuses</SelectItem>
                {etaStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setEtaFilter('all');
              }}
              className="border-secondary-foreground/20"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-secondary-foreground/70">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        </div>
      </section>

      {/* Bookings Management */}
      <section className="py-8">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          {filteredBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-secondary/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-primary-foreground/50" />
              </div>
              <h3 className="font-heading text-2xl font-semibold mb-4">
                No bookings found
              </h3>
              <p className="font-paragraph text-primary-foreground/70">
                No bookings match your current filters.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking, index) => {
                const etaInfo = getETAInfo(booking.etaStatus || 'scheduled');
                const ETAIcon = etaInfo.icon;

                return (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                  >
                    <Card className="bg-secondary text-secondary-foreground">
                      <CardContent className="p-6">
                        <div className="grid lg:grid-cols-4 gap-6">
                          {/* Booking Info */}
                          <div className="lg:col-span-2 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-heading text-lg font-semibold mb-1">
                                  {booking.serviceName}
                                </h3>
                                <p className="text-secondary-foreground/70 text-sm">
                                  ID: {booking._id}
                                </p>
                              </div>
                              <Badge className={`${getStatusColor(booking.bookingStatus || '')} text-white`}>
                                {booking.bookingStatus}
                              </Badge>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-secondary-foreground/50" />
                                <span>{booking.freelancerName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-secondary-foreground/50" />
                                <span>{formatDate(booking.bookingDate)} at {booking.bookingTime}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-secondary-foreground/50" />
                                <span>{booking.clientName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-secondary-foreground/50" />
                                <span>{booking.clientEmail}</span>
                              </div>
                            </div>

                            <div className="text-xs text-secondary-foreground/60">
                              Created: {formatDateTime(booking._createdDate)}
                            </div>
                          </div>

                          {/* Live Status */}
                          <div className="lg:col-span-1">
                            <div className="bg-white/5 rounded-lg p-4">
                              <div className="text-center mb-3">
                                <div className="w-12 h-12 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
                                  <ETAIcon className={`h-6 w-6 ${etaInfo.color}`} />
                                </div>
                                <div className="text-sm font-medium">Live Status</div>
                                <div className={`text-xs ${etaInfo.color}`}>
                                  {etaInfo.label}
                                </div>
                              </div>

                              <Select
                                value={booking.etaStatus || 'scheduled'}
                                onValueChange={(value) => updateBookingStatus(booking._id, 'etaStatus', value)}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {etaStatuses.map(status => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Booking Status Controls */}
                          <div className="lg:col-span-1">
                            <div className="bg-white/5 rounded-lg p-4">
                              <div className="text-center mb-3">
                                <div className="text-sm font-medium mb-2">Booking Status</div>
                                <Badge className={`${getStatusColor(booking.bookingStatus || '')} text-white mb-3`}>
                                  {booking.bookingStatus}
                                </Badge>
                              </div>

                              <Select
                                value={booking.bookingStatus || 'pending'}
                                onValueChange={(value) => updateBookingStatus(booking._id, 'bookingStatus', value)}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {bookingStatuses.map(status => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* Quick Actions */}
                              <div className="mt-3 space-y-2">
                                {booking.bookingStatus !== 'confirmed' && (
                                  <Button
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => updateBookingStatus(booking._id, 'bookingStatus', 'confirmed')}
                                    disabled={isUpdating}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Confirm
                                  </Button>
                                )}
                                {booking.bookingStatus === 'confirmed' && booking.etaStatus !== 'completed' && (
                                  <Button
                                    size="sm"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => {
                                      updateBookingStatus(booking._id, 'bookingStatus', 'completed');
                                      updateBookingStatus(booking._id, 'etaStatus', 'completed');
                                    }}
                                    disabled={isUpdating}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Statistics */}
      <section className="py-8 bg-secondary/30 text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <h2 className="font-heading text-2xl font-bold mb-6">Booking Statistics</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bookingStatuses.map(status => {
              const count = bookings.filter(b => b.bookingStatus === status.value).length;
              const percentage = bookings.length > 0 ? (count / bookings.length * 100).toFixed(1) : '0';
              
              return (
                <Card key={status.value}>
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 ${status.color} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold">{count}</span>
                    </div>
                    <h3 className="font-semibold mb-1">{status.label}</h3>
                    <p className="text-sm text-secondary-foreground/70">{percentage}% of total</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}