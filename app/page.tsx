"use client";

import Image from "next/image";
import { motion } from "motion/react";

export default function Home() {
  return (
    <div>
      <div className="select-none flex flex-row gap-[10px] items-center justify-center">
        <div className="ml-[10px]">
          <Image src="/png/w.png" alt="W" width={62.94} height={53.12} />
        </div>
        <div className="ml-[-15px]">
          <Image src="/png/o.png" alt="W" width={45.08} height={53.58} />
        </div>
        <div className="ml-[-15px]">
          <Image src="/png/a.png" alt="W" width={47.73} height={52.11} />
        </div>
        <div className="ml-[-12px]">
          <Image src="/png/h.png" alt="W" width={47.87} height={52.93} />
        </div>
      </div>

      <h1>Hello World</h1>
    </div>
  );
}
