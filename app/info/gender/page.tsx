"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GenderPage() {
  const [selected, setSelected] = useState<'male' | 'female' | 'other' | null>(null);
  const setGender = useUserStore((state) => state.setGender);
  const router = useRouter();

  const handleSubmit = () => {
    if (selected) {
      setGender(selected);
      router.push("/info/hb");
    }
  };

  const genders = [
    { id: 'male', label: 'Male', icon: '👨' },
    { id: 'female', label: 'Female', icon: '👩' },
    { id: 'other', label: 'Other', icon: '🧑' },
  ] as const;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Gender</h2>
          <p className="text-muted-foreground">Select your biological sex.</p>
        </div>

        <div className="glass-card p-8 space-y-8">
          <div className="grid grid-cols-3 gap-4">
            {genders.map((g) => (
              <motion.button
                key={g.id}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelected(g.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all h-32 space-y-2",
                  selected === g.id
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-transparent bg-secondary/50 hover:bg-secondary"
                )}
              >
                <span className="text-4xl">{g.icon}</span>
                <span className="font-medium text-sm">{g.label}</span>
              </motion.button>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selected}
            className="w-full h-12 rounded-xl text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
