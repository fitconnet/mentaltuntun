import { cn } from "@/lib/utils";
import mallangiImage from "@assets/말랑이-removebg-preview_1751791098585.png";

interface MallangiCharacterProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function MallangiCharacter({
  size = "md",
  animated = true,
  className,
}: MallangiCharacterProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  return (
    <div
      className={cn(
        "relative",
        sizeClasses[size],
        animated && "character-float",
        className
      )}
    >
      <img
        src={mallangiImage}
        alt="말랑이"
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export function MallangiWithSpeech({
  children,
  size = "md",
}: MallangiCharacterProps & { children: React.ReactNode }) {
  return (
    <div className="flex items-center space-x-3">
      <MallangiCharacter size={size} />
      <div className="bg-white rounded-2xl rounded-bl-sm p-3 shadow-lg max-w-xs">
        <p className="text-sm text-gray-700">{children}</p>
      </div>
    </div>
  );
}
