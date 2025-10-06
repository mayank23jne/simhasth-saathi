import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { encodeQR } from "@/lib/qr";

const TestQRGenerator: React.FC = () => {
  // Create a test member card QR
  const testMemberQR = useMemo(() => {
    return encodeQR({
      v: 1,
      kind: "member_card",
      id: "test_user_123",
      name: "राम शर्मा",
      groupCode: "GRP001",
      phone: "+91-9876543210",
      age: 25,
      latitude: 23.1765,
      longitude: 75.7884,
      locationName: "उज्जैन, मध्य प्रदेश",
      address: "राम घाट, उज्जैन",
    });
  }, []);

  // Create a test group invite QR
  const testGroupQR = useMemo(() => {
    return encodeQR({
      v: 1,
      kind: "group_invite",
      groupCode: "GRP001",
    });
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("QR Data copied to clipboard!");
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-center">Test QR Codes</h2>

      {/* Member Card QR */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Member Card QR</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={testMemberQR} size={200} />
            </div>
            <Button onClick={() => handleCopy(testMemberQR)}>
              Copy QR Data
            </Button>
            <div className="text-xs text-gray-600 max-w-md text-center">
              <p>This QR contains member information:</p>
              <p>Name: राम शर्मा</p>
              <p>Phone: +91-9876543210</p>
              <p>Group: GRP001</p>
              <p>Location: उज्जैन, मध्य प्रदेश</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group Invite QR */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Group Invite QR</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={testGroupQR} size={200} />
            </div>
            <Button onClick={() => handleCopy(testGroupQR)}>
              Copy QR Data
            </Button>
            <div className="text-xs text-gray-600 max-w-md text-center">
              <p>This QR contains group invite:</p>
              <p>Group Code: GRP001</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Text QR */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Simple Text QR</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCode
                value="Hello World! This is a simple QR code."
                size={200}
              />
            </div>
            <Button
              onClick={() =>
                handleCopy("Hello World! This is a simple QR code.")
              }
            >
              Copy Text
            </Button>
            <div className="text-xs text-gray-600 max-w-md text-center">
              <p>
                This QR contains simple text: "Hello World! This is a simple QR
                code."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestQRGenerator;
