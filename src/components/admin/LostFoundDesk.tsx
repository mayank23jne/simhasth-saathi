import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, QrCode, User, Clock, MapPin, Phone, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface LostFoundReport {
  id: string;
  type: 'lost' | 'found';
  name: string;
  age?: number;
  description: string;
  lastSeen: string;
  reporterName: string;
  reporterPhone: string;
  timestamp: number;
  status: 'active' | 'resolved';
  qrCode?: string;
  photo?: string;
}

export const LostFoundDesk: React.FC = () => {
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lost' as 'lost' | 'found',
    name: '',
    age: '',
    description: '',
    lastSeen: '',
    reporterName: '',
    reporterPhone: ''
  });

  useEffect(() => {
    // Load dummy lost & found data
    const dummyReports: LostFoundReport[] = [
      {
        id: 'lf_001',
        type: 'lost',
        name: 'Arjun Kumar',
        age: 8,
        description: 'Boy wearing blue shirt and black shorts, has a small mole on left cheek',
        lastSeen: 'Near Har Ki Pauri main entrance',
        reporterName: 'Priya Sharma',
        reporterPhone: '+91 98765 43210',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        status: 'active',
        qrCode: 'QR-LF-001'
      },
      {
        id: 'lf_002',
        type: 'found',
        name: 'Elderly Woman',
        age: 65,
        description: 'Wearing white saree, speaks Hindi, appears confused',
        lastSeen: 'Mansa Devi Temple',
        reporterName: 'Volunteer Team A',
        reporterPhone: '+91 87654 32109',
        timestamp: Date.now() - 900000, // 15 minutes ago
        status: 'active',
        qrCode: 'QR-LF-002'
      },
      {
        id: 'lf_003',
        type: 'lost',
        name: 'Handbag with documents',
        description: 'Brown leather handbag containing Aadhar card and train tickets',
        lastSeen: 'Ganga Aarti area',
        reporterName: 'Sunita Devi',
        reporterPhone: '+91 76543 21098',
        timestamp: Date.now() - 3600000, // 1 hour ago
        status: 'resolved'
      }
    ];

    setReports(dummyReports);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.lastSeen.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || report.type === filter;
    
    return matchesSearch && matchesFilter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newReport: LostFoundReport = {
      id: `lf_${Date.now()}`,
      type: formData.type,
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : undefined,
      description: formData.description,
      lastSeen: formData.lastSeen,
      reporterName: formData.reporterName,
      reporterPhone: formData.reporterPhone,
      timestamp: Date.now(),
      status: 'active',
      qrCode: `QR-LF-${Date.now()}`
    };

    setReports(prev => [newReport, ...prev]);
    setFormData({
      type: 'lost',
      name: '',
      age: '',
      description: '',
      lastSeen: '',
      reporterName: '',
      reporterPhone: ''
    });
    setIsDialogOpen(false);
    toast.success('Report submitted successfully');
  };

  const handleResolve = (reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: 'resolved' as const }
        : report
    ));
    toast.success('Report marked as resolved');
  };

  const generateQRCode = (reportId: string) => {
    toast.success('QR Code generated and shared with volunteers');
  };

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-500" />
                Lost & Found Desk
              </CardTitle>
              <CardDescription>
                {filteredReports.length} reports requiring attention
              </CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Report</DialogTitle>
                  <DialogDescription>
                    Add a new lost or found person/item report
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={formData.type === 'lost' ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, type: 'lost' }))}
                      className="w-full"
                    >
                      Lost
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === 'found' ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, type: 'found' }))}
                      className="w-full"
                    >
                      Found
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Name/Item"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <Input
                      placeholder="Age (optional)"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>
                  
                  <Textarea
                    placeholder="Description (appearance, clothing, distinguishing features)"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                  
                  <Input
                    placeholder="Last seen location"
                    value={formData.lastSeen}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastSeen: e.target.value }))}
                    required
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Reporter name"
                      value={formData.reporterName}
                      onChange={(e) => setFormData(prev => ({ ...prev, reporterName: e.target.value }))}
                      required
                    />
                    <Input
                      placeholder="Phone number"
                      value={formData.reporterPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, reporterPhone: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Submit Report
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'lost' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('lost')}
            >
              Lost
            </Button>
            <Button
              variant={filter === 'found' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('found')}
            >
              Found
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Reports Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`hover:shadow-medium transition-shadow ${
                report.status === 'resolved' ? 'opacity-60' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={`${
                        report.type === 'lost' 
                          ? 'bg-red-500' 
                          : 'bg-green-500'
                      } text-white text-xs mb-2`}>
                        {report.type}
                      </Badge>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      {report.age && (
                        <p className="text-sm text-muted-foreground">Age: {report.age}</p>
                      )}
                    </div>
                    <Badge variant={report.status === 'resolved' ? 'default' : 'destructive'}>
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm">{report.description}</p>
                  
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Last seen: {report.lastSeen}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Reporter: {report.reporterName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {report.reporterPhone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(report.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    {report.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() => handleResolve(report.id)}
                        className="flex-1"
                      >
                        Mark Resolved
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateQRCode(report.id)}
                      className="flex-1"
                    >
                      <QrCode className="h-3 w-3 mr-1" />
                      QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No reports found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};