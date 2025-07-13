import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Share2,
  Download,
  Clock,
} from "lucide-react";
import { Link } from "wouter";

interface TestData {
  id: string;
  title: string;
  description: string;
  category: "professional" | "fun";
  estimatedTime: string;
  questions: Array<{
    id: number;
    text: string;
    options: string[];
    category?: string;
  }>;
  scoring: {
    ranges: Array<{
      min: number;
      max: number;
      category: string;
      title: string;
      description: string;
      recommendations: string[];
      details?: Record<string, { score: number; description: string }>;
    }>;
  };
}

interface Question {
  id: number;
  text: string;
  options: string[];
}

interface TestResult {
  score: number;
  category: string;
  title: string;
  description: string;
  recommendations: string[];
  details: {
    [key: string]: {
      score: number;
      description: string;
    };
  };
}

export default function PsychologicalTestDetail() {
  const [match, params] = useRoute("/psychological-tests/:category/:testId");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);

  const { category, testId } = params || {};

  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId || !category) return;

      try {
        const response = await fetch(
          `/api/psychological-tests/${testId}/${category}`
        );
        if (response.ok) {
          const data = await response.json();
          setTestData(data);
        } else {
          console.error("Failed to fetch test data");
        }
      } catch (error) {
        console.error("Error fetching test data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId, category]);

  useEffect(() => {
    if (!testData) return;
    setAnswers(new Array(testData.questions.length).fill(-1));
  }, [testData]);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < (testData?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResult = () => {
    if (!testData) return;

    const totalScore = answers.reduce((sum, answer, index) => {
      return sum + (answer >= 0 ? answer : 0);
    }, 0);

    // Use the scoring system from the actual test data
    const range = testData.scoring?.ranges.find(
      r => totalScore >= r.min && totalScore <= r.max
    );

    let resultData: TestResult;
    if (range) {
      resultData = {
        score: totalScore,
        category: range.category,
        title: range.title,
        description: range.description,
        recommendations: range.recommendations,
        details: range.details || {},
      };
    } else {
      // Fallback result
      resultData = {
        score: totalScore,
        category: "결과 없음",
        title: "결과를 계산할 수 없습니다",
        description: "점수 범위를 찾을 수 없습니다. 총점: " + totalScore,
        recommendations: ["다시 테스트해보세요"],
        details: {},
      };
    }

    setResult(resultData);
    setIsCompleted(true);
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setAnswers(new Array(testData?.questions.length || 0).fill(-1));
    setIsCompleted(false);
    setResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            당신을 위한 초개인화된 정보를 분석중입니다...
          </p>
        </div>
      </div>
    );
  }

  if (!match || !testData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4 leading-tight">
              테스트를 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              요청한 심리테스트가 존재하지 않습니다.
            </p>
            <Link href="/psychological-tests">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                목록으로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/psychological-tests">
              <Button variant="ghost" className="mb-4 text-sm leading-tight">
                <ArrowLeft className="w-4 h-4 mr-2" />
                목록으로 돌아가기
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 leading-tight text-break-words">
              {testData.title} 결과
            </h1>
            <Badge variant="outline" className="text-sm">
              {category === "professional" ? "전문 검사" : "재미 테스트"}
            </Badge>
          </div>

          {/* Result Summary */}
          <Card className="mb-6 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="text-xl md:text-2xl text-blue-800 leading-tight text-break-words">
                {result.title}
              </CardTitle>
              <div className="text-lg font-semibold text-purple-700 leading-tight">
                {result.category}
              </div>
              {category === "professional" && (
                <div className="text-sm text-gray-600 leading-tight">
                  점수: {result.score}점
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 text-center mb-4 leading-relaxed text-balance">
                {result.description}
              </p>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          {Object.keys(result.details).length > 0 && (
            <Card className="mb-6 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg leading-tight">
                  세부 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(result.details).map(([key, detail]) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800 text-sm leading-tight text-break-words">
                          {key}
                        </span>
                        <span className="text-sm text-gray-600 leading-tight">
                          {detail.score}점
                        </span>
                      </div>
                      <Progress value={detail.score} className="mb-1" />
                      <p className="text-xs text-gray-600 leading-relaxed text-break-words">
                        {detail.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="mb-6 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg leading-tight">추천 사항</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1 flex-shrink-0">
                      •
                    </span>
                    <span className="text-gray-700 text-sm leading-relaxed text-break-words">
                      {rec}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={resetTest} variant="outline" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              다시 테스트하기
            </Button>
            <Button className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              결과 공유하기
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              결과 저장하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress =
    ((currentQuestion + 1) / (testData?.questions.length || 1)) * 100;
  const currentQ = testData?.questions[currentQuestion];

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">질문을 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/psychological-tests">
            <Button variant="ghost" className="mb-4 text-sm leading-tight">
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 leading-tight text-break-words">
            {testData.title}
          </h1>
          <p className="text-sm text-gray-600 mb-2 leading-relaxed text-balance">
            {testData.description}
          </p>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">
              예상 소요시간: {testData.estimatedTime}
            </span>
          </div>

          {/* Progress */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span className="leading-tight">
                질문 {currentQuestion + 1} / {testData.questions.length}
              </span>
              <span className="leading-tight">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>

        {/* Question */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl leading-tight text-break-words">
              {currentQ.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQ.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={
                    answers[currentQuestion] === index ? "default" : "outline"
                  }
                  className={`w-full text-left justify-start p-4 h-auto ${
                    answers[currentQuestion] === index
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleAnswer(index)}
                >
                  <span className="text-sm leading-relaxed text-break-words">
                    {option}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="text-sm leading-tight"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전
          </Button>

          <Button
            onClick={nextQuestion}
            disabled={answers[currentQuestion] === -1}
            className="text-sm leading-tight"
          >
            {currentQuestion === testData.questions.length - 1
              ? "결과 보기"
              : "다음"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
