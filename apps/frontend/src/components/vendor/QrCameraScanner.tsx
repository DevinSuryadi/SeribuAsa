/**
 * QrCameraScanner
 * Wraps html5-qrcode to provide camera-based QR scanning as a React component.
 * Automatically starts scanning on mount and stops on unmount.
 */

import { useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrCameraScannerProps {
  /** Fired once when a QR code is successfully decoded */
  onScan: (result: string) => void;
  /** Fired if camera cannot be started or permission is denied */
  onError?: (err: string) => void;
  /** CSS class for the outer container */
  className?: string;
}

const SCANNER_ID = "qr-camera-region";

export function QrCameraScanner({ onScan, onError, className = "" }: QrCameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const runningRef = useRef(false);

  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  });

  const stop = useCallback(async () => {
    if (scannerRef.current && runningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore cleanup errors
      }
      runningRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Slight delay to ensure the DOM element is mounted
    const timer = setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) {
          onError?.("Tidak ada kamera yang ditemukan di perangkat ini");
          return;
        }

        // Prefer rear camera on mobile; first camera on desktop
        const rearCam = cameras.find(
          (c) =>
            c.label.toLowerCase().includes("back") ||
            c.label.toLowerCase().includes("rear") ||
            c.label.toLowerCase().includes("environment")
        );
        const cameraId = rearCam?.id ?? cameras[0].id;

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.333334,
            disableFlip: false,
          },
          (decodedText) => {
            onScanRef.current(decodedText);
          },
          () => {
            // QR not found yet — suppress continuous "not found" errors
          }
        );
        runningRef.current = true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.toLowerCase().includes("permission") ||
          msg.toLowerCase().includes("denied") ||
          msg.toLowerCase().includes("notallowed")
        ) {
          onError?.("Akses kamera ditolak. Mohon izinkan akses kamera di browser Anda.");
        } else {
          onError?.(msg || "Gagal memulai kamera");
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      void stop();
    };
  }, [stop, onError]);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black ${className}`}>
      {/* html5-qrcode mounts video into this element */}
      <div id={SCANNER_ID} className="w-full" />

      {/* Scan-frame overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-52 w-52">
          {/* Corner brackets */}
          {[
            "top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
            "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
            "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
            "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl",
          ].map((cls, i) => (
            <span
              key={i}
              className={`absolute h-8 w-8 border-emerald-400 ${cls}`}
            />
          ))}

          {/* Scanning line animation */}
          <div className="absolute inset-x-2 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)] animate-scan-line" />
        </div>
      </div>
    </div>
  );
}
