'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import api from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Leaf
} from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
  });

  const chartData = stats?.disease_distribution 
    ? Object.entries(stats.disease_distribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <ProtectedLayout>
      <div className="p-4 md:p-6">
        <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Resumen de tus análisis de hojas de maíz</p>
      </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Análisis</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats?.total_analyses || 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Activity size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hojas Sanas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.healthy_count || 0}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hojas Enfermas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.diseased_count || 0}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <Link href="/analyze" className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-xl shadow-sm text-white hover:from-green-700 hover:to-green-800 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-100">Nuevo Análisis</p>
              <p className="text-lg font-bold">Analizar Hoja</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Leaf size={20} />
            </div>
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-3">Distribución de Enfermedades</h3>
          <div className="h-56">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--tw-bg-white)', 
                      borderColor: 'var(--tw-border-gray-200)',
                      color: 'var(--tw-text-gray-800)' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-3">Análisis por Tipo</h3>
          <div className="h-56">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--tw-border-gray-200)" />
                  <XAxis dataKey="name" fontSize={12} tick={{ fill: 'var(--tw-text-gray-600)' }} />
                  <YAxis fontSize={12} tick={{ fill: 'var(--tw-text-gray-600)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--tw-bg-white)', 
                      borderColor: 'var(--tw-border-gray-200)',
                      color: 'var(--tw-text-gray-800)' 
                    }} 
                  />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Análisis Recientes</h3>
          <Link href="/history" className="text-green-600 hover:text-green-700 dark:text-green-400 font-medium text-xs">
            Ver todos
          </Link>
        </div>
        <div className="space-y-2">
          {stats?.recent_analyses?.length > 0 ? (
            stats.recent_analyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={analysis.image_data} 
                    alt="Hoja" 
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white text-sm">{analysis.diagnosis_class}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(analysis.confidence * 100).toFixed(1)}% de confianza
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    analysis.is_healthy 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {analysis.is_healthy ? 'Sana' : 'Enferma'}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
                    <Clock size={12} />
                    <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm">No hay análisis recientes</p>
          )}
        </div>
      </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}