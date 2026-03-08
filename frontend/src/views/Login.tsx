import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { authApi, LoginRequestSchema, LoginRequest, RegisterRequestSchema, RegisterRequest } from '../app/data/auth';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLogin, setIsLogin]   = useState(true);

  // Define two separated forms so we can distinctively match validation
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
      resetSignup(); // clear signup fields
    } else {
      resetLogin();  // clear login fields
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
    <div className="login-container">
      <div className="login-glass-card">
        <div className="login-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Login to your account to continue' : 'Sign up to get started'}</p>
        </div>

        {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

        {isLogin ? (
          <form onSubmit={handleLoginSubmit(onLogin)} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerLogin('email')}
                  className={loginErrors.email ? 'input-error' : ''}
                />
              </div>
              {loginErrors.email && <span className="error-text">{loginErrors.email.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...registerLogin('password')}
                  className={loginErrors.password ? 'input-error' : ''}
                />
              </div>
              {loginErrors.password && <span className="error-text">{loginErrors.password.message}</span>}
            </div>

            <button type="submit" disabled={isSubmittingLogin} className="submit-button">
              {isSubmittingLogin ? (
                <span className="button-content">
                  <Loader2 className="spinner" size={20} /> Sign In
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit(onSignup)} className="login-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon" size={20} />
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...registerSignup('name')}
                  className={signupErrors.name ? 'input-error' : ''}
                />
              </div>
              {signupErrors.name && <span className="error-text">{signupErrors.name.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerSignup('email')}
                  className={signupErrors.email ? 'input-error' : ''}
                />
              </div>
              {signupErrors.email && <span className="error-text">{signupErrors.email.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  {...registerSignup('password')}
                  className={signupErrors.password ? 'input-error' : ''}
                />
              </div>
              {signupErrors.password && <span className="error-text">{signupErrors.password.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password_confirmation">Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="password_confirmation"
                  type="password"
                  placeholder="••••••••"
                  {...registerSignup('password_confirmation')}
                  className={signupErrors.password_confirmation ? 'input-error' : ''}
                />
              </div>
              {signupErrors.password_confirmation && <span className="error-text">{signupErrors.password_confirmation.message}</span>}
            </div>

            <button type="submit" disabled={isSubmittingSignup} className="submit-button">
              {isSubmittingSignup ? (
                <span className="button-content">
                  <Loader2 className="spinner" size={20} /> Creating Account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
        )}

        <div className="login-footer">
          {isLogin ? (
            <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(false); }}>Create an account</a></p>
          ) : (
            <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(true); }}>Sign In</a></p>
          )}
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
    </div>
  );
}
