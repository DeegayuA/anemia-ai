"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HbPage() {
  const [knowsHb, setKnowsHb] = useState<boolean | null>(null);
  const [hbValue, setHbValueInput] = useState<string>("");
  const setKnownHb = useUserStore((state) => state.setKnownHb);
  const setHbValue = useUserStore((state) => state.setHbValue);
  const router = useRouter();

  const handleSubmit = () => {
    setKnownHb(!!knowsHb);
    if (knowsHb && hbValue) {
      setHbValue(parseFloat(hbValue));
    }
    router.push("/scan");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Hemoglobin</h2>
          <p className="text-muted-foreground">Do you know your current Hb value?</p>
        </div>

        <div className="glass-card p-8 space-y-8">
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => setKnowsHb(true)}
              className={cn(
                "flex-1 h-16 text-lg rounded-xl border-2 transition-all",
                knowsHb === true
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent bg-secondary/50 hover:bg-secondary"
              )}
            >
              <Check className="mr-2 h-5 w-5" /> Yes
            </Button>
            <Button
              variant="outline"
              onClick={() => setKnowsHb(false)}
              className={cn(
                "flex-1 h-16 text-lg rounded-xl border-2 transition-all",
                knowsHb === false
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent bg-secondary/50 hover:bg-secondary"
              )}
            >
              <X className="mr-2 h-5 w-5" /> No
            </Button>
          </div>

          <AnimatePresence>
            {knowsHb === true && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2 space-y-2">
                  <label className="text-sm font-medium">Hb Value (g/dL)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 13.5"
                    value={hbValue}
                    onChange={(e) => setHbValueInput(e.target.value)}
                    className="h-14 rounded-xl bg-secondary/50 border-0 shadow-inner"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleSubmit}
            disabled={knowsHb === null || (knowsHb === true && !hbValue)}
            className="w-full h-12 rounded-xl text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Start Scan <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
