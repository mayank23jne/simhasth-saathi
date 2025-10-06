// Utility functions for external QR scanner integration

export interface ExternalQRData {
  text: string;
  timestamp: number;
  source: string;
}

// Function to handle QR data from external scanners
export const handleExternalQR = (
  qrText: string,
  source: string = "external"
) => {
  console.log(`External QR Handler - ${source}:`, qrText);

  // Store in localStorage for GlobalQRHandler to pick up
  try {
    const qrData: ExternalQRData = {
      text: qrText,
      timestamp: Date.now(),
      source: source,
    };

    localStorage.setItem("qrScanData", JSON.stringify(qrData));

    // Also dispatch custom event
    const event = new CustomEvent("qr-scanned", {
      detail: { qrData: qrText, source: source },
    });
    window.dispatchEvent(event);

    console.log("External QR Handler - Data stored and event dispatched");
  } catch (error) {
    console.error("External QR Handler - Error storing data:", error);
  }
};

// Function to create QR scanner URLs
export const createQRScannerURL = (baseURL: string, qrData: string) => {
  const encodedData = encodeURIComponent(qrData);
  return `${baseURL}?qr=${encodedData}`;
};

// Function to create deep link URLs
export const createDeepLinkURL = (baseURL: string, qrData: string) => {
  const encodedData = encodeURIComponent(qrData);
  return `${baseURL}#${encodedData}`;
};

// Function to detect if app was opened via QR scan
export const detectQRScan = (): string | null => {
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const qrParam = urlParams.get("qr") || urlParams.get("data");
  if (qrParam) {
    return decodeURIComponent(qrParam);
  }

  // Check hash
  if (window.location.hash && window.location.hash !== "#") {
    return decodeURIComponent(window.location.hash.substring(1));
  }

  // Check localStorage
  try {
    const stored = localStorage.getItem("qrScanData");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.text && Date.now() - data.timestamp < 30000) {
        // 30 seconds
        return data.text;
      }
    }
  } catch (error) {
    console.error("QR detection error:", error);
  }

  return null;
};

// Function to clear QR scan data
export const clearQRScanData = () => {
  localStorage.removeItem("qrScanData");
  // Clear URL parameters
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.searchParams.delete("qr");
    url.searchParams.delete("data");
    url.hash = "";
    window.history.replaceState({}, "", url.toString());
  }
};
