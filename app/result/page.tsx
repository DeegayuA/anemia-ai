"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
    RotateCcw, 
    Share2, 
    CheckCircle2, 
    AlertTriangle, 
    AlertOctagon,
    Info,
    Activity,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_CONFIG = {
    'Severe': {
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        gradient: "from-red-500 to-rose-600",
        icon: AlertOctagon,
        label: "High Risk",
        description: "The analysis indicates a high likelihood of anemia.",
    },
    'Moderate': {
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        gradient: "from-orange-500 to-amber-600",
        icon: AlertTriangle,
        label: "Moderate Risk",
        description: "There are signs suggesting potential anemia.",
    },
    'Mild': {
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        gradient: "from-yellow-500 to-amber-500",
        icon: Info,
        label: "Mild Risk",
        description: "Borderline indicators detected.",
    },
    'Non-Anemic': {
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        gradient: "from-emerald-500 to-green-600",
        icon: CheckCircle2,
        label: "Low Risk",
        description: "No significant signs of anemia detected.",
    }
};

export default function ResultPage() {
  const router = useRouter();
  const scanResult = useUserStore((state) => state.scanResult);
  const name = useUserStore((state) => state.name);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!scanResult) {
      router.replace("/scan");
    }
  }, [scanResult, router]);

  if (!scanResult) return null;

  const { severity, confidence, estimatedHb } = scanResult;
  const config = RISK_CONFIG[severity as keyof typeof RISK_CONFIG] || RISK_CONFIG['Non-Anemic'];
  const StatusIcon = config.icon;

  // Display confidence as a percentage
  const confidencePercent = Math.round(confidence * 100);

  const handleShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (navigator.share) {
        navigator.share({
            title: 'Anemia Screening Result',
            text: `I just completed an AI Anemia Screening. Result: ${config.label}.`,
            url: window.location.href
        }).catch(console.error);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
                <h1 className="text-xl font-bold">Analysis Report</h1>
                <p className="text-zinc-500 text-sm">Patient: {name || "Guest"}</p>
            </div>
            <div className={cn("px-3 py-1 rounded-full text-xs font-bold border", config.bg, config.color, config.border)}>
                {new Date().toLocaleDateString()}
            </div>
        </div>

        {/* Main Card */}
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative">
            {/* Background Glow */}
            <div className={cn("absolute top-0 left-0 w-full h-1 opacity-50 bg-gradient-to-r", config.gradient)} />

            <CardContent className="p-8 text-center space-y-6">
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                    <div className={cn("absolute inset-0 rounded-full opacity-20 blur-xl", config.bg)} />
                    <StatusIcon className={cn("w-16 h-16 relative z-10", config.color)} />
                </div>

                <div className="space-y-2">
                    <h2 className={cn("text-3xl font-bold", config.color)}>
                        {config.label}
                    </h2>
                    <p className="text-zinc-400 leading-relaxed">
                        {config.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-black/40 rounded-xl p-3 border border-zinc-800">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Confidence</p>
                        <p className="text-xl font-mono font-bold">{confidencePercent}%</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-zinc-800">
                         <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Est. Level</p>
                         <p className="text-xl font-mono font-bold flex items-center justify-center gap-1">
                             {estimatedHb.toFixed(1)} <span className="text-[10px] text-zinc-600">g/dL</span>
                         </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Hb Scale Visualization */}
        <Card className="bg-zinc-900 border-zinc-800">
             <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                     <Activity className="w-4 h-4" /> Hemoglobin Estimation
                 </CardTitle>
             </CardHeader>
             <CardContent>
                 <div className="relative h-12 w-full mt-2">
                     {/* Scale Background */}
                     <div className="absolute top-4 left-0 right-0 h-2 bg-zinc-800 rounded-full overflow-hidden">
                         <div className="absolute left-0 w-[30%] h-full bg-red-900/50" /> {/* Low */}
                         <div className="absolute left-[30%] w-[20%] h-full bg-yellow-900/50" /> {/* Mild */}
                         <div className="absolute left-[50%] right-0 h-full bg-emerald-900/50" /> {/* Normal */}
                     </div>

                     {/* Marker */}
                     <motion.div
                        className="absolute top-1 w-1 h-8 bg-white rounded-full shadow-[0_0_10px_white]"
                        initial={{ left: "0%" }}
                        animate={{
                            // Map 0-20 scale to 0-100%
                            left: `${Math.min(Math.max((estimatedHb / 20) * 100, 0), 100)}%`
                        }}
                        transition={{ duration: 1, delay: 0.2 }}
                     />

                     {/* Labels */}
                     <div className="absolute top-8 w-full flex justify-between text-[10px] text-zinc-600 font-mono">
                         <span>0</span>
                         <span>Severe</span>
                         <span>10</span>
                         <span>Normal</span>
                         <span>20</span>
                     </div>
                 </div>
                 <p className="text-[10px] text-zinc-500 mt-6 text-center italic">
                     * Visual approximation based on risk assessment. Not a clinical measurement.
                 </p>
             </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
            <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl bg-transparent border-zinc-700 hover:bg-zinc-800 hover:text-white"
                onClick={() => router.push("/scan")}
            >
                <RotateCcw className="mr-2 w-4 h-4" /> Retest
            </Button>
            <Button
                className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-zinc-200"
                onClick={handleShare}
            >
                {copied ? <CheckCircle2 className="mr-2 w-4 h-4" /> : <Share2 className="mr-2 w-4 h-4" />}
                {copied ? "Copied" : "Share Result"}
            </Button>
        </div>

        <p className="text-center text-[10px] text-zinc-600 px-6">
            Disclaimer: This tool is for screening purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>

      </motion.div>
    </main>
  );
}
