'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import api from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
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

const generatePDF = async (analysis) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    doc.setFillColor(34, 139, 34);
    doc.roundedRect(10, 10, pageWidth - 20, 35, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Salud de la Hoja de Maíz', pageWidth / 2, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    doc.text(`Fecha: ${now.toLocaleDateString('es-ES')}    Hora: ${now.toLocaleTimeString('es-ES')}`, 15, 55);
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
    doc.text('Resultado del Análisis:', 75, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    if (analysis.is_healthy) {
        doc.text('Estado: Saludable', 75, y);
        y += 7;
        doc.text('Tu hoja de maíz está bien!', 75, y);
    } else {
        doc.text('Estado: Necesita Atención', 75, y);
        y += 7;
        doc.text(`Problema: ${analysis.diagnosis_class}`, 75, y);
        y += 7;
        doc.text(`Seguridad del diagnóstico: ${Math.round(analysis.confidence * 100)}%`, 75, y);
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
    doc.text('Probabilidades:', 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const classProbabilities = {};
    CLASS_NAMES.forEach(name => {
        classProbabilities[name] = name === analysis.diagnosis_class ? analysis.confidence : 0;
    });

    Object.entries(classProbabilities).forEach(([className, prob]) => {
        const pct = Math.round(prob * 100);
        doc.text(`- ${className}: ${pct}%`, 20, y);
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
        doc.text('Mantenimiento Preventivo:', 15, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(recommendations.message, 170);
        doc.text(lines, 20, y);
    } else {
        const sections = [
            {
                title: 'Síntomas y Condiciones',
                content: [
                    `Cómo se ve: ${recommendations.symptoms}`,
                    `Condiciones favorables: ${recommendations.favorable_conditions}`
                ]
            },
            {
                title: 'Manejo Cultural (Sin Químicos)',
                content: recommendations.cultural_controls
            },
            {
                title: 'Opciones Químicas',
                content: recommendations.chemical_controls
            },
            {
                title: 'Alternativas Biológicas',
                content: recommendations.biological_controls
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
    doc.text('Consejo: Si tienes dudas, consulta a un experto en agricultura.', pageWidth / 2, footerY, { align: 'center' });

    doc.save(`analisis-${analysis.id}.pdf`);
};

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
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

  return (
    <ProtectedLayout>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Historial de Análisis</h1>
          <p className="text-gray-500 mt-1 text-sm">Ver todos tus análisis de hojas de maíz</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por diagnóstico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
                  <div key={analysis.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50/30 transition-all">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <img 
                        src={analysis.image_data} 
                        alt="Hoja analizada" 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800 text-base">Análisis #{analysis.id} - {analysis.diagnosis_class}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            analysis.is_healthy 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {analysis.is_healthy ? 'Sana' : 'Enferma'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          Confianza: {(analysis.confidence * 100).toFixed(1)}%
                        </p>
                        <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                          <Clock size={14} />
                          <span>{new Date(analysis.created_at).toLocaleString('es-ES')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => generatePDF(analysis)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-xs transition-all"
                      >
                        <FileText size={16} />
                        Generar PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay análisis en el historial</p>
              <p className="text-gray-400 text-sm mt-2">Comienza analizando tu primera hoja!</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}