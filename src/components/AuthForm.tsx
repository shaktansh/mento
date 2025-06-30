import React, { useState } from 'react';
import { Brain, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import FloatingBlobs from './FloatingBlobs';

const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name');
          return;
        }
        await signUp(email, password, name.trim());
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <FloatingBlobs />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-[#A5E3D8]/20 rounded-full">
                <Brain className="w-8 h-8 text-[#A5E3D8]" />
              </div>
            </div>
            <h1 className="font-sora font-bold text-2xl text-[#334155] mb-2">
              Welcome to Mento AI
            </h1>
            <p className="font-inter text-[#334155]/70">
              {isSignUp ? 'Create your account to get started' : 'Sign in to continue your journey'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block font-inter font-medium text-[#334155] mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#334155]/50" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/30 rounded-2xl font-inter text-[#334155] placeholder-[#334155]/50 focus:outline-none focus:ring-2 focus:ring-[#A5E3D8]/50"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-inter font-medium text-[#334155] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#334155]/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/30 rounded-2xl font-inter text-[#334155] placeholder-[#334155]/50 focus:outline-none focus:ring-2 focus:ring-[#A5E3D8]/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-inter font-medium text-[#334155] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#334155]/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-white/50 border border-white/30 rounded-2xl font-inter text-[#334155] placeholder-[#334155]/50 focus:outline-none focus:ring-2 focus:ring-[#A5E3D8]/50"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#334155]/50 hover:text-[#334155] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-2xl">
                <p className="text-red-700 text-sm font-inter">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#A5E3D8] text-[#334155] py-3 rounded-2xl font-inter font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#8DD3C7] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="font-inter text-[#334155]/70 hover:text-[#334155] transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;