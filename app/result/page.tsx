"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
    ArrowLeft, 
    RotateCcw, 
    Share2, 
    Activity, 
    Info, 
    CheckCircle2, 
    AlertTriangle, 
    AlertOctagon,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Configuration for severity levels to keep code clean
const SEVERITY_CONFIG = {
    'Severe': {
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        fill: "stroke-rose-600",
        gradient: "from-rose-500 to-red-600",
        icon: AlertOctagon,
        message: "Requires immediate medical attention.",
    },
    'Moderate': {
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
        fill: "stroke-orange-500",
        gradient: "from-orange-400 to-orange-600",
        icon: AlertTriangle,
        message: "Consult a healthcare provider soon.",
    },
    'Mild': {
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        fill: "stroke-yellow-500",
        gradient: "from-yellow-400 to-yellow-600",
        icon: Info,
        message: "Monitor diet and consult a doctor.",
    },
    'Non-Anemic': {
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        fill: "stroke-emerald-500",
        gradient: "from-emerald-400 to-emerald-600",
        icon: CheckCircle2,
        message: "Levels appear within normal range.",
    }
};

export default function ResultPage() {
  const router = useRouter();
  const scanResult = useUserStore((state) => state.scanResult);
  const name = useUserStore((state) => state.name);
  
  // Mocking toast for share
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!scanResult) {
      // Redirect to scan if no result, instead of root (which loops to name input)
      router.replace("/scan");
    }
  }, [scanResult, router]);

  if (!scanResult) return null;

  const { severity, estimatedHb, confidence, image } = scanResult;
  const percentage = Math.round(confidence * 100);
  
  // Get config or fallback to Mild if undefined
  const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG['Mild'];
  const StatusIcon = config.icon;

  const handleShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Add actual navigator.share logic here if needed
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 flex flex-col items-center py-10 px-4 sm:px-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg space-y-6"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Analysis Report
                </h2>
                <p className="text-slate-500 text-sm">Patient: {name}</p>
            </div>
            <div className={cn("px-3 py-1 rounded-full text-xs font-medium border", config.bg, config.color, config.border)}>
                {new Date().toLocaleDateString()}
            </div>
        </motion.div>

        {/* Main Result Card */}
        <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-none shadow-lg ring-1 ring-slate-900/5">
                <div className={cn("h-2 w-full bg-gradient-to-r", config.gradient)} />
                <CardContent className="p-8">
                    <div className="flex flex-col items-center">
                        
                        {/* Gauge Component */}
                        <div className="relative w-56 h-56 mb-6">
                            <svg className="w-full h-full transform -rotate-90">
                                {/* Track */}
                                <circle
                                    cx="112"
                                    cy="112"
                                    r="100"
                                    stroke="currentColor"
                                    strokeWidth="16"
                                    fill="transparent"
                                    className="text-slate-100"
                                />
                                {/* Progress */}
                                <motion.circle
                                    cx="112"
                                    cy="112"
                                    r="100"
                                    stroke="currentColor"
                                    strokeWidth="16"
                                    fill="transparent"
                                    strokeLinecap="round"
                                    className={config.fill}
                                    initial={{ strokeDasharray: "0 628" }} // 2 * PI * 100
                                    animate={{ strokeDasharray: `${percentage * 6.28} 628` }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                />
                            </svg>
                            
                            {/* Center Data */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.div 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.5, type: "spring" }}
                                    className="text-center"
                                >
                                    <span className="text-5xl font-bold tracking-tighter text-slate-900">
                                        {estimatedHb.toFixed(1)}
                                    </span>
                                    <span className="block text-xs font-medium text-slate-400 uppercase mt-1">
                                        Hb g/dL
                                    </span>
                                </motion.div>
                            </div>
                        </div>

                        {/* Text Result */}
                        <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <StatusIcon className={cn("w-6 h-6", config.color)} />
                                <h3 className={cn("text-2xl font-bold", config.color)}>
                                    {severity} Anemia
                                </h3>
                            </div>
                            <p className="text-slate-600 font-medium">
                                {config.message}
                            </p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mt-4">
                                <Activity className="w-3 h-3" />
                                AI Confidence: {percentage}%
                            </div>
                        </div>

                    </div>
                </CardContent>
            </Card>
        </motion.div>

        {/* Details & Visualization Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4">
            {/* Heatmap Visualization Card */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-slate-400" />
                        Region of Interest
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative h-32 w-full bg-slate-900">
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                           <p className="text-xs text-slate-400 font-mono border border-slate-700 px-2 py-1 rounded bg-black/40 backdrop-blur-sm">
                                GRAD-CAM OVERLAY
                           </p>
                        </div>
                        {/* Simulated organic heatmap effect */}
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,0,0,0.5),_transparent_70%)] mix-blend-screen animate-pulse" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                    </div>
                </CardContent>
            </Card>

            {/* Reference Range Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Low (&lt;12)</span>
                            <span>Normal (12-16)</span>
                            <span>High (&gt;16)</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                            {/* Gradient background representing ranges */}
                            <div className="absolute inset-0 bg-gradient-to-r from-rose-300 via-emerald-300 to-rose-300 opacity-30" />
                            
                            {/* Indicator Marker */}
                            <motion.div 
                                className="absolute top-0 bottom-0 w-1 bg-slate-900 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                                initial={{ left: "0%" }}
                                animate={{ 
                                    // Simple normalization: assuming 0-20 scale for visualization
                                    left: `${Math.min(Math.max((estimatedHb / 20) * 100, 0), 100)}%` 
                                }}
                                transition={{ delay: 1, duration: 1 }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 text-center pt-1">
                            Your level is <strong>{estimatedHb}</strong> g/dL
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="pt-4 flex gap-3">
            <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1 h-12 text-base rounded-xl border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            >
                <RotateCcw className="mr-2 h-4 w-4" /> 
                Retest
            </Button>
            <Button
                onClick={handleShare}
                className="flex-1 h-12 text-base rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20"
            >
                {copied ? (
                    <>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Copied
                    </>
                ) : (
                    <>
                        <Share2 className="mr-2 h-4 w-4" /> Share Report
                    </>
                )}
            </Button>
        </motion.div>

        <motion.p variants={itemVariants} className="text-center text-[10px] text-slate-400 px-8 leading-relaxed">
            Disclaimer: This AI screening tool analyzes palpebral conjunctiva pallor. 
            Results are estimates and <strong>do not constitute a medical diagnosis</strong>. 
            Please consult a qualified healthcare professional for blood tests.
        </motion.p>
      </motion.div>
    </main>
  );
}