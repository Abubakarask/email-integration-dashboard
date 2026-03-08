import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { authApi, LoginRequestSchema, LoginRequest, RegisterRequestSchema, RegisterRequest } from '../app/data/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLogin, setIsLogin]   = useState(true);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isSubmittingLogin },
    reset: resetLogin,
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors, isSubmitting: isSubmittingSignup },
    reset: resetSignup,
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
  });

  const toggleMode = (loginMode: boolean) => {
    setErrorMsg(null);
    setIsLogin(loginMode);
    if (loginMode) {
      resetSignup();
    } else {
      resetLogin();
    }
  };

  const onLogin = async (data: LoginRequest) => {
    setErrorMsg(null);
    try {
      const response = await authApi.login(data);
      if (response.access_token) {
        navigate('/dashboard'); 
      } else {
        setErrorMsg('Login failed, please check your credentials.');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('An unexpected error occurred. Please try again.');
      }
    }
  };

  const onSignup = async (data: RegisterRequest) => {
    setErrorMsg(null);
    try {
      const response = await authApi.register(data);
      if (response.access_token) {
        navigate('/dashboard'); 
      } else {
        setErrorMsg('Registration failed.');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm text-zinc-400">
            {isLogin ? 'Login to your account to continue' : 'Sign up to get started'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
            {errorMsg}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-mono text-zinc-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerLogin('email')}
                  className={`w-full bg-zinc-800 border ${loginErrors.email ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-4 py-2.5 pl-10 text-zinc-100 text-sm focus:outline-none focus:border-cyan-400`}
                />
              </div>
              {loginErrors.email && <span className="text-xs text-red-500 mt-1 block">{loginErrors.email.message}</span>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono text-zinc-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...registerLogin('password')}
                  className={`w-full bg-zinc-800 border ${loginErrors.password ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-4 py-2.5 pl-10 text-zinc-100 text-sm focus:outline-none focus:border-cyan-400`}
                />
              </div>
              {loginErrors.password && <span className="text-xs text-red-500 mt-1 block">{loginErrors.password.message}</span>}
            </div>

            <button type="submit" disabled={isSubmittingLogin} className="w-full bg-cyan-400 text-black font-semibold text-sm rounded-lg py-2.5 hover:bg-cyan-300 transition flex items-center justify-center mt-6">
              {isSubmittingLogin ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} /> Sign In
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-mono text-zinc-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...registerSignup('name')}
                  className={`w-full bg-zinc-800 border ${signupErrors.name ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-4 py-2.5 pl-10 text-zinc-100 text-sm focus:outline-none focus:border-cyan-400`}
                />
              </div>
              {signupErrors.name && <span className="text-xs text-red-500 mt-1 block">{signupErrors.name.message}</span>}
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-mono text-zinc-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerSignup('email')}
                  className={`w-full bg-zinc-800 border ${signupErrors.email ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-4 py-2.5 pl-10 text-zinc-100 text-sm focus:outline-none focus:border-cyan-400`}
                />
              </div>
              {signupErrors.email && <span className="text-xs text-red-500 mt-1 block">{signupErrors.email.message}</span>}
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-mono text-zinc-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  {...registerSignup('password')}
                  className={`w-full bg-zinc-800 border ${signupErrors.password ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-4 py-2.5 pl-10 text-zinc-100 text-sm focus:outline-none focus:border-cyan-400`}
                />
              </div>
              {signupErrors.password && <span className="text-xs text-red-500 mt-1 block">{signupErrors.password.message}</span>}
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-xs font-mono text-zinc-400 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  id="password_confirmation"
                  type="password"
                  placeholder="••••••••"
                  {...registerSignup('password_confirmation')}
                  className={`w-full bg-zinc-800 border ${signupErrors.password_confirmation ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-4 py-2.5 pl-10 text-zinc-100 text-sm focus:outline-none focus:border-cyan-400`}
                />
              </div>
              {signupErrors.password_confirmation && <span className="text-xs text-red-500 mt-1 block">{signupErrors.password_confirmation.message}</span>}
            </div>

            <button type="submit" disabled={isSubmittingSignup} className="w-full bg-cyan-400 text-black font-semibold text-sm rounded-lg py-2.5 hover:bg-cyan-300 transition flex items-center justify-center mt-6">
              {isSubmittingSignup ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} /> Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-zinc-400">
          {isLogin ? (
            <p>Don't have an account? <span className="text-cyan-400 hover:underline cursor-pointer ml-1" onClick={() => toggleMode(false)}>Create an account</span></p>
          ) : (
            <p>Already have an account? <span className="text-cyan-400 hover:underline cursor-pointer ml-1" onClick={() => toggleMode(true)}>Sign In</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
