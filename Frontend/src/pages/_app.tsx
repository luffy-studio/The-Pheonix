import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from 'react';
import { AuthProvider } from "@/lib/context/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#08090C] text-[#F4F4F5] antialiased">
        <Component {...pageProps} />
        <Toaster />
      </div>
    </AuthProvider>
  );
}
