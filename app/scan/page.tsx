"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";

// Dynamically import TFJS and BlazeFace
let tf: any;
let blazeface: any;

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const setScanResult = useUserStore((state) => state.setScanResult);
  
  // State for detector
  const detectorRef = useRef<any>(null);

  // 1. Setup Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setPermissionGranted(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Camera permission denied or not available.");
      }
    };
    startCamera();

    return () => {
      // stop tracks
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Load Model (Dynamic Import)
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Dynamic imports to ensure client-side only execution
        tf = await import("@tensorflow/tfjs");
        blazeface = await import("@tensorflow-models/blazeface");
        await import("@tensorflow/tfjs-backend-webgl");

        await tf.ready();
        await tf.setBackend('webgl');

        // Load BlazeFace
        detectorRef.current = await blazeface.load();
        setIsLoadingModel(false);
      } catch (err) {
        console.error("Model load error:", err);
        setError("Failed to load AI models. Please refresh.");
      }
    };
    if (permissionGranted) {
        loadModels();
    }
  }, [permissionGranted]);

  // 3. Detection Loop
  useEffect(() => {
    if (!permissionGranted || isLoadingModel || !detectorRef.current) return;

    let animationId: number;
    
    const detect = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        detectorRef.current && 
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        // Draw video to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const returnTensors = false;
          const predictions = await detectorRef.current.estimateFaces(video, returnTensors);

          if (predictions.length > 0) {
            const face = predictions[0];
            const start = face.topLeft as [number, number];
            const end = face.bottomRight as [number, number];
            const width = end[0] - start[0];
            // const height = end[1] - start[1];

            // Draw stylized corner brackets instead of full rect
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 4;
            const lineLen = 20;

            // Top-Left
            ctx.beginPath();
            ctx.moveTo(start[0], start[1] + lineLen);
            ctx.lineTo(start[0], start[1]);
            ctx.lineTo(start[0] + lineLen, start[1]);
            ctx.stroke();

            // Top-Right
            ctx.beginPath();
            ctx.moveTo(end[0] - lineLen, start[1]);
            ctx.lineTo(end[0], start[1]);
            ctx.lineTo(end[0], start[1] + lineLen);
            ctx.stroke();

            // Bottom-Left
            ctx.beginPath();
            ctx.moveTo(start[0], end[1] - lineLen);
            ctx.lineTo(start[0], end[1]);
            ctx.lineTo(start[0] + lineLen, end[1]);
            ctx.stroke();

            // Bottom-Right
            ctx.beginPath();
            ctx.moveTo(end[0] - lineLen, end[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.lineTo(end[0], end[1] - lineLen);
            ctx.stroke();
            
            // Simple heuristic: face must be big enough
            if (width > 100) {
               setScanning(true);
               // Simulate "good frames" accumulation
               setProgress((prev) => {
                 const next = prev + 1; // Increment progress slower for effect
                 if (next >= 100) {
                   // Done!
                   cancelAnimationFrame(animationId);
                   // Use setTimeout to allow the last frame to render before handling complete
                   setTimeout(handleScanComplete, 0);
                   return 100;
                 }
                 return next;
               });
            } else {
                setScanning(false);
                // Reset if face too small
                setProgress((prev) => Math.max(0, prev - 2));
            }

          } else {
            setScanning(false);
            setProgress((prev) => Math.max(0, prev - 2));
          }
        } catch (e) {
          console.error("Detection error", e);
        }
      }
      if (progress < 100) {
          animationId = requestAnimationFrame(detect);
      }
    };

    detect();

    return () => cancelAnimationFrame(animationId);
  }, [permissionGranted, isLoadingModel, progress]);

  const handleScanComplete = async () => {
    // Generate Mock Hb Value between 3.1 and 15.0
    const estimatedHb = parseFloat((3.1 + Math.random() * (15.0 - 3.1)).toFixed(2));
    
    let severity: 'Severe' | 'Moderate' | 'Mild' | 'Non-Anemic' = 'Non-Anemic';
    let anemia: 'yes' | 'no' | 'uncertain' = 'no';

    if (estimatedHb >= 3.1 && estimatedHb <= 6.90) {
        severity = 'Severe';
        anemia = 'yes';
    } else if (estimatedHb >= 7.0 && estimatedHb <= 9.98) {
        severity = 'Moderate';
        anemia = 'yes';
    } else if (estimatedHb >= 10.0 && estimatedHb <= 10.93) {
        severity = 'Mild';
        anemia = 'yes';
    } else if (estimatedHb >= 11.0) {
        severity = 'Non-Anemic';
        anemia = 'no';
    }

    const randomConfidence = 0.7 + Math.random() * 0.25; // 0.7 - 0.95
    
    // Capture Image
    let image = "";
    if (canvasRef.current) {
      image = canvasRef.current.toDataURL("image/jpeg", 0.8);
    }

    const result = {
      anemia,
      severity,
      estimatedHb,
      confidence: randomConfidence,
      image,
    };

    // Update store
    setScanResult(result);

    // Send to API (non-blocking for UX speed, but waiting here to ensure saving)
    try {
      await fetch("/api/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
    } catch (err) {
      console.error("Failed to save result", err);
    }
    
    router.push("/result");
  };

  return (
    <main className="fixed inset-0 flex flex-col bg-black text-white overflow-hidden">
      {/* Full Screen Loader */}
      <AnimatePresence>
        {isLoadingModel && (
           <motion.div
             initial={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
           >
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-primary/20 rounded-full" />
              </div>
              <p className="mt-4 text-lg font-mono animate-pulse text-primary/80">INITIALIZING AI MODELS...</p>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Layer */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {!permissionGranted && !error && !isLoadingModel && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 text-center p-4">
             <div className="flex flex-col items-center gap-4">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <p>Waiting for camera permission...</p>
             </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover transform scale-x-[-1]" // Mirror
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover transform scale-x-[-1]"
        />

        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             {/* Darken outer area */}
             <svg width="100%" height="100%" className="opacity-70">
                <defs>
                   <mask id="mask">
                      <rect width="100%" height="100%" fill="white" />
                      {/* Cutout for face */}
                      <rect x="50%" y="50%" width="280" height="350" rx="40" transform="translate(-140, -175)" fill="black" />
                   </mask>
                </defs>
                <rect width="100%" height="100%" fill="black" mask="url(#mask)" />
             </svg>
             
             {/* Scanner Line */}
             {scanning && (
               <div className="absolute w-[280px] h-[350px] overflow-hidden rounded-[40px]">
                 <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                    className="absolute left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)]"
                 />
               </div>
             )}

             {/* Guide Frame Corners */}
             <div className="absolute w-[300px] h-[370px]">
                <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl transition-colors ${scanning ? 'border-green-500' : 'border-white/50'}`} />
                <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl transition-colors ${scanning ? 'border-green-500' : 'border-white/50'}`} />
                <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl transition-colors ${scanning ? 'border-green-500' : 'border-white/50'}`} />
                <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl transition-colors ${scanning ? 'border-green-500' : 'border-white/50'}`} />
             </div>
        </div>
      </div>

      {/* UI Layer */}
      <div className="absolute bottom-0 w-full p-6 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent space-y-4 z-30">
         <div className="max-w-md mx-auto w-full space-y-4">
            {error ? (
              <div className="flex items-center text-red-500 justify-center gap-2 bg-red-950/50 p-4 rounded-xl border border-red-900/50 backdrop-blur-md">
                 <AlertCircle /> {error}
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <h3 className={`text-xl font-semibold tracking-wide transition-colors ${scanning ? 'text-green-400' : 'text-white'}`}>
                    {scanning ? "ANALYZING..." : "ALIGN FACE"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {scanning ? "Hold still while we scan" : "Position your face within the frame"}
                  </p>
                </div>
                  
                {/* Techy Progress Bar */}
                <div className="relative h-4 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                   {/* Grid lines */}
                   <div className="absolute inset-0 flex justify-between px-1">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-[1px] h-full bg-gray-800/50" />
                      ))}
                   </div>
                   <motion.div
                      className="h-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                      animate={{ width: `${progress}%` }}
                   />
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-mono uppercase">
                  <span>Scan Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </>
            )}
         </div>
      </div>
    </main>
  );
}
