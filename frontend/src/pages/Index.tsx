import { SnakeGame } from "@/components/SnakeGame";
import { Leaderboard } from "@/components/Leaderboard";

const Index = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex-1 flex items-center justify-center">
        <SnakeGame />
      </div>
      <div className="flex items-center justify-center lg:w-96">
        <Leaderboard />
      </div>
    </div>
  );
};

export default Index;
