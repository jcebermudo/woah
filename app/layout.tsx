import { Inter } from "next/font/google";
import "./globals.css";

const myFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
