import Navbar from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { PhaseTimeline } from "@/components/PhaseTimeline";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <PhaseTimeline />
    </div>
  );
};

export default Index;
