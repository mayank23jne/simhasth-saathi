import React, { useEffect } from "react";
import { useQRHandler } from "@/hooks/useQRHandler";

const GlobalQRHandler: React.FC = () => {
  const { handleQRData } = useQRHandler();

  useEffect(() => {
    // Handle URL-based QR data (when app is opened via QR scan)
    const handleURLQR = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const qrData = urlParams.get("qr") || urlParams.get("data");

      if (qrData) {
        console.log("Global QR Handler - URL data:", qrData);
        handleQRData(decodeURIComponent(qrData));
      }
    };

    // Handle clipboard-based QR data (when QR is copied and app is opened)
    const handleClipboardQR = async () => {
      try {
        const clipboardText = await navigator.clipboard.readText();

        // Check if clipboard contains QR-like data
        if (
          clipboardText &&
          (clipboardText.includes('"kind":') ||
            clipboardText.includes('"v":') ||
            clipboardText.includes('"groupCode":') ||
            clipboardText.includes('"name":'))
        ) {
          console.log("Global QR Handler - Clipboard data:", clipboardText);
          handleQRData(clipboardText);
        }
      } catch (error) {
        // Clipboard access denied or not available
        console.log("Global QR Handler - Clipboard not accessible");
      }
    };

    // Handle deep link QR data
    const handleDeepLink = () => {
      if (window.location.hash) {
        const hashData = window.location.hash.substring(1);
        if (hashData && hashData !== "#") {
          console.log("Global QR Handler - Hash data:", hashData);
          handleQRData(decodeURIComponent(hashData));
        }
      }
    };

    // Check for URL parameters
    handleURLQR();

    // Check for hash data
    handleDeepLink();

    // Check clipboard after a short delay (to allow app to load)
    const clipboardTimer = setTimeout(handleClipboardQR, 1000);

    // Listen for custom events (for external QR scanners)
    const handleCustomQR = (event: CustomEvent) => {
      console.log("Global QR Handler - Custom event:", event.detail);
      if (event.detail && event.detail.qrData) {
        handleQRData(event.detail.qrData);
      }
    };

    // Listen for storage events (when QR data is stored in localStorage)
    const handleStorageQR = (event: StorageEvent) => {
      if (event.key === "qrScanData" && event.newValue) {
        console.log("Global QR Handler - Storage data:", event.newValue);
        try {
          const qrData = JSON.parse(event.newValue);
          if (qrData.text) {
            handleQRData(qrData.text);
          }
        } catch (error) {
          console.error("Global QR Handler - Storage parse error:", error);
        }
      }
    };

    // Add event listeners
    window.addEventListener("qr-scanned", handleCustomQR as EventListener);
    window.addEventListener("storage", handleStorageQR);

    // Cleanup
    return () => {
      clearTimeout(clipboardTimer);
      window.removeEventListener("qr-scanned", handleCustomQR as EventListener);
      window.removeEventListener("storage", handleStorageQR);
    };
  }, [handleQRData]);

  // This component doesn't render anything
  return null;
};

export default GlobalQRHandler;
