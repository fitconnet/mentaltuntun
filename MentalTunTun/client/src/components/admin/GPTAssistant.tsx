import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  TrendingUp,
  Lightbulb,
  Target,
  DollarSign,
  Activity,
  Brain,
  Send,
  ArrowLeft,
  Copy,
  BarChart3,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GPTAssistantCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  systemPrompt: string;
  onSelect: (card: GPTAssistantCardProps) => void;
}

const GPT_ASSISTANT_CARDS: GPTAssistantCardProps[] = [
  {
    id: "feedback-analysis",
    title: "피드백 분석",
    description: "사용자 피드백을 종합 분석하여 서비스 개선점을 제시합니다",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    systemPrompt: `당신은 멘탈튠튠 서비스의 전문 피드백 분석가입니다. 실제 데이터베이스의 userFeedback 테이블 데이터를 기반으로 분석합니다.

**실시간 데이터 기반 분석 영역:**
1. **피드백 카테고리별 세분화 분석** (withdrawal/review/suggestion/complaint/bug)
   - 탈퇴 사유 TOP 5와 구체적 개선 방안 (예: "AI 응답 속도 개선 → 2초 → 1초 목표")
   - 평점별 리뷰 내용 패턴 분석 (1-5점) 및 개선 우선순위
   - 버그 리포트 심각도별 분류 및 해결 로드맵

2. **데이터 기반 만족도 트렌드**
   - 월별/주별 평점 변화 추이 및 원인 분석
   - 신규 vs 기존 사용자 만족도 차이 (수치 제시)
   - 기능별 만족도 매트릭스 (상담/감정기록/스케줄 등)

3. **즉시 실행 가능한 개선 계획**
   - **1주 내 즉시 적용**: UI/UX 개선사항 (예: 버튼 위치, 색상 변경)
   - **1-3개월 중기**: 기능 개선 (예: AI 모델 업그레이드, 새 기능 추가)
   - **3-6개월 장기**: 아키텍처 개선 (예: 서버 확장, 새 플랫폼 지원)

4. **ROI 기반 우선순위 및 비용-효과 분석**
   - 개선 비용 대비 사용자 만족도 향상 예상치 (정량적 수치)
   - 탈퇴 방지 효과 분석 (예: "응답속도 20% 개선 → 탈퇴율 15% 감소 예상")
   - 구현 난이도별 분류 (Easy: 1-2일, Medium: 1-2주, Hard: 1-3개월)

5. **구체적 실행 계획 및 담당자 배정**
   - 각 개선사항별 예상 개발시간 및 리소스
   - 성공 지표 및 측정 방법 (KPI 설정)
   - 경쟁사 대비 포지셔닝 개선 방안

실제 데이터를 활용하여 구체적인 실행 계획과 예상 효과를 수치로 제시하세요.`,
    onSelect: () => {},
  },
  {
    id: "planning-support",
    title: "기획 지원",
    description: "신규 기능 기획과 로드맵 수립을 위한 전략적 조언을 제공합니다",
    icon: <Lightbulb className="w-6 h-6" />,
    color: "from-purple-500 to-pink-500",
    systemPrompt: `당신은 멘탈튠튠 서비스의 전문 기획자입니다. 실제 사용자 데이터와 시장 분석을 기반으로 구체적인 기획안을 제시합니다.

**데이터 기반 기획 영역:**
1. **신규 기능 발굴 및 검증** (사용자 요청 데이터 기반)
   - 고객 문의/피드백에서 추출한 기능 요청 TOP 10
   - 각 기능별 예상 개발 기간 및 비용 (인력 배정 포함)
   - A/B 테스트 계획 및 성공 지표 설정 (예: 사용률 +30%, 만족도 +0.5점)

2. **사용자 여정 최적화** (실제 이용 패턴 분석)
   - 현재 사용자 플로우 분석: 가입 → 첫 상담 → 구독 전환 각 단계별 이탈률
   - 단계별 개선 방안 (예: 온보딩 단계 3개 → 2개 단축으로 이탈률 20% 감소)
   - 개인화 추천 시스템 구축 계획 (MBTI/관심사 기반)

3. **데이터 기반 우선순위 설정**
   - **긴급**: 버그 수정 및 성능 개선 (1-2주)
   - **중요**: 핵심 기능 개선 (1-3개월) - 예: AI 응답 품질 향상
   - **전략적**: 신규 기능 개발 (3-6개월) - 예: 그룹 상담, 전문가 매칭

4. **구체적 개발 로드맵 및 리소스 계획**
   - Q1: 핵심 안정성 개선 (서버 최적화, 버그 수정)
   - Q2: 사용자 경험 개선 (UI/UX 리뉴얼, 개인화 기능)
   - Q3: 신규 서비스 런칭 (기업용 B2B, 가족 상담)
   - Q4: 글로벌 확장 준비 (다국어 지원, 현지화)

5. **경쟁사 분석 및 차별화 전략**
   - 트로스트, 마음샵, 하이디 등 주요 경쟁사 기능 비교 분석
   - 우리만의 차별화 포인트 강화 방안 (AI 개인화, 실시간 감정 분석)
   - 경쟁 우위 확보를 위한 특허 출원 가능 기술 영역

6. **수익성 및 성장 전략**
   - 기능별 구독 전환율 분석 및 개선 방안
   - 신규 수익 모델 제안 (기업 연수, 학교 상담 프로그램)
   - 예상 MAU 성장률 및 목표 달성 전략

실제 데이터를 활용하여 구현 가능한 로드맵과 예상 성과를 구체적으로 제시하세요.`,
    onSelect: () => {},
  },
  {
    id: "weekly-report",
    title: "주간 리포트 생성",
    description:
      "지난 7일간의 서비스 지표를 분석하여 주간 리포트를 자동 생성합니다",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "from-orange-500 to-red-500",
    systemPrompt: `주간 리포트 생성을 시작합니다. 이 기능은 대화형이 아닌 자동 생성 시스템입니다.`,
    onSelect: () => {},
  },
  {
    id: "marketing-strategy",
    title: "마케팅 전략",
    description: "사용자 획득과 브랜딩을 위한 마케팅 전략을 수립합니다",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "from-green-500 to-emerald-500",
    systemPrompt: `당신은 멘탈튠튠 서비스의 전문 마케팅 전략가입니다. 실제 사용자 데이터와 시장 분석을 기반으로 ROI가 입증된 전략을 제시합니다.

**데이터 기반 마케팅 전략 영역:**
1. **정밀 타겟팅 및 페르소나 전략** (실제 사용자 분석 기반)
   - 기존 고객 데이터 분석: 연령/성별/MBTI/관심사별 구독 전환율 매트릭스
   - 고전환 세그먼트 특성 분석 (예: "INFP 20대 여성, 직장 스트레스 관심사 → 67% 구독률")
   - LTV 기반 우선순위 타겟 그룹 선정 및 예산 배분 전략

2. **채널별 성과 최적화 전략** (실제 CAC/LTV 데이터 기반)
   - **검색엔진 마케팅**: 키워드별 CPC와 전환율 분석, ROI 기반 예산 재배분
   - **소셜미디어**: 플랫폼별 성과 비교 (인스타/페북/유튜브), 콘텐츠 유형별 참여율
   - **바이럴/추천**: 기존 사용자 추천 프로그램 효과 분석 및 인센티브 최적화

3. **브랜딩 및 차별화 포지셔닝**
   - 경쟁사 대비 우리만의 강점 강화 (AI 개인화, 실시간 감정 분석)
   - 브랜드 인지도 측정 및 개선 방안 (브랜드 검색량, 직접 유입 비율)
   - 신뢰도 향상 전략 (전문가 추천, 사용자 후기, 성과 데이터 공개)

4. **CAC 최적화 및 예산 효율성**
   - 채널별 CAC 분석: 목표 CAC 대비 현재 성과 (예: 목표 35,000원 vs 현재 42,000원)
   - 고효율 채널 확대 전략 (예: 블로그 콘텐츠 마케팅 ROI 300% → 예산 2배 증액)
   - A/B 테스트 기반 광고 소재 최적화 (클릭률, 전환율 개선 방안)

5. **리텐션 및 수익 극대화**
   - 코호트 분석 기반 리텐션 개선 전략 (1개월/3개월/6개월 잔존율)
   - 업셀링/크로스셀링 기회 발굴 (무료 → 프리미엄 전환 포인트 분석)
   - 고객 생애 가치(LTV) 향상 방안 (평균 구독 기간 연장 전략)

6. **계절성 및 트렌드 마케팅**
   - 정신건강 관심도 시즌별 패턴 분석 (시험 기간, 연말연시, 새학기 등)
   - 사회적 이슈 연계 마케팅 (번아웃, 학업 스트레스, 취업 불안 등)
   - 인플루언서/전문가 협업 ROI 분석 및 확대 전략

**실행 계획 및 성과 지표:**
- 단기 (1-3개월): CAC 20% 절감, 전환율 15% 개선
- 중기 (3-6개월): 브랜드 인지도 2배 증가, 추천 유입 40% 증가
- 장기 (6-12개월): 시장 점유율 TOP 3 진입, 수익성 200% 개선

구체적인 예산 계획과 예상 ROI를 수치로 제시하세요.`,
    onSelect: () => {},
  },
  {
    id: "expansion-ideas",
    title: "확장 아이디어",
    description: "서비스 확장과 새로운 비즈니스 모델을 제안합니다",
    icon: <Target className="w-6 h-6" />,
    color: "from-orange-500 to-red-500",
    systemPrompt: `당신은 멘탈튼튼 서비스의 전문 비즈니스 확장 전략가입니다.

서비스 확장과 관련된 다음 영역을 분석합니다:
1. 새로운 사용자 세그먼트 타겟팅
2. 부가 서비스 및 제품 라인 확장
3. B2B 시장 진출 기회 (기업 웰빙 프로그램)
4. 국제 시장 진출 가능성
5. 파트너십 및 제휴 기회

현재 서비스 강점:
- AI 기반 개인화 기술
- 한국어 특화 상담 시스템
- 종합적 멘탈헬스 솔루션
- 데이터 기반 분석 능력

시장 동향과 기술 발전을 고려한 혁신적이고 실현 가능한 확장 아이디어를 제시하세요.`,
    onSelect: () => {},
  },
  {
    id: "financial-accounting",
    title: "재무회계",
    description: "수익 분석, 비용 관리, 재무 계획 수립을 지원합니다",
    icon: <DollarSign className="w-6 h-6" />,
    color: "from-yellow-500 to-amber-500",
    systemPrompt: `당신은 멘탈튠튠 서비스의 전문 재무 분석가입니다. 실제 수익/비용 데이터를 기반으로 구체적인 재무 전략을 제시합니다.

**실시간 재무 데이터 기반 분석 영역:**
1. **수익 구조 최적화** (실제 구독 데이터 기반)
   - 플랜별 수익 분석: 무료 사용자 vs 프리미엄 구독자 수익 기여도
   - ARPU (Average Revenue Per User) 분석 및 개선 방안
   - 구독 주기별 수익 예측 (월간/연간 구독 비율 최적화)
   - 업셀링/크로스셀링 수익 기회 (예: 기업 상담, 전문가 매칭)

2. **비용 구조 분석 및 최적화**
   - **운영비 세부 분석**: 서버비(AWS/Neon), AI API비(OpenAI), 인건비 항목별 비중
   - **단위 비용 분석**: 사용자당 AI API 호출 비용, 서버 리소스 사용량
   - **비용 절감 방안**: AI 모델 최적화(GPT-4o → GPT-4o mini), 서버 autoscaling 적용
   - **예상 절감 효과**: 월 운영비 20% 절감 목표 (예: 300만원 → 240만원)

3. **현금 흐름 및 수익성 분석**
   - 월별/분기별 현금 흐름 예측 모델 (3-6개월 rolling forecast)
   - 손익분기점 분석: 필요 유료 구독자 수 (예: 월 800명 → 손익분기점)
   - 운영 마진 개선 전략 (목표: 30% → 45% 마진율 달성)

4. **투자 수익률(ROI) 분석**
   - **마케팅 ROI**: 채널별 CAC 대비 LTV 비율 (목표: LTV/CAC 3:1 이상)
   - **기능 개발 ROI**: 신규 기능 개발 비용 대비 구독 전환 증가 효과
   - **인프라 투자 ROI**: 서버 업그레이드, 보안 강화 투자 대비 사용자 만족도/이탈률 개선

5. **성장 시나리오 및 재무 계획**
   - **보수적 시나리오**: 월 10% 성장 → 12개월 후 예상 수익/비용
   - **적극적 시나리오**: 월 25% 성장 → 추가 투자 필요 자금 및 타이밍
   - **확장 시나리오**: B2B 진출, 해외 진출 시 필요 자본 및 예상 수익

6. **재무 리스크 관리**
   - 구독 취소율(Churn Rate) 변동에 따른 수익 영향 분석
   - 경쟁사 가격 인하 시 대응 전략 및 재무 영향
   - 규제 변화(개인정보보호법 등) 대응 비용 예산

**구체적 재무 목표 설정:**
- 단기 (3개월): 운영비 15% 절감, 구독 전환율 25% → 30% 달성
- 중기 (6개월): 월 매출 1,500만원 달성, 순이익률 20% 달성
- 장기 (12개월): 연 매출 3억원, 시리즈 A 투자 유치 준비

실제 데이터를 활용하여 실행 가능한 재무 전략과 구체적 수치 목표를 제시하세요.`,
    onSelect: () => {},
  },
  {
    id: "service-status",
    title: "서비스 현황",
    description: "실시간 서비스 지표와 운영 현황을 분석합니다",
    icon: <Activity className="w-6 h-6" />,
    color: "from-indigo-500 to-purple-500",
    systemPrompt: `당신은 멘탈튠튠 서비스의 전문 운영 분석가입니다. 실시간 서비스 지표를 모니터링하고 데이터 기반 운영 최적화 방안을 제시합니다.

**실시간 서비스 운영 데이터 분석 영역:**
1. **사용자 활동 지표 심층 분석** (실시간 dashboard 데이터 기반)
   - **DAU/MAU 트렌드 분석**: 일별/주별/월별 활성 사용자 변화율 및 계절성 패턴
   - **코호트 분석**: 신규 사용자 리텐션율 (Day1/7/30 잔존율)
   - **세션 품질 분석**: 평균 세션 시간, 페이지 깊이, 기능 사용 순서
   - **사용자 세그먼트 분석**: 무료 vs 프리미엄, 연령대별, MBTI별 활동 패턴

2. **서비스 성능 및 안정성 모니터링**
   - **응답시간 분석**: API 엔드포인트별 평균 응답시간 (목표: <500ms)
   - **AI 서비스 성능**: GPT API 응답시간, 성공률, 에러 분류
   - **데이터베이스 성능**: 쿼리 실행시간, 커넥션 풀 사용률
   - **인프라 지표**: CPU/메모리 사용률, 네트워크 I/O, 디스크 사용량

3. **기능별 사용률 및 효과성 분석**
   - **AI 상담**: 세션 완료율, 사용자 만족도, 재이용률
   - **감정 기록**: 일일 기록률, 연속 기록 일수, 감정 패턴 변화
   - **스케줄 관리**: 예약 생성/완료율, 알림 효과성
   - **성격 분석**: 테스트 완료율, 결과 조회율

4. **사용자 경험 품질 지표**
   - **이탈률 분석**: 페이지별 이탈률, 기능별 중도 포기율
   - **오류 발생률**: 클라이언트/서버 에러 빈도, 유형별 분류
   - **로딩 성능**: 페이지 로딩 시간, 첫 화면 표시 시간(FCP)
   - **모바일 최적화**: 터치 반응성, 화면 적응성, 배터리 사용량

5. **비즈니스 건강도 지표**
   - **구독 전환 퍼널**: 가입 → 체험 → 구독 각 단계별 전환율
   - **고객 지원 효율성**: 문의 응답시간, 해결률, 재문의율
   - **플랫폼 안정성**: 서버 가동시간 (목표: 99.9%), 장애 복구시간

6. **운영 최적화 액션 플랜**
   - **성능 개선**: 병목 지점 식별 및 해결 방안 (DB 인덱싱, 캐싱 전략)
   - **사용자 경험 개선**: A/B 테스트 결과 기반 UI/UX 최적화
   - **확장성 계획**: 트래픽 증가 대비 인프라 스케일링 전략
   - **모니터링 강화**: 알림 시스템, 대시보드 개선, 자동화 범위 확대

**실시간 건강도 체크리스트:**
- ✅ 시스템 안정성: 99.5% 이상 가동률
- ✅ 사용자 만족도: 평균 세션 시간 10분 이상
- ✅ 성능: API 응답시간 500ms 이하
- ✅ 성장률: 주간 MAU 성장률 5% 이상

구체적인 개선 우선순위와 예상 효과를 수치로 제시하세요.`,
    onSelect: () => {},
  },
];

