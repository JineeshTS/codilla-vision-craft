import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { calculatePasswordStrength } from "@/lib/validation";
import { z } from "zod";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  useEffect(() => {
    // Check if we have a password reset token
    const accessToken = searchParams.get('access_token');
    const type = searchParams.get('type');

    if (accessToken && type === 'recovery') {
      setStep('reset');
    }
  }, [searchParams]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      setPasswordStrength(calculatePasswordStrength(value));
    } else {
      setPasswordStrength({ score: 0, label: '', color: '' });
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent!",
        description: "Check your email for the password reset link.",
      });

      setEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send reset email",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate password
    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ password: error.issues[0].message });
        return;
      }
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password updated successfully!",
        description: "You can now sign in with your new password.",
      });

      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to reset password",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 cosmic-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <KeyRound className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            {step === 'request' ? 'Reset Password' : 'Create New Password'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'request'
              ? "Enter your email to receive a password reset link"
              : "Enter your new password below"
            }
          </p>
        </div>

        <div className="glass-panel p-8">
          {step === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate("/auth")}
                  className="text-sm"
                >
                  Back to Sign In
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                />
                {errors.password && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.password}</span>
                  </div>
                )}
                {password && passwordStrength.label && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span className="font-medium">{passwordStrength.label}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {errors.confirmPassword && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
