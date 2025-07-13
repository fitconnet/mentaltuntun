import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Headphones,
  MessageCircle,
  Mail,
  Send,
  Bot,
  User,
  HelpCircle,
  BookOpen,
  Settings,
  Heart,
  Clock,
  CheckCircle,
} from "lucide-react";

const FAQ_ITEMS = [
  {
    id: 1,
    category: "사용법",
    question: "AI 상담은 어떻게 이용하나요?",
    answer:
      "홈 화면에서 'AI 상담' 카드를 클릭하거나, 사이드 메뉴에서 AI 상담을 선택하세요. 현재 고민이나 상황을 선택하면 적합한 페르소나가 추천됩니다.",
    icon: MessageCircle,
  },
  {
    id: 2,
    category: "기능",
    question: "감정 일기는 어떻게 작성하나요?",
    answer:
      "홈 화면의 '감정 일기' 카드를 클릭하면 오늘의 감정을 선택하고 간단한 메모를 작성할 수 있습니다. 매일 기록하면 감정 변화 패턴을 확인할 수 있어요.",
    icon: Heart,
  },
  {
    id: 3,
    category: "구독",
    question: "무료 버전과 유료 버전의 차이점은 무엇인가요?",
    answer:
      "무료 버전은 AI 상담 2회, 나는 누구 1회 제한이 있습니다. 프리미엄 버전은 모든 기능을 무제한으로 이용 가능하며, 상세한 성격분석과 심리테스트를 제공합니다.",
    icon: Settings,
  },
  {
    id: 4,
    category: "사용법",
    question: "성격분석 결과를 어떻게 해석하나요?",
    answer:
      "성격분석 페이지에서 5가지 카테고리별로 상세한 분석 결과를 확인할 수 있습니다. 각 키워드를 클릭하면 더 자세한 설명과 개선 방법을 볼 수 있어요.",
    icon: BookOpen,
  },
  {
    id: 5,
    category: "기술",
    question: "데이터는 안전하게 보관되나요?",
    answer:
      "모든 개인정보와 상담 내용은 암호화되어 안전하게 저장됩니다. 데이터는 서비스 개선 목적으로만 사용되며, 제3자와 공유되지 않습니다.",
    icon: CheckCircle,
  },
];

export default function Support() {
  const [activeTab, setActiveTab] = useState<"faq" | "chat" | "contact">("faq");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: number;
      type: "bot" | "user";
      content: string;
      timestamp: Date;
    }>
  >([
    {
      id: 1,
      type: "bot" as const,
      content: "안녕하세요! 멘탈튼튼 고객센터입니다. 어떤 도움이 필요하신가요?",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    category: "general",
    subject: "",
    message: "",
  });

  const { toast } = useToast();

  const categories = [
    { id: "all", name: "전체", count: FAQ_ITEMS.length },
    {
      id: "사용법",
      name: "사용법",
      count: FAQ_ITEMS.filter(item => item.category === "사용법").length,
    },
    {
      id: "기능",
      name: "기능",
      count: FAQ_ITEMS.filter(item => item.category === "기능").length,
    },
    {
      id: "구독",
      name: "구독",
      count: FAQ_ITEMS.filter(item => item.category === "구독").length,
    },
    {
      id: "기술",
      name: "기술",
      count: FAQ_ITEMS.filter(item => item.category === "기술").length,
    },
  ];

  const filteredFAQ =
    selectedCategory === "all"
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter(item => item.category === selectedCategory);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Add user message
    const userMessage = {
      id: chatMessages.length + 1,
      type: "user" as const,
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: chatMessages.length + 2,
        type: "bot" as const,
        content:
          "고객님의 문의를 확인했습니다. 좀 더 구체적인 도움이 필요하시면 '문의하기'를 통해 상세한 내용을 보내주세요. 담당자가 빠르게 답변드리겠습니다.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !contactForm.name ||
      !contactForm.email ||
      !contactForm.subject ||
      !contactForm.message
    ) {
      toast({
        title: "모든 필드를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/customer-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(contactForm),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "문의가 접수되었습니다",
          description: "빠른 시일 내에 답변드리겠습니다.",
        });

        setContactForm({
          name: "",
          email: "",
          category: "general",
          subject: "",
          message: "",
        });
      } else {
        throw new Error(data.error || "문의 접수에 실패했습니다.");
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast({
        title: "문의 접수에 실패했습니다",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Headphones className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">고객센터</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          멘탈튼튼 이용에 대한 궁금한 점이 있으시면 언제든지 문의해주세요
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg">
          <Button
            variant={activeTab === "faq" ? "default" : "ghost"}
            onClick={() => setActiveTab("faq")}
            className="px-6"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            자주 묻는 질문
          </Button>
          <Button
            variant={activeTab === "chat" ? "default" : "ghost"}
            onClick={() => setActiveTab("chat")}
            className="px-6"
          >
            <Bot className="w-4 h-4 mr-2" />
            Q&A 챗봇
          </Button>
          <Button
            variant={activeTab === "contact" ? "default" : "ghost"}
            onClick={() => setActiveTab("contact")}
            className="px-6"
          >
            <Mail className="w-4 h-4 mr-2" />
            문의하기
          </Button>
        </div>
      </div>

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() => setSelectedCategory(category.id)}
                className="gap-2"
              >
                {category.name}
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="grid gap-4 max-w-4xl mx-auto">
            {filteredFAQ.map(item => (
              <Card
                key={item.id}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <item.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        <h3 className="font-semibold text-gray-900">
                          {item.question}
                        </h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                실시간 Q&A 챗봇
              </CardTitle>
              <p className="text-sm text-gray-600">
                간단한 질문은 챗봇이 즉시 답변해드립니다
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4 bg-gray-50">
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.type === "bot" && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.type === "user"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.type === "user" && (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="궁금한 점을 입력해주세요..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!chatInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                문의하기
              </CardTitle>
              <p className="text-sm text-gray-600">
                상세한 문의사항을 남겨주시면 담당자가 빠르게 답변드리겠습니다
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={e =>
                        setContactForm(prev => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">이메일 *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={e =>
                        setContactForm(prev => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">문의 유형</Label>
                  <select
                    id="category"
                    value={contactForm.category}
                    onChange={e =>
                      setContactForm(prev => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="general">일반 문의</option>
                    <option value="technical">기술 문의</option>
                    <option value="billing">결제 문의</option>
                    <option value="feature">기능 건의</option>
                    <option value="bug">버그 신고</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject">제목 *</Label>
                  <Input
                    id="subject"
                    value={contactForm.subject}
                    onChange={e =>
                      setContactForm(prev => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">내용 *</Label>
                  <Textarea
                    id="message"
                    value={contactForm.message}
                    onChange={e =>
                      setContactForm(prev => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    required
                    rows={6}
                    className="mt-1"
                    placeholder="문의 내용을 상세히 작성해주세요..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      답변 안내
                    </span>
                  </div>
                  <p className="text-sm text-blue-800">
                    문의 접수 후 24시간 내에 답변드리겠습니다. 급한 문의사항은
                    Q&A 챗봇을 먼저 이용해보세요.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  문의 보내기
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
