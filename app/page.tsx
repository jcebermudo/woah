"use client";

import Image from "next/image";
import { motion } from "motion/react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="select-none flex flex-row gap-[10px] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 70 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
          className="ml-[10px]"
        >
          <Image src="/png/w.png" alt="W" width={79.18} height={66.83} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 70 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
            delay: 0.2,
          }}
          className="ml-[-15px]"
        >
          <Image src="/png/o.png" alt="W" width={56.71} height={67.41} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 70 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
            delay: 0.4,
          }}
          className="ml-[-15px]"
        >
          <Image src="/png/a.png" alt="W" width={60.04} height={65.56} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 70 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
            delay: 0.6,
          }}
          className="ml-[-12px]"
        >
          <Image src="/png/h.png" alt="W" width={60.22} height={66.59} />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 70 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 200,
          delay: 0.8,
        }}
        className="text-[24px] font-medium text-foreground"
      >
        Send anonymous messages
      </motion.p>
    </div>
  );
}
