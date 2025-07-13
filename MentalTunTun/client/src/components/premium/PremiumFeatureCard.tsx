import { Crown, Sparkles, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PremiumFeatureCardProps {
  title: string;
  description: string;
  features: string[];
  isActive?: boolean;
  className?: string;
}

export function PremiumFeatureCard({
  title,
  description,
  features,
  isActive = false,
  className = "",
}: PremiumFeatureCardProps) {
  return (
    <Card
      className={`relative overflow-hidden ${isActive ? "border-purple-500 shadow-lg" : "border-gray-200"} ${className}`}
    >
      {isActive && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-xs font-medium">
          <Crown className="w-3 h-3 inline mr-1" />
          프리미엄
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {description}
        </p>

        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {isActive && (
          <Badge
            variant="secondary"
            className="mt-4 bg-purple-100 text-purple-700"
          >
            이용 가능
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
