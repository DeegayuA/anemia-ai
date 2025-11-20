"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, RefreshCcw, Camera, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import TFJS, BlazeFace and ONNX Runtime
let tf: any;
let blazeface: any;
let ort: any;

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  // Torch State
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const setScanResult = useUserStore((state) => state.setScanResult);
  
  // State for detector and ONNX session
  const detectorRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Setup Camera
  const startCamera = async () => {
    setShowFallback(false);
    setError(null);
    setProgress(0);
    try {
      // Prefer environment camera for rear usage if possible, but user facing is standard for self-check.
      // Torch is usually only available on 'environment' (rear) cameras on phones.
      // However, the requirement implies enabling torch if available.
      // Let's try to get a stream.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "user", // Usually front camera
            width: { ideal: 640 },
            height: { ideal: 480 }
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            setPermissionGranted(true);
        };
      }

      // Check for Torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};

      // @ts-ignore - 'torch' is not in standard TS definitions yet for all envs
      if (capabilities.torch) {
          setHasTorch(true);
      }

    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera permission denied or not available.");
      setShowFallback(true);
    }
  };

  useEffect(() => {
    startCamera();

    // Add debug command
    if (typeof window !== 'undefined') {
        (window as any).pass = () => {
            console.log("Executing manual pass...");
            const mockResult = {
                anemia: "yes",
                severity: "Moderate",
                estimatedHb: 9.5,
                confidence: 0.88
            };
            // @ts-ignore
            setScanResult(mockResult);
            router.push("/result");
        };
        console.log("Debug command 'pass()' is available in console.");
    }

    return () => {
      // stop tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTorch = async () => {
      if (!videoRef.current || !videoRef.current.srcObject) return;
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];

      try {
          const newStatus = !isTorchOn;
          await track.applyConstraints({
              advanced: [{ torch: newStatus } as any]
          });
          setIsTorchOn(newStatus);
      } catch (err) {
          console.error("Failed to toggle torch", err);
      }
  };

  // 2. Load Models (Dynamic Import)
  useEffect(() => {
    const loadModels = async () => {
      try {
        tf = await import("@tensorflow/tfjs");
        blazeface = await import("@tensorflow-models/blazeface");
        await import("@tensorflow/tfjs-backend-webgl");
        ort = await import("onnxruntime-web");

        await tf.ready();
        await tf.setBackend('webgl');

        detectorRef.current = await blazeface.load();

        try {
            const basePath = window.location.pathname.startsWith('/anemia-ai') ? '/anemia-ai' : '';
            const modelsPath = `${window.location.origin}${basePath}/models/`;

            ort.env.wasm.wasmPaths = modelsPath;
            const modelPath = `${modelsPath}model.onnx`;

            sessionRef.current = await ort.InferenceSession.create(modelPath, { executionProviders: ['wasm'] });
            console.log("ONNX Model loaded successfully");
        } catch (onnxError) {
            console.warn("Failed to load ONNX model:", onnxError);
            setError("Failed to load analysis model.");
        }

        setIsLoadingModel(false);
      } catch (err) {
        console.error("Model load error:", err);
        setError("Failed to initialize AI.");
      }
    };
    if (permissionGranted) {
        loadModels();
    }
  }, [permissionGranted]);

  // 3. Detection Loop
  useEffect(() => {
    if (!permissionGranted || isLoadingModel || !detectorRef.current || showFallback) return;

    let animationId: number;
    
    scanTimeoutRef.current = setTimeout(() => {
        if (progress < 100) {
            setShowFallback(true);
        }
    }, 20000);

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

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        try {
          const returnTensors = false;
          const predictions = await detectorRef.current.estimateFaces(video, returnTensors);

          if (predictions.length > 0) {
            const face = predictions[0];
            const start = face.topLeft as [number, number];
            const end = face.bottomRight as [number, number];
            const width = end[0] - start[0];
            const height = end[1] - start[1];

            const x = start[0];
            const y = start[1];
            const flippedX = canvas.width - x - width;

            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 3;

            const lineLen = Math.min(width, height) * 0.2;

            ctx.beginPath(); ctx.moveTo(flippedX, y + lineLen); ctx.lineTo(flippedX, y); ctx.lineTo(flippedX + lineLen, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(flippedX + width - lineLen, y); ctx.lineTo(flippedX + width, y); ctx.lineTo(flippedX + width, y + lineLen); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(flippedX, y + height - lineLen); ctx.lineTo(flippedX, y + height); ctx.lineTo(flippedX + lineLen, y + height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(flippedX + width - lineLen, y + height); ctx.lineTo(flippedX + width, y + height); ctx.lineTo(flippedX + width, y + height - lineLen); ctx.stroke();

            if (width > 80) {
               setScanning(true);
               setProgress((prev) => {
                 const next = prev + 1.5;
                 if (next >= 100) {
                   cancelAnimationFrame(animationId);
                   if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                   handleScanComplete(video, face);
                   return 100;
                 }
                 return next;
               });
            } else {
                setScanning(false);
                setProgress((prev) => Math.max(0, prev - 1));
            }

          } else {
            setScanning(false);
            setProgress((prev) => Math.max(0, prev - 1));
          }
        } catch (e) {
          console.error("Detection error", e);
        }
      }

      if (progress < 100 && !showFallback) {
          animationId = requestAnimationFrame(detect);
      }
    };

    detect();

    return () => {
        cancelAnimationFrame(animationId);
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [permissionGranted, isLoadingModel, progress, showFallback]);

  const handleScanComplete = async (videoElement: HTMLVideoElement, facePrediction: any) => {
    if (!sessionRef.current) {
        setError("Model not loaded.");
        setShowFallback(true);
        return;
    }

    try {
        const landmarks = facePrediction.landmarks as number[][];
        const eyeIndex = 0;
        const eyeCenter = landmarks[eyeIndex];
        const otherEyeCenter = landmarks[1];

        const dx = eyeCenter[0] - otherEyeCenter[0];
        const dy = eyeCenter[1] - otherEyeCenter[1];
        const eyeDist = Math.sqrt(dx*dx + dy*dy);

        const boxSize = Math.max(eyeDist * 1.8, 50);

        const sx = eyeCenter[0] - boxSize / 2;
        const sy = eyeCenter[1] - boxSize / 2;

        const targetSize = 224;
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = targetSize;
        tmpCanvas.height = targetSize;
        const ctx = tmpCanvas.getContext('2d');

        if (!ctx) throw new Error("Canvas context failed");

        ctx.drawImage(videoElement, sx, sy, boxSize, boxSize, 0, 0, targetSize, targetSize);

        const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
        const { data } = imageData;

        const float32Data = new Float32Array(1 * targetSize * targetSize * 3);

        for (let i = 0; i < targetSize * targetSize; i++) {
            const r = data[i * 4] / 255.0;
            const g = data[i * 4 + 1] / 255.0;
            const b = data[i * 4 + 2] / 255.0;

            const pixelIndex = i * 3;
            float32Data[pixelIndex] = r;
            float32Data[pixelIndex + 1] = g;
            float32Data[pixelIndex + 2] = b;
        }

        const inputTensor = new ort.Tensor('float32', float32Data, [1, targetSize, targetSize, 3]);

        const inputName = sessionRef.current.inputNames[0];
        const feeds = { [inputName]: inputTensor };

        const results = await sessionRef.current.run(feeds);
        const outputName = sessionRef.current.outputNames[0];
        const outputTensor = results[outputName];
        const outputData = outputTensor.data;

        let probability = 0;

        if (outputData.length === 1) {
            probability = outputData[0];
             if (probability < 0 || probability > 1) {
                 probability = 1 / (1 + Math.exp(-probability));
             }
        } else if (outputData.length === 2) {
            probability = outputData[1];
        }

        const minHb = 5.0;
        const maxHb = 15.0;
        const estimatedHb = maxHb - (probability * (maxHb - minHb));

        let severity: 'Severe' | 'Moderate' | 'Mild' | 'Non-Anemic' = 'Non-Anemic';
        let anemia: 'yes' | 'no' | 'uncertain' = 'no';

        if (estimatedHb < 7.0) severity = 'Severe';
        else if (estimatedHb < 10.0) severity = 'Moderate';
        else if (estimatedHb < 12.0) severity = 'Mild';
        else severity = 'Non-Anemic';

        if (severity !== 'Non-Anemic') anemia = 'yes';

        const result = {
            anemia,
            severity,
            estimatedHb,
            confidence: probability > 0.5 ? probability : 1 - probability,
        };

        setScanResult(result);

        fetch("/api/save-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
        }).catch(e => console.error("Save failed", e));

        router.push("/result");

    } catch (err) {
        console.error("Inference Error:", err);
        setError("Analysis failed. Please try again.");
        setShowFallback(true);
    }
  };

  const handleRetry = () => {
      setShowFallback(false);
      setError(null);
      setProgress(0);
      setScanning(false);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
  };

  return (
    <main className="fixed inset-0 flex flex-col bg-black text-white overflow-hidden">
      <AnimatePresence>
        {isLoadingModel && (
           <motion.div
             initial={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
           >
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <p className="mt-4 text-lg font-mono animate-pulse text-primary/80">INITIALIZING SYSTEM...</p>
           </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFallback && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            >
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Scan Failed</h3>
                    <p className="text-zinc-400 text-sm">
                        We couldn't detect a clear eye region or the analysis timed out.
                    </p>
                    <div className="text-xs text-zinc-500 bg-zinc-950 p-3 rounded-lg text-left space-y-1">
                        <p>• Ensure good lighting</p>
                        <p>• Remove glasses if possible</p>
                        <p>• Hold the camera steady at eye level</p>
                    </div>
                    <Button
                        onClick={handleRetry}
                        className="w-full bg-white text-black hover:bg-zinc-200"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
                    </Button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex-1 overflow-hidden bg-black">
        {/* Torch Button */}
        {hasTorch && (
            <div className="absolute top-6 right-6 z-40">
                <Button
                    size="icon"
                    onClick={toggleTorch}
                    className={`rounded-full h-12 w-12 transition-all duration-300 ${isTorchOn ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'}`}
                >
                    {isTorchOn ? <ZapOff className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                </Button>
            </div>
        )}

        {!permissionGranted && !error && !isLoadingModel && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 text-center p-4">
             <div className="flex flex-col items-center gap-4">
                 <Camera className="w-12 h-12 text-zinc-500" />
                 <p className="text-zinc-400">Please allow camera access to continue.</p>
             </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <svg width="100%" height="100%" className="opacity-60">
                <defs>
                   <mask id="mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect x="50%" y="50%" width="280" height="380" rx="100" transform="translate(-140, -190)" fill="black" />
                   </mask>
                </defs>
                <rect width="100%" height="100%" fill="black" mask="url(#mask)" />
             </svg>
             
             {scanning && (
               <div className="absolute w-[280px] h-[380px] overflow-hidden rounded-[100px]">
                 <motion.div
                    animate={{ top: ["-10%", "110%"] }}
                    transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                    className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent"
                 />
               </div>
             )}

             <div className={`absolute w-[290px] h-[390px] border-2 rounded-[105px] transition-colors duration-300 ${scanning ? 'border-emerald-500/80' : 'border-white/30'}`} />
        </div>
      </div>

      <div className="absolute bottom-0 w-full p-6 pb-10 bg-gradient-to-t from-black via-black/90 to-transparent space-y-6 z-30">
         <div className="max-w-md mx-auto w-full space-y-4">

            <div className="text-center space-y-2">
                <h3 className={`text-2xl font-bold tracking-tight transition-colors ${scanning ? 'text-emerald-400' : 'text-white'}`}>
                {scanning ? "Scanning..." : "Position Face"}
                </h3>
                <p className="text-sm text-zinc-400">
                {scanning ? "Keep your eyes open and hold still" : "Align your face within the frame"}
                </p>
            </div>

            <div className="space-y-2">
                <div className="relative h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500"
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "tween", ease: "linear" }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                    <span>Analysis</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            </div>
         </div>
      </div>
    </main>
  );
}
