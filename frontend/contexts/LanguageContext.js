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
      'chatbot_greeting': 'Bienvenido, {{name}}. ¿En qué te puedo ayudar?',

      // Dashboard
      'dashboard_title': 'Dashboard',
      'dashboard_subtitle': 'Resumen de tus análisis de hojas de maíz',
      'dashboard_total_analyses': 'Total Análisis',
      'dashboard_healthy_leaves': 'Hojas Sanas',
      'dashboard_diseased_leaves': 'Hojas Enfermas',
      'dashboard_new_analysis': 'Nuevo Análisis',
      'dashboard_disease_distribution': 'Distribución de Enfermedades',
      'dashboard_no_data': 'No hay datos suficientes',
      'dashboard_analysis_by_type': 'Análisis por Tipo',
      'dashboard_recent_analyses': 'Análisis Recientes',
      'dashboard_view_all': 'Ver todos',
      'dashboard_confidence': '{{percent}}% de confianza',
      'dashboard_healthy': 'Sana',
      'dashboard_diseased': 'Enferma',
      'dashboard_no_recent': 'No hay análisis recientes',

      // Analyze
      'analyze_title': 'Analizar Hoja de Maíz',
      'analyze_subtitle': 'Sube una foto o usa la cámara para analizar la salud de tu hoja',
      'analyze_leaf_image': 'Imagen de la Hoja',
      'analyze_select_file': 'Seleccionar Archivo',
      'analyze_use_camera': 'Usar Cámara',
      'analyze_capture': 'Capturar',
      'analyze_cancel': 'Cancelar',
      'analyze_preview': 'Vista Previa',
      'analyze_analyzing': 'Analizando...',
      'analyze_btn': 'Analizar Hoja',
      'analyze_results_title': 'Resultados del Análisis',
      'analyze_generate_pdf': 'Generar Reporte PDF',
      'analyze_invalid_image': 'Imagen no válida',
      'analyze_invalid_desc': 'Por favor, sube una imagen clara de una hoja de maíz.',
      'analyze_confidence': '{{percent}}% de confianza',
      'analyze_probabilities': 'Probabilidades por Enfermedad',
      'analyze_recommendations': 'Recomendaciones',
      'analyze_symptoms': 'Síntomas',
      'analyze_cultural': 'Manejo Cultural',
      'analyze_chemical': 'Químicos',
      'analyze_biological': 'Biológicos',
      'analyze_pathogen': 'Patógeno',
      'analyze_severity': 'Nivel de severidad',
      'analyze_favorable_cond': 'Condiciones favorables',
      'analyze_warning_note': '⚠️ Nota: Consulte a un ingeniero agrónomo para un plan específico y adaptado a tu cultivo.',
      'analyze_preventive_recs': '✅ Recomendaciones Preventivas',
      'analyze_error_processing': 'Error al procesar la imagen. Por favor, intenta de nuevo.',
      'analyze_camera_error': 'No se pudo acceder a la cámara',

      // History
      'history_title': 'Historial de Análisis',
      'history_subtitle': 'Ver todos tus análisis de hojas de maíz',
      'history_search_placeholder': 'Buscar por diagnóstico...',
      'history_confidence': 'Confianza: {{percent}}%',
      'history_generate_pdf': 'Generar PDF',
      'history_showing_page': 'Mostrando página {{current}} de {{total}}',
      'history_empty': 'No hay análisis en el historial',
      'history_empty_subtitle': 'Comienza analizando tu primera hoja!',

      // Disease Names
      'disease_blight': 'Tizón del norte',
      'disease_common_rust': 'Roya común',
      'disease_gray_leaf_spot': 'Mancha gris de la hoja',
      'disease_healthy': 'Sano',
      'disease_roña_común': 'Roya común',
      'disease_tizón_del_norte': 'Tizón del norte',
      'disease_mancha_gris': 'Mancha gris de la hoja'
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
      'chatbot_greeting': 'Welcome, {{name}}. How can I help you?',

      // Dashboard
      'dashboard_title': 'Dashboard',
      'dashboard_subtitle': 'Summary of your corn leaf analyses',
      'dashboard_total_analyses': 'Total Analyses',
      'dashboard_healthy_leaves': 'Healthy Leaves',
      'dashboard_diseased_leaves': 'Diseased Leaves',
      'dashboard_new_analysis': 'New Analysis',
      'dashboard_disease_distribution': 'Disease Distribution',
      'dashboard_no_data': 'Insufficient data',
      'dashboard_analysis_by_type': 'Analysis by Type',
      'dashboard_recent_analyses': 'Recent Analyses',
      'dashboard_view_all': 'View all',
      'dashboard_confidence': '{{percent}}% confidence',
      'dashboard_healthy': 'Healthy',
      'dashboard_diseased': 'Diseased',
      'dashboard_no_recent': 'No recent analyses',

      // Analyze
      'analyze_title': 'Analyze Corn Leaf',
      'analyze_subtitle': 'Upload a photo or use the camera to analyze the health of your leaf',
      'analyze_leaf_image': 'Leaf Image',
      'analyze_select_file': 'Select File',
      'analyze_use_camera': 'Use Camera',
      'analyze_capture': 'Capture',
      'analyze_cancel': 'Cancel',
      'analyze_preview': 'Preview',
      'analyze_analyzing': 'Analyzing...',
      'analyze_btn': 'Analyze Leaf',
      'analyze_results_title': 'Analysis Results',
      'analyze_generate_pdf': 'Generate PDF Report',
      'analyze_invalid_image': 'Invalid image',
      'analyze_invalid_desc': 'Please upload a clear image of a corn leaf.',
      'analyze_confidence': '{{percent}}% confidence',
      'analyze_probabilities': 'Probabilities by Disease',
      'analyze_recommendations': 'Recommendations',
      'analyze_symptoms': 'Symptoms',
      'analyze_cultural': 'Cultural Management',
      'analyze_chemical': 'Chemicals',
      'analyze_biological': 'Biologicals',
      'analyze_pathogen': 'Pathogen',
      'analyze_severity': 'Severity level',
      'analyze_favorable_cond': 'Favorable conditions',
      'analyze_warning_note': '⚠️ Note: Consult an agronomist for a specific plan adapted to your crop.',
      'analyze_preventive_recs': '✅ Preventive Recommendations',
      'analyze_error_processing': 'Error processing image. Please try again.',
      'analyze_camera_error': 'Could not access camera',

      // History
      'history_title': 'Analysis History',
      'history_subtitle': 'View all your corn leaf analyses',
      'history_search_placeholder': 'Search by diagnosis...',
      'history_confidence': 'Confidence: {{percent}}%',
      'history_generate_pdf': 'Generate PDF',
      'history_showing_page': 'Showing page {{current}} of {{total}}',
      'history_empty': 'No analyses in history',
      'history_empty_subtitle': 'Start by analyzing your first leaf!',

      // Disease Names
      'disease_blight': 'Northern Leaf Blight',
      'disease_common_rust': 'Common Rust',
      'disease_gray_leaf_spot': 'Gray Leaf Spot',
      'disease_healthy': 'Healthy',
      'disease_roña_común': 'Common Rust',
      'disease_tizón_del_norte': 'Northern Leaf Blight',
      'disease_mancha_gris': 'Gray Leaf Spot',

      // Recommendation strings - Roña común
      "Pústulas de color marrón-rojizo en ambas caras de las hojas, que coalescen en estadios avanzados.": "Reddish-brown pustules on both sides of the leaves, which coalesce in advanced stages.",
      "Temperaturas entre 16-25°C y alta humedad relativa (rocío matutino).": "Temperatures between 16-25°C and high relative humidity (morning dew).",
      "Usar variedades resistentes (ej: DK-70-89, P-30F53)": "Use resistant varieties (e.g., DK-70-89, P-30F53)",
      "Rotación de cultivos con leguminosas (2-3 años)": "Crop rotation with legumes (2-3 years)",
      "Eliminar residuos de cosecha": "Remove crop residues",
      "Evitar siembra tardía": "Avoid late planting",
      "Fungicidas protectantes: Mancozeb (2 kg/ha)": "Protectant fungicides: Mancozeb (2 kg/ha)",
      "Fungicidas curativos: Triazoles (Tebuconazol 250 EC, 0.5 L/ha)": "Curative fungicides: Triazoles (Tebuconazole 250 EC, 0.5 L/ha)",
      "Aplicar en los primeros síntomas, repetir cada 15 días si las condiciones son favorables": "Apply at the first symptoms, repeat every 15 days if conditions are favorable",
      "Bacillus subtilis (1 kg/ha)": "Bacillus subtilis (1 kg/ha)",
      "Trichoderma harzianum (2 kg/ha)": "Trichoderma harzianum (2 kg/ha)",
      "Moderada-Alta": "Moderate-High",

      // Recommendation strings - Mancha gris
      "Manchas rectangulares de color gris a marrón, limitadas por las nervaduras de las hojas.": "Rectangular gray to brown spots, limited by leaf veins.",
      "Temperaturas entre 22-30°C y alta humedad (>90%) prolongada.": "Temperatures between 22-30°C and prolonged high humidity (>90%).",
      "Rotación con cultivos no hospedantes (soja, frijol)": "Rotation with non-host crops (soybean, bean)",
      "Labranza mínima para enterrar residuos": "Minimum tillage to bury residues",
      "Manejar la densidad de siembra para mejorar la ventilación": "Manage planting density to improve ventilation",
      "Evitar el exceso de nitrógeno": "Avoid excess nitrogen",
      "Fungicidas triazoles: Propiconazol (0.4 L/ha)": "Triazole fungicides: Propiconazole (0.4 L/ha)",
      "Fungicidas estrobilurinas: Azoxistrobina (0.3 L/ha)": "Strobilurin fungicides: Azoxystrobin (0.3 L/ha)",
      "Aplicar en floración masculina o 2 semanas después": "Apply at male flowering or 2 weeks after",
      "Gliocladium virens": "Gliocladium virens",
      "Extractos de neem (2%)": "Neem extracts (2%)",
      "Moderada": "Moderate",

      // Recommendation strings - Tizón del norte
      "Lesiones alargadas (cigar-shaped) de color marrón grisáceo, con bordes definidos.": "Elongated (cigar-shaped) grayish-brown lesions, with defined edges.",
      "Temperaturas entre 18-27°C y humedad relativa alta (>90%).": "Temperatures between 18-27°C and high relative humidity (>90%).",
      "Usar variedades resistentes (ej: H-513, H-514)": "Use resistant varieties (e.g., H-513, H-514)",
      "Rotación de cultivos (3 años fuera de maíz)": "Crop rotation (3 years out of corn)",
      "Eliminar residuos infectados": "Remove infected residues",
      "Mejorar la ventilación en el cultivo": "Improve ventilation in the crop",
      "Fungicidas: Difenoconazol + Azoxistrobina (0.5 L/ha)": "Fungicides: Difenoconazole + Azoxystrobin (0.5 L/ha)",
      "Aplicar a los primeros signos de la enfermedad": "Apply at the first signs of the disease",
      "Repetición cada 10-14 días según sea necesario": "Repeat every 10-14 days as needed",
      "Pseudomonas fluorescens": "Pseudomonas fluorescens",
      "Bacillus amyloliquefaciens": "Bacillus amyloliquefaciens",
      "Alta": "High",

      // Recommendation strings - Sano
      "La hoja está saludable. Continúa con tu programa de fertilización y riego habitual, y realiza monitoreos semanales del cultivo.": "The leaf is healthy. Continue with your usual fertilization and irrigation schedule, and conduct weekly crop monitoring."
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
