import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordMode, setShowPasswordMode] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { signInWithOtp, signIn } = useAuth();

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await signInWithOtp(email);
      setMagicLinkSent(true);
      toast.success('Magic link sent! Check your email (and spam). 📧');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to YOUR leadership mirror 🌟
          </CardTitle>
          <CardDescription>
            {magicLinkSent ? 'Check your email to continue' : 'Sign in to reflect and grow'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordMode ? (
            <>
              {/* Magic Link Form */}
              <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || magicLinkSent}
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || magicLinkSent}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : magicLinkSent ? (
                    'Magic link sent!'
                  ) : (
                    'Send Magic Link'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setShowPasswordMode(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Use password instead?
                </button>
              </div>

              {/* GOOGLE_LOGIN_HERE */}
            </>
          ) : (
            <>
              {/* Password Form */}
              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-password">Email</Label>
                  <Input
                    id="email-password"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setShowPasswordMode(false)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Use magic link instead?
                </button>
              </div>
            </>
          )}

          <p className="text-xs text-center text-muted-foreground mt-4">
            Your data stays private and secure
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
