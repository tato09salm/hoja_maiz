'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Translations dictionary
const translations = {
  es: {
    // General
    'maiz_saludable': 'Maíz Saludable',
    'detector_enfermedades': 'Detector de Enfermedades',
    'cerrar_sesion': 'Cerrar Sesión',
    'loading': 'Cargando...',
    
    // Navbar/Sidebar
    'dashboard': 'Dashboard',
    'analizar_hoja': 'Analizar Hoja',
    'historial': 'Historial',
    'usuarios': 'Usuarios',
    
    // Login
    'bienvenido': 'Bienvenido de nuevo',
    'crea_tu_cuenta': 'Crea tu cuenta',
    'ingresa_credenciales': 'Ingresa tus credenciales para acceder',
    'comienza_experiencia': 'Comienza tu experiencia de agricultura inteligente',
    'nombre_completo': 'Nombre Completo',
    'tu_nombre': 'Tu nombre',
    'correo_electronico': 'Correo Electrónico',
    'tu_email': 'tu@email.com',
    'contrasena': 'Contraseña',
    'ingresa_contrasena': '••••••••',
    'iniciar_sesion': 'Iniciar Sesión',
    'crear_cuenta': 'Crear Cuenta',
    'o_continua_con': 'o continúa con',
    'no_tienes_cuenta': '¿No tienes cuenta? Regístrate',
    'ya_tienes_cuenta': '¿Ya tienes cuenta? Inicia sesión',
    'error_ocurrido': 'Ocurrió un error',
    'error_login_google': 'Error al iniciar sesión con Google',
    
    // Landing
    'cultiva_futuro': 'Cultiva el futuro de tu maíz',
    'detecta_enfermedades_rapido': 'Detecta enfermedades de forma rápida y precisa con inteligencia artificial. Protege tus cultivos y maximiza tu producción.',
    'ia_avanzada': 'IA Avanzada',
    'modelos_vanguardia': 'Modelos de vanguardia',
    'deteccion_rapida': 'Detección Rápida',
    'resultados_segundos': 'Resultados en segundos',
    'mejora_rendimiento': 'Mejora tu rendimiento',
    'decisiones_informadas': 'Toma decisiones informadas',
    'facil_usar': 'Fácil de usar',
    'interfaz_intuitiva': 'Interfaz intuitiva',
    'agricultores_confian': '+2,500 agricultores confían en nosotros',
    'agricultura_inteligente': 'Agricultura Inteligente'
  },
  en: {
    // General
    'maiz_saludable': 'Healthy Corn',
    'detector_enfermedades': 'Disease Detector',
    'cerrar_sesion': 'Log Out',
    'loading': 'Loading...',
    
    // Navbar/Sidebar
    'dashboard': 'Dashboard',
    'analizar_hoja': 'Analyze Leaf',
    'historial': 'History',
    'usuarios': 'Users',
    
    // Login
    'bienvenido': 'Welcome back',
    'crea_tu_cuenta': 'Create your account',
    'ingresa_credenciales': 'Enter your credentials to access',
    'comienza_experiencia': 'Start your smart agriculture experience',
    'nombre_completo': 'Full Name',
    'tu_nombre': 'Your name',
    'correo_electronico': 'Email Address',
    'tu_email': 'your@email.com',
    'contrasena': 'Password',
    'ingresa_contrasena': '••••••••',
    'iniciar_sesion': 'Sign In',
    'crear_cuenta': 'Create Account',
    'o_continua_con': 'or continue with',
    'no_tienes_cuenta': "Don't have an account? Sign up",
    'ya_tienes_cuenta': 'Already have an account? Sign in',
    'error_ocurrido': 'An error occurred',
    'error_login_google': 'Error logging in with Google',
    
    // Landing
    'cultiva_futuro': 'Grow the future of your corn',
    'detecta_enfermedades_rapido': 'Detect diseases quickly and accurately with artificial intelligence. Protect your crops and maximize your production.',
    'ia_avanzada': 'Advanced AI',
    'modelos_vanguardia': 'Cutting-edge models',
    'deteccion_rapida': 'Fast Detection',
    'resultados_segundos': 'Results in seconds',
    'mejora_rendimiento': 'Improve your yield',
    'decisiones_informadas': 'Make informed decisions',
    'facil_usar': 'Easy to use',
    'interfaz_intuitiva': 'Intuitive interface',
    'agricultores_confian': '+2,500 farmers trust us',
    'agricultura_inteligente': 'Smart Agriculture'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'es';
    }
    return 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'es' ? 'en' : 'es'));
  };

  const t = (key) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
