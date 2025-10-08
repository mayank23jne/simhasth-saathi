import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/context/TranslationContext";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "react-qr-barcode-scanner";
import { tryParseQR } from "@/lib/qr";
import { authService } from "@/services/authService";
import { useAppStore } from "@/store/appStore";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: any) => void;
  mode?: "member" | "lost_found" | "general";
}

export const QRScanner: React.FC<QRScannerProps> = ({
  isOpen,
  onClose,
  onScanResult,
  mode = "general",
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stopStream, setStopStream] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [torch, setTorch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHasScanned(false);
      setStopStream(false);
      setCameraError(null);
      setFacingMode("environment");
    } else {
      setStopStream(true);
    }
  }, [isOpen]);

  const close = useCallback(() => {
    setStopStream(true);
    setTimeout(() => onClose(), 0);
  }, [onClose]);

  const mapParsedToResult = (parsed: any): any => {
    if (!parsed || typeof parsed !== "object") return null;
    // Map standardized QR payloads to legacy shapes expected by screens
    if (parsed.kind === "member_card") {
      return {
        id: parsed.id,
        name: parsed.name || "Member",
        phone: parsed.phone,
        groupCode: parsed.groupCode,
        type: "member",
        details: {
          ...(typeof parsed.age === "number" ? { age: parsed.age } : {}),
          ...(typeof parsed.latitude === "number"
            ? { latitude: parsed.latitude }
            : {}),
          ...(typeof parsed.longitude === "number"
            ? { longitude: parsed.longitude }
            : {}),
          ...(typeof parsed.locationName === "string"
            ? { locationName: parsed.locationName }
            : {}),
          ...(typeof parsed.address === "string"
            ? { address: parsed.address }
            : {}),
        },
      };
    }
    if (parsed.kind === "group_invite") {
      return {
        type: "group_invite",
        groupCode: parsed.groupCode,
      };
    }
    return { type: parsed.kind, ...parsed };
  };

  const onScanUpdate = useCallback(
    (err: any, result: any) => {
      if (hasScanned) return;
      if (err) {
        // ignore transient decode errors
        return;
      }
      if (!result) return;
      // Extract text for different library versions
      let text: string = "";
      try {
        // @ts-ignore
        text =
          result?.text ??
          (typeof result?.getText === "function" ? result.getText() : "");
      } catch {}
      if (!text) return;

      const parsed = tryParseQR(text);
      let mapped = parsed ? mapParsedToResult(parsed) : null;

      // Optional mode filtering
      if (
        mode === "member" &&
        mapped &&
        mapped.type &&
        mapped.type !== "member"
      ) {
        mapped = null;
      }
      if (
        mode === "lost_found" &&
        mapped &&
        mapped.type &&
        mapped.type !== "lost_person"
      ) {
        mapped = null;
      }

      if (mapped) {
        console.log("QRScanner - Mapped data:", mapped);
        setHasScanned(true);
        try {
          if (navigator.vibrate) navigator.vibrate(15);
        } catch {}
        toast.success("QR स्कैन हुआ");
        console.info(mapped, "mapped 123456");
        // Special case: group invite → join existing group, navigate only on success
        if (mapped.type === "group_invite" && mapped.groupCode) {
          (async () => {
            try {
              const code =
                String(mapped.groupCode) ||
                localStorage.getItem("groupCode") ||
                "";
              const userId = (
                localStorage.getItem("userId") ||
                useAppStore.getState().userId ||
                ""
              ).toString();
              if (!userId) throw new Error("Not logged in");
              await authService.joinExistingGroup({
                userId,
                groupId:
                  code ||
                  localStorage.getItem("groupCode") ||
                  code ||
                  localStorage.getItem("groupId"),
              });
              try {
                useAppStore.getState().setGroup(code);
              } catch {}
              onScanResult(mapped);
              navigate("/dashboard");
            } catch (e: any) {
              console.error("joinExistingGroup failed:", e);
              toast.error(e?.message || "Failed to join group");
            } finally {
              close();
            }
          })();
        } else {
          // Default behavior for other QR kinds
          console.log(
            "QRScanner - Navigating to /qr-result with data:",
            mapped
          );
          close();
          navigate("/qr-result", { state: { scanData: mapped } });
          onScanResult(mapped);
        }
      } else {
        console.log("QRScanner - Raw text:", text);
        // Fallback: pass raw text if not mapped
        setHasScanned(true);
        try {
          if (navigator.vibrate) navigator.vibrate(15);
        } catch {}
        toast.success("QR स्कैन हुआ");
        close();
        // Navigate to landing page with raw text
        console.log(
          "QRScanner - Navigating to /qr-result with raw text:",
          text
        );
        navigate("/qr-result", {
          state: { scanData: { type: "raw", text: text } },
        });
        onScanResult(text);
      }
    },
    [hasScanned, close, onScanResult, mode, navigate]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        const url = URL.createObjectURL(file);
        try {
          const ZX = await import("@zxing/library");
          const ReaderCtor: any =
            (ZX as any).BrowserQRCodeReader ||
            (ZX as any).BrowserMultiFormatReader;
          const reader = new ReaderCtor();
          const result = await reader.decodeFromImageUrl(url);
          const text =
            typeof result?.getText === "function"
              ? result.getText()
              : result?.text || "";
          if (text) {
            const parsed = tryParseQR(text);
            let mapped = parsed ? mapParsedToResult(parsed) : null;
            if (
              mode === "member" &&
              mapped &&
              mapped.type &&
              mapped.type !== "member"
            )
              mapped = null;
            if (
              mode === "lost_found" &&
              mapped &&
              mapped.type &&
              mapped.type !== "lost_person"
            )
              mapped = null;
            if (mapped) {
              console.log("QRScanner File - Mapped data:", mapped);
              setHasScanned(true);
              try {
                if (navigator.vibrate) navigator.vibrate(15);
              } catch {}
              toast.success("QR स्कैन हुआ");
              console.info(mapped, "mapped 123456  789456");
              if (mapped.type === "group_invite" && mapped.groupCode) {
                try {
                  const code =
                    String(mapped.groupCode) ||
                    localStorage.getItem("groupCode") ||
                    "";
                  const userId = (
                    localStorage.getItem("userId") ||
                    useAppStore.getState().userId ||
                    ""
                  ).toString();
                  if (!userId) throw new Error("Not logged in");
                  await authService.joinExistingGroup({
                    userId,
                    groupId: code,
                  });
                  try {
                    useAppStore.getState().setGroup(code);
                  } catch {}
                  onScanResult(mapped);
                  navigate("/dashboard");
                } catch (e: any) {
                  console.error("joinExistingGroup failed:", e);
                  toast.error(e?.message || "Failed to join group");
                } finally {
                  close();
                }
              } else {
                close();
                navigate("/qr-result", { state: { scanData: mapped } });
                onScanResult(mapped);
              }
            } else {
              console.log("QRScanner File - Raw text:", text);
              setHasScanned(true);
              try {
                if (navigator.vibrate) navigator.vibrate(15);
              } catch {}
              toast.success("QR स्कैन हुआ");
              close();
              navigate("/qr-result", {
                state: { scanData: { type: "raw", text: text } },
              });
              onScanResult(text);
            }
          } else {
            toast.error("Unable to read QR from image");
          }
        } catch (err) {
          toast.error("Failed to decode image");
        } finally {
          URL.revokeObjectURL(url);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      } catch {}
    },
    [mode, close, onScanResult, navigate]
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>{t("scanQR") || "QR स्कैन करें"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden border bg-black/5 relative">
            <div className="absolute right-2 top-2 z-10 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setFacingMode((m) =>
                    m === "environment" ? "user" : "environment"
                  )
                }
              >
                {facingMode === "environment" ? "Flip Camera" : "Rear Camera"}
              </Button>
              <Button
                size="sm"
                variant={torch ? "default" : "outline"}
                onClick={() => setTorch((t) => !t)}
              >
                {torch ? "Torch On" : "Torch"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Gallery
              </Button>
            </div>
            {cameraError ? (
              <div className="p-4 text-sm text-destructive">
                {t("cameraError") ||
                  "Camera error. Please allow camera permission or enter code manually"}
              </div>
            ) : (
              <BarcodeScanner
                onUpdate={onScanUpdate}
                stopStream={stopStream}
                width={"100%"}
                height={300}
                // Prefer rear camera; toggle available
                facingMode={facingMode}
                videoConstraints={{ facingMode: { ideal: facingMode } }}
                torch={torch}
                onError={(e: any) =>
                  setCameraError(String(e?.message || e) || "Camera error")
                }
              />
            )}
          </div>
          <Button variant="outline" onClick={close} className="w-full">
            {t("back") || "Back"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(QRScanner);
