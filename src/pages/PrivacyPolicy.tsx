import { SEOHead } from '@/components/shared/SEOHead';
import Navbar from '@/components/Navbar';

const PrivacyPolicy = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy | Codilla.ai"
        description="Learn how Codilla.ai collects, uses, and protects your personal information."
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 3, 2024</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground">
                GANAKYS CODILLA APPS (OPC) Private Limited ("we", "our", or "us") operates Codilla.ai. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-medium mb-2">Personal Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Name and email address when you create an account</li>
                <li>Payment information when you purchase tokens (processed by Razorpay)</li>
                <li>GitHub account information if you connect your repository</li>
                <li>Project ideas and business data you submit</li>
              </ul>
              
              <h3 className="text-xl font-medium mb-2 mt-4">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Usage patterns and feature interactions</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>To provide and maintain our services</li>
                <li>To process transactions and manage your account</li>
                <li>To send important updates and notifications</li>
                <li>To improve our AI models and platform features</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
              <p className="text-muted-foreground">
                Your data is stored securely using Supabase infrastructure with encryption at rest 
                and in transit. We implement industry-standard security measures including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Row-Level Security (RLS) policies for data isolation</li>
                <li>Encrypted connections (TLS/SSL)</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
              <p className="text-muted-foreground">We use the following third-party services:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li><strong>Supabase:</strong> Database and authentication</li>
                <li><strong>Razorpay:</strong> Payment processing</li>
                <li><strong>OpenAI, Anthropic, Google:</strong> AI services</li>
                <li><strong>GitHub:</strong> Code repository integration</li>
                <li><strong>Sentry:</strong> Error tracking and monitoring</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to enhance your experience. 
                See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a> for details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not intended for users under 18 years of age. We do not knowingly 
                collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically. We will notify you of any material 
                changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
              <p className="text-muted-foreground">
                For privacy-related inquiries, contact us at:
              </p>
              <address className="text-muted-foreground mt-2 not-italic">
                <strong>GANAKYS CODILLA APPS (OPC) Private Limited</strong><br />
                TC.6/1608-6, ROSE APTMT, Neerazhi lane<br />
                Medical College PO, Thiruvananthapuram<br />
                Kerala, India - 695011<br />
                Email: <a href="mailto:legal@codilla.ai" className="text-primary hover:underline">legal@codilla.ai</a>
              </address>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default PrivacyPolicy;
