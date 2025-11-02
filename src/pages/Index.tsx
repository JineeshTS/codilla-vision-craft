import Navbar from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { PhaseTimeline } from "@/components/PhaseTimeline";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <ErrorBoundary name="Hero"><Hero /></ErrorBoundary>
      <ErrorBoundary name="Features"><Features /></ErrorBoundary>
      <ErrorBoundary name="PhaseTimeline"><PhaseTimeline /></ErrorBoundary>
    </div>
  );
};

export default Index;
