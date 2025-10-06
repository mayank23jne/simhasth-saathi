// src/utils/permissions.ts
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';

type PermissionResult = {
  locationGranted: boolean;
  cameraGranted: boolean;
};

export async function requestAppPermissions(): Promise<PermissionResult> {
  let locationGranted = false;
  let cameraGranted = false;

  try {
    // Location (Capacitor)
    const locStatus = await Geolocation.requestPermissions();
    // locStatus may look like: { locations: 'granted' | 'denied' | 'prompt' }
    locationGranted = (locStatus as any)?.locations === 'granted' || (locStatus as any)?.location === 'granted';
  } catch (e) {
    console.warn('Location permission request failed', e);
    // fallback: try browser geolocation (for WebView)
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

  try {
    // Camera (Capacitor) - requests CAMERA permission
    const camStatus = await Camera.requestPermissions();
    // camStatus may have camera: 'granted' etc.
    cameraGranted = (camStatus as any)?.camera === 'granted' || (camStatus as any)?.photos === 'granted';
  } catch (e) {
    console.warn('Camera permission request failed', e);
    // fallback: try getUserMedia (WebView)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // stop tracks immediately
        stream.getTracks().forEach((t) => t.stop());
        cameraGranted = true;
      } catch {
        cameraGranted = false;
      }
    }
  }

  return { locationGranted, cameraGranted };
}
