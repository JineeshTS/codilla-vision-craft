import { SEOHead } from '@/components/shared/SEOHead';
import Navbar from '@/components/Navbar';

const CookiePolicy = () => {
  return (
    <>
      <SEOHead
        title="Cookie Policy | Codilla.ai"
        description="Learn about how Codilla.ai uses cookies and similar technologies."
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 3, 2024</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
              <p className="text-muted-foreground">
                Cookies are small text files stored on your device when you visit a website. 
                They help websites remember your preferences and improve your experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
              <p className="text-muted-foreground">Codilla.ai uses cookies for:</p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">Essential Cookies</h3>
              <p className="text-muted-foreground">
                Required for the website to function. These include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Authentication and session management</li>
                <li>Security features and CSRF protection</li>
                <li>Load balancing and server routing</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">Functional Cookies</h3>
              <p className="text-muted-foreground">
                Enhance your experience by remembering preferences:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Theme preference (dark/light mode)</li>
                <li>Language settings</li>
                <li>Recent project selections</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">Analytics Cookies</h3>
              <p className="text-muted-foreground">
                Help us understand how users interact with our platform:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Page views and navigation patterns</li>
                <li>Feature usage statistics</li>
                <li>Error tracking (via Sentry)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
              <p className="text-muted-foreground">
                Some cookies are set by third-party services we use:
              </p>
              <table className="w-full mt-4 border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold">Service</th>
                    <th className="text-left py-2 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="py-2">Supabase</td>
                    <td className="py-2">Authentication and database</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">Razorpay</td>
                    <td className="py-2">Payment processing</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">Sentry</td>
                    <td className="py-2">Error tracking</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">GitHub</td>
                    <td className="py-2">OAuth authentication</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Cookie Duration</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain for a set period (typically 30 days to 1 year)</li>
                <li><strong>Authentication Cookies:</strong> Valid for your session duration (up to 30 days)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Managing Cookies</h2>
              <p className="text-muted-foreground">
                You can control cookies through your browser settings:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Note: Disabling essential cookies may prevent some features from working correctly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Local Storage</h2>
              <p className="text-muted-foreground">
                In addition to cookies, we use browser local storage for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Theme preferences</li>
                <li>Draft content (auto-save)</li>
                <li>UI state persistence</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Updates to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Cookie Policy periodically. Changes will be posted on this 
                page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground">
                For questions about our use of cookies, contact us at:
              </p>
              <address className="text-muted-foreground mt-2 not-italic">
                Email: <a href="mailto:legal@codilla.ai" className="text-primary hover:underline">legal@codilla.ai</a>
              </address>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default CookiePolicy;
