import { InteractiveRobot } from "./InteractiveRobot";

export const HeroVisual = () => {
  return (
    <div className="w-full h-full relative flex justify-center items-center">
      {/* Background glow behind the robot */}
      <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* The Interactive 3D Robot */}
      <InteractiveRobot />
    </div>
  );
};

export default HeroVisual;
