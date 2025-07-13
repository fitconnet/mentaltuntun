import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Clock,
  User,
  Tag,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Trash2,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface CustomerInquiry {
  id: number;
  userId?: number;
  email: string;
  name: string;
  category: string;
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved";
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerInquiryManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] =
    useState<CustomerInquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: inquiriesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/customer-inquiries"],
    retry: 2,
    retryDelay: 1000,
  });

  const inquiries = Array.isArray(inquiriesData?.inquiries)
    ? inquiriesData.inquiries
    : [];

  const replyMutation = useMutation({
    mutationFn: async ({ id, reply }: { id: number; reply: string }) => {
      const response = await fetch(
        `/api/admin/customer-inquiries/${id}/reply`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reply }),
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("답변 전송 실패");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "답변이 성공적으로 전송되었습니다" });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/customer-inquiries"],
      });
      setReplyText("");
      setSelectedInquiry(null);
    },
    onError: () => {
      toast({ title: "답변 전송에 실패했습니다", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/customer-inquiries/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "문의를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다."
          );
        }
        throw new Error(data.error || "문의 삭제 실패");
      }
      return data;
    },
    onSuccess: () => {
      toast({ title: "문의가 성공적으로 삭제되었습니다" });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/customer-inquiries"],
      });
      setSelectedInquiry(null); // 상세보기 창 닫기
    },
    onError: (error: Error) => {
      toast({
        title: "문의 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
      // 404 오류인 경우 목록 새로고침하여 삭제된 항목 제거
      if (error.message.includes("찾을 수 없습니다")) {
        queryClient.invalidateQueries({
          queryKey: ["/api/admin/customer-inquiries"],
        });
        setSelectedInquiry(null);
      }
    },
  });

  const filteredInquiries = inquiries.filter((inquiry: CustomerInquiry) => {
    if (!inquiry || typeof inquiry !== "object") return false;

    const matchesSearch =
      (inquiry.subject?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (inquiry.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (inquiry.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            대기중
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Clock className="w-3 h-3 mr-1" />
            처리중
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            완료
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "서비스":
      case "service":
        return "bg-blue-100 text-blue-800";
      case "결제":
      case "payment":
        return "bg-green-100 text-green-800";
      case "기술":
      case "technical":
        return "bg-purple-100 text-purple-800";
      case "제안":
      case "feature":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case "service":
        return "서비스";
      case "payment":
        return "결제";
      case "technical":
        return "기술";
      case "feature":
        return "제안";
      default:
        return category;
    }
  };

  const handleSendReply = () => {
    if (!selectedInquiry || !replyText.trim()) return;
    replyMutation.mutate({ id: selectedInquiry.id, reply: replyText });
  };

  const handleDeleteInquiry = (inquiry: CustomerInquiry) => {
    if (
      confirm(
        `"${inquiry.subject}" 문의를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      deleteMutation.mutate(inquiry.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h3>
          <p className="text-red-600 mb-4">
            고객 문의 데이터를 불러오는 중 오류가 발생했습니다.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700"
          >
            페이지 새로고침
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            고객 문의 관리
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            총 {inquiries.length}건의 문의 (
            {
              inquiries.filter((i: CustomerInquiry) => i.status === "pending")
                .length
            }
            건 대기중)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="문의 제목, 이름, 이메일 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="in_progress">처리중</option>
            <option value="resolved">완료</option>
          </select>
        </div>
      </div>

      {/* Inquiry List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inquiry List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">문의 목록</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredInquiries.map((inquiry: CustomerInquiry) => (
              <Card
                key={inquiry.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedInquiry?.id === inquiry.id
                    ? "ring-2 ring-purple-500 bg-purple-50"
                    : ""
                }`}
                onClick={() => setSelectedInquiry(inquiry)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(inquiry.status)}
                      <Badge
                        className={`text-xs ${getCategoryColor(inquiry.category)}`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {getCategoryDisplayName(inquiry.category)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(inquiry.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
                    {inquiry.subject}
                  </h4>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {inquiry.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {inquiry.email}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {inquiry.message}
                  </p>
                </CardContent>
              </Card>
            ))}

            {filteredInquiries.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    검색 조건에 맞는 문의가 없습니다.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Inquiry Details and Reply */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            문의 상세 및 답변
          </h3>

          {selectedInquiry ? (
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {selectedInquiry.subject}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedInquiry.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteInquiry(selectedInquiry)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedInquiry.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {selectedInquiry.email}
                  </div>
                  <Badge
                    className={`text-xs ${getCategoryColor(selectedInquiry.category)}`}
                  >
                    {getCategoryDisplayName(selectedInquiry.category)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">문의 내용</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    {selectedInquiry.message}
                  </div>
                </div>

                {selectedInquiry.adminReply && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      관리자 답변
                      <span className="text-xs text-gray-500 font-normal ml-2">
                        (
                        {new Date(selectedInquiry.repliedAt!).toLocaleString(
                          "ko-KR"
                        )}
                        )
                      </span>
                    </h4>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm border-l-4 border-blue-500">
                      {selectedInquiry.adminReply}
                    </div>
                  </div>
                )}

                {selectedInquiry.status !== "resolved" && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      답변 작성
                    </h4>
                    <Textarea
                      placeholder="고객에게 보낼 답변을 작성해주세요..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <div className="flex justify-end mt-3">
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || replyMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {replyMutation.isPending ? "전송 중..." : "답변 보내기"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  문의를 선택하면 상세 내용을 확인할 수 있습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
