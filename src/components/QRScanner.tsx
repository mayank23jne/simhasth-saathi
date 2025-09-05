import React, { useState, useCallback, memo } from 'react';
import { Camera, Scan, User, Phone, Users, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from '@/context/TranslationContext';

interface QRScanResult {
  id: string;
  name: string;
  phone?: string;
  groupCode?: string;
  type: 'member' | 'lost_person' | 'help_center' | 'safety_info';
  details?: Record<string, any>;
}

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: QRScanResult) => void;
  mode?: 'member' | 'lost_found' | 'general';
}

const mockScanResults: QRScanResult[] = [
  {
    id: 'mem_001',
    name: 'राम कुमार शर्मा',
    phone: '+91 98765 43210',
    groupCode: 'GRP-2024-001',
    type: 'member',
    details: { age: 65, relation: 'पिता', emergencyContact: '+91 98765 43211' }
  },
  {
    id: 'mem_002',
    name: 'सीता देवी',
    phone: '+91 98765 43212',
    groupCode: 'GRP-2024-002',
    type: 'member',
    details: { age: 45, relation: 'माता', emergencyContact: '+91 98765 43213' }
  },
  {
    id: 'lost_001',
    name: 'अजय शर्मा',
    phone: '+91 98765 43214',
    type: 'lost_person',
    details: { 
      age: 12, 
      lastSeen: 'महाकाल मंदिर के पास',
      description: 'नीली शर्ट, काली पैंट',
      reportedBy: 'राम शर्मा',
      reportTime: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
    }
  },
  {
    id: 'help_001',
    name: 'सहायता केंद्र - रामघाट',
    type: 'help_center',
    details: {
      services: ['चिकित्सा सहायता', 'खोए व्यक्ति की जानकारी', 'सुरक्षा गार्ड'],
      contact: '+91 98765 43220',
      timing: '24 घंटे खुला',
      location: 'रामघाट मुख्य प्रवेश द्वार'
    }
  },
  {
    id: 'safety_001',
    name: 'सुरक्षा जानकारी - क्षेत्र A1',
    type: 'safety_info',
    details: {
      safetyTips: [
        'समूह के साथ रहें',
        'फोन चार्ज रखें',
        'पानी पीते रहें'
      ],
      emergencyNumbers: {
        police: '100',
        medical: '108',
        simhasthHelpline: '+91 98765 43200'
      },
      crowdLevel: 'मध्यम',
      bestRoutes: ['मुख्य मार्ग', 'रामघाट मार्ग']
    }
  }
];

