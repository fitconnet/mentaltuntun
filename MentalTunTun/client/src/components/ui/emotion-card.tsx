import { cn } from "@/lib/utils";

interface EmotionCardProps {
  emoji: string;
  name: string;
  color: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function EmotionCard({
  emoji,
  name,
  color,
  selected = false,
  onClick,
  className,
}: EmotionCardProps) {
  const colorClasses = {
    yellow: selected
      ? "border-yellow-400 bg-yellow-50"
      : "border-yellow-200 hover:border-yellow-400",
    gray: selected
      ? "border-gray-400 bg-gray-50"
      : "border-gray-200 hover:border-gray-400",
    blue: selected
      ? "border-blue-400 bg-blue-50"
      : "border-blue-200 hover:border-blue-400",
    red: selected
      ? "border-red-400 bg-red-50"
      : "border-red-200 hover:border-red-400",
    purple: selected
      ? "border-purple-400 bg-purple-50"
      : "border-purple-200 hover:border-purple-400",
    pink: selected
      ? "border-pink-400 bg-pink-50"
      : "border-pink-200 hover:border-pink-400",
    green: selected
      ? "border-green-400 bg-green-50"
      : "border-green-200 hover:border-green-400",
  };

  return (
    <div
      className={cn(
        "bg-white border-2 rounded-2xl p-4 text-center cursor-pointer hover:shadow-lg transition-all group",
        colorClasses[color as keyof typeof colorClasses] || colorClasses.gray,
        className
      )}
      onClick={onClick}
    >
      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
        {emoji}
      </div>
      <span className="text-gray-800 font-medium text-sm">{name}</span>
    </div>
  );
}
