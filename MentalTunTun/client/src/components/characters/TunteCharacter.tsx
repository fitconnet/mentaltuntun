import { cn } from "@/lib/utils";
import tunteImage from "@assets/튼트니-removebg-preview_1751791098584.png";

interface TunteCharacterProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function TunteCharacter({
  size = "md",
  animated = true,
  className,
}: TunteCharacterProps) {
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
        animated && "character-bounce",
        className
      )}
    >
      <img
        src={tunteImage}
        alt="튼트니"
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export function TunteWithSpeech({
  children,
  size = "md",
}: TunteCharacterProps & { children: React.ReactNode }) {
  return (
    <div className="flex items-center space-x-3">
      <TunteCharacter size={size} />
      <div className="bg-white rounded-2xl rounded-bl-sm p-3 shadow-lg max-w-xs">
        <p className="text-sm text-gray-700">{children}</p>
      </div>
    </div>
  );
}
