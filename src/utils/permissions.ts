// src/utils/permissions.ts
import { Geolocation } from "@capacitor/geolocation";
import { Camera } from "@capacitor/camera";

type PermissionResult = {
  locationGranted: boolean;
  cameraGranted: boolean;
};

// LocalStorage keys for caching
const LS_KEYS = {
  location: "perm_location_granted_v1",
  camera: "perm_camera_granted_v1",
  lastPromptAt: "perm_last_prompt_at_v1",
};

function readBool(key: string): boolean | null {
  try {
    const v = localStorage.getItem(key);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {}
  return null;
}

function writeBool(key: string, val: boolean) {
  try {
    localStorage.setItem(key, val ? "1" : "0");
  } catch {}
}

export async function requestAppPermissions(): Promise<PermissionResult> {
  // Read cached values first to avoid repeat prompts
  let cachedLocation = readBool(LS_KEYS.location);
  let cachedCamera = readBool(LS_KEYS.camera);

  let locationGranted = !!cachedLocation;
  let cameraGranted = !!cachedCamera;

  // Request location only if not granted yet
  if (cachedLocation === null || cachedLocation === false) {
    try {
      const locStatus = await Geolocation.requestPermissions();
      locationGranted =
        (locStatus as any)?.locations === "granted" ||
        (locStatus as any)?.location === "granted";
      if (!locationGranted) {
        // Fallback for WebView
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve(true),
              (err) => reject(err),
              { enableHighAccuracy: true, timeout: 10000 }
            );
          });
          locationGranted = true;
        } catch {
          locationGranted = false;
        }
      }
    } catch (e) {
      console.warn("Location permission request failed", e);
    } finally {
      writeBool(LS_KEYS.location, !!locationGranted);
      try {
        localStorage.setItem(LS_KEYS.lastPromptAt, String(Date.now()));
      } catch {}
    }
  }

  // Do NOT proactively request camera here; request only when scanner opens
  // Preserve any existing cached result so callers can know if previously granted
  if (cachedCamera === null) {
    cameraGranted = false; // unknown → treat as not granted yet
    writeBool(LS_KEYS.camera, false);
  }

  return { locationGranted, cameraGranted };
}

// Explicit camera permission request to be used by QR modules only when needed
export async function ensureCameraPermission(): Promise<boolean> {
  const cached = readBool(LS_KEYS.camera);
  if (cached === true) return true;
  try {
    const camStatus = await Camera.requestPermissions();
    const granted =
      (camStatus as any)?.camera === "granted" ||
      (camStatus as any)?.photos === "granted";
    if (!granted && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((t) => t.stop());
        writeBool(LS_KEYS.camera, true);
        return true;
      } catch {}
    }
    writeBool(LS_KEYS.camera, !!granted);
    return !!granted;
  } catch (e) {
    console.warn("Camera permission request failed", e);
    writeBool(LS_KEYS.camera, false);
    return false;
  }
}