export const QRScanner: React.FC<QRScannerProps> = ({ 
  isOpen, 
  onClose, 
  onScanResult,
  mode = 'general'
}) => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<QRScanResult | null>(null);
  const [scanAnimation, setScanAnimation] = useState(false);

  const simulateScan = useCallback(() => {
    setIsScanning(true);
    setScanAnimation(true);
    
    // Filter results based on mode
    let availableResults = mockScanResults;
    if (mode === 'member') {
      availableResults = mockScanResults.filter(r => r.type === 'member');
    } else if (mode === 'lost_found') {
      availableResults = mockScanResults.filter(r => r.type === 'lost_person');
    }

    setTimeout(() => {
      const randomResult = availableResults[Math.floor(Math.random() * availableResults.length)];
      setScannedResult(randomResult);
      setIsScanning(false);
      setScanAnimation(false);
      toast.success('QR कोड स्कैन हो गया!');
    }, 2000);
  }, [mode]);

  const handleAcceptResult = useCallback(() => {
    if (scannedResult) {
      onScanResult(scannedResult);
      setScannedResult(null);
      onClose();
    }
  }, [scannedResult, onScanResult, onClose]);

  const handleReject = useCallback(() => {
    setScannedResult(null);
  }, []);

  const handleClose = useCallback(() => {
    setScannedResult(null);
    setIsScanning(false);
    setScanAnimation(false);
    onClose();
  }, [onClose]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'member': return Users;
      case 'lost_person': return User;
      case 'help_center': return CheckCircle;
      case 'safety_info': return CheckCircle;
      default: return User;
    }
  };

  const getResultTitle = (result: QRScanResult) => {
    switch (result.type) {
      case 'member': return 'समूह सदस्य मिला';
      case 'lost_person': return 'खोया व्यक्ति मिला';
      case 'help_center': return 'सहायता केंद्र';
      case 'safety_info': return 'सुरक्षा जानकारी';
      default: return 'QR कोड स्कैन';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            QR कोड स्कैनर
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!scannedResult ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Camera View */}
              <div className="relative mx-auto w-64 h-64 bg-muted rounded-xl overflow-hidden border-2 border-dashed border-primary/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  {!isScanning ? (
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-primary mx-auto mb-3" />
                      <p className="text-primary font-medium">कैमरा तैयार है</p>
                      <p className="text-sm text-muted-foreground mt-1">QR कोड को फ्रेम में रखें</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 360]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Scan className="h-16 w-16 text-primary mx-auto" />
                      </motion.div>
                      <p className="text-primary font-medium mt-3">स्कैन हो रहा है...</p>
                    </div>
                  )}
                </div>

                {/* Scanning Animation Overlay */}
                {scanAnimation && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: "-100%" }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                  />
                )}

                {/* Corner Frames */}
                <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-primary" />
                <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-primary" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-primary" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-primary" />
              </div>

              {/* Instructions */}
              <Card className="bg-accent/30">
                <CardContent className="p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    {mode === 'member' && 'सदस्य का QR कोड स्कैन करें'}
                    {mode === 'lost_found' && 'खोए व्यक्ति का QR कोड स्कैन करें'}  
                    {mode === 'general' && 'QR कोड को कैमरे के सामने रखें'}
                  </p>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={simulateScan} disabled={isScanning} className="h-11">
                  {isScanning ? 'स्कैन हो रहा...' : 'स्कैन करें'}
                </Button>
                <Button variant="outline" onClick={handleClose} className="h-11">
                  रद्द करें
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Scan Result */}
              <Card className="border-success/50 bg-success/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-success">
                    {React.createElement(getResultIcon(scannedResult.type), { className: "h-5 w-5" })}
                    {getResultTitle(scannedResult)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-foreground">{scannedResult.name}</p>
                    {scannedResult.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" />
                        <span>{scannedResult.phone}</span>
                      </div>
                    )}
                    {scannedResult.groupCode && (
                      <p className="text-xs text-muted-foreground">समूह: {scannedResult.groupCode}</p>
                    )}
                  </div>

                  {/* Additional Details */}
                  {scannedResult.details && (
                    <div className="space-y-2 text-sm">
                      {scannedResult.type === 'member' && scannedResult.details.age && (
                        <p>उम्र: {scannedResult.details.age} वर्ष</p>
                      )}
                      {scannedResult.type === 'lost_person' && (
                        <div className="space-y-1">
                          <p>अंतिम बार देखा: {scannedResult.details.lastSeen}</p>
                          <p>विवरण: {scannedResult.details.description}</p>
                          <p className="text-xs text-muted-foreground">
                            रिपोर्ट: {new Date(scannedResult.details.reportTime).toLocaleString('hi-IN')}
                          </p>
                        </div>
                      )}
                      {scannedResult.type === 'help_center' && (
                        <div className="space-y-1">
                          <p>स्थान: {scannedResult.details.location}</p>
                          <p>समय: {scannedResult.details.timing}</p>
                          <p>संपर्क: {scannedResult.details.contact}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={handleAcceptResult} className="h-11">
                  स्वीकार करें
                </Button>
                <Button variant="outline" onClick={simulateScan} className="h-11">
                  दोबारा स्कैन
                </Button>
                <Button variant="outline" onClick={handleReject} className="h-11">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default memo(QRScanner);