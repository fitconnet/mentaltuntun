import { Crown, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PremiumFeatureBadgeProps {
  tier: "premium" | "pro";
  feature: string;
  className?: string;
}

export function PremiumFeatureBadge({
  tier,
  feature,
  className = "",
}: PremiumFeatureBadgeProps) {
  const config = {
    premium: {
      icon: Crown,
      color: "purple",
      label: "프리미엄",
      gradient: "from-purple-500 to-blue-500",
    },
    pro: {
      icon: Sparkles,
      color: "amber",
      label: "프로",
      gradient: "from-amber-500 to-orange-500",
    },
  };

  const { icon: Icon, color, label, gradient } = config[tier];

  return (
    <Badge
      className={`bg-gradient-to-r ${gradient} text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${className}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {label} • {feature}
    </Badge>
  );
}

export function PremiumAIIndicator({
  aiModel,
  className = "",
}: {
  aiModel: string;
  className?: string;
}) {
  const isPro = aiModel === "gpt-4o";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isPro ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}`}
      >
        <Zap className="w-3 h-3" />
        <span className="text-xs font-medium">{aiModel}</span>
      </div>
      <PremiumFeatureBadge tier={isPro ? "pro" : "premium"} feature="고급 AI" />
    </div>
  );
}
