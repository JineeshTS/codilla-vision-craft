import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="glass-panel p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Codilla.ai ("Service," "Platform," "we," "our," or "us"), you accept
              and agree to be bound by these Terms of Service. If you do not agree to these terms, you
              should not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Codilla.ai is an AI-powered development platform that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Validates ideas using multi-agent AI consensus (Claude, Gemini, Codex)</li>
              <li>Tracks project development through 10 structured phases</li>
              <li>Generates code and technical documentation</li>
              <li>Provides templates and development tools</li>
              <li>Uses a token-based system for AI operations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">3.1 Registration</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You must create an account to use our Service. You agree to provide accurate, current,
                  and complete information during registration and to update such information to keep it
                  accurate, current, and complete.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">3.2 Account Security</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for safeguarding your password and for all activities that occur
                  under your account. You must notify us immediately of any unauthorized use of your account.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">3.3 Account Termination</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to suspend or terminate your account if you violate these Terms of
                  Service or engage in fraudulent, abusive, or illegal activity.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Token System</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">4.1 Token Usage</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our platform uses a token-based system for AI operations:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1 ml-4">
                  <li>Idea validation: 150 tokens</li>
                  <li>Phase validation: 100 tokens</li>
                  <li>Code generation: Variable tokens based on complexity</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">4.2 Token Purchase</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tokens can be purchased through our platform. All token purchases are final and
                  non-refundable, except as required by law or at our sole discretion in case of technical
                  errors.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">4.3 Welcome Bonus</h3>
                <p className="text-muted-foreground leading-relaxed">
                  New users receive 100 free tokens upon registration. This is a one-time bonus and cannot
                  be transferred or exchanged for cash.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">5.1 Ownership</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You retain ownership of all content you create on our platform, including ideas, projects,
                  and code. However, you grant us a license to use this content to provide our services.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">5.2 Content Restrictions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You agree not to post or transmit content that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1 ml-4">
                  <li>Violates any laws or regulations</li>
                  <li>Infringes on intellectual property rights</li>
                  <li>Contains malware or harmful code</li>
                  <li>Is fraudulent, deceptive, or misleading</li>
                  <li>Harasses, abuses, or threatens others</li>
                  <li>Contains offensive or inappropriate content</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">5.3 AI-Generated Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Content generated by our AI services is provided for informational purposes only. You are
                  responsible for reviewing, validating, and ensuring the accuracy of all AI-generated content
                  before use.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content, features, and functionality are owned by Codilla.ai and
              are protected by international copyright, trademark, patent, trade secret, and other intellectual
              property laws. Our trademarks and trade dress may not be used without our prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to our systems or networks</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Remove or modify any copyright or proprietary notices</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Disclaimers</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">8.1 Service Availability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The Service is provided "as is" and "as available." We do not guarantee that the Service
                  will be uninterrupted, secure, or error-free.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">8.2 AI Accuracy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  While we strive for accuracy, AI-generated validations and content may contain errors or
                  inaccuracies. You should independently verify all information before relying on it.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">8.3 No Professional Advice</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The Service does not provide legal, financial, or professional advice. Consult with
                  appropriate professionals for such advice.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Codilla.ai shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including but not limited to loss of
              profits, data, use, or goodwill, arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless Codilla.ai and its officers, directors, employees,
              and agents from any claims, damages, losses, liabilities, and expenses arising from your use
              of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of any changes by
              posting the new Terms on this page and updating the "Last updated" date. Your continued use
              of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction],
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-white/5 rounded-lg">
              <p className="text-muted-foreground">Email: legal@codilla.ai</p>
              <p className="text-muted-foreground">Address: [Your Company Address]</p>
            </div>
          </section>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
