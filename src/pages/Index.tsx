import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="bg-animated"></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="glass-container p-8 md:p-12 max-w-2xl w-full text-center animate-slide-in">
          <h1 className="title-hero mb-6">
            AlgoVisuals 🚀
          </h1>
          <div className="mb-8">
            <div className="text-xl md:text-2xl text-foreground/90 font-medium">
              Welcome to Algorithm Visualization!
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/sorting')}
              className="btn-glass btn-primary text-lg py-6 px-8 min-w-[200px]"
            >
              🔢 Sorting Visualizer
            </Button>
            <Button 
              onClick={() => navigate('/graph')}
              className="btn-glass btn-primary text-lg py-6 px-8 min-w-[200px]"
            >
              📈 Graph Visualizer
            </Button>
          </div>

          <p className="mt-8 text-foreground/70 text-sm">
            Interactive algorithm visualization made simple and beautiful
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;