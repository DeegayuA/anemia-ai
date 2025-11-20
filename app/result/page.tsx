"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Share2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResultPage() {
  const router = useRouter();
  const scanResult = useUserStore((state) => state.scanResult);
  const name = useUserStore((state) => state.name);

  useEffect(() => {
    if (!scanResult) {
      router.replace("/");
    }
  }, [scanResult, router]);

  if (!scanResult) return null;

  const { severity, estimatedHb, confidence } = scanResult;
  const percentage = Math.round(confidence * 100);
  
  // Determine Color based on severity
  let colorClass = "text-green-500";
  let bgClass = "bg-green-500";
  
  switch(severity) {
      case 'Severe':
          colorClass = "text-red-600";
          bgClass = "bg-red-600";
          break;
      case 'Moderate':
          colorClass = "text-orange-500";
          bgClass = "bg-orange-500";
          break;
      case 'Mild':
          colorClass = "text-yellow-500";
          bgClass = "bg-yellow-500";
          break;
      case 'Non-Anemic':
          colorClass = "text-green-500";
          bgClass = "bg-green-500";
          break;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-muted-foreground">Analysis Complete</h1>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Hello, {name}</h2>
        </div>

        <div className="glass-card p-8 space-y-8 relative overflow-hidden">
            {/* Background Glow */}
            <div className={cn("absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-current to-transparent opacity-50", colorClass)} />

            <div className="flex flex-col items-center space-y-4">
                <div className="relative w-48 h-48">
                    {/* Animated Circular Gauge */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-secondary"
                        />
                        <motion.circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeLinecap="round"
                            className={colorClass}
                            initial={{ strokeDasharray: "0 552" }}
                            animate={{ strokeDasharray: `${percentage * 5.52} 552` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-4xl font-bold"
                        >
                            {estimatedHb.toFixed(1)}
                        </motion.span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Hb g/dL</span>
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className={cn("text-3xl font-bold uppercase", colorClass)}
                    >
                        {severity}
                    </motion.div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        <span>Confidence: {percentage}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Based on palpebral conjunctiva analysis.
                    </p>
                </div>
            </div>

            {/* Heatmap Overlay Placeholder */}
            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-black/50 mt-4">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
                    [ Grad-CAM Heatmap Visualization ]
                </div>
                {/* Simulated Heatmap Gradient */}
                <div className={cn("absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-red-500/20 mix-blend-overlay", bgClass === "bg-green-500" ? "opacity-0" : "opacity-50")} />
            </div>

             <div className="flex gap-4 pt-4">
                <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="flex-1 h-12 rounded-xl"
                >
                    <RotateCcw className="mr-2 h-4 w-4" /> Retry
                </Button>
                <Button
                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground"
                >
                    <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
            </div>
        </div>

        <div className="text-center text-xs text-muted-foreground px-8">
            Disclaimer: This is an AI-assisted screening tool and not a medical diagnosis. Please consult a doctor for professional advice.
        </div>
      </motion.div>
    </main>
  );
}
