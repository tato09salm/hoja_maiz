'use client';

import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Inter } from 'next/font/google';
import Chatbot from '@/components/Chatbot';

const inter = Inter({ subsets: ['latin'] });

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "115489995010-5uhqgn77pler5s5uakkd2iu34ee1othr.apps.googleusercontent.com";

  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            <GoogleOAuthProvider clientId={googleClientId}>
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  {children}
                  <Chatbot />
                </AuthProvider>
              </QueryClientProvider>
            </GoogleOAuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
