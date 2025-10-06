import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tryParseQR } from "@/lib/qr";

const QRHandlerWrapper: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle URL-based QR data
    const handleURLQR = () => {
      const urlParams = new URLSearchParams(location.search);
      const qrData = urlParams.get("qr") || urlParams.get("data");

      if (qrData) {
        console.log("QRHandlerWrapper - URL data:", qrData);
        handleQRData(decodeURIComponent(qrData));
      }
    };

    // Handle hash-based QR data
    const handleHashQR = () => {
      if (location.hash && location.hash !== "#") {
        const hashData = location.hash.substring(1);
        console.log("QRHandlerWrapper - Hash data:", hashData);
        handleQRData(decodeURIComponent(hashData));
      }
    };

    // Handle clipboard-based QR data (for external scanners)
    const handleClipboardQR = async () => {
      try {
        const clipboardText = await navigator.clipboard.readText();

        // Check if clipboard contains QR-like data
        if (
          clipboardText &&
          (clipboardText.includes('"kind":') ||
            clipboardText.includes('"v":') ||
            clipboardText.includes('"groupCode":') ||
            clipboardText.includes('"name":') ||
            clipboardText.includes('"member_card"') ||
            clipboardText.includes('"group_invite"'))
        ) {
          console.log("QRHandlerWrapper - Clipboard data:", clipboardText);
          handleQRData(clipboardText);
        }
      } catch (error) {
        console.log("QRHandlerWrapper - Clipboard not accessible:", error);
      }
    };

    // Handle storage events (when QR data is stored in localStorage)
    const handleStorageQR = (event: StorageEvent) => {
      if (event.key === "qrScanData" && event.newValue) {
        console.log("QRHandlerWrapper - Storage data:", event.newValue);
        try {
          const qrData = JSON.parse(event.newValue);
          if (qrData.text) {
            handleQRData(qrData.text);
          }
        } catch (error) {
          console.error("QRHandlerWrapper - Storage parse error:", error);
        }
      }
    };

    // Handle custom events (for external QR scanners)
    const handleCustomQR = (event: CustomEvent) => {
      console.log("QRHandlerWrapper - Custom event:", event.detail);
      if (event.detail && event.detail.qrData) {
        handleQRData(event.detail.qrData);
      }
    };

    const handleQRData = (qrText: string) => {
      console.log("QRHandlerWrapper - Processing QR data:", qrText);

      try {
        const parsed = tryParseQR(qrText);

        if (parsed) {
          console.log("QRHandlerWrapper - Parsed data:", parsed);

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

          console.log("QRHandlerWrapper - Mapped data:", mappedData);
          navigate("/qr-result", { state: { scanData: mappedData } });
          return;
        }

        // Raw text fallback
        console.log("QRHandlerWrapper - Raw text:", qrText);
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
        console.error("QRHandlerWrapper - Error:", error);
        navigate("/qr-result", {
          state: {
            scanData: {
              type: "raw",
              text: qrText,
              ts: Date.now(),
            },
          },
        });
      }
    };

    // Check for URL parameters
    handleURLQR();

    // Check for hash data
    handleHashQR();

    // Check clipboard after a short delay (to allow app to load)
    const clipboardTimer = setTimeout(handleClipboardQR, 1000);

    // Add event listeners
    window.addEventListener("qr-scanned", handleCustomQR as EventListener);
    window.addEventListener("storage", handleStorageQR);

    // Cleanup
    return () => {
      clearTimeout(clipboardTimer);
      window.removeEventListener("qr-scanned", handleCustomQR as EventListener);
      window.removeEventListener("storage", handleStorageQR);
    };
  }, [location, navigate]);

  return null;
};

export default QRHandlerWrapper;
