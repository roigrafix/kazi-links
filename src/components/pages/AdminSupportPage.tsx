import { useEffect, useState } from 'react';
import { BaseCrudService } from '@/integrations';
import { CustomerServiceRequests } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export default function AdminSupportPage() {
  const [requests, setRequests] = useState<CustomerServiceRequests[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { items } = await BaseCrudService.getAll<CustomerServiceRequests>('customerservicerequests');
      setRequests(items || []);
    } catch (error) {
      console.error('Error loading support requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, newStatus: string, newPriority: string) => {
    try {
      await BaseCrudService.update<CustomerServiceRequests>('customerservicerequests', {
        _id: id,
        status: newStatus,
        priority: newPriority,
      });
      setEditingId(null);
      loadRequests();
    } catch (error) {
      console.error('Error updating support request:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await BaseCrudService.delete('customerservicerequests', id);
      loadRequests();
    } catch (error) {
      console.error('Error deleting support request:', error);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.issueDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Open':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-logoBlack to-[#2a2a2a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-logoGold mb-2">Customer Support Management</h1>
          <p className="text-secondary/90 font-paragraph text-lg">Manage and respond to customer service requests</p>
        </div>

        <Card className="mb-6 border-0 shadow-lg bg-secondary">
          <CardHeader className="bg-secondary border-b border-logoGold/20">
            <CardTitle className="text-logoBlack font-heading text-xl">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by name, email, or issue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-logoGold/30 bg-white text-logoBlack placeholder:text-logoBlack/50 font-paragraph"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-logoGold/30 bg-white text-logoBlack font-paragraph">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="border-logoGold/30 bg-white text-logoBlack font-paragraph">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-base text-logoBlack flex items-center font-paragraph font-semibold">
                Total: <span className="font-bold ml-2 text-logoGold">{filteredRequests.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg overflow-hidden bg-secondary">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-logoGold/10 border-b-2 border-logoGold">
                <TableRow>
                  <TableHead className="font-heading font-bold text-logoBlack">Client Name</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Email</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Category</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Issue</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Status</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Priority</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Date</TableHead>
                  <TableHead className="font-heading font-bold text-logoBlack">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-logoBlack/60 font-paragraph">
                      No support requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request._id} className="hover:bg-logoGold/5 border-b border-logoGold/10">
                      <TableCell className="font-paragraph font-semibold text-logoBlack">{request.clientName}</TableCell>
                      <TableCell className="font-paragraph text-sm text-logoBlack/80">{request.clientEmail}</TableCell>
                      <TableCell className="font-paragraph text-sm text-logoBlack/80">{request.category}</TableCell>
                      <TableCell className="font-paragraph text-sm text-logoBlack/80 max-w-xs truncate">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="text-logoGold hover:text-logoGold/80 hover:underline cursor-pointer font-semibold">
                              View Details
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-secondary border-logoGold/20">
                            <DialogHeader>
                              <DialogTitle className="text-logoBlack font-heading">Issue Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-heading font-bold text-logoBlack mb-2">Description</h3>
                                <p className="font-paragraph text-logoBlack/80 whitespace-pre-wrap">{request.issueDescription}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-heading font-bold text-logoBlack mb-2">Client</h3>
                                  <p className="font-paragraph font-semibold text-logoBlack">{request.clientName}</p>
                                  <p className="font-paragraph text-sm text-logoBlack/70">{request.clientEmail}</p>
                                </div>
                                <div>
                                  <h3 className="font-heading font-bold text-logoBlack mb-2">Category</h3>
                                  <p className="font-paragraph font-semibold text-logoBlack">{request.category}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        {editingId === request._id ? (
                          <Select value={editStatus} onValueChange={setEditStatus}>
                            <SelectTrigger className="w-32 h-8 text-xs bg-white text-logoBlack border-logoGold/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={`${getStatusColor(request.status)} border-0 font-semibold`}>
                            {request.status || 'Open'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === request._id ? (
                          <Select value={editPriority} onValueChange={setEditPriority}>
                            <SelectTrigger className="w-28 h-8 text-xs bg-white text-logoBlack border-logoGold/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={`${getPriorityColor(request.priority)} border-0 font-semibold`}>
                            {request.priority || 'Medium'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-paragraph text-sm text-logoBlack/80">
                        {request.submissionDate ? format(new Date(request.submissionDate), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {editingId === request._id ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-logoGold hover:bg-logoGold/90 text-logoBlack h-8 font-semibold"
                                onClick={() => handleUpdate(request._id, editStatus, editPriority)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-logoGold/30 text-logoBlack hover:bg-logoGold/10"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-logoGold/30 text-logoBlack hover:bg-logoGold/10"
                                onClick={() => {
                                  setEditingId(request._id);
                                  setEditStatus(request.status || 'Open');
                                  setEditPriority(request.priority || 'Medium');
                                }}
                              >
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="h-8 bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-secondary border-logoGold/20">
                                  <AlertDialogTitle className="text-logoBlack font-heading">Delete Support Request</AlertDialogTitle>
                                  <AlertDialogDescription className="text-logoBlack/70 font-paragraph">
                                    Are you sure you want to delete this support request? This action cannot be undone.
                                  </AlertDialogDescription>
                                  <div className="flex gap-3 justify-end">
                                    <AlertDialogCancel className="border-logoGold/30 text-logoBlack hover:bg-logoGold/10">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(request._id)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
