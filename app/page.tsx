"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/info/name");
    }, 3500); // 3.5 seconds loading

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center z-10 relative"
      >
        <div className="relative w-64 h-64 flex items-center justify-center">
           {/* Center Core */}
           <motion.div
              animate={{
                 scale: [1, 1.2, 1],
                 opacity: [0.5, 1, 0.5],
                 boxShadow: ["0 0 20px rgba(59,130,246,0.5)", "0 0 50px rgba(59,130,246,0.8)", "0 0 20px rgba(59,130,246,0.5)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center backdrop-blur-md border border-blue-500/50"
           >
              <div className="w-12 h-12 bg-blue-400 rounded-full" />
           </motion.div>

           {/* Orbiting Rings */}
           {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
                className={`absolute inset-0 border border-blue-500/30 rounded-full border-t-transparent border-l-transparent`}
                style={{ width: `${100 + i * 40}%`, height: `${100 + i * 40}%`, margin: `-${i * 20}%` }}
              />
           ))}

             {[1, 2, 3].map((i) => (
              <motion.div
                key={`rev-${i}`}
                animate={{ rotate: -360 }}
                transition={{ duration: 4 + i, repeat: Infinity, ease: "linear" }}
                className={`absolute inset-0 border border-cyan-500/20 rounded-full border-b-transparent border-r-transparent`}
                style={{ width: `${100 + i * 40}%`, height: `${100 + i * 40}%`, margin: `-${i * 20}%` }}
              />
           ))}

        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-widest">
            SYSTEM INITIALIZATION
          </h1>
          <motion.div
            className="flex gap-1 h-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
             {[0, 1, 2].map((i) => (
               <motion.div
                  key={i}
                  animate={{ scaleY: [1, 2, 1], backgroundColor: ["#60a5fa", "#22d3ee", "#60a5fa"] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  className="w-8 h-full bg-blue-400 rounded-full"
               />
             ))}
          </motion.div>
          <p className="text-xs text-blue-400/70 font-mono mt-2">
            LOADING NEURAL NETWORKS...
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
