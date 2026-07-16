'use client';

import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            <GoogleOAuthProvider clientId="115489995010-5uhqgn77pler5s5uakkd2iu34ee1othr.apps.googleusercontent.com">
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  {children}
                </AuthProvider>
              </QueryClientProvider>
            </GoogleOAuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
