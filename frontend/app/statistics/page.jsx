'use client';

import { useState, useEffect } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import api from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Award, 
  ShieldAlert, 
  Zap, 
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export default function StatisticsPage() {
  const { t, language } = useLanguage();
  const [reloading, setReloading] = useState(false);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['compare-stats'],
    queryFn: async () => {
      const response = await api.get('/models/compare-stats');
      return response.data;
    },
  });

  // Check initial and current execution status
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const res = await api.get('/models/compare-stats/status');
        if (res.data.running) {
          setReloading(true);
        }
      } catch (e) {
        console.error('Error fetching initial stats execution status:', e);
      }
    };
    checkInitialStatus();
  }, []);

  // Poll status endpoint while reloading in background
  useEffect(() => {
    let interval;
    if (reloading) {
      interval = setInterval(async () => {
        try {
          const res = await api.get('/models/compare-stats/status');
          if (!res.data.running) {
            setReloading(false);
            refetch();
          }
        } catch (e) {
          console.error('Error polling stats comparison status:', e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [reloading, refetch]);

  const handleReloadStats = async () => {
    try {
      setReloading(true);
      await api.post('/models/compare-stats/run');
    } catch (e) {
      console.error('Error initiating stats comparison run:', e);
      setReloading(false);
    }
  };

  const getTranslatedInterpretation = (testType, m1, m2, isSignificant) => {
    const isEn = language === 'en';
    if (testType === 'ks') {
      return isSignificant
        ? (isEn 
            ? `The prediction confidences of ${m1} and ${m2} differ significantly in their probability distributions.` 
            : `Las confianzas de predicción de ${m1} y ${m2} difieren significativamente en sus distribuciones de probabilidad.`)
        : (isEn 
            ? `No significant difference in prediction confidence profiles between ${m1} and ${m2}.` 
            : `No hay diferencia significativa en los perfiles de confianza de predicción entre ${m1} y ${m2}.`);
    } else if (testType === 'mw') {
      return isSignificant
        ? (isEn 
            ? `There is a statistically significant difference in the global accuracy/performance between ${m1} and ${m2}.` 
            : `Existe diferencia de precisión estadísticamente significativa en el rendimiento global entre ${m1} y ${m2}.`)
        : (isEn 
            ? `The classification performance of ${m1} and ${m2} is statistically equivalent.` 
            : `El rendimiento de clasificación de ${m1} y ${m2} es estadísticamente equivalente.`);
    } else if (testType === 'levene') {
      return isSignificant
        ? (isEn 
            ? `The dispersion of prediction errors between ${m1} and ${m2} differs significantly (unstable error behavior).` 
            : `La dispersión de los errores de predicción entre ${m1} y ${m2} difiere significativamente (comportamiento de error inestable).`)
        : (isEn 
            ? `Error variances are equivalent. Choosing the lighter, simpler model (e.g. ${m1}) is mathematically justified.` 
            : `Las variaciones de error son equivalentes. Se justifica elegir el modelo más liviano y simple (ej. ${m1}).`);
    }
    return '';
  };

  const getScientificNotation = (val) => {
    if (val === 0) return '0';
    if (val < 0.0001) {
      return val.toExponential(4);
    }
    return val.toFixed(4);
  };

  // Format Recharts data for model metrics comparison
  const metricsChartData = stats?.metrics
    ? Object.entries(stats.metrics).map(([name, val]) => ({
        name: name,
        Accuracy: Math.round(val.accuracy * 1000) / 10,
        F1_Score: Math.round(val.f1_macro * 1000) / 10
      }))
    : [];

  return (
    <ProtectedLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('stats_title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('stats_subtitle')}</p>
          </div>
          <button
            onClick={handleReloadStats}
            disabled={reloading || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-lg text-sm transition-all shadow-sm disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={reloading ? 'animate-spin' : ''} />
            {t('stats_reload_btn')}
          </button>
        </div>

        {reloading && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm font-medium">
            {t('stats_reloading_banner')}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-500 text-sm">{t('loading')}</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
            <AlertCircle className="mx-auto text-red-600 dark:text-red-400 mb-3" size={36} />
            <p className="text-red-800 dark:text-red-300 font-medium">Error al cargar estadísticas</p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-1">
              Asegúrese de haber generado el archivo de caché con `python generar_cache_stats.py`
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Model Summary Table & Performance Comparison Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Metrics Table */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="text-green-600" size={22} />
                  {t('stats_metrics_title')}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-400 uppercase">
                        <th className="py-3 px-4">{t('stats_model')}</th>
                        <th className="py-3 px-4 text-center">{t('stats_acc')}</th>
                        <th className="py-3 px-4 text-center">{t('stats_loss')}</th>
                        <th className="py-3 px-4 text-center">{t('stats_f1')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-700/50 text-sm text-gray-700 dark:text-gray-300">
                      {Object.entries(stats?.metrics || {}).map(([modelName, values]) => (
                        <tr key={modelName} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                          <td className="py-4 px-4 font-semibold text-gray-800 dark:text-white">{modelName}</td>
                          <td className="py-4 px-4 text-center font-medium text-green-600 dark:text-green-400">
                            {(values.accuracy * 100).toFixed(1)}%
                          </td>
                          <td className="py-4 px-4 text-center">{values.loss.toFixed(4)}</td>
                          <td className="py-4 px-4 text-center">{(values.f1_macro * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Performance Comparison Bar Chart */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  {language === 'en' ? 'Performance comparison (%)' : 'Comparación de Rendimiento (%)'}
                </h3>
                <div className="h-60 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricsChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--tw-border-gray-200)" />
                      <XAxis dataKey="name" fontSize={11} tick={{ fill: 'var(--tw-text-gray-500)' }} />
                      <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: 'var(--tw-text-gray-500)' }} />
                      <Tooltip />
                      <Bar dataKey="Accuracy" fill="#10b981" radius={[4, 4, 0, 0]} name={t('stats_acc')} />
                      <Bar dataKey="F1_Score" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('stats_f1')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Kolmogorov-Smirnov Test (KS) */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Zap className="text-indigo-500" size={22} />
                  {t('stats_ks_title')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{t('stats_ks_desc')}</p>
              </div>

              <div className="space-y-4">
                {stats?.kolmogorov_smirnov?.map((test, index) => (
                  <div key={index} className="p-4 rounded-xl border border-gray-150 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-900/10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-150 dark:border-gray-700/50 pb-3 mb-3">
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {test.model_1} <span className="text-gray-400 dark:text-gray-600 font-normal">vs</span> {test.model_2}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {t('stats_val')}: <strong className="text-gray-700 dark:text-gray-300">{test.statistic.toFixed(4)}</strong>
                        </span>
                        <span className="text-xs text-gray-500">
                          {t('stats_p_val')}: <strong className="text-gray-700 dark:text-gray-300">{getScientificNotation(test.p_value)}</strong>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          test.significant
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                        }`}>
                          {t('stats_sig')}: {test.significant ? t('stats_yes') : t('stats_no')}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                      <strong>{t('stats_interpretation')}:</strong> {getTranslatedInterpretation('ks', test.model_1, test.model_2, test.significant)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mann-Whitney U Test */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="text-amber-500" size={22} />
                  {t('stats_mw_title')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{t('stats_mw_desc')}</p>
              </div>

              <div className="space-y-4">
                {stats?.mann_whitney?.map((test, index) => (
                  <div key={index} className="p-4 rounded-xl border border-gray-150 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-900/10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-150 dark:border-gray-700/50 pb-3 mb-3">
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {test.model_1} <span className="text-gray-400 dark:text-gray-600 font-normal">vs</span> {test.model_2}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {t('stats_val')}: <strong className="text-gray-700 dark:text-gray-300">{test.statistic.toFixed(1)}</strong>
                        </span>
                        <span className="text-xs text-gray-500">
                          {t('stats_p_val')}: <strong className="text-gray-700 dark:text-gray-300">{getScientificNotation(test.p_value)}</strong>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          test.significant
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {t('stats_sig')}: {test.significant ? t('stats_yes') : t('stats_no')}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                      <strong>{t('stats_interpretation')}:</strong> {getTranslatedInterpretation('mw', test.model_1, test.model_2, test.significant)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Levene Test */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <FileText className="text-blue-500" size={22} />
                  {t('stats_levene_title')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{t('stats_levene_desc')}</p>
              </div>

              <div className="space-y-4">
                {stats?.levene?.map((test, index) => (
                  <div key={index} className="p-4 rounded-xl border border-gray-150 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-900/10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-150 dark:border-gray-700/50 pb-3 mb-3">
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {test.model_1} <span className="text-gray-400 dark:text-gray-600 font-normal">vs</span> {test.model_2}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {t('stats_val')}: <strong className="text-gray-700 dark:text-gray-300">{test.statistic.toFixed(4)}</strong>
                        </span>
                        <span className="text-xs text-gray-500">
                          {t('stats_p_val')}: <strong className="text-gray-700 dark:text-gray-300">{getScientificNotation(test.p_value)}</strong>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          test.significant
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                        }`}>
                          {t('stats_sig')}: {test.significant ? t('stats_yes') : t('stats_no')}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                      <strong>{t('stats_interpretation')}:</strong> {getTranslatedInterpretation('levene', test.model_1, test.model_2, test.significant)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
