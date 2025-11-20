"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Lottie from "react-lottie-player";
import { motion } from "framer-motion";

// I'll use a placeholder JSON for the Lottie animation. 
// In a real app, I would import a local JSON file.
// I'll fetch a public one or use a simple dummy object if fetching fails.
const lottieJsonUrl = "https://assets9.lottiefiles.com/packages/lf20_p8bfn5to.json"; // Generic medical/loading animation

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/info/name");
    }, 3500); // 3.5 seconds loading

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full neumorph-inset flex items-center justify-center p-8">
           {/* Using a network Lottie for now */}
           <Lottie
            loop
            path={lottieJsonUrl}
            play
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-2xl font-semibold text-primary tracking-wider"
        >
          INITIALIZING...
        </motion.h1>
      </motion.div>
    </main>
  );
}
