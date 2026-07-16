'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations dictionary
const resources = {
  es: {
    translation: {
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
      'agricultura_inteligente': 'Agricultura Inteligente',

      // Chatbot
      'chatbot_header': 'Asistente Maíz Saludable',
      'chatbot_online': 'En línea',
      'chatbot_tool_used': '-- Herramienta utilizada --',
      'chatbot_tool_calling': '-- Llamando a herramienta --',
      'chatbot_assistant_label': 'ASISTENTE',
      'chatbot_open_aria': 'Abrir asistente de chat',
      'chatbot_placeholder': 'Pregunta algo sobre Maíz Saludable...',
      'chatbot_error': 'Un error ha ocurrido. Por favor, inténtalo de nuevo.',
      'chatbot_clear_confirm': '¿Deseas vaciar el historial de conversación?',
      'chatbot_clear_title': 'Limpiar chat',
      'chatbot_close_title': 'Cerrar chat',
      'chatbot_scan_title': 'Analizar Hoja de Maíz',
      'chatbot_scan_desc': 'Sube una imagen de la hoja de maíz para realizar el diagnóstico automático.',
      'chatbot_scan_btn': 'Seleccionar Imagen',
      'chatbot_scan_formats': 'JPEG, PNG (Solo imágenes)',
      'chatbot_scan_error': 'Por favor, sube solo imágenes.',
      'chatbot_feedback_dashboard': 'Listo, te llevo al Dashboard ahora.',
      'chatbot_feedback_analyze': 'Perfecto, abriendo la página de análisis.',
      'chatbot_feedback_history': 'Entendido, te llevo al historial.',
      'chatbot_feedback_upload': 'Por favor, sube una imagen de tu hoja de maíz en el panel de abajo.',
      'chatbot_greeting': 'Bienvenido, {{name}}. ¿En qué te puedo ayudar?'
    }
  },
  en: {
    translation: {
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
      'agricultura_inteligente': 'Smart Agriculture',

      // Chatbot
      'chatbot_header': 'Healthy Corn Assistant',
      'chatbot_online': 'Online',
      'chatbot_tool_used': '-- Tool used --',
      'chatbot_tool_calling': '-- Calling tool --',
      'chatbot_assistant_label': 'ASSISTANT',
      'chatbot_open_aria': 'Open chat assistant',
      'chatbot_placeholder': 'Ask something about Healthy Corn...',
      'chatbot_error': 'An error occurred. Please try again.',
      'chatbot_clear_confirm': 'Do you want to clear the conversation history?',
      'chatbot_clear_title': 'Clear chat',
      'chatbot_close_title': 'Close chat',
      'chatbot_scan_title': 'Scan Corn Leaf',
      'chatbot_scan_desc': 'Upload an image of a corn leaf to start automatic diagnosis.',
      'chatbot_scan_btn': 'Select Image',
      'chatbot_scan_formats': 'JPEG, PNG (Images only)',
      'chatbot_scan_error': 'Please upload images only.',
      'chatbot_feedback_dashboard': 'Sure, taking you to the Dashboard now.',
      'chatbot_feedback_analyze': 'Perfect, opening the leaf analysis page.',
      'chatbot_feedback_history': 'Understood, taking you to your history.',
      'chatbot_feedback_upload': 'Please upload a photo of your corn leaf below.',
      'chatbot_greeting': 'Welcome, {{name}}. How can I help you?'
    }
  }
};

// Initialize i18next
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: typeof window !== 'undefined' ? localStorage.getItem('language') || 'es' : 'es',
      fallbackLng: 'es',
      interpolation: {
        escapeValue: false
      }
    });
}

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [languageState, setLanguageState] = useState('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language') || 'es';
      i18n.changeLanguage(stored);
      setLanguageState(stored);
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = languageState === 'es' ? 'en' : 'es';
    i18n.changeLanguage(nextLang);
    setLanguageState(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', nextLang);
    }
  };

  const t = (key, options) => i18n.t(key, options) || key;

  // Safe wrapper for language value during SSR to prevent hydration mismatch
  const currentLanguage = mounted ? languageState : 'es';

  return (
    <LanguageContext.Provider value={{ language: currentLanguage, toggleLanguage, t }}>
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
