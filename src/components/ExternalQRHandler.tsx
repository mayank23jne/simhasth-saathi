import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tryParseQR } from "@/lib/qr";

const ExternalQRHandler: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Function to handle external QR data
    const handleExternalQRData = (qrText: string) => {
      if (isProcessing) return;

      console.log("ExternalQRHandler - Processing QR data:", qrText);
      setIsProcessing(true);

      try {
        const parsed = tryParseQR(qrText);

        if (parsed) {
          console.log("ExternalQRHandler - Parsed data:", parsed);

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

          console.log("ExternalQRHandler - Mapped data:", mappedData);
          navigate("/qr-result", { state: { scanData: mappedData } });
          return;
        }

        // Raw text fallback
        console.log("ExternalQRHandler - Raw text:", qrText);
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
        console.error("ExternalQRHandler - Error:", error);
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

    // Listen for focus events (when app comes back from external scanner)
    const handleFocus = () => {
      console.log("ExternalQRHandler - App focused, checking for QR data");

      // Check if there's QR data in localStorage
      try {
        const stored = localStorage.getItem("qrScanData");
        if (stored) {
          const data = JSON.parse(stored);
          if (data.text && Date.now() - data.timestamp < 30000) {
            // 30 seconds
            console.log("ExternalQRHandler - Found stored QR data:", data.text);
            handleExternalQRData(data.text);
            localStorage.removeItem("qrScanData");
          }
        }
      } catch (error) {
        console.error("ExternalQRHandler - Error reading stored data:", error);
      }
    };

    // Listen for visibility change (when app becomes visible)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log(
          "ExternalQRHandler - App became visible, checking for QR data"
        );
        handleFocus();
      }
    };

    // Listen for custom events
    const handleCustomEvent = (event: CustomEvent) => {
      console.log("ExternalQRHandler - Custom event received:", event.detail);
      if (event.detail && event.detail.qrData) {
        handleExternalQRData(event.detail.qrData);
      }
    };

    // Add event listeners
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("qr-scanned", handleCustomEvent as EventListener);

    // Initial check
    handleFocus();

    // Cleanup
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(
        "qr-scanned",
        handleCustomEvent as EventListener
      );
    };
  }, [navigate, isProcessing]);

  return null;
};

export default ExternalQRHandler;
