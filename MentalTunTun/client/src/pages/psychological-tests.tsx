import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Heart,
  ArrowRight,
  Star,
  Trophy,
  Lightbulb,
} from "lucide-react";
import { Link } from "wouter";

const testCategories = [
  {
    id: "professional",
    title: "심층 심리테스트",
    description: "전문적인 심리 분석과 정신 건강을 위한 과학적 검사",
    icon: <Brain className="w-12 h-12 text-blue-600" />,
    gradient: "from-blue-50 to-indigo-100",
    borderColor: "border-blue-200",
    hoverColor: "hover:border-blue-400",
    tests: [
      {
        id: "beck-depression",
        name: "Beck 우울 척도 (BDI-II)",
        description: "우울증 정도를 측정하는 표준화된 임상 검사 - 21문항",
      },
      {
        id: "anxiety-scale",
        name: "일반화된 불안장애 척도 (GAD-7)",
        description: "불안 수준과 불안 장애 가능성 평가 - 15문항",
      },
      {
        id: "stress-inventory",
        name: "스트레스 반응 척도 (SRI)",
        description: "스트레스 수준과 대처 능력 종합 측정 - 12문항",
      },
      {
        id: "burnout-assessment",
        name: "번아웃 증후군 검사 (MBI-GS)",
        description: "직업적 소진과 정서적 고갈 상태 평가 - 12문항",
      },
      {
        id: "eating-behavior",
        name: "섭식 행동 검사 (EAT-26)",
        description: "섭식 장애와 섭식 행동 패턴 전문 분석 - 12문항",
      },
    ],
  },
  {
    id: "fun",
    title: "재미있는 심리테스트",
    description: "흥미롭고 재미있는 심리 탐구로 나를 알아가는 시간",
    icon: <Heart className="w-12 h-12 text-pink-600" />,
    gradient: "from-pink-50 to-rose-100",
    borderColor: "border-pink-200",
    hoverColor: "hover:border-pink-400",
    tests: [
      {
        id: "color-personality",
        name: "컬러 심리테스트",
        description: "좋아하는 색깔로 알아보는 나의 성격과 심리상태 - 10문항",
      },
      {
        id: "animal-personality",
        name: "동물 성격 테스트",
        description: "나와 닮은 동물로 알아보는 숨겨진 성격과 특성 - 10문항",
      },
      {
        id: "love-style",
        name: "연애 스타일 테스트",
        description: "나만의 독특한 연애 방식과 이상형 종합 분석 - 10문항",
      },
      {
        id: "career-aptitude",
        name: "직업 적성 테스트",
        description: "재미있는 질문으로 알아보는 천직과 적성 찾기 - 10문항",
      },
      {
        id: "friendship-type",
        name: "우정 유형 테스트",
        description: "친구 관계에서 나의 역할과 우정 스타일 - 10문항",
      },
    ],
  },
];

export default function PsychologicalTests() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 leading-tight">
            심리테스트
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed text-balance">
            다양한 심리테스트로 나 자신을 더 깊이 이해해보세요
          </p>
        </div>

        {/* Test Category Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {testCategories.map(category => (
            <Card
              key={category.id}
              className={`
                ${category.borderColor} ${category.hoverColor}
                bg-white shadow-lg hover:shadow-xl 
                transform hover:scale-105 transition-all duration-300 
                cursor-pointer border-2 min-h-[400px]
              `}
            >
              <CardContent className="p-6 h-full flex flex-col">
                {/* Category Header */}
                <div
                  className={`bg-gradient-to-r ${category.gradient} rounded-xl p-4 mb-6 text-center`}
                >
                  <div className="flex justify-center mb-3">
                    {category.icon}
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2 leading-tight text-break-words">
                    {category.title}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed text-balance">
                    {category.description}
                  </p>
                </div>

                {/* Test List */}
                <div className="flex-1 space-y-3">
                  {category.tests.map((test, index) => (
                    <Link
                      key={test.id}
                      href={`/psychological-tests/${category.id}/${test.id}`}
                    >
                      <div className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-1 leading-tight text-break-words">
                              {test.name}
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed text-break-words line-clamp-2">
                              {test.description}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors ml-2 flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Category Action Button */}
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      // 해당 카테고리의 모든 테스트를 보여주는 기능 (향후 구현 예정)
                      alert(
                        `${category.title} 전체 목록 기능은 준비중입니다. 현재는 개별 테스트를 선택해 주세요.`
                      );
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <span className="text-sm md:text-base leading-tight">
                      모든 {category.title} 보기
                    </span>
                    <ArrowRight className="w-4 h-4 ml-2 flex-shrink-0" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 h-20">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
                  5
                </span>
              </div>
              <p className="text-xs text-gray-600 text-center leading-tight text-break-words">
                전문 테스트
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 h-20">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
                  5
                </span>
              </div>
              <p className="text-xs text-gray-600 text-center leading-tight text-break-words">
                재미 테스트
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 h-20">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
                  122
                </span>
              </div>
              <p className="text-xs text-gray-600 text-center leading-tight text-break-words">
                총 질문 수
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 leading-tight">
              🧠 심리테스트 이용 안내
            </h3>
            <div className="space-y-2">
              <p className="text-sm md:text-base text-gray-600 leading-relaxed text-balance">
                • 전문 심리테스트는 임상적으로 검증된 도구를 기반으로 합니다
              </p>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed text-balance">
                • 재미있는 테스트는 자기 이해를 돕는 흥미로운 도구입니다
              </p>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed text-balance">
                • 모든 결과는 개인 정보로 안전하게 보호됩니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
