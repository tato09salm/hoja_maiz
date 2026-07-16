'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import api from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];
const EXPERT_SYSTEM = {
    "Roña común": {
        "pathogen": "Puccinia sorghi",
        "symptoms": "Pústulas de color marrón-rojizo en ambas caras de las hojas, que coalescen en estadios avanzados.",
        "favorable_conditions": "Temperaturas entre 16-25°C y alta humedad relativa (rocío matutino).",
        "cultural_controls": [
            "Usar variedades resistentes (ej: DK-70-89, P-30F53)",
            "Rotación de cultivos con leguminosas (2-3 años)",
            "Eliminar residuos de cosecha",
            "Evitar siembra tardía"
        ],
        "chemical_controls": [
            "Fungicidas protectantes: Mancozeb (2 kg/ha)",
            "Fungicidas curativos: Triazoles (Tebuconazol 250 EC, 0.5 L/ha)",
            "Aplicar en los primeros síntomas, repetir cada 15 días si las condiciones son favorables"
        ],
        "biological_controls": [
            "Bacillus subtilis (1 kg/ha)",
            "Trichoderma harzianum (2 kg/ha)"
        ],
        "severity_level": "Moderada-Alta"
    },
    "Mancha gris": {
        "pathogen": "Cercospora zeae-maydis",
        "symptoms": "Manchas rectangulares de color gris a marrón, limitadas por las nervaduras de las hojas.",
        "favorable_conditions": "Temperaturas entre 22-30°C y alta humedad (>90%) prolongada.",
        "cultural_controls": [
            "Rotación con cultivos no hospedantes (soja, frijol)",
            "Labranza mínima para enterrar residuos",
            "Manejar la densidad de siembra para mejorar la ventilación",
            "Evitar el exceso de nitrógeno"
        ],
        "chemical_controls": [
            "Fungicidas triazoles: Propiconazol (0.4 L/ha)",
            "Fungicidas estrobilurinas: Azoxistrobina (0.3 L/ha)",
            "Aplicar en floración masculina o 2 semanas después"
        ],
        "biological_controls": [
            "Gliocladium virens",
            "Extractos de neem (2%)"
        ],
        "severity_level": "Moderada"
    },
    "Tizón del norte": {
        "pathogen": "Exserohilum turcicum",
        "symptoms": "Lesiones alargadas (cigar-shaped) de color marrón grisáceo, con bordes definidos.",
        "favorable_conditions": "Temperaturas entre 18-27°C y humedad relativa alta (>90%).",
        "cultural_controls": [
            "Usar variedades resistentes (ej: H-513, H-514)",
            "Rotación de cultivos (3 años fuera de maíz)",
            "Eliminar residuos infectados",
            "Mejorar la ventilación en el cultivo"
        ],
        "chemical_controls": [
            "Fungicidas: Difenoconazol + Azoxistrobina (0.5 L/ha)",
            "Aplicar a los primeros signos de la enfermedad",
            "Repetición cada 10-14 días según sea necesario"
        ],
        "biological_controls": [
            "Pseudomonas fluorescens",
            "Bacillus amyloliquefaciens"
        ],
        "severity_level": "Alta"
    },
    "Sano": {
        "message": "La hoja está saludable. Continúa con tu programa de fertilización y riego habitual, y realiza monitoreos semanales del cultivo."
    }
};

const CLASS_NAMES = ["Mancha gris", "Roña común", "Tizón del norte", "Sano"];

