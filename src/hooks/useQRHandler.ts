import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tryParseQR } from "@/lib/qr";

export const useQRHandler = () => {
  const navigate = useNavigate();

  const handleQRData = useCallback(
    (qrText: string) => {
      console.log("Universal QR Handler - Received text:", qrText);

      try {
        // Try to parse as structured QR data
        const parsed = tryParseQR(qrText);

        if (parsed) {
          console.log("Universal QR Handler - Parsed data:", parsed);

          // Map to standard format
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
            // Unknown kind, pass through
            mappedData = {
              type: parsed.kind,
              kind: parsed.kind,
              ...parsed,
            };
          }

          console.log("Universal QR Handler - Mapped data:", mappedData);
          navigate("/qr-result", { state: { scanData: mappedData } });
          return;
        }

        // If not structured data, treat as raw text
        console.log("Universal QR Handler - Raw text:", qrText);
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
        console.error("Universal QR Handler - Error:", error);
        // Fallback to raw text
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
    },
    [navigate]
  );

  return { handleQRData };
};
