import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { Crown } from "lucide-react";

interface CharacterCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  tags: string[];
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  showPremiumIcon?: boolean;
  limitText?: string;
}

export function CharacterCard({
  title,
  description,
  icon,
  gradient,
  tags,
  onClick,
  selected = false,
  className,
  showPremiumIcon = false,
  limitText,
}: CharacterCardProps) {
  return (
    <Card
      className={cn(
        "group card-3d cursor-pointer h-full min-h-[280px] sm:min-h-[300px] relative mobile-card shadow-lg hover:shadow-2xl",
        selected && "ring-2 ring-primary ring-offset-2",
        className
      )}
      onClick={onClick}
    >
      {showPremiumIcon && (
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium shadow-lg">
            <Crown className="w-3 h-3" />
          </div>
          {limitText && (
            <div className="bg-red-500 text-white px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium shadow-sm">
              {limitText}
            </div>
          )}
        </div>
      )}
      <CardContent className="mobile-card h-full flex flex-col justify-between">
        <div className="text-center flex-1 flex flex-col min-h-0">
          <div
            className={cn(
              "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:rotate-12 transition-transform",
              gradient
            )}
          >
            {icon}
          </div>
          <div className="flex-1 mb-4 sm:mb-6">
            <h3 className="mobile-title font-bold text-gray-800 mb-2 sm:mb-3 text-balance text-center">
              {title}
            </h3>
            <p className="mobile-text text-gray-600 text-balance text-center">
              {description}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl mobile-card mt-auto w-full">
            <div className="flex flex-wrap gap-1 justify-center items-center">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs sm:text-sm text-gray-600 text-center text-balance"
                >
                  {tag}
                  {index < tags.length - 1 && " • "}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
