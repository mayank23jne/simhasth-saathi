import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const QRTestButton: React.FC = () => {
  const navigate = useNavigate();

  const testMemberQR = () => {
    const memberData = {
      v: 1,
      kind: "member_card",
      id: "test_member_123",
      name: "Test User",
      phone: "+91-9876543210",
      groupCode: "TEST001",
      age: 25,
      latitude: 23.1765,
      longitude: 75.7884,
      locationName: "Test Location",
      address: "Test Address",
      ts: Date.now(),
    };

    navigate("/qr-result", { state: { scanData: memberData } });
  };

  const testGroupQR = () => {
    const groupData = {
      v: 1,
      kind: "group_invite",
      groupCode: "TEST001",
      ts: Date.now(),
    };

    navigate("/qr-result", { state: { scanData: groupData } });
  };

  const testSimpleText = () => {
    const textData = {
      type: "raw",
      text: "Hello World! This is a simple QR code.",
      ts: Date.now(),
    };

    navigate("/qr-result", { state: { scanData: textData } });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Quick QR Tests</h3>
      <div className="flex flex-col gap-2">
        <Button onClick={testMemberQR} size="sm">
          Test Member QR
        </Button>
        <Button onClick={testGroupQR} size="sm">
          Test Group QR
        </Button>
        <Button onClick={testSimpleText} size="sm">
          Test Simple Text
        </Button>
      </div>
    </div>
  );
};

export default QRTestButton;
