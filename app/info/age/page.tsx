"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Minus, Plus } from "lucide-react";

export default function AgePage() {
  const [age, setLocalAge] = useState<number>(25);
  const setAge = useUserStore((state) => state.setAge);
  const router = useRouter();

  const handleSubmit = () => {
    setAge(age);
    router.push("/info/gender");
  };

  const increment = () => setLocalAge((prev) => Math.min(prev + 1, 120));
  const decrement = () => setLocalAge((prev) => Math.max(prev - 1, 1));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Age</h2>
          <p className="text-muted-foreground">How old are you?</p>
        </div>

        <div className="glass-card p-8 space-y-8 flex flex-col items-center">
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={decrement}
              className="h-14 w-14 rounded-full border-2 hover:border-primary hover:bg-primary/10 active:scale-90 transition-all"
            >
              <Minus className="h-6 w-6" />
            </Button>
            
            <motion.div
              key={age}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold text-primary w-24 text-center"
            >
              {age}
            </motion.div>

            <Button
              variant="outline"
              size="icon"
              onClick={increment}
              className="h-14 w-14 rounded-full border-2 hover:border-primary hover:bg-primary/10 active:scale-90 transition-all"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full h-12 rounded-xl text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
