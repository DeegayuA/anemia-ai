"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function NamePage() {
  const [inputValue, setInputValue] = useState("");
  const setName = useUserStore((state) => state.setName);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setName(inputValue);
      router.push("/info/age");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Welcome</h2>
          <p className="text-muted-foreground">Let's get to know you better.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              What is your name?
            </label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-14 px-4 rounded-xl border-0 bg-secondary/50 shadow-inner focus-visible:ring-primary/50 text-lg transition-all"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-full h-12 rounded-xl text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
