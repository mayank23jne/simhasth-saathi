import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Phone,
  MapPin,
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Copy,
  Navigation,
  Home,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { detectQRScan, clearQRScanData } from "@/lib/externalQR";

interface QRScanData {
  type?: string;
  kind?: string;
  id?: string;
  name?: string;
  phone?: string;
  groupCode?: string;
  age?: number;
  details?: {
    latitude?: number;
    longitude?: number;
    locationName?: string;
    address?: string;
    age?: number;
  };
  ts?: number;
}

const QRScanResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scanData, setScanData] = useState<QRScanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get scan data from location state
    let data = location.state?.scanData;
    console.log("QRScanResult - Received data:", data);
    console.log("QRScanResult - Location state:", location.state);

    // If no data from location state, try to detect external QR
    if (!data) {
      const externalQR = detectQRScan();
      if (externalQR) {
        console.log("QRScanResult - External QR detected:", externalQR);
        // Try to parse external QR data
        try {
          const parsed = JSON.parse(externalQR);
          data = parsed;
        } catch {
          // If not JSON, treat as raw text
          data = { type: "raw", text: externalQR, ts: Date.now() };
        }
        // Clear the external QR data
        clearQRScanData();
      }
    }

    if (data) {
      setScanData(data);
    } else {
      console.log("QRScanResult - No scan data found");
    }
    setIsLoading(false);
  }, [location.state]);

  const handleCopyData = () => {
    if (scanData) {
      const dataString = JSON.stringify(scanData, null, 2);
      navigator.clipboard.writeText(dataString);
      toast.success("Data copied to clipboard!");
    }
  };

  const handleShare = async () => {
    if (scanData && navigator.share) {
      try {
        await navigator.share({
          title: `QR Scan Result - ${scanData.name || "Unknown"}`,
          text: `Name: ${scanData.name}\nGroup: ${scanData.groupCode}\nPhone: ${scanData.phone}`,
        });
        toast.success("Data shared!");
      } catch (error) {
        handleCopyData();
      }
    } else {
      handleCopyData();
    }
  };

  const handleJoinGroup = () => {
    if (scanData?.groupCode) {
      // Navigate to group join or add member functionality
      navigate("/members/add", {
        state: { groupCode: scanData.groupCode },
      });
    }
  };

  const handleViewOnMap = () => {
    if (scanData?.details?.latitude && scanData?.details?.longitude) {
      navigate("/map", {
        state: {
          center: {
            lat: scanData.details.latitude,
            lng: scanData.details.longitude,
          },
          markers: [
            {
              id: scanData.id || "scanned-location",
              position: {
                lat: scanData.details.latitude,
                lng: scanData.details.longitude,
              },
              label: scanData.name || "Scanned Location",
            },
          ],
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto p-8 text-center">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No QR Data Found
          </h2>
          <p className="text-gray-600 mb-6">
            Please scan a valid QR code to view information.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const isMemberCard =
    scanData.type === "member" || scanData.kind === "member_card";
  const isGroupInvite =
    scanData.type === "group_invite" || scanData.kind === "group_invite";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyData}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Profile Card */}
          {isMemberCard && (
            <Card className="overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-4 border-white/30">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                      {scanData.name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold">
                      {scanData.name || "Unknown Member"}
                    </h1>
                    {scanData.phone && (
                      <p className="text-blue-100 flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4" />
                        {scanData.phone}
                      </p>
                    )}
                    {scanData.details?.age && (
                      <p className="text-blue-100 flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" />
                        {scanData.details.age} years old
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scanData.groupCode && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Group Code</p>
                        <p className="font-mono font-bold text-blue-800">
                          {scanData.groupCode}
                        </p>
                      </div>
                    </div>
                  )}

                  {scanData.ts && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="font-semibold text-green-800">
                          {formatDistanceToNow(new Date(scanData.ts), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Group Invite Card */}
          {isGroupInvite && (
            <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h1 className="text-3xl font-bold mb-2">Group Invitation</h1>
                <p className="text-green-100 mb-6">
                  You've been invited to join a group!
                </p>
                <div className="bg-white/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-100 mb-2">Group Code</p>
                  <p className="text-2xl font-mono font-bold">
                    {scanData.groupCode}
                  </p>
                </div>
                <Button
                  onClick={handleJoinGroup}
                  className="bg-white text-green-600 hover:bg-green-50 font-semibold px-8 py-3"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Join Group
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Location Information */}
          {scanData.details &&
            (scanData.details.latitude || scanData.details.locationName) && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-6 w-6 text-red-500" />
                    <h2 className="text-xl font-bold">Location Information</h2>
                  </div>

                  <div className="space-y-4">
                    {scanData.details.locationName && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Home className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">
                            {scanData.details.locationName}
                          </p>
                          {scanData.details.address && (
                            <p className="text-sm text-gray-600">
                              {scanData.details.address}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {scanData.details.latitude &&
                      scanData.details.longitude && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Navigation className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Coordinates</p>
                            <p className="font-mono text-sm">
                              {scanData.details.latitude.toFixed(6)},{" "}
                              {scanData.details.longitude.toFixed(6)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleViewOnMap}
                            className="ml-2"
                          >
                            View on Map
                          </Button>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Emergency Information */}
          {isMemberCard && (
            <Card className="shadow-lg border-0 bg-gradient-to-r from-red-500 to-pink-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Emergency Information</h2>
                </div>
                <p className="text-red-100 mb-4">
                  This QR code contains important information that can help in
                  emergency situations. Volunteers and emergency responders can
                  use this data to provide assistance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/20 rounded-lg p-3">
                    <p className="text-sm text-red-100">Contact</p>
                    <p className="font-semibold">
                      {scanData.phone || "Not available"}
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <p className="text-sm text-red-100">Group</p>
                    <p className="font-semibold">
                      {scanData.groupCode || "Not available"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Data (for debugging) */}
          <Card className="shadow-lg border-0 bg-gray-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Raw QR Data</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(scanData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRScanResult;
