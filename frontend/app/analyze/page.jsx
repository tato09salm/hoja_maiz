'use client';

import { useState, useRef, useEffect } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import { 
  Camera, 
  Upload, 
  X, 
  Search,
  FileText
} from 'lucide-react';

export default function AnalyzePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('cultural');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const checkPendingImage = () => {
      if (typeof window !== 'undefined') {
        const pendingImage = sessionStorage.getItem('pending_analyze_image');
        if (pendingImage) {
          sessionStorage.removeItem('pending_analyze_image');
          const filename = sessionStorage.getItem('pending_analyze_filename') || 'photo.jpg';
          sessionStorage.removeItem('pending_analyze_filename');
          
          try {
            const byteString = atob(pendingImage.split(',')[1]);
            const mimeString = pendingImage.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const newFile = new File([blob], filename, { type: mimeString });
            
            setPreview(pendingImage);
            setFile(newFile);
            
            autoSubmit(newFile);
          } catch (err) {
            console.error('Error loading pending image from chatbot:', err);
          }
        }
      }
    };

    checkPendingImage();

    if (typeof window !== 'undefined') {
      window.addEventListener('pending-analyze-image', checkPendingImage);
      return () => {
        window.removeEventListener('pending-analyze-image', checkPendingImage);
      };
    }
  }, []);

  const autoSubmit = async (uploadFile) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await api.post('/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (error) {
      console.error('Error completo:', error);
      let errorMsg = 'Error al procesar la imagen. Por favor, intenta de nuevo.';
      if (error.response) {
        errorMsg += ` (Error ${error.response.status}: ${JSON.stringify(error.response.data)})`;
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
      setResult(null);
    }
  };

  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('No se pudo acceder a la cámara');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/jpeg');
      setPreview(dataURL);
      
      const byteString = atob(dataURL.split(',')[1]);
      const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const newFile = new File([blob], 'photo.jpg', { type: mimeString });
      setFile(newFile);
      setResult(null);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
    setShowCamera(false);
  };

  const clearImage = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
      
      // Invalidate queries to refresh history and dashboard
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (error) {
      console.error('Error completo:', error);
      let errorMsg = 'Error al procesar la imagen. Por favor, intenta de nuevo.';
      
      if (error.response) {
        errorMsg += ` (Error ${error.response.status}: ${JSON.stringify(error.response.data)})`;
      }
      
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!result || !result.is_corn_leaf) return;

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

    if (preview) {
      try {
        doc.addImage(preview, 'JPEG', 15, y, 55, 55);
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
    
    if (result.diagnosis.is_healthy) {
      doc.text('Estado: Saludable', 75, y);
      y += 7;
      doc.text('Tu hoja de maíz está bien!', 75, y);
    } else {
      doc.text('Estado: Necesita Atención', 75, y);
      y += 7;
      doc.text(`Problema: ${result.diagnosis.class}`, 75, y);
      y += 7;
      doc.text(`Seguridad del diagnóstico: ${Math.round(result.diagnosis.confidence * 100)}%`, 75, y);
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
    
    Object.entries(result.class_probabilities).forEach(([className, prob]) => {
      const pct = Math.round(prob * 100);
      doc.text(`- ${className}: ${pct}%`, 20, y);
      y += 6;
    });
    y += 12;

    if (result.diagnosis.is_healthy) {
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
      const lines = doc.splitTextToSize(result.recommendations.message, 170);
      doc.text(lines, 20, y);
    } else {
      const recs = result.recommendations;
      const sections = [
        {
          title: 'Síntomas y Condiciones',
          content: [
            `Cómo se ve: ${recs.symptoms}`,
            `Condiciones favorables: ${recs.favorable_conditions}`
          ]
        },
        {
          title: 'Manejo Cultural (Sin Químicos)',
          content: recs.cultural_controls
        },
        {
          title: 'Opciones Químicas',
          content: recs.chemical_controls
        },
        {
          title: 'Alternativas Biológicas',
          content: recs.biological_controls
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

    doc.save('reporte-salud-maiz.pdf');
  };

  return (
    <ProtectedLayout>
      <div className="p-4 md:p-6">
        <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Analizar Hoja de Maíz</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Sube una foto o usa la cámara para analizar la salud de tu hoja</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Imagen de la Hoja</h2>

            {!showCamera && (
              <div className="flex flex-wrap gap-2 mb-3">
                <label className="px-3 py-2 border border-green-600 text-green-600 dark:border-green-400 dark:text-green-400 rounded-md font-medium hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer flex items-center gap-2 text-sm">
                  <Upload size={18} />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  Seleccionar Archivo
                </label>
                <button
                  onClick={startCamera}
                  className="px-3 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 flex items-center gap-2 text-sm"
                >
                  <Camera size={18} />
                  Usar Cámara
                </button>
              </div>
            )}

            {showCamera && (
              <div className="mb-3">
                <div className="relative rounded-lg overflow-hidden bg-black w-full max-w-md mx-auto">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-48 md:h-64 object-cover"
                  />
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={capturePhoto}
                    className="px-5 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 text-sm"
                  >
                    Capturar
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-5 py-2 border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {preview && (
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="w-full md:w-56 rounded-lg shadow"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Vista Previa</h3>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full md:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-md flex items-center gap-2 text-sm"
                  >
                    <Search size={18} />
                    {loading ? 'Analizando...' : 'Analizar Hoja'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Resultados del Análisis</h2>
                {result.is_corn_leaf && (
                  <button
                    onClick={generatePDF}
                    className="mt-2 md:mt-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center gap-2 text-sm"
                  >
                    <FileText size={16} />
                    Generar Reporte PDF
                  </button>
                )}
              </div>

              {!result.is_corn_leaf ? (
                <div className="p-4 rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 text-center">
                  <div className="text-3xl mb-2">⚠️</div>
                  <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-1">Imagen no válida</h3>
                  <p className="text-yellow-700 dark:text-yellow-400 mb-3 text-sm">{result.validation_message}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">Por favor, sube una imagen clara de una hoja de maíz.</p>
                </div>
              ) : (
                <>
                  <div className={`mb-4 p-4 rounded-lg border ${
                    result.diagnosis.is_healthy 
                      ? 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-900/20' 
                      : 'border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                  }`}>
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="text-4xl">
                        {result.diagnosis.is_healthy ? '✅' : '⚠️'}
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-800 dark:text-white">
                          {result.diagnosis.class}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 text-sm">
                          {(result.diagnosis.confidence * 100).toFixed(1)}% de confianza
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Probabilidades por Enfermedad
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(result.class_probabilities).map(([className, prob]) => (
                        <div key={className} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{className}</span>
                              <span className="font-bold text-gray-700 dark:text-gray-300">{(prob * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  className === result.diagnosis.class 
                                    ? 'bg-green-500' 
                                    : 'bg-blue-400'
                                }`}
                                style={{ width: `${prob * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!result.diagnosis.is_healthy && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                        Recomendaciones
                      </h3>

                      <div className="flex flex-wrap gap-1 mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                        {[
                          { id: 'symptoms', label: 'Síntomas' },
                          { id: 'cultural', label: 'Manejo Cultural' },
                          { id: 'chemical', label: 'Químicos' },
                          { id: 'biological', label: 'Biológicos' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1.5 rounded-t text-xs font-medium transition-all ${
                              activeTab === tab.id
                                ? 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 border-b-2 border-green-600 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="text-xs">
                        {activeTab === 'symptoms' && (
                          <div className="space-y-1.5 text-gray-700 dark:text-gray-300">
                            <p><strong>Patógeno:</strong> {result.recommendations.pathogen}</p>
                            <p><strong>Síntomas:</strong> {result.recommendations.symptoms}</p>
                            <p><strong>Condiciones favorables:</strong> {result.recommendations.favorable_conditions}</p>
                            <p><strong>Nivel de severidad:</strong> {result.recommendations.severity_level}</p>
                          </div>
                        )}
                        {activeTab === 'cultural' && (
                          <ul className="list-disc list-inside space-y-1.5 text-gray-700 dark:text-gray-300">
                            {result.recommendations.cultural_controls.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {activeTab === 'chemical' && (
                          <ul className="list-disc list-inside space-y-1.5 text-gray-700 dark:text-gray-300">
                            {result.recommendations.chemical_controls.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {activeTab === 'biological' && (
                          <ul className="list-disc list-inside space-y-1.5 text-gray-700 dark:text-gray-300">
                            {result.recommendations.biological_controls.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
                        ⚠️ Nota: Consulte a un ingeniero agrónomo para un plan específico y adaptado a tu cultivo.
                      </p>
                    </div>
                  )}

                  {result.diagnosis.is_healthy && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                        ✅ Recomendaciones Preventivas
                      </h3>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        {result.recommendations.message}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}