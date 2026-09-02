import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "RoleProof — AI Resume Builder",
  description:
    "Craft the perfect resume for any role. AI-powered JD analysis, experience mapping, resume generation, and critique loop.",
  keywords: [
    "resume",
    "AI resume builder",
    "job description analysis",
    "resume critique",
    "career",
  ],
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="selection:bg-primary/15 selection:text-foreground flex min-h-full flex-col">
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
