import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, UserPlus2, Share2, Hash, IdCard, Copy, Printer, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { encodeQR } from '@/lib/qr';
import { qrService } from '@/services/qrService';
import { getSimpleLocation } from '@/lib/location';
import { useAppStore } from '@/store/appStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

const fieldBase = "flex flex-col gap-1";
const labelBase = "text-sm font-medium text-foreground";
const hintBase = "text-xs text-muted-foreground";

const AddMembers: React.FC = () => {
  const groupCode = useAppStore(s => s.groupCode) || (typeof window !== 'undefined' ? (localStorage.getItem('groupId') || 'GRP-2024-001') : 'GRP-2024-001');

  const [inviteName, setInviteName] = useState('');
  const [inviteAge, setInviteAge] = useState('');
  const [invitePhone, setInvitePhone] = useState('');

  const [qrName, setQrName] = useState('');
  const [qrAge, setQrAge] = useState('');
  const [qrPhone, setQrPhone] = useState('');
  const [qrAddress, setQrAddress] = useState('');
  const [qrEmergency, setQrEmergency] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // UX helpers: sanitize and validate inputs
  const onlyDigits = (v: string) => v.replace(/\D/g, '');
  const handleInvitePhoneChange = (v: string) => setInvitePhone(onlyDigits(v).slice(0, 10));
  const handleQrPhoneChange = (v: string) => setQrPhone(onlyDigits(v).slice(0, 10));
  const handleInviteAgeChange = (v: string) => setInviteAge(onlyDigits(v).slice(0, 3));
  const handleQrAgeChange = (v: string) => setQrAge(onlyDigits(v).slice(0, 3));

  const inviteWhatsApp = () => {
    const ageStr = inviteAge ? `, Age: ${inviteAge}` : '';
    const phoneStr = invitePhone ? `, Phone: ${invitePhone}` : '';
    const message = `Namaste${inviteName ? ' ' + inviteName : ''}!\nJoin our Simhastha group. Group Code: ${groupCode}${ageStr}${phoneStr}.\nOpen the app and enter this code to join.`;
    const cleaned = (invitePhone || '').replace(/\D/g, '');
    if (cleaned) {
      let target = cleaned;
      if (target.length === 10) target = `91${target}`; // default to India if 10 digits
      if (target.length < 11) {
        toast.error('Please enter a valid mobile number');
        return;
      }
      const url = `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      return;
    }
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Deferred QR generation state and handlers
  type GeneratedEntry = {
    id: string;
    name: string;
    age?: number;
    phone?: string;
    groupCode: string;
    payload: string;
  };

  const [generated, setGenerated] = useState<GeneratedEntry[]>([]);
  const [selected, setSelected] = useState<GeneratedEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationName, setLocationName] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    getSimpleLocation({ enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 }).then((loc) => {
      if (!mounted || !loc) return;
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
      setLocationName(loc.locationName);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Utilities: create PNG from the QR SVG shown in the modal
  const createSelectedQrPng = async (): Promise<string | null> => {
    try {
      const wrapper = document.getElementById('selected-qr-wrapper');
      if (!wrapper) return null;
      const svg = wrapper.querySelector('svg') as unknown as SVGSVGElement | null;
      if (!svg) return null;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const canvas = document.createElement('canvas');
      const size = 220;
      const scale = 3; // high-res for print/share
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const img = new Image();
      const dataUrl: string = await new Promise((resolve) => {
        img.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
      });
      return dataUrl;
    } catch {
      return null;
    }
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleShareSelected = async () => {
    if (!selected) return;
    const dataUrl = await createSelectedQrPng();
    if (!dataUrl) {
      toast.error('Unable to prepare QR for sharing');
      return;
    }
    try {
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      const file = new File([blob], `member-qr-${selected.id}.png`, { type: 'image/png' });
      // @ts-ignore
      const canShareFiles = typeof navigator !== 'undefined' && (navigator as any).canShare && (navigator as any).canShare({ files: [file] });
      if (navigator.share && canShareFiles) {
        // @ts-ignore
        await navigator.share({ files: [file], title: 'Member QR', text: selected.name });
        toast.success('QR shared');
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'Member QR', text: selected.name, url: dataUrl });
        toast.success('Share opened');
        return;
      }
    } catch {}
    downloadDataUrl(dataUrl, `member-qr-${selected.id}.png`);
    toast.info('Sharing not supported. Saved image instead');
  };

  const handlePrintSelected = async () => {
    if (!selected) return;
    const dataUrl = await createSelectedQrPng();
    if (!dataUrl) {
      toast.error('Unable to prepare QR for printing');
      return;
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const canWindowPrint = typeof window.print === 'function' && !isMobile;

    if (canWindowPrint) {
      // Desktop-like print: open a minimal window with the image and trigger print
      const w = window.open('', '_blank', 'noopener,noreferrer,width=480,height=640');
      if (w) {
        const html = `<!doctype html><html><head><title>Print QR</title>
          <style>body{margin:0;display:grid;place-items:center;background:#fff}img{width:85vmin;max-width:480px}</style>
        </head><body><img src="${dataUrl}" onload="window.print(); setTimeout(() => window.close(), 300);"/></body></html>`;
        w.document.open();
        w.document.write(html);
        w.document.close();
        return;
      }
    }

    // Mobile/native fallback: share the image if possible, otherwise download
    try {
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      const file = new File([blob], `member-qr-${selected.id}.png`, { type: 'image/png' });
      // @ts-ignore
      const canShareFiles = typeof navigator !== 'undefined' && (navigator as any).canShare && (navigator as any).canShare({ files: [file] });
      if (navigator.share && canShareFiles) {
        // @ts-ignore
        await navigator.share({ files: [file], title: 'Member QR', text: 'Member QR Code' });
        toast.success('QR shared');
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'Member QR', text: 'Member QR Code', url: dataUrl });
        toast.success('Share opened');
        return;
      }
    } catch {}

    // As a last resort, download the PNG so the user can print from gallery/files
    downloadDataUrl(dataUrl, `member-qr-${selected.id}.png`);
    toast.success('QR saved');
  };

  const handleGenerate = async () => {
    if (!qrName.trim() || !qrAge.trim() || !qrPhone.trim()) {
      toast.error('Please fill name, age and mobile number');
      return;
    }
    const ageNum = Number(qrAge);
    if (!Number.isFinite(ageNum) || ageNum <= 0) {
      toast.error('Please enter a valid age');
      return;
    }
    setSubmitting(true);
    let qrId: string | number | undefined;
    try {
      const gen = await qrService.generate();
      qrId = (gen as any)?.qrId ?? (gen as any)?.data?.qrId;
      if (qrId == null) throw new Error('Missing qrId');
      await qrService.bind({
        qrId,
        groupId: groupCode,
        fullName: qrName.trim(),
        age: ageNum,
        emergencyContact: (qrEmergency || qrPhone).trim(),
        address: (qrAddress.trim() || locationName),
      });
    } catch (e) {
      toast.error('Failed to generate/bind QR');
      setSubmitting(false);
      return;
    }
    const id = `mem_${Date.now()}`;
    const payload = encodeQR({
      v: 1,
      kind: 'member_card',
      id,
      name: qrName.trim(),
      groupCode,
      phone: qrPhone.trim(),
      age: ageNum,
      latitude,
      longitude,
      locationName,
      address: qrAddress.trim() || locationName,
      qrId,
    } as any);
    const entry: GeneratedEntry = { id, name: qrName.trim(), age: ageNum, phone: qrPhone.trim(), groupCode, payload };
    setGenerated(prev => [entry, ...prev]);
    setQrName('');
    setQrAge('');
    setQrPhone('');
    setQrAddress('');
    setQrEmergency('');
    setSubmitting(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1800);
    toast.success('Offline QR generated');
  };

  const openEntry = (entry: GeneratedEntry) => {
    setSelected(entry);
    setIsModalOpen(true);
  };

  const copySelected = () => {
    if (selected) {
      navigator.clipboard.writeText(selected.payload);
      toast.success('QR data copied');
    }
  };

  const isFilled = !!(qrName.trim() && qrAge.trim() && qrPhone.trim());
  const progress = (Number(!!qrName.trim()) + Number(!!qrAge.trim()) + Number(!!qrPhone.trim())) / 3;

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-saffron-light/30 via-background to-sky-blue-light/30">
      <div className="container-mobile sm:container-tablet lg:container-desktop py-4 sm:py-6 space-y-4">
        <Card className="border-card-border shadow-medium bg-card/95 backdrop-blur-sm rounded-lg sm:rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-responsive-lg">
              <UserPlus2 className="h-5 w-5" /> Add Group Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="invite" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="invite" className="gap-2">
                  <Share2 className="h-4 w-4" /> Invite Member
                </TabsTrigger>
                <TabsTrigger value="qr" className="gap-2">
                  <QrCode className="h-4 w-4" /> Generate Offline QR
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invite" className="mt-4">
                <div className="space-y-4">
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={fieldBase}>
                    <label className={labelBase}>Name</label>
                    <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Member name" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }} className="grid grid-cols-1 gap-3">
                    <div className={fieldBase}>
                      <label className={labelBase}>Age</label>
                      <Input type="number" inputMode="numeric" min={1} max={120} value={inviteAge} onChange={e => handleInviteAgeChange(e.target.value)} placeholder="Age in years" aria-label="Age" />
                      <p className={hintBase}>Enter age between 1-120.</p>
                    </div>
                    <div className={fieldBase}>
                      <label className={labelBase}>Mobile Number</label>
                      <Input type="tel" inputMode="tel" maxLength={10} value={invitePhone} onChange={e => handleInvitePhoneChange(e.target.value)} placeholder="10-digit mobile number" aria-label="Mobile Number" />
                      <p className={hintBase}>Digits only. Country code auto-applied for 10 digits.</p>
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" /> Group Code: <span className="font-mono text-foreground">{groupCode}</span>
                    <Button size="sm" variant="outline" className="h-6 px-2 ml-2" onClick={() => { navigator.clipboard.writeText(groupCode); toast.success('Group code copied'); }}>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }} whileTap={{ scale: 0.98 }}>
                    <Button className="h-11 w-full bg-[#25D366] hover:bg-[#1EBE57] text-white" onClick={inviteWhatsApp}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-4 w-4" aria-hidden>
                        <path fill="currentColor" d="M19.11 17.42c-.26-.13-1.53-.76-1.77-.85c-.24-.09-.42-.13-.59.13c-.17.26-.68.85-.83 1.03c-.15.17-.31.2-.57.07c-.26-.13-1.1-.4-2.1-1.28c-.78-.7-1.31-1.56-1.46-1.82c-.15-.26-.02-.4.11-.53c.11-.11.26-.31.39-.46c.13-.15.17-.26.26-.44c.09-.17.04-.33-.02-.46c-.07-.13-.59-1.43-.8-1.95c-.21-.5-.42-.43-.59-.43h-.5c-.17 0-.46.07-.7.33c-.24.26-.9.88-.9 2.13s.92 2.48 1.05 2.65c.13.17 1.82 2.78 4.4 3.9c.62.27 1.11.43 1.49.55c.63.2 1.2.17 1.65.1c.5-.08 1.53-.62 1.75-1.22c.22-.59.22-1.1.15-1.21c-.07-.11-.24-.17-.5-.3m-3.1 6.4h-.01A7.8 7.8 0 0 1 8.2 16.1a7.74 7.74 0 0 1 7.74-7.74c2.07 0 4.02.81 5.49 2.28a7.73 7.73 0 0 1 2.24 5.53a7.74 7.74 0 0 1-7.74 7.64m6.64-14.38A10.47 10.47 0 0 0 15.94 5C9.34 5 4 10.33 4 16.92c0 2.1.55 4.16 1.6 5.98L4 28l5.22-1.53a11.9 11.9 0 0 0 5.72 1.55h.01c6.6 0 11.93-5.33 11.93-11.93c0-3.19-1.25-6.19-3.53-8.47"/>
                      </svg>
                      Send WhatsApp Invite
                    </Button>
                  </motion.div>
                  <p className={hintBase}>Opens WhatsApp with a pre-filled message including your group code.</p>
                </div>
              </TabsContent>

              <TabsContent value="qr" className="mt-4">
                <div className="space-y-4">
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={fieldBase}>
                    <label className={labelBase}>Name</label>
                    <Input value={qrName} onChange={e => setQrName(e.target.value)} placeholder="Member name" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }} className="grid grid-cols-1 gap-3">
                    <div className={fieldBase}>
                      <label className={labelBase}>Age</label>
                      <Input type="number" inputMode="numeric" min={1} max={120} value={qrAge} onChange={e => handleQrAgeChange(e.target.value)} placeholder="Age in years" aria-label="Age" />
                      <p className={hintBase}>Enter age between 1-120.</p>
                    </div>
                    <div className={fieldBase}>
                      <label className={labelBase}>Mobile Number</label>
                      <Input type="tel" inputMode="tel" maxLength={10} value={qrPhone} onChange={e => handleQrPhoneChange(e.target.value)} placeholder="10-digit mobile number" aria-label="Mobile Number" />
                      <p className={hintBase}>Digits only. Country code auto-applied for 10 digits.</p>
                    </div>
                    <div className={fieldBase}>
                      <label className={labelBase}>Emergency Contact</label>
                      <Input type="tel" inputMode="tel" maxLength={10} value={qrEmergency} onChange={e => setQrEmergency(e.target.value.replace(/\D/g, ''))} placeholder="Alternate phone (optional)" aria-label="Emergency Contact" />
                      <p className={hintBase}>If empty, we will use the mobile number.</p>
                    </div>
                    <div className={fieldBase}>
                      <label className={labelBase}>Address (optional)</label>
                      <Input value={qrAddress} onChange={e => setQrAddress(e.target.value)} placeholder="House/Street, Area, City" aria-label="Address" />
                      <p className={hintBase}>Edit if auto location name is not accurate.</p>
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IdCard className="h-3.5 w-3.5" /> Fill the form and tap Generate to create an offline QR
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }}>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.2 }} whileTap={{ scale: 0.98 }}>
                    <Button className={`h-11 w-full ${isFilled ? 'shadow-[0_0_0_3px_rgba(34,197,94,0.25)] animate-pulse' : ''}`} onClick={handleGenerate} disabled={!isFilled || submitting}>
                      <QrCode className="h-4 w-4" /> {submitting ? 'Generating…' : 'Generate QR'}
                    </Button>
                  </motion.div>

                  {generated.length > 0 && (
                    <div className="pt-2">
                      <div className="text-sm font-medium mb-2">Generated QRs</div>
                      <div className="space-y-2">
                        {generated.map((g) => (
                          <motion.button
                            key={g.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-background/60 border border-border/60 text-left"
                            onClick={() => openEntry(g)}
                          >
                            <div>
                              <div className="text-sm font-medium text-foreground">QR code generated for</div>
                              <div className="text-xs text-muted-foreground">{g.name} {g.age ? `• ${g.age}y` : ''}</div>
                            </div>
                            <div className="bg-white p-1 rounded border">
                              <QRCode value={g.payload} size={56} />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <AnimatePresence>
          {generated.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-2 mx-auto max-w-md w-full bg-success/10 border border-success/30 text-success rounded-lg p-3 text-sm text-center"
            >
              Last QR generated for <span className="font-medium">{generated[0].name}</span> {generated[0].age ? `(${generated[0].age}y)` : ''}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
            >
              {[...Array(20)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ y: -20, x: Math.random() * window.innerWidth }}
                  animate={{ y: window.innerHeight + 20, rotate: 360 }}
                  transition={{ duration: 1 + Math.random() * 1.2, ease: 'easeOut' }}
                  className="absolute block h-2 w-2 rounded-sm"
                  style={{ background: ['#22c55e','#ef4444','#3b82f6','#f59e0b'][i % 4], left: 0 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-xs w-full p-0 rounded-2xl shadow-2xl">
            <DialogHeader className="p-[7px]">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <QrCode className="h-5 w-5" /> Member QR
              </DialogTitle>
            </DialogHeader>
            {selected && (
              <Card className="shadow-lg rounded-2xl border-0">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                  <div className="text-center">
                    <div className="font-bold text-base text-foreground">{selected.name}</div>
                    {selected.phone && <div className="text-sm text-muted-foreground">{selected.phone}</div>}
                    <div className="text-xs text-primary font-mono mt-1">Group: {selected.groupCode} {selected.age ? `• Age: ${selected.age}` : ''}</div>
                  </div>
                  <div id="selected-qr-wrapper" className="my-2 rounded-2xl bg-white p-3 shadow-soft border w-fit mx-auto">
                    <QRCode value={selected.payload} size={180} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    <Button className="w-full" variant="outline" onClick={copySelected}>
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                    <Button className="w-full" variant="outline" onClick={handleShareSelected}>
                      <Share2 className="h-4 w-4 mr-1" /> Share
                    </Button>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handlePrintSelected}>
                      <Printer className="h-4 w-4 mr-1" /> Print / <Download className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AddMembers;


