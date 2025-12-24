import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/auth");
        return;
      }

      setUserEmail(session.user.email || null);

      // Check if email is verified
      if (session.user.email_confirmed_at) {
        setIsVerified(true);
        toast({
          title: "Email verified!",
          description: "Your email has been successfully verified.",
        });
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    };

    checkVerificationStatus();

    // Listen for auth state changes (email verification)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "USER_UPDATED" && session?.user?.email_confirmed_at) {
        setIsVerified(true);
        toast({
          title: "Email verified!",
          description: "Your email has been successfully verified.",
        });
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No email address found.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      toast({
        title: "Verification email sent!",
        description: "Please check your inbox and spam folder.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to resend email",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col cosmic-bg">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-panel p-8">
            <div className="text-center mb-6">
              {isVerified ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
              )}
              <h1 className="text-2xl font-bold mb-2">
                {isVerified ? "Email Verified!" : "Verify Your Email"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isVerified
                  ? "Redirecting you to dashboard..."
                  : `We've sent a verification email to ${userEmail}`
                }
              </p>
            </div>

            {!isVerified && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="mb-2">Please check your email and click the verification link.</p>
                  <p className="text-muted-foreground">
                    Don't see the email? Check your spam folder or request a new one.
                  </p>
                </div>

                <Button
                  onClick={handleResendVerification}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            )}

            {isVerified && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
