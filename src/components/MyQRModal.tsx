import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Share2, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { encodeQR } from "@/lib/qr";
import { getSimpleLocation } from "@/lib/location";

interface MyQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    groupCode?: string;
    phone?: string;
    avatarUrl?: string;
  };
}

const MyQRModal: React.FC<MyQRModalProps> = ({ isOpen, onClose, user }) => {
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationName, setLocationName] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    getSimpleLocation({
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 8000,
    })
      .then((loc) => {
        if (!mounted || !loc) return;
        setLatitude(loc.latitude);
        setLongitude(loc.longitude);
        setLocationName(loc.locationName);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Prepare standardized member_card QR (offline-friendly JSON)
  const qrData = useMemo(
    () =>
      encodeQR({
        v: 1,
        kind: "member_card",
        id: user.id,
        name: user.name,
        groupCode: user.groupCode,
        phone: user.phone,
        latitude,
        longitude,
        locationName,
      }),
    [user, latitude, longitude, locationName]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(qrData);
    toast.success("QR data copied!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Simhastha Saathi QR",
          text: qrData,
        });
        toast.success("QR data shared!");
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs w-full p-0 rounded-2xl shadow-2xl">
        <DialogHeader className="p-[7px]">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5" />
            My QR Code
          </DialogTitle>
        </DialogHeader>
        <Card className="shadow-lg rounded-2xl border-0">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            {/* <Avatar className="h-16 w-16 mb-2">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} />
              ) : (
                <AvatarFallback>{user.name?.[0] || '?'}</AvatarFallback>
              )}
            </Avatar> */}
            <div className="text-center">
              <div className="font-bold text-base text-foreground">
                {user.name}
              </div>
              {user.phone && (
                <div className="text-sm text-muted-foreground">
                  {user.phone}
                </div>
              )}
              {user.groupCode && (
                <div className="text-xs text-primary font-mono mt-1">
                  Group: {user.groupCode}
                </div>
              )}
            </div>
            <div className="my-2 rounded-xl bg-white p-2 shadow-inner border w-fit mx-auto">
              <QRCode value={qrData} size={160} />
            </div>
            {latitude !== undefined && longitude !== undefined && (
              <div className="text-[11px] text-muted-foreground text-center -mt-2">
                {locationName
                  ? `${locationName}`
                  : `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`}
              </div>
            )}
            <div className="flex gap-2 w-full">
              <Button className="flex-1" variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-1" /> Copy QR Data
              </Button>
              <Button className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" /> Share QR
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center mt-2">
              <span>
                Show this QR to others to let them join your group.
                <br />
                Volunteers/Police can scan to access emergency info.
                <br />
                <span className="italic">
                  Works offline – no internet required.
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default MyQRModal;
