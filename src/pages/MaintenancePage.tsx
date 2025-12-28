import { Wrench } from 'lucide-react';

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Wrench className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          We're Under Maintenance
        </h1>
        <p className="text-muted-foreground mb-6">
          We're currently performing scheduled maintenance to improve your experience. 
          Please check back shortly.
        </p>
        <p className="text-sm text-muted-foreground">
          Thank you for your patience!
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
