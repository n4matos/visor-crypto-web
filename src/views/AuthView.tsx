import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

type AuthMode = 'login' | 'signup';

interface AuthViewProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function AuthView({
  onLogin,
  onRegister,
  isLoading,
  error,
  onClearError,
}: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLogin = mode === 'login';

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    if (!formData.email) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, isLogin]);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (error) {
      onClearError();
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  }, [formErrors, error, onClearError, successMessage]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isLogin) {
      const success = await onLogin(formData.email, formData.password);
      if (success) {
        setSuccessMessage('Login realizado com sucesso!');
      }
    } else {
      const success = await onRegister(formData.email, formData.password);
      if (success) {
        setSuccessMessage('Conta criada com sucesso!');
      }
    }
  }, [validateForm, isLogin, formData, onLogin, onRegister]);

  const toggleMode = useCallback(() => {
    setMode(prev => (prev === 'login' ? 'signup' : 'login'));
    setFormErrors({});
    setFormData({ email: '', password: '', confirmPassword: '' });
    onClearError();
    setSuccessMessage(null);
  }, [onClearError]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Memoized form title and subtitle
  const { title, subtitle, buttonText, toggleText, toggleAction } = useMemo(() => {
    if (isLogin) {
      return {
        title: 'Bem-vindo de volta',
        subtitle: 'Entre com suas credenciais para acessar o dashboard',
        buttonText: 'Entrar',
        toggleText: 'Ainda não tem uma conta?',
        toggleAction: 'Criar conta',
      };
    }
    return {
      title: 'Criar conta',
      subtitle: 'Preencha os dados abaixo para começar',
      buttonText: 'Criar conta',
      toggleText: 'Já tem uma conta?',
      toggleAction: 'Fazer login',
    };
  }, [isLogin]);

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-action-primary flex items-center justify-center shadow-glow">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-text-primary tracking-tight">
            Visor Crypto
          </span>
        </div>

        {/* Card */}
        <div className="bg-surface-card border border-border-default rounded-2xl p-6 lg:p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              {title}
            </h1>
            <p className="text-sm text-text-secondary">
              {subtitle}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex p-1 bg-action-secondary rounded-lg mb-6">
            <button
              type="button"
              onClick={() => !isLogin && toggleMode()}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200',
                isLogin
                  ? 'bg-surface-elevated text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => isLogin && toggleMode()}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200',
                !isLogin
                  ? 'bg-surface-elevated text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              Cadastro
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-status-success/10 border border-status-success/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
              <p className="text-sm text-status-success">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-status-error/10 border border-status-error/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-status-error flex-shrink-0" />
              <p className="text-sm text-status-error">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-text-secondary">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={cn(
                    'pl-10 h-11 bg-surface-input border-border-default focus:border-border-focus focus:ring-1 focus:ring-border-focus rounded-lg text-text-primary placeholder:text-text-muted',
                    formErrors.email && 'border-status-error focus:border-status-error focus:ring-status-error'
                  )}
                  disabled={isLoading}
                />
              </div>
              {formErrors.email && (
                <p className="text-xs text-status-error">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-text-secondary">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={cn(
                    'pl-10 pr-10 h-11 bg-surface-input border-border-default focus:border-border-focus focus:ring-1 focus:ring-border-focus rounded-lg text-text-primary placeholder:text-text-muted',
                    formErrors.password && 'border-status-error focus:border-status-error focus:ring-status-error'
                  )}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-status-error">{formErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field (Signup only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-text-secondary">
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={cn(
                      'pl-10 pr-10 h-11 bg-surface-input border-border-default focus:border-border-focus focus:ring-1 focus:ring-border-focus rounded-lg text-text-primary placeholder:text-text-muted',
                      formErrors.confirmPassword && 'border-status-error focus:border-status-error focus:ring-status-error'
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-xs text-status-error">{formErrors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-action-primary hover:bg-action-primary-hover text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {buttonText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Mode Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              {toggleText}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-action-primary hover:text-action-primary-hover font-medium transition-colors"
              >
                {toggleAction}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-text-muted">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-text-link hover:underline">
            Termos de Serviço
          </a>{' '}
          e{' '}
          <a href="#" className="text-text-link hover:underline">
            Política de Privacidade
          </a>
          .
        </p>
      </div>
    </div>
  );
}
