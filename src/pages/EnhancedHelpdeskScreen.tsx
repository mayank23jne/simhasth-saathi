import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  Search, 
  Users, 
  Phone, 
  MapPin, 
  Shield, 
  HelpCircle,
  Camera,
  MessageSquare,
  Navigation,
  Clock,
  Star,
  Heart,
  AlertTriangle,
  CheckCircle,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from '@/context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import LostFoundSystem from '@/components/LostFoundSystem';
import QRScanner from '@/components/QRScanner';
import { IonicHeader } from '@/components/layout/ionic-header';

interface HelpService {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'emergency' | 'medical' | 'lost_found' | 'information' | 'spiritual' | 'facilities';
  available: boolean;
  contact?: string;
  location?: string;
  timing?: string;
  rating?: number;
  features?: string[];
}

interface HelpCenter {
  id: string;
  name: string;
  location: string;
  distance: string;
  services: string[];
  contact: string;
  timing: string;
  crowdLevel: 'low' | 'medium' | 'high';
  rating: number;
  lat: number;
  lng: number;
}

const helpServices: HelpService[] = [
  {
    id: 'sos',
    title: 'आपातकालीन सहायता',
    description: 'तुरंत सहायता के लिए SOS अलर्ट भेजें',
    icon: AlertTriangle,
    category: 'emergency',
    available: true,
    contact: '100',
    features: ['तुरंत अलर्ट', 'GPS स्थान', '24x7 उपलब्ध']
  },
  {
    id: 'lost_found',
    title: 'खोया-पाया सेवा',
    description: 'खोए व्यक्ति या सामान की रिपोर्ट करें',
    icon: Users,
    category: 'lost_found',
    available: true,
    features: ['QR कोड स्कैन', 'तस्वीर अपलोड', 'तुरंत खोज']
  },
  {
    id: 'medical',
    title: 'चिकित्सा सहायता',
    description: 'डॉक्टर और प्राथमिक चिकित्सा',
    icon: Heart,
    category: 'medical',
    available: true,
    contact: '108',
    features: ['24x7 उपलब्ध', 'मुफ्त जांच', 'दवाइयां']
  },
  {
    id: 'volunteer',
    title: 'स्वयंसेवक सहायता',
    description: 'रास्ता, जानकारी और सामान्य सहायता',
    icon: User,
    category: 'information',
    available: true,
    features: ['स्थानीय गाइड', 'भाषा सहायता', 'सामान्य जानकारी']
  },
  {
    id: 'police',
    title: 'पुलिस सहायता',
    description: 'सुरक्षा और कानून व्यवस्था',
    icon: Shield,
    category: 'emergency',
    available: true,
    contact: '100',
    features: ['सुरक्षा गश्त', 'शिकायत दर्ज', 'तुरंत सहायता']
  },
  {
    id: 'information',
    title: 'सूचना केंद्र',
    description: 'मेला जानकारी, मानचित्र, टाइमिंग',
    icon: HelpCircle,
    category: 'information',
    available: true,
    timing: '6:00 AM - 10:00 PM',
    features: ['मेला मैप', 'कार्यक्रम सूची', 'मार्गदर्शन']
  }
];

const helpCenters: HelpCenter[] = [
  {
    id: 'hc1',
    name: 'मुख्य सहायता केंद्र - रामघाट',
    location: 'रामघाट मुख्य प्रवेश द्वार',
    distance: '150 मी',
    services: ['चिकित्सा', 'खोया-पाया', 'सूचना', 'सुरक्षा'],
    contact: '+91 98765 43200',
    timing: '24 घंटे',
    crowdLevel: 'medium',
    rating: 4.8,
    lat: 23.1769,
    lng: 75.7889
  },
  {
    id: 'hc2',
    name: 'महाकाल गेट सहायता केंद्र',
    location: 'महाकाल मंदिर मुख्य गेट',
    distance: '300 मी',
    services: ['सूचना', 'पुलिस', 'स्वयंसेवक'],
    contact: '+91 98765 43201',
    timing: '5:00 AM - 11:00 PM',
    crowdLevel: 'high',
    rating: 4.5,
    lat: 23.1825,
    lng: 75.7685
  },
  {
    id: 'hc3',
    name: 'कालिदेह रोड केंद्र',
    location: 'कालिदेह रोड जंक्शन',
    distance: '500 मी',
    services: ['चिकित्सा', 'खोया-पाया', 'सुविधाएं'],
    contact: '+91 98765 43202',
    timing: '6:00 AM - 10:00 PM',
    crowdLevel: 'low',
    rating: 4.6,
    lat: 23.1992,
    lng: 75.7841
  }
];

const emergencyNumbers = [
  { name: 'पुलिस कंट्रोल रूम', number: '100', icon: Shield },
  { name: 'मेडिकल इमरजेंसी', number: '108', icon: Heart },
  { name: 'सिंहस्थ हेल्पलाइन', number: '+91-734-2525252', icon: Phone },
  { name: 'फायर ब्रिगेड', number: '101', icon: AlertTriangle }
];

const EnhancedHelpdeskScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<HelpService | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<HelpCenter | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLostFoundOpen, setIsLostFoundOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);

  const categories = [
    { id: 'all', name: 'सभी', icon: HelpCircle },
    { id: 'emergency', name: 'आपातकाल', icon: AlertTriangle },
    { id: 'medical', name: 'चिकित्सा', icon: Heart },
    { id: 'lost_found', name: 'खोया-पाया', icon: Users },
    { id: 'information', name: 'जानकारी', icon: MessageSquare }
  ];

  const filteredServices = useMemo(() => {
    let services = helpServices;
    
    if (activeCategory !== 'all') {
      services = services.filter(service => service.category === activeCategory);
    }
    
    if (searchQuery) {
      services = services.filter(service => 
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return services;
  }, [searchQuery, activeCategory]);

  const handleServiceClick = useCallback((service: HelpService) => {
    setSelectedService(service);
    
    switch (service.id) {
      case 'sos':
        navigate('/sos');
        break;
      case 'lost_found':
        setIsLostFoundOpen(true);
        break;
      case 'medical':
      case 'police':
        setEmergencyDialogOpen(true);
        break;
      default:
        // Handle other services
        break;
    }
  }, [navigate]);

  const handleCenterClick = useCallback((center: HelpCenter) => {
    setSelectedCenter(center);
  }, []);

  const handleCallNumber = useCallback((number: string) => {
    window.open(`tel:${number}`);
    toast.success(`कॉल की जा रही है: ${number}`);
  }, []);

  const handleGetDirections = useCallback((center: HelpCenter) => {
    // In a real app, this would open maps with directions
    toast.success(`${center.name} के लिए दिशा निर्देश`);
  }, []);

  const handleQRScanResult = useCallback((result: any) => {
    toast.success(`QR कोड स्कैन किया गया: ${result.name}`);
    if (result.type === 'help_center') {
      // Show help center details
    }
  }, []);

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getCrowdLevelText = (level: string) => {
    switch (level) {
      case 'low': return 'कम भीड़';
      case 'medium': return 'सामान्य भीड़';
      case 'high': return 'ज्यादा भीड़';
      default: return 'अज्ञात';
    }
  };

  return (
    <>
      <IonicHeader
        title={t('helpdeskTitle')}
        subtitle={t('helpdeskSubtitle')}
        rightIcon="notifications"
        onRightClick={() => navigate('/notifications')}
      />
      
      <div className="min-h-screen bg-background pb-nav">
        <div className="px-lg py-lg space-y-lg">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="सेवा या सहायता खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setActiveCategory(category.id)}
              >
                <category.icon className="h-3 w-3 mr-1" />
                {category.name}
              </Button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-md">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="destructive"
                size="lg"
                className="w-full h-20 flex-col gap-2"
                onClick={() => navigate('/sos')}
              >
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm font-medium">SOS आपातकाल</span>
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-20 flex-col gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setIsQRScannerOpen(true)}
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm font-medium">QR स्कैन करें</span>
              </Button>
            </motion.div>
          </div>

          {/* Help Services */}
          <div>
            <h2 className="text-lg font-semibold mb-md">सहायता सेवाएं</h2>
            <div className="grid grid-cols-1 gap-md">
              <AnimatePresence>
                {filteredServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="cursor-pointer transition-all hover:shadow-medium border-card-border"
                      onClick={() => handleServiceClick(service)}
                    >
                      <CardContent className="p-lg">
                        <div className="flex items-start gap-md">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <service.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-foreground">{service.title}</h3>
                              {service.available ? (
                                <Badge variant="default" className="bg-success text-success-foreground">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  उपलब्ध
                                </Badge>
                              ) : (
                                <Badge variant="destructive">बंद</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                            
                            {service.features && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {service.features.slice(0, 2).map((feature, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              {service.contact && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{service.contact}</span>
                                </div>
                              )}
                              <Button size="sm" variant="ghost" className="h-6 text-xs">
                                और जानकारी →
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Nearby Help Centers */}
          <div>
            <h2 className="text-lg font-semibold mb-md">नजदीकी सहायता केंद्र</h2>
            <div className="space-y-md">
              {helpCenters.map((center, index) => (
                <motion.div
                  key={center.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-medium transition-all"
                    onClick={() => handleCenterClick(center)}
                  >
                    <CardContent className="p-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{center.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3" />
                            <span>{center.location}</span>
                            <span>•</span>
                            <span>{center.distance}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-muted-foreground">{center.rating}</span>
                            </div>
                            <div className={`text-xs ${getCrowdLevelColor(center.crowdLevel)}`}>
                              {getCrowdLevelText(center.crowdLevel)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{center.timing}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {center.services.slice(0, 3).map((service, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {center.services.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{center.services.length - 3}
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCallNumber(center.contact);
                              }}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              कॉल करें
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGetDirections(center);
                              }}
                            >
                              <Navigation className="h-3 w-3 mr-1" />
                              दिशा निर्देश
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Emergency Numbers */}
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader className="pb-md">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                आपातकालीन नंबर
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-md">
              {emergencyNumbers.map((emergency) => (
                <div 
                  key={emergency.number}
                  className="flex items-center justify-between p-md bg-background rounded-lg border"
                >
                  <div className="flex items-center gap-md">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <emergency.icon className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{emergency.name}</p>
                      <p className="text-xs text-muted-foreground">{emergency.number}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCallNumber(emergency.number)}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    कॉल
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Lost & Found Modal */}
        <LostFoundSystem
          isOpen={isLostFoundOpen}
          onClose={() => setIsLostFoundOpen(false)}
        />

        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanResult={handleQRScanResult}
          mode="general"
        />

        {/* Emergency Services Modal */}
        <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                आपातकालीन सेवाएं
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                तुरंत सहायता के लिए नीचे दिए गए नंबर पर कॉल करें
              </p>
              {emergencyNumbers.map((emergency) => (
                <Card key={emergency.number}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-destructive/10 rounded-lg">
                        <emergency.icon className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">{emergency.name}</p>
                        <p className="text-sm text-muted-foreground">{emergency.number}</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleCallNumber(emergency.number);
                        setEmergencyDialogOpen(false);
                      }}
                    >
                      कॉल करें
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default memo(EnhancedHelpdeskScreen);