const generatePDF = async (analysis, language, t) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    const isEn = language === 'en';

    const getDiseaseTranslation = (name) => {
        if (!name) return '';
        const key = `disease_${name.toLowerCase().replace(/\s+/g, '_')}`;
        const translated = t(key);
        if (translated !== key) return translated;
        if (name.toLowerCase() === 'sano' || name.toLowerCase() === 'healthy') return t('disease_healthy');
        return name;
    };

    doc.setFillColor(34, 139, 34);
    doc.roundedRect(10, 10, pageWidth - 20, 35, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(isEn ? 'Corn Leaf Health Report' : 'Reporte de Salud de la Hoja de Maíz', pageWidth / 2, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    doc.text(isEn ? `Date: ${now.toLocaleDateString('en-US')}    Time: ${now.toLocaleTimeString('en-US')}` : `Fecha: ${now.toLocaleDateString('es-ES')}    Hora: ${now.toLocaleTimeString('es-ES')}`, 15, 55);
    y = 65;

    doc.setFillColor(240, 250, 240);
    doc.roundedRect(10, y, pageWidth - 20, 100, 4, 4, 'F');
    y += 10;

    if (analysis.image_data) {
        try {
            doc.addImage(analysis.image_data, 'JPEG', 15, y, 55, 55);
        } catch (e) {
            console.log('No se pudo agregar la imagen');
        }
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(isEn ? 'Analysis Results:' : 'Resultado del Análisis:', 75, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    if (analysis.is_healthy) {
        doc.text(isEn ? 'Status: Healthy' : 'Estado: Saludable', 75, y);
        y += 7;
        doc.text(isEn ? 'Your corn leaf is doing great!' : 'Tu hoja de maíz está bien!', 75, y);
    } else {
        doc.text(isEn ? 'Status: Needs Attention' : 'Estado: Necesita Atención', 75, y);
        y += 7;
        doc.text(isEn ? `Problem: ${getDiseaseTranslation(analysis.diagnosis_class)}` : `Problema: ${getDiseaseTranslation(analysis.diagnosis_class)}`, 75, y);
        y += 7;
        doc.text(isEn ? `Diagnostic confidence: ${Math.round(analysis.confidence * 100)}%` : `Seguridad del diagnóstico: ${Math.round(analysis.confidence * 100)}%`, 75, y);
    }
    y += 18;

    if (y > pageHeight - 70) {
        doc.addPage();
        y = 20;
    }

    doc.setFillColor(225, 240, 225);
    doc.roundedRect(10, y, pageWidth - 20, 55, 4, 4, 'F');
    y += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(isEn ? 'Probabilities:' : 'Probabilidades:', 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const classProbabilities = {};
    CLASS_NAMES.forEach(name => {
        classProbabilities[name] = name === analysis.diagnosis_class ? analysis.confidence : 0;
    });

    Object.entries(classProbabilities).forEach(([className, prob]) => {
        const pct = Math.round(prob * 100);
        doc.text(`- ${getDiseaseTranslation(className)}: ${pct}%`, 20, y);
        y += 6;
    });
    y += 12;

    const recommendations = analysis.recommendations || EXPERT_SYSTEM[analysis.diagnosis_class] || {};

    if (analysis.is_healthy) {
        if (y > pageHeight - 80) {
            doc.addPage();
            y = 20;
        }

        doc.setFillColor(210, 250, 210);
        doc.roundedRect(10, y, pageWidth - 20, 60, 4, 4, 'F');
        y += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(isEn ? 'Preventive Maintenance:' : 'Mantenimiento Preventivo:', 15, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(t(recommendations.message || EXPERT_SYSTEM["Sano"].message), 170);
        doc.text(lines, 20, y);
    } else {
        const sections = [
            {
                title: isEn ? 'Symptoms and Conditions' : 'Síntomas y Condiciones',
                content: [
                    isEn ? `Appearance: ${t(recommendations.symptoms)}` : `Cómo se ve: ${t(recommendations.symptoms)}`,
                    isEn ? `Favorable conditions: ${t(recommendations.favorable_conditions)}` : `Condiciones favorables: ${t(recommendations.favorable_conditions)}`
                ]
            },
            {
                title: isEn ? 'Cultural Management (Chemical-free)' : 'Manejo Cultural (Sin Químicos)',
                content: (recommendations.cultural_controls || []).map(item => t(item))
            },
            {
                title: isEn ? 'Chemical Options' : 'Opciones Químicas',
                content: (recommendations.chemical_controls || []).map(item => t(item))
            },
            {
                title: isEn ? 'Biological Alternatives' : 'Alternativas Biológicas',
                content: (recommendations.biological_controls || []).map(item => t(item))
            }
        ];

        sections.forEach(sec => {
            if (y > pageHeight - 80) {
                doc.addPage();
                y = 20;
            }

            doc.setFillColor(235, 245, 235);
            doc.roundedRect(10, y, pageWidth - 20, 10, 4, 4, 'F');
            y += 7;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(sec.title, 15, y);
            y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            sec.content.forEach(item => {
                if (y > pageHeight - 25) {
                    doc.addPage();
                    y = 20;
                }
                const textLines = doc.splitTextToSize(`- ${item}`, 165);
                doc.text(textLines, 20, y);
                y += (textLines.length * 5) + 3;
            });
            y += 8;
        });
    }

    const footerY = pageHeight - 12;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(isEn ? 'Advice: If you have doubts, consult an agricultural expert.' : 'Consejo: Si tienes dudas, consulta a un experto en agricultura.', pageWidth / 2, footerY, { align: 'center' });

    doc.save(isEn ? `analysis-${analysis.id}.pdf` : `analisis-${analysis.id}.pdf`);
};

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { language, t } = useLanguage();
  
  const { data: paginatedData, isLoading, error, refetch } = useQuery({
    queryKey: ['analyses', currentPage],
    queryFn: async () => {
      console.log("Fetching analyses...");
      const response = await api.get('/analyses', {
        params: {
          page: currentPage,
          per_page: 10
        }
      });
      console.log("Analyses response data:", response.data);
      return response.data;
    },
  });

  console.log("paginatedData:", paginatedData);
  const analyses = paginatedData?.items || [];
  const totalPages = paginatedData?.total_pages || 1;
  console.log("analyses:", analyses);

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.diagnosis_class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDiseaseTranslation = (name) => {
    if (!name) return '';
    const key = `disease_${name.toLowerCase().replace(/\s+/g, '_')}`;
    const translated = t(key);
    if (translated !== key) return translated;
    if (name.toLowerCase() === 'sano' || name.toLowerCase() === 'healthy') return t('disease_healthy');
    return name;
  };

  return (
    <ProtectedLayout>
      <div className="p-4 md:p-6">
        <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('history_title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('history_subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('history_search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredAnalyses.length > 0 ? (
          <>
            <div className="space-y-3">
              {filteredAnalyses.map((analysis) => (
                <div key={analysis.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <img 
                      src={analysis.image_data} 
                      alt="Hoja analizada" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white text-base">
                          {language === 'en' ? 'Analysis' : 'Análisis'} #{analysis.id} - {getDiseaseTranslation(analysis.diagnosis_class)}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          analysis.is_healthy 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {analysis.is_healthy ? t('dashboard_healthy') : t('dashboard_diseased')}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {t('history_confidence', { percent: (analysis.confidence * 100).toFixed(1) })}
                      </p>
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs mt-1">
                        <Clock size={14} />
                        <span>{new Date(analysis.created_at).toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => generatePDF(analysis, language, t)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-xs transition-all"
                    >
                      <FileText size={16} />
                      {t('history_generate_pdf')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('history_showing_page', { current: currentPage, total: totalPages })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      currentPage === page 
                        ? 'bg-green-600 text-white' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('history_empty')}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t('history_empty_subtitle')}</p>
          </div>
        )}
      </div>
      </div>
    </ProtectedLayout>
  );
}