'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { Sprout, Eye, EyeOff, Lock, Mail, User, Loader2, ChevronRight, Leaf, Brain, Sparkles, TrendingUp, Cpu } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '@/utils/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const { login, register, user, fetchUser } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setError(''); // Clear any errors on component mount
  }, []);
  
  useEffect(() => {
    setError(''); // Clear error when switching between login/register
  }, [isLogin]);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
        await login(formData.email, formData.password);
      }
      router.push('/dashboard');
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.detail || t('error_ocurrido'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google success:', credentialResponse);
      setLoading(true);
      const response = await api.post('/auth/google', null, {
        params: { token: credentialResponse.credential }
      });
      console.log('Auth response:', response.data);
      localStorage.setItem('token', response.data.access_token);
      
      await fetchUser();
      
      console.log('Pushing to dashboard');
      router.push('/dashboard');
    } catch (err) {
      console.error('Google login error:', err);
      console.error('Error details:', err.response?.data);
      // Show the exact error message from the backend, default to generic
      setError(err.response?.data?.detail || t('error_login_google'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(t('error_login_google'));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      {/* Left side - Illustration & Info */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-12 items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-emerald-400/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-green-300/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 w-full max-w-lg text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Sprout className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t('maiz_saludable')}</h2>
              <p className="text-emerald-100 text-sm">{t('agricultura_inteligente')}</p>
            </div>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            {t('cultiva_futuro')}
          </h1>
          <p className="text-emerald-100 text-lg mb-10 leading-relaxed">
            {t('detecta_enfermedades_rapido')}
          </p>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="mt-1 p-2 bg-yellow-400/20 rounded-lg">
                <Brain className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{t('ia_avanzada')}</h3>
                <p className="text-emerald-100 text-sm">{t('modelos_vanguardia')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="mt-1 p-2 bg-green-400/20 rounded-lg">
                <Leaf className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{t('deteccion_rapida')}</h3>
                <p className="text-emerald-100 text-sm">{t('resultados_segundos')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="mt-1 p-2 bg-lime-400/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-lime-300" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{t('mejora_rendimiento')}</h3>
                <p className="text-emerald-100 text-sm">{t('decisiones_informadas')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="mt-1 p-2 bg-teal-400/20 rounded-lg">
                <Cpu className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{t('facil_usar')}</h3>
                <p className="text-emerald-100 text-sm">{t('interfaz_intuitiva')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div>
              <p className="font-semibold text-sm">{t('agricultores_confian')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('maiz_saludable')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('agricultura_inteligente')}</p>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <Sparkles className="w-8 h-8 text-yellow-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLogin ? t('bienvenido') : t('crea_tu_cuenta')}
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400 mt-2">
                {isLogin 
                  ? t('ingresa_credenciales') 
                  : t('comienza_experiencia')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl text-sm flex items-center gap-2 animate-pulse">
                  <span className="font-semibold">{error.startsWith('Error') ? 'Error' : t('error_ocurrido').split(' ')[0]}:</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('nombre_completo')}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="name"
                        type="text"
                        placeholder={t('tu_nombre')}
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 h-11 text-base border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:ring-green-500 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('correo_electronico')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('tu_email')}
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 h-11 text-base border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:ring-green-500 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('contrasena')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('ingresa_contrasena')}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10 h-11 text-base border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:ring-green-500 focus-visible:ring-offset-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('loading') || 'Cargando...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isLogin ? t('iniciar_sesion') : t('crear_cuenta')}
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t('o_continua_con')}</span>
                </div>
              </div>

              <div className="flex justify-center">
                {mounted && (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    shape="pill"
                    theme={theme === 'dark' ? 'filled_black' : 'outline'}
                    text="signin_with"
                  />
                )}
              </div>
            </CardContent>
            
            <CardFooter className="justify-center pb-8">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors flex items-center gap-1"
              >
                {isLogin ? t('no_tienes_cuenta') : t('ya_tienes_cuenta')}
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
