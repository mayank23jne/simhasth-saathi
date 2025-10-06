import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Smartphone, Globe } from "lucide-react";
import { handleExternalQR } from "@/lib/externalQR";

const QRTestGuide: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const testExternalQR = (qrData: string, source: string) => {
    try {
      handleExternalQR(qrData, source);
      addTestResult(
        `External QR from ${source} - Data: ${qrData.substring(0, 50)}...`
      );
    } catch (error) {
      addTestResult(`Error testing ${source}: ${error}`);
    }
  };

  const testMemberQR = () => {
    const memberData = JSON.stringify({
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
    });
    testExternalQR(memberData, "Test Member QR");
  };

  const testGroupQR = () => {
    const groupData = JSON.stringify({
      v: 1,
      kind: "group_invite",
      groupCode: "TEST001",
      ts: Date.now(),
    });
    testExternalQR(groupData, "Test Group QR");
  };

  const testSimpleText = () => {
    testExternalQR("Hello World! This is a simple QR code.", "Simple Text");
  };

  const testURLQR = () => {
    const url = `${window.location.origin}/qr-result?qr=${encodeURIComponent(
      JSON.stringify({
        v: 1,
        kind: "member_card",
        id: "url_test_123",
        name: "URL Test User",
        phone: "+91-1234567890",
        groupCode: "URL001",
      })
    )}`;

    navigator.clipboard.writeText(url);
    addTestResult(`URL copied to clipboard: ${url}`);
  };

  const testDeepLink = () => {
    const deepLink = `${window.location.origin}/qr-result#${encodeURIComponent(
      JSON.stringify({
        v: 1,
        kind: "group_invite",
        groupCode: "DEEP001",
      })
    )}`;

    navigator.clipboard.writeText(deepLink);
    addTestResult(`Deep link copied to clipboard: ${deepLink}`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            QR Scanner Integration Test Guide
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={testMemberQR} className="h-12">
                Test Member QR
              </Button>
              <Button onClick={testGroupQR} className="h-12">
                Test Group QR
              </Button>
              <Button onClick={testSimpleText} className="h-12">
                Test Simple Text
              </Button>
              <Button onClick={testURLQR} className="h-12">
                <ExternalLink className="h-4 w-4 mr-2" />
                Test URL QR
              </Button>
              <Button onClick={testDeepLink} className="h-12">
                <Globe className="h-4 w-4 mr-2" />
                Test Deep Link
              </Button>
              <Button onClick={clearResults} variant="outline" className="h-12">
                Clear Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">
                No test results yet. Click buttons above to test.
              </p>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                >
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{result}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            How to Test with External Scanners
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold">1. Built-in Camera Apps:</h4>
              <p>• iPhone: Use Camera app to scan QR codes</p>
              <p>• Android: Use Google Lens or Camera app</p>
              <p>• The app will automatically detect and handle the QR data</p>
            </div>

            <div>
              <h4 className="font-semibold">2. Third-party QR Scanners:</h4>
              <p>• Any QR scanner app that can open URLs</p>
              <p>• The app will receive the QR data via URL parameters</p>
            </div>

            <div>
              <h4 className="font-semibold">3. Web-based Scanners:</h4>
              <p>• Online QR scanners that can redirect to your app</p>
              <p>• Use the URL QR test to generate test URLs</p>
            </div>

            <div>
              <h4 className="font-semibold">4. Manual Testing:</h4>
              <p>• Copy QR data to clipboard</p>
              <p>• Open the app - it will detect clipboard data</p>
              <p>• Use the test buttons above to simulate external scans</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRTestGuide;
