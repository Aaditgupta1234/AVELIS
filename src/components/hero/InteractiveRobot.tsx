import { useState } from "react";
import Spline from "@splinetool/react-spline";

export const InteractiveRobot = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[600px] flex items-center justify-center">
      {/* Premium Luxury Gold Loading Shimmer */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative w-72 h-72 rounded-full border border-primary/10 flex items-center justify-center">
            {/* Outer glowing pulsing ring */}
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
            <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl animate-pulse" />

            {/* Inner luxury spinner */}
            <div className="w-16 h-16 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
            
            {/* Subtle text indicator */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-primary/60 uppercase whitespace-nowrap">
              Entering Sanctuary...
            </div>
          </div>
        </div>
      )}

      {/* Spline 3D Scene */}
      <div
        className={`w-full h-full transition-all duration-1000 ease-out ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <Spline
          scene="https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
};

export default InteractiveRobot;