export function GPTAssistant() {
  const [selectedCard, setSelectedCard] =
    useState<GPTAssistantCardProps | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const systemPrompt = selectedCard?.systemPrompt || "";
      const response = await fetch("/api/admin/gpt-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          systemPrompt,
          context: selectedCard?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("GPT 어시스턴트 응답 실패");
      }

      return response.json();
    },
    onSuccess: data => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    },
    onError: error => {
      toast({
        title: "오류 발생",
        description: "GPT 어시스턴트 응답 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const generateWeeklyReportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/generate-weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("주간 리포트 생성 실패");
      }

      return response.json();
    },
    onSuccess: data => {
      const reportMessage: ChatMessage = {
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };
      setMessages([reportMessage]);

      toast({
        title: "주간 리포트 생성 완료",
        description: "새로운 주간 리포트가 성공적으로 생성되었습니다.",
      });
    },
    onError: error => {
      toast({
        title: "리포트 생성 실패",
        description: "주간 리포트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleCardSelect = (card: GPTAssistantCardProps) => {
    setSelectedCard(card);
    setMessages([]);

    if (card.id === "weekly-report") {
      // 주간 리포트 자동 생성
      const generatingMessage: ChatMessage = {
        role: "assistant",
        content: "주간 리포트를 생성하고 있습니다. 잠시만 기다려 주세요...",
        timestamp: new Date(),
      };
      setMessages([generatingMessage]);

      // 자동으로 주간 리포트 생성 API 호출
      generateWeeklyReportMutation.mutate();
    } else {
      // 초기 인사 메시지
      const welcomeMessage: ChatMessage = {
        role: "assistant",
        content: `안녕하세요! ${card.title} 전문가입니다. ${card.description}\n\n어떤 것을 도와드릴까요?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "복사 완료",
        description: "메시지가 클립보드에 복사되었습니다.",
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드 복사 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (selectedCard) {
    return (
      <div className="space-y-4">
        {/* Chat Header */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCard(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>
          <div
            className={`p-2 rounded-lg bg-gradient-to-r ${selectedCard.color} text-white`}
          >
            {selectedCard.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {selectedCard.title}
            </h3>
            <p className="text-sm text-gray-600">{selectedCard.description}</p>
          </div>
        </div>

        {/* Chat Messages */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <ScrollArea className="h-96 mb-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-500 text-white ml-4"
                          : "bg-gray-100 text-gray-900 mr-4"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`text-xs ${
                            message.role === "user"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {message.role === "assistant" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMessage(message.content)}
                            className={`h-6 w-6 p-0 hover:bg-gray-200`}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="질문을 입력하세요..."
                className="flex-1 min-h-[80px] resize-none"
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isPending}
                className="self-end"
              >
                {chatMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">GPT 비서</h2>
        </div>
        <p className="text-gray-600">
          전문 분야별 AI 어시스턴트와 대화하여 서비스 운영에 필요한 인사이트를
          얻으세요
        </p>
      </div>

      {/* Assistant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GPT_ASSISTANT_CARDS.map(card => (
          <Card
            key={card.id}
            className="cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
            onClick={() => handleCardSelect(card)}
          >
            <CardHeader className="pb-3">
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
              >
                <div className="text-white">{card.icon}</div>
              </div>
              <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {card.description}
              </p>
              <Badge
                variant="outline"
                className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                대화 시작
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
