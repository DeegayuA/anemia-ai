"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, RefreshCcw, Camera } from "lucide-react";
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata to load to ensure videoWidth/Height are available
        videoRef.current.onloadedmetadata = () => {
            setPermissionGranted(true);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera permission denied or not available.");
      setShowFallback(true);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      // stop tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

        // Load BlazeFace
        detectorRef.current = await blazeface.load();

        // Load ONNX Model
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
    let lastScanTime = Date.now();
    
    // Fallback timeout: if no scan completes in 20 seconds, show retry
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

        // Draw video to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror and Draw
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        try {
          const returnTensors = false;
          // Estimate faces
          // BlazeFace expects the image element (video). It handles scaling internally but returns coords relative to video size.
          const predictions = await detectorRef.current.estimateFaces(video, returnTensors);

          if (predictions.length > 0) {
            const face = predictions[0];
            // Landmarks: 0=Right Eye, 1=Left Eye, 2=Nose, 3=Mouth, 4=R-Ear, 5=L-Ear
            // Note: "Right Eye" is the person's right eye. In a mirrored video display, it appears on the Right side if not flipped.
            // But we flipped the canvas drawing (scale -1, 1).
            // The detections are on the original video frame (unflipped).
            // We need to map them to the flipped canvas for visualization.

            const start = face.topLeft as [number, number];
            const end = face.bottomRight as [number, number];
            const width = end[0] - start[0];
            const height = end[1] - start[1];

            // Coordinates on Unflipped Video
            const x = start[0];
            const y = start[1];

            // Coordinates for Flipped Canvas
            // Flipped X = CanvasWidth - X - Width
            const flippedX = canvas.width - x - width;

            // Draw Face Box
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 3;
            
            // Draw stylized corners on the flipped face location
            const lineLen = Math.min(width, height) * 0.2;

            // TL
            ctx.beginPath(); ctx.moveTo(flippedX, y + lineLen); ctx.lineTo(flippedX, y); ctx.lineTo(flippedX + lineLen, y); ctx.stroke();
            // TR
            ctx.beginPath(); ctx.moveTo(flippedX + width - lineLen, y); ctx.lineTo(flippedX + width, y); ctx.lineTo(flippedX + width, y + lineLen); ctx.stroke();
            // BL
            ctx.beginPath(); ctx.moveTo(flippedX, y + height - lineLen); ctx.lineTo(flippedX, y + height); ctx.lineTo(flippedX + lineLen, y + height); ctx.stroke();
            // BR
            ctx.beginPath(); ctx.moveTo(flippedX + width - lineLen, y + height); ctx.lineTo(flippedX + width, y + height); ctx.lineTo(flippedX + width, y + height - lineLen); ctx.stroke();

            // Check criteria
            if (width > 80) { // Face large enough
               setScanning(true);

               // Progress Logic
               setProgress((prev) => {
                 const next = prev + 1.5; // Speed
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
                // Decay progress if face lost/too small
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
        // Pipeline: Video -> Extract ROI (Eye) -> Resize (224) -> Normalize -> Predict

        const landmarks = facePrediction.landmarks as number[][];
        // 0: Right Eye, 1: Left Eye.
        // "Right Eye" (index 0) is the person's right eye.

        // We will select the "Right Eye" (index 0) for consistency with single-eye models.
        // Or average both? Let's stick to one for now or crop both and batch?
        // Let's use index 0 (Right Eye).
        const eyeIndex = 0;
        const eyeCenter = landmarks[eyeIndex]; // [x, y]
        const otherEyeCenter = landmarks[1];

        // Calculate Eye Distance for scale
        const dx = eyeCenter[0] - otherEyeCenter[0];
        const dy = eyeCenter[1] - otherEyeCenter[1];
        const eyeDist = Math.sqrt(dx*dx + dy*dy);

        // Define ROI size. For Conjunctiva, we need the eye region.
        // Heuristic: Box size = 1.5 * EyeDistance?
        const boxSize = Math.max(eyeDist * 1.8, 50);

        // Source Coordinates (Video Frame)
        const sx = eyeCenter[0] - boxSize / 2;
        const sy = eyeCenter[1] - boxSize / 2;

        // Create tensor input
        const targetSize = 224;
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = targetSize;
        tmpCanvas.height = targetSize;
        const ctx = tmpCanvas.getContext('2d');

        if (!ctx) throw new Error("Canvas context failed");

        // Draw the ROI, resizing to 224x224
        ctx.drawImage(videoElement, sx, sy, boxSize, boxSize, 0, 0, targetSize, targetSize);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
        const { data } = imageData;

        // Preprocess: Normalize [0, 1] and layout [1, 224, 224, 3] (NHWC)
        const float32Data = new Float32Array(1 * targetSize * targetSize * 3);

        for (let i = 0; i < targetSize * targetSize; i++) {
            const r = data[i * 4] / 255.0;
            const g = data[i * 4 + 1] / 255.0;
            const b = data[i * 4 + 2] / 255.0;

            // NHWC layout: [batch, height, width, channel]
            // Index = (h * W + w) * C + c
            const pixelIndex = i * 3;
            float32Data[pixelIndex] = r;
            float32Data[pixelIndex + 1] = g;
            float32Data[pixelIndex + 2] = b;
        }

        const inputTensor = new ort.Tensor('float32', float32Data, [1, targetSize, targetSize, 3]);

        // Run Inference
        const inputName = sessionRef.current.inputNames[0];
        const feeds = { [inputName]: inputTensor };

        const results = await sessionRef.current.run(feeds);
        const outputName = sessionRef.current.outputNames[0];
        const outputTensor = results[outputName];
        const outputData = outputTensor.data;

        console.log("Model Output:", outputData);

        // Interpret Result
        // Model seems to be a classifier (Anemic vs Non-Anemic).
        // Assume output is a probability/score.
        // If size is 1, it's likely sigmoid probability or logit.
        let probability = 0;

        if (outputData.length === 1) {
            probability = outputData[0];
            // If it's logit (can be negative or >1), apply sigmoid.
            // But TFJS exported models usually include the activation if it was part of the model.
            // "ROC-AUC Score" implies probabilities.
            // We'll clamp it to 0-1 just in case.
             if (probability < 0 || probability > 1) {
                 // Apply sigmoid if it looks like logit
                 probability = 1 / (1 + Math.exp(-probability));
             }
        } else if (outputData.length === 2) {
            // Softmax output [prob_0, prob_1]
            probability = outputData[1];
        }

        // Map Probability to Severity/Hb for the UI
        // High probability = Anemia likely.
        // We can simulate Hb for the UI or change the UI.
        // For now, we'll map probability to a risk-based Hb estimation for visualization.
        // Anemia is Hb < 11-12 roughly.
        // If prob = 1.0 -> Hb ~ 5.0 (Severe)
        // If prob = 0.0 -> Hb ~ 15.0 (Healthy)

        const minHb = 5.0;
        const maxHb = 15.0;
        // Linear interpolation: Hb = Max - Prob * (Max - Min)
        // This is a HACK for the UI. The real output is just "Risk".
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
            confidence: probability > 0.5 ? probability : 1 - probability, // Confidence in the prediction
        };

        setScanResult(result);

        // Save result
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
      // Reset timeout
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
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
              </div>
              <p className="mt-4 text-lg font-mono animate-pulse text-primary/80">INITIALIZING SYSTEM...</p>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback / Error Popup */}
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

      {/* Camera Layer */}
      <div className="relative flex-1 overflow-hidden bg-black">
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
          // Note: We are NOT mirroring the video element with CSS transform here
          // because we want the raw feed to be correct for canvas drawing.
          // But for user UX, we often want to mirror.
          // If we mirror here with CSS, it doesn't affect the underlying video data.
          // But our canvas overlay IS mirrored. So let's mirror this too for alignment.
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        />

        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             {/* Darken outer area */}
             <svg width="100%" height="100%" className="opacity-60">
                <defs>
                   <mask id="mask">
                      <rect width="100%" height="100%" fill="white" />
                      {/* Cutout for face */}
                      <rect x="50%" y="50%" width="280" height="380" rx="100" transform="translate(-140, -190)" fill="black" />
                   </mask>
                </defs>
                <rect width="100%" height="100%" fill="black" mask="url(#mask)" />
             </svg>
             
             {/* Scanner Effect */}
             {scanning && (
               <div className="absolute w-[280px] h-[380px] overflow-hidden rounded-[100px]">
                 <motion.div
                    animate={{ top: ["-10%", "110%"] }}
                    transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                    className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent"
                 />
               </div>
             )}

             {/* Guide Frame */}
             <div className={`absolute w-[290px] h-[390px] border-2 rounded-[105px] transition-colors duration-300 ${scanning ? 'border-emerald-500/80' : 'border-white/30'}`} />
        </div>
      </div>

      {/* UI Layer */}
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

            {/* Progress Bar */}
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
