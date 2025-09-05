import React, { useState, useCallback, memo } from 'react';
import { Search, User, Camera, Phone, MapPin, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import QRScanner from './QRScanner';
import { useTranslation } from '@/context/TranslationContext';
import { useAppStore } from '@/store/appStore';

interface LostPerson {
  id: string;
  name: string;
  age?: number;
  description: string;
  lastSeen: string;
  contactPhone: string;
  reporterName: string;
  reportedAt: number;
  found: boolean;
  foundAt?: number;
  foundBy?: string;
  photo?: string;
  qrCode?: string;
}

interface LostFoundSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockLostPersons: LostPerson[] = [
  {
    id: 'lost_001',
    name: 'अजय कुमार',
    age: 12,
    description: 'नीली शर्ट, काली पैंट, स्कूल बैग',
    lastSeen: 'महाकाल मंदिर मुख्य द्वार के पास',
    contactPhone: '+91 98765 43210',
    reporterName: 'राम कुमार (पिता)',
    reportedAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    found: false
  },
  {
    id: 'lost_002',
    name: 'सुनीता देवी',
    age: 65,
    description: 'सफेद साड़ी, चांदी के कंगन, चश्मा',
    lastSeen: 'रामघाट के पास',
    contactPhone: '+91 98765 43211',
    reporterName: 'मनोज शर्मा (पुत्र)',
    reportedAt: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
    found: true,
    foundAt: Date.now() - 1 * 60 * 60 * 1000, // Found 1 hour ago
    foundBy: 'सुरक्षा गार्ड - पोस्ट 3'
  },
  {
    id: 'lost_003',
    name: 'रोहित शर्मा',
    age: 8,
    description: 'लाल टी-शर्ट, जींस, खिलौना कार',
    lastSeen: 'भोजन वितरण केंद्र के पास',
    contactPhone: '+91 98765 43212',
    reporterName: 'प्रिया शर्मा (माता)',
    reportedAt: Date.now() - 30 * 60 * 1000, // 30 minutes ago
    found: false
  }
];

export const LostFoundSystem: React.FC<LostFoundSystemProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'search' | 'report' | 'scan'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [lostPersons, setLostPersons] = useState(mockLostPersons);
  const [isReporting, setIsReporting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    name: '',
    age: '',
    description: '',
    lastSeen: '',
    contactPhone: '',
    reporterName: ''
  });

  const submitReport = useAppStore(s => s.submitReport);

  const filteredPersons = lostPersons.filter(person => 
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.lastSeen.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReportSubmit = useCallback(async () => {
    if (!reportForm.name || !reportForm.description || !reportForm.lastSeen || !reportForm.contactPhone) {
      toast.error('कृपया सभी आवश्यक फील्ड भरें');
      return;
    }

    setIsReporting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newReport = {
      name: reportForm.name,
      age: reportForm.age ? parseInt(reportForm.age) : undefined,
      description: reportForm.description,
      lastSeen: reportForm.lastSeen
    };

    submitReport(newReport);
    
    const newLostPerson: LostPerson = {
      id: `lost_${Date.now()}`,
      ...newReport,
      contactPhone: reportForm.contactPhone,
      reporterName: reportForm.reporterName || 'अनाम',
      reportedAt: Date.now(),
      found: false
    };

    setLostPersons(prev => [newLostPerson, ...prev]);
    setReportForm({
      name: '',
      age: '',
      description: '',
      lastSeen: '',
      contactPhone: '',
      reporterName: ''
    });
    
    setIsReporting(false);
    toast.success('रिपोर्ट सफलतापूर्वक दर्ज की गई');
    setActiveTab('search');
  }, [reportForm, submitReport]);

  const handleMarkFound = useCallback((id: string) => {
    setLostPersons(prev => prev.map(person => 
      person.id === id 
        ? { 
            ...person, 
            found: true, 
            foundAt: Date.now(),
            foundBy: 'आप' 
          }
        : person
    ));
    toast.success('व्यक्ति मिल गया!');
  }, []);

  const handleScanResult = useCallback((result: any) => {
    if (result.type === 'lost_person') {
      // Find the person in our list or add them
      const existingPerson = lostPersons.find(p => p.id === result.id);
      if (existingPerson) {
        handleMarkFound(result.id);
        toast.success(`${result.name} मिल गया!`);
      } else {
        // Add new found person
        const newFoundPerson: LostPerson = {
          id: result.id,
          name: result.name,
          age: result.details?.age,
          description: result.details?.description || 'QR कोड से स्कैन किया गया',
          lastSeen: result.details?.lastSeen || 'अज्ञात',
          contactPhone: result.phone || '',
          reporterName: result.details?.reportedBy || 'QR स्कैन',
          reportedAt: result.details?.reportTime || Date.now(),
          found: true,
          foundAt: Date.now(),
          foundBy: 'आप (QR स्कैन)'
        };
        setLostPersons(prev => [newFoundPerson, ...prev]);
        toast.success(`${result.name} का QR कोड स्कैन किया गया - वे मिल गए हैं!`);
      }
    }
    setIsScannerOpen(false);
  }, [lostPersons, handleMarkFound]);

  const getTimeSince = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours} घंटे पहले`;
    } else {
      return `${minutes} मिनट पहले`;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              खोए व्यक्ति की जानकारी
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex bg-muted rounded-lg p-1 mb-4">
            {[
              { id: 'search', label: 'खोजें', icon: Search },
              { id: 'report', label: 'रिपोर्ट करें', icon: User },
              { id: 'scan', label: 'QR स्कैन', icon: Camera }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                className={`flex-1 h-8 ${activeTab === tab.id ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <tab.icon className="h-3 w-3 mr-1" />
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              {/* Search Tab */}
              {activeTab === 'search' && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="नाम, विवरण या स्थान खोजें..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-3">
                    {filteredPersons.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? 'कोई परिणाम नहीं मिला' : 'कोई खोई हुई व्यक्ति की रिपोर्ट नहीं'}
                        </p>
                      </div>
                    ) : (
                      filteredPersons.map((person) => (
                        <Card key={person.id} className={`${person.found ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-sm">{person.name}</h4>
                                {person.age && (
                                  <p className="text-xs text-muted-foreground">उम्र: {person.age} वर्ष</p>
                                )}
                              </div>
                              <Badge variant={person.found ? 'default' : 'destructive'} className="text-xs">
                                {person.found ? (
                                  <><CheckCircle className="h-3 w-3 mr-1" />मिल गया</>
                                ) : (
                                  <><AlertCircle className="h-3 w-3 mr-1" />खोया हुआ</>
                                )}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-xs">
                              <p><strong>विवरण:</strong> {person.description}</p>
                              <p><strong>अंतिम बार देखा:</strong> {person.lastSeen}</p>
                              <p><strong>रिपोर्टर:</strong> {person.reporterName}</p>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>रिपोर्ट: {getTimeSince(person.reportedAt)}</span>
                              </div>
                              {person.found && person.foundAt && (
                                <>
                                  <div className="flex items-center gap-1 text-success">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>मिला: {getTimeSince(person.foundAt)}</span>
                                  </div>
                                  {person.foundBy && (
                                    <p className="text-success"><strong>द्वारा मिला:</strong> {person.foundBy}</p>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs flex-1"
                                onClick={() => window.open(`tel:${person.contactPhone}`)}
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                संपर्क
                              </Button>
                              {!person.found && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs flex-1"
                                  onClick={() => handleMarkFound(person.id)}
                                >
                                  मिल गया
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* Report Tab */}
              {activeTab === 'report' && (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">नाम *</Label>
                      <Input
                        id="name"
                        placeholder="खोए व्यक्ति का पूरा नाम"
                        value={reportForm.name}
                        onChange={(e) => setReportForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="age">उम्र</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="वर्षों में"
                        value={reportForm.age}
                        onChange={(e) => setReportForm(prev => ({ ...prev, age: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">विवरण *</Label>
                      <Textarea
                        id="description"
                        placeholder="कपड़े, शारीरिक विशेषताएं, कोई अन्य पहचान..."
                        value={reportForm.description}
                        onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastSeen">अंतिम बार कहां देखा *</Label>
                      <Input
                        id="lastSeen"
                        placeholder="स्थान का नाम या विवरण"
                        value={reportForm.lastSeen}
                        onChange={(e) => setReportForm(prev => ({ ...prev, lastSeen: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="contactPhone">संपर्क नंबर *</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={reportForm.contactPhone}
                        onChange={(e) => setReportForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="reporterName">आपका नाम</Label>
                      <Input
                        id="reporterName"
                        placeholder="रिपोर्ट करने वाले का नाम"
                        value={reportForm.reporterName}
                        onChange={(e) => setReportForm(prev => ({ ...prev, reporterName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleReportSubmit}
                    disabled={isReporting}
                    className="w-full"
                  >
                    {isReporting ? 'रिपोर्ट दर्ज हो रही है...' : 'रिपोर्ट दर्ज करें'}
                  </Button>
                </motion.div>
              )}

              {/* QR Scan Tab */}
              {activeTab === 'scan' && (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4 text-center"
                >
                  <div className="py-8">
                    <Camera className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">QR कोड स्कैन करें</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      खोए व्यक्ति के पास का QR कोड स्कैन करके तुरंत उन्हें मिला हुआ रिपोर्ट करें
                    </p>
                    
                    <Button 
                      onClick={() => setIsScannerOpen(true)}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      QR स्कैनर खोलें
                    </Button>
                  </div>

                  <Card className="bg-accent/30">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm mb-2">स्कैन करने योग्य QR कोड:</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• व्यक्तिगत पहचान QR कोड</p>
                        <p>• खोए व्यक्ति रिपोर्ट QR</p>
                        <p>• सहायता केंद्र QR कोड</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
        mode="lost_found"
      />
    </>
  );
};

export default memo(LostFoundSystem);