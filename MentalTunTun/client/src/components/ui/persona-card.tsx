import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { Brain, Heart, Smile } from "lucide-react";

interface PersonaCardProps {
  type: "strategic" | "empathetic" | "cheerful";
  name: string;
  description: string;
  quote?: string;
  slogan?: string;
  matchingRank: "최상" | "상" | "중";
  reasons: string[];
  selected?: boolean;
  recommended?: boolean;
  onClick?: () => void;
  className?: string;
}

const personaConfig = {
  strategic: {
    icon: Brain,
    gradient: "bg-gradient-to-r from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
  empathetic: {
    icon: Heart,
    gradient: "bg-gradient-to-r from-pink-500 to-purple-500",
    bgColor: "bg-pink-50",
    textColor: "text-pink-700",
  },
  cheerful: {
    icon: Smile,
    gradient: "bg-gradient-to-r from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
  },
};

export function PersonaCard({
  type,
  name,
  description,
  quote,
  slogan,
  matchingRank,
  reasons,
  selected = false,
  recommended = false,
  onClick,
  className,
}: PersonaCardProps) {
  const config = personaConfig[type];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "group hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer",
        selected && "ring-2 ring-primary ring-offset-2",
        recommended && "border-2 border-primary",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-6 h-full flex flex-col">
        <div className="text-center flex-1 flex flex-col min-h-0">
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform",
              config.gradient
            )}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          <div className="flex-text-container flex-1 mb-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 leading-tight text-break-words">
              {name}
            </h3>
            <p className="text-gray-600 text-sm md:text-base mb-4 leading-relaxed text-break-words hyphens-auto">
              {description}
            </p>
          </div>

          <div
            className={cn(
              "rounded-xl p-3 text-xs md:text-sm mb-4 text-break-words leading-relaxed",
              config.bgColor,
              config.textColor
            )}
          >
            "{slogan || quote || "함께 문제를 해결해보세요"}"
          </div>

          <div className="mt-auto pt-4">
            <div className="text-xs md:text-sm text-gray-500 mb-3 text-center leading-relaxed">
              {recommended
                ? `가장 적합 (${matchingRank}급)`
                : `추천 순위: ${matchingRank}급`}
            </div>
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {reasons.map((reason, index) => (
                <span
                  key={index}
                  className={cn(
                    "px-2 py-1 rounded-full text-xs text-center text-break-words leading-tight",
                    config.bgColor,
                    config.textColor
                  )}
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
