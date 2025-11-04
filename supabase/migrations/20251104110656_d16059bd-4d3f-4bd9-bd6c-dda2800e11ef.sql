-- Seed initial UI templates
INSERT INTO public.ui_templates (name, description, category, component_code, preview_image_url, customizable_fields, dependencies, is_public) VALUES
('SaaS Landing Page', 'Modern landing page with hero section, features, and CTA', 'landing', 
'export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="hero-gradient py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold gradient-text mb-6">{{hero_title}}</h1>
          <p className="text-xl text-muted-foreground mb-8">{{hero_subtitle}}</p>
          <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg">{{cta_text}}</button>
        </div>
      </section>
    </div>
  );
}', 
null,
'{"hero_title": {"type": "text", "default": "Transform Your Business", "label": "Hero Title"}, "hero_subtitle": {"type": "text", "default": "Powerful tools for modern teams", "label": "Hero Subtitle"}, "cta_text": {"type": "text", "default": "Get Started", "label": "CTA Button Text"}}',
'{"npm": ["lucide-react"]}',
true),

('Authentication Pages', 'Complete auth flow with login, signup, and password reset', 'auth',
'import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-panel p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{{form_title}}</h2>
        <Input type="email" placeholder="Email" className="mb-4" />
        <Input type="password" placeholder="Password" className="mb-6" />
        <Button className="w-full">{{button_text}}</Button>
      </div>
    </div>
  );
}',
null,
'{"form_title": {"type": "text", "default": "Sign In", "label": "Form Title"}, "button_text": {"type": "text", "default": "Continue", "label": "Button Text"}}',
'{"npm": ["@supabase/supabase-js"]}',
true),

('Dashboard Layout', 'Responsive dashboard with sidebar and main content area', 'dashboard',
'import { Sidebar } from "@/components/ui/sidebar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border">
        <div className="p-4">
          <h2 className="text-xl font-bold gradient-text">{{app_name}}</h2>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-6">{{page_title}}</h1>
      </main>
    </div>
  );
}',
null,
'{"app_name": {"type": "text", "default": "My App", "label": "App Name"}, "page_title": {"type": "text", "default": "Dashboard", "label": "Page Title"}}',
'{"npm": ["lucide-react"]}',
true),

('Pricing Cards', 'Beautiful pricing cards with features and CTAs', 'marketing',
'import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PricingCards() {
  return (
    <div className="container mx-auto py-12">
      <h2 className="text-3xl font-bold text-center mb-12">{{section_title}}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-2xl font-bold mb-4">{{plan_name}}</h3>
          <p className="text-4xl font-bold mb-6">{{price}}</p>
          <Button className="w-full">{{cta_text}}</Button>
        </Card>
      </div>
    </div>
  );
}',
null,
'{"section_title": {"type": "text", "default": "Choose Your Plan", "label": "Section Title"}, "plan_name": {"type": "text", "default": "Pro", "label": "Plan Name"}, "price": {"type": "text", "default": "$29", "label": "Price"}, "cta_text": {"type": "text", "default": "Get Started", "label": "CTA Text"}}',
'{"npm": []}',
true),

('Contact Form', 'Professional contact form with validation', 'forms',
'import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactForm() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">{{form_title}}</h2>
      <Input placeholder="Name" className="mb-4" />
      <Input type="email" placeholder="Email" className="mb-4" />
      <Textarea placeholder="Message" className="mb-4" rows={4} />
      <Button className="w-full">{{submit_text}}</Button>
    </div>
  );
}',
null,
'{"form_title": {"type": "text", "default": "Contact Us", "label": "Form Title"}, "submit_text": {"type": "text", "default": "Send Message", "label": "Submit Button"}}',
'{"npm": []}',
true),

('Hero Section', 'Eye-catching hero section with gradient background', 'landing',
'export default function HeroSection() {
  return (
    <section className="hero-gradient py-24">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold gradient-text mb-6">{{headline}}</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{{subheadline}}</p>
        <div className="flex gap-4 justify-center">
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg">{{primary_cta}}</button>
          <button className="border border-border px-6 py-3 rounded-lg">{{secondary_cta}}</button>
        </div>
      </div>
    </section>
  );
}',
null,
'{"headline": {"type": "text", "default": "Build Something Amazing", "label": "Headline"}, "subheadline": {"type": "text", "default": "The fastest way to ship your next project", "label": "Subheadline"}, "primary_cta": {"type": "text", "default": "Get Started", "label": "Primary CTA"}, "secondary_cta": {"type": "text", "default": "Learn More", "label": "Secondary CTA"}}',
'{"npm": []}',
true),

('Feature Grid', 'Responsive grid showcasing features with icons', 'marketing',
'import { Zap, Shield, Rocket } from "lucide-react";

export default function FeatureGrid() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{{section_title}}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">{{feature_1_title}}</h3>
            <p className="text-muted-foreground">{{feature_1_desc}}</p>
          </div>
        </div>
      </div>
    </section>
  );
}',
null,
'{"section_title": {"type": "text", "default": "Features", "label": "Section Title"}, "feature_1_title": {"type": "text", "default": "Lightning Fast", "label": "Feature 1 Title"}, "feature_1_desc": {"type": "text", "default": "Blazing fast performance", "label": "Feature 1 Description"}}',
'{"npm": ["lucide-react"]}',
true),

('Footer', 'Complete footer with links and social media', 'layout',
'export default function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">{{company_name}}</h3>
            <p className="text-muted-foreground">{{company_tagline}}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{{column_1_title}}</h4>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
          <p>{{copyright_text}}</p>
        </div>
      </div>
    </footer>
  );
}',
null,
'{"company_name": {"type": "text", "default": "Company", "label": "Company Name"}, "company_tagline": {"type": "text", "default": "Building the future", "label": "Tagline"}, "column_1_title": {"type": "text", "default": "Product", "label": "Column 1 Title"}, "copyright_text": {"type": "text", "default": "© 2024 All rights reserved", "label": "Copyright"}}',
'{"npm": []}',
true),

('Testimonials', 'Customer testimonials with avatars and quotes', 'marketing',
'import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Testimonials() {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{{section_title}}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="mb-4 text-muted-foreground">{{testimonial_1}}</p>
            <div className="flex items-center gap-3">
              <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
              <div><p className="font-semibold">{{author_1}}</p></div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}',
null,
'{"section_title": {"type": "text", "default": "What Our Customers Say", "label": "Section Title"}, "testimonial_1": {"type": "text", "default": "Amazing product!", "label": "Testimonial 1"}, "author_1": {"type": "text", "default": "John Doe", "label": "Author 1"}}',
'{"npm": []}',
true),

('FAQ Section', 'Accordion-based FAQ section', 'marketing',
'import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQSection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">{{section_title}}</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>{{question_1}}</AccordionTrigger>
            <AccordionContent>{{answer_1}}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}',
null,
'{"section_title": {"type": "text", "default": "Frequently Asked Questions", "label": "Section Title"}, "question_1": {"type": "text", "default": "How does it work?", "label": "Question 1"}, "answer_1": {"type": "text", "default": "It works great!", "label": "Answer 1"}}',
'{"npm": []}',
true);