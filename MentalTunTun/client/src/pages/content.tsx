import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Eye, Clock, Plus, Send, X } from "lucide-react";

// Content categories for filtering
const contentCategories = [
  { id: "psychology", name: "정신건강", color: "bg-blue-100 text-blue-800" },
  { id: "health", name: "건강정보", color: "bg-green-100 text-green-800" },
  { id: "wellness", name: "웰니스", color: "bg-purple-100 text-purple-800" },
  {
    id: "lifestyle",
    name: "라이프스타일",
    color: "bg-yellow-100 text-yellow-800",
  },
  { id: "mindfulness", name: "마음챙김", color: "bg-pink-100 text-pink-800" },
  { id: "news", name: "오늘의 뉴스", color: "bg-indigo-100 text-indigo-800" },
];

// Fetch content from API - using public endpoint for users
const useContent = () => {
  return useQuery({
    queryKey: ["/api/content"],
    staleTime: 5 * 60 * 1000,
  });
};

// Content request dialog component
function ContentRequestDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestMutation = useMutation({
    mutationFn: async (data: {
      subject: string;
      content: string;
      reason: string;
      userEmail: string;
    }) => {
      const response = await fetch("/api/content-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to submit request");
      return response.json();
    },
    onSuccess: () => {
      toast({ description: "컨텐츠 신청이 접수되었습니다." });
      setIsOpen(false);
      setSubject("");
      setContent("");
      setReason("");
    },
    onError: () => {
      toast({
        description: "컨텐츠 신청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!subject.trim() || !content.trim() || !reason.trim()) {
      toast({
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    requestMutation.mutate({
      subject: subject.trim(),
      content: content.trim(),
      reason: reason.trim(),
      userEmail: "user@example.com", // This would come from user session
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          신청하기
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>컨텐츠 신청</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">주제</Label>
            <Input
              id="subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="신청하실 컨텐츠 주제를 입력해주세요"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">신청내용</Label>
            <Textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="구체적인 내용이나 궁금한 점을 자세히 작성해주세요"
              rows={4}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">신청이유</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="해당 컨텐츠가 필요한 이유를 알려주세요"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={requestMutation.isPending}
          >
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={requestMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {requestMutation.isPending ? "전송중..." : "보내기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ContentPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: contentItems, isLoading } = useContent();

  // Filter content based on category and search
  const filteredContent =
    contentItems?.filter((item: any) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }) || [];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
            건강한 컨텐츠 정보
          </h1>
          <p className="text-gray-600 leading-relaxed">
            정신건강과 웰빙에 도움이 되는 전문 컨텐츠를 만나보세요
          </p>
        </div>

        {/* Category filters with request button */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <ContentRequestDialog />
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="shadow-md hover:shadow-lg transition-all"
            >
              전체
            </Button>
            {contentCategories.map(category => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() => setSelectedCategory(category.id)}
                className="shadow-md hover:shadow-lg transition-all"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">컨텐츠를 불러오는 중...</p>
            </div>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              등록된 컨텐츠가 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              관리자가 컨텐츠를 등록하면 이곳에 표시됩니다.
            </p>
            <ContentRequestDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item: any) => (
              <Card
                key={item.id}
                className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border border-gray-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      className={
                        contentCategories.find(cat => cat.id === item.category)
                          ?.color || "bg-gray-100 text-gray-800"
                      }
                    >
                      {contentCategories.find(cat => cat.id === item.category)
                        ?.name || item.category}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="w-4 h-4 mr-1" />
                      {item.viewCount || 0}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h3>

                  {item.content && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {item.content.length > 150
                        ? `${item.content.substring(0, 150)}...`
                        : item.content}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                    </div>

                    {item.url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.url, "_blank")}
                        className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        읽기
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="cursor-default"
                      >
                        링크 없음
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
