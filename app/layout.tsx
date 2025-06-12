import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const myFont = localFont({
  src: "../public/fonts/Satoshi-Variable.ttf",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${myFont.className} antialiased selection:bg-[#803DFF] selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
