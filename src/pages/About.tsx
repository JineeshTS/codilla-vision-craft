import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Building2, Users, Target, Sparkles } from "lucide-react";
import { SEOHead } from "@/components/shared/SEOHead";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <>
      <SEOHead 
        title="About Codilla - AI-Powered Startup Builder"
        description="Learn about GANAKYS CODILLA APPS (OPC) Private Limited. We help entrepreneurs transform ideas into validated, production-ready applications using AI-powered tools."
      />
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">About Codilla</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Empowering entrepreneurs to transform ideas into reality through AI-powered development and validation
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To democratize software development by providing AI-powered tools that help entrepreneurs validate ideas, 
                  build products, and launch successful startups faster and more efficiently than ever before.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To become the world's leading platform for AI-assisted startup development, where every entrepreneur 
                  has access to enterprise-grade tools and insights to turn their vision into a thriving business.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* What We Do */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                What We Do
              </CardTitle>
              <CardDescription>
                Codilla is an end-to-end platform that guides you through every stage of startup development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Idea Validation</h3>
                  <p className="text-sm text-muted-foreground">
                    Use AI consensus from multiple models to validate your business ideas before investing time and money
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Business Planning</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate comprehensive business models, market research, and go-to-market strategies
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Product Development</h3>
                  <p className="text-sm text-muted-foreground">
                    Build production-ready applications with AI-assisted development and automated workflows
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Legal Name</h3>
                <p className="text-muted-foreground">GANAKYS CODILLA APPS (OPC) Private Limited</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Registered Address
                </h3>
                <p className="text-muted-foreground">
                  TC.6/1608-6, ROSE APTMT, Neerazhi lane,<br />
                  Medical College PO, Thiruvananthapuram,<br />
                  Kerala, India - 695011
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>General Inquiries: <a href="mailto:info@codilla.ai" className="text-primary hover:underline">info@codilla.ai</a></p>
                  <p>Support: <a href="mailto:support@codilla.ai" className="text-primary hover:underline">support@codilla.ai</a></p>
                  <p>Sales: <a href="mailto:marketing@codilla.ai" className="text-primary hover:underline">marketing@codilla.ai</a></p>
                  <p>Legal: <a href="mailto:legal@codilla.ai" className="text-primary hover:underline">legal@codilla.ai</a></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to Build Your Startup?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of entrepreneurs using Codilla to validate ideas and build successful products
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link 
                  to="/ideas" 
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Start Building
                </Link>
                <a 
                  href="mailto:info@codilla.ai" 
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default About;
