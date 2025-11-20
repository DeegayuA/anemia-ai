"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

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
            const height = end[1] - start[1];

            // Draw bounding box
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 2;
            ctx.strokeRect(start[0], start[1], width, height);
            
            // Simple heuristic: face must be big enough
            if (width > 100) {
               setScanning(true);
               // Simulate "good frames" accumulation
               setProgress((prev) => {
                 const next = prev + 2; // Increment progress
                 if (next >= 100) {
                   // Done!
                   cancelAnimationFrame(animationId);
                   handleScanComplete();
                   return 100;
                 }
                 return next;
               });
            } else {
                setScanning(false);
                // Reset if face too small
                setProgress((prev) => Math.max(0, prev - 5));
            }

          } else {
            setScanning(false);
            setProgress((prev) => Math.max(0, prev - 5));
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

  const handleScanComplete = () => {
    // Generate Mock Hb Value between 3.1 and 15.0
    // Weighted towards normal for realism if needed, or purely random.
    // Let's pick a random value between 3.1 and 15.0
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
    
    const result = {
      anemia,
      severity,
      estimatedHb,
      confidence: randomConfidence,
    };

    setScanResult(result);
    
    // Delay slightly for effect then navigate
    setTimeout(() => {
        router.push("/result");
    }, 500);
  };

  return (
    <main className="fixed inset-0 flex flex-col bg-black text-white">
      {/* Camera Layer */}
      <div className="relative flex-1 overflow-hidden">
        {!permissionGranted && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
            <p>Requesting camera access...</p>
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
             {/* Mask / Overlay */}
             <svg width="100%" height="100%" className="opacity-50">
                <defs>
                   <mask id="mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect x="50%" y="50%" width="280" height="350" rx="150" transform="translate(-140, -175)" fill="black" />
                   </mask>
                </defs>
                <rect width="100%" height="100%" fill="black" mask="url(#mask)" />
             </svg>
             
             {/* Guide Frame */}
             <div className={`w-[280px] h-[350px] rounded-[150px] border-4 transition-colors duration-300 flex items-center justify-center relative ${scanning ? 'border-green-500' : 'border-white/50'}`}>
                 {scanning && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.1, opacity: 0.5 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute inset-0 bg-green-500/20 rounded-[150px]"
                    />
                 )}
             </div>
        </div>
      </div>

      {/* UI Layer */}
      <div className="absolute bottom-0 w-full p-8 pb-12 bg-gradient-to-t from-black/90 to-transparent space-y-4 z-30">
         <div className="flex justify-between items-center text-center">
            {error ? (
              <div className="flex items-center text-red-500 mx-auto gap-2 bg-red-500/10 p-4 rounded-xl backdrop-blur-md">
                 <AlertCircle /> {error}
              </div>
            ) : (
              <div className="w-full space-y-2">
                  <p className="text-lg font-medium text-center">
                    {isLoadingModel ? "Loading AI Models..." : scanning ? "Scanning..." : "Position your face in the frame"}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                     <motion.div 
                        className="h-full bg-green-500"
                        animate={{ width: `${progress}%` }}
                     />
                  </div>
              </div>
            )}
         </div>
      </div>
    </main>
  );
}
