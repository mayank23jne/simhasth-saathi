import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { tryParseQR } from "@/lib/qr";

const ManualQRInput: React.FC = () => {
  const navigate = useNavigate();
  const [qrText, setQrText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessQR = async () => {
    if (!qrText.trim()) return;

    setIsProcessing(true);
    console.log("ManualQRInput - Processing QR data:", qrText);

    try {
      const parsed = tryParseQR(qrText);

      if (parsed) {
        console.log("ManualQRInput - Parsed data:", parsed);

        let mappedData: any = null;

        if (parsed.kind === "member_card") {
          mappedData = {
            type: "member",
            kind: "member_card",
            id: parsed.id,
            name: parsed.name || "Member",
            phone: parsed.phone,
            groupCode: parsed.groupCode,
            age: parsed.age,
            details: {
              latitude: parsed.latitude,
              longitude: parsed.longitude,
              locationName: parsed.locationName,
              address: parsed.address,
              age: parsed.age,
            },
            ts: parsed.ts,
          };
        } else if (parsed.kind === "group_invite") {
          mappedData = {
            type: "group_invite",
            kind: "group_invite",
            groupCode: parsed.groupCode,
            ts: parsed.ts,
          };
        } else {
          mappedData = {
            type: parsed.kind,
            kind: parsed.kind,
            ...parsed,
          };
        }

        console.log("ManualQRInput - Mapped data:", mappedData);
        navigate("/qr-result", { state: { scanData: mappedData } });
        return;
      }

      // Raw text fallback
      console.log("ManualQRInput - Raw text:", qrText);
      navigate("/qr-result", {
        state: {
          scanData: {
            type: "raw",
            text: qrText,
            ts: Date.now(),
          },
        },
      });
    } catch (error) {
      console.error("ManualQRInput - Error:", error);
      navigate("/qr-result", {
        state: {
          scanData: {
            type: "raw",
            text: qrText,
            ts: Date.now(),
          },
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setQrText(clipboardText);
    } catch (error) {
      console.error("ManualQRInput - Clipboard access denied:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual QR Data Input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">QR Data (JSON or Text):</label>
          <Textarea
            value={qrText}
            onChange={(e) => setQrText(e.target.value)}
            placeholder="Paste your QR data here..."
            className="mt-1"
            rows={6}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleProcessQR}
            disabled={!qrText.trim() || isProcessing}
            className="flex-1"
          >
            {isProcessing ? "Processing..." : "Process QR Data"}
          </Button>

          <Button onClick={handlePasteFromClipboard} variant="outline">
            Paste from Clipboard
          </Button>
        </div>

        <div className="text-xs text-gray-600">
          <p>You can paste QR data from:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>External QR scanner apps</li>
            <li>Copied JSON data</li>
            <li>Raw text from QR codes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualQRInput;
