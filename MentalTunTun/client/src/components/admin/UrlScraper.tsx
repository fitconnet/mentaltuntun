import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  Calendar as CalendarIcon,
  Globe,
  Sparkles,
  Search,
  X,
  Upload,
  Image,
  Copy,
  RefreshCw,
  Eye,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface UrlScraperProps {
  onBack: () => void;
}

interface ScrapedContent {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  images: string[];
  metadata: {
    author?: string;
    publishDate?: string;
    readTime?: string;
    wordCount?: number;
  };
}

export default function UrlScraper({ onBack }: UrlScraperProps) {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent | null>(
    null
  );
  const [editableTitle, setEditableTitle] = useState("");
  const [editableSummary, setEditableSummary] = useState("");
  const [editableTags, setEditableTags] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [category, setCategory] = useState("psychology");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [publishType, setPublishType] = useState<"immediate" | "scheduled">(
    "immediate"
  );
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("09:00");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          const result = e.target?.result as string;
          setUploadedImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // URL 분석 mutation
  const analyzeUrl = useMutation({
    mutationFn: async (urlToAnalyze: string) => {
      setIsAnalyzing(true);
      const response = await fetch("/api/admin/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToAnalyze }),
      });

      if (!response.ok) {
        throw new Error("URL 분석에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (data: ScrapedContent) => {
      setScrapedContent(data);
      setEditableTitle(data.title);
      setEditableSummary(data.summary);
      setEditableTags(data.tags);
      setSelectedImage(data.images[0] || "");
      setIsAnalyzing(false);
      toast({ title: "URL 분석이 완료되었습니다!" });
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      toast({
        title: "URL 분석 실패",
        description: error.message || "URL을 분석하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 콘텐츠 저장 mutation
  const saveContent = useMutation({
    mutationFn: async (contentData: any) => {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ title: "콘텐츠가 성공적으로 저장되었습니다." });
      onBack();
    },
    onError: () => {
      toast({ title: "콘텐츠 저장에 실패했습니다.", variant: "destructive" });
    },
  });

  const handleAnalyze = () => {
    if (!url.trim()) {
      toast({ title: "URL을 입력해주세요.", variant: "destructive" });
      return;
    }

    // URL 형식 검증
    try {
      new URL(url);
    } catch {
      toast({
        title: "올바른 URL 형식을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    analyzeUrl.mutate(url);
  };

  const handleSave = () => {
    if (!scrapedContent || !editableTitle.trim()) {
      toast({
        title: "분석된 콘텐츠가 없거나 제목이 누락되었습니다.",
        variant: "destructive",
      });
      return;
    }

    const contentData = {
      title: editableTitle.trim(),
      summary: editableSummary.trim(),
      content: scrapedContent.content,
      category,
      tags: editableTags,
      selectedImage: selectedImage, // Pass selected image for title image
      thumbnailUrl: selectedImage,
      sourceUrl: url,
      url: url,
      type: "scraped",
      publishType,
      scheduledDate: publishType === "scheduled" ? scheduledDate : null,
      scheduledTime: publishType === "scheduled" ? scheduledTime : null,
      status: publishType === "immediate" ? "published" : "scheduled",
      metadata: scrapedContent.metadata,
    };

    saveContent.mutate(contentData);
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !editableTags.includes(tag.trim())) {
      setEditableTags([...editableTags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditableTags(editableTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로 돌아가기
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">URL 스크래핑</h2>
        </div>
        {scrapedContent && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPublishType("scheduled")}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              예약 발행
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveContent.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {publishType === "immediate" ? "바로 발행" : "예약 설정"}
            </Button>
          </div>
        )}
      </div>

      {/* URL Input */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            URL 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="분석할 URL을 입력하세요 (예: https://blog.naver.com/...)"
                onKeyPress={e => e.key === "Enter" && handleAnalyze()}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  분석중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 분석 시작
                </>
              )}
            </Button>
          </div>

          {isAnalyzing && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">
                    AI가 콘텐츠를 분석하고 있습니다...
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    타이틀, 요약글, 해시태그 생성 및 이미지 수집 중
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scraped Content Preview */}
      {scrapedContent && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              분석 결과 편집
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scraped-title">제목 *</Label>
                  <Input
                    id="scraped-title"
                    value={editableTitle}
                    onChange={e => setEditableTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="scraped-category">카테고리</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psychology">정신건강</SelectItem>
                      <SelectItem value="health">건강</SelectItem>
                      <SelectItem value="wellness">웰니스</SelectItem>
                      <SelectItem value="lifestyle">라이프스타일</SelectItem>
                      <SelectItem value="mindfulness">마음챙김</SelectItem>
                      <SelectItem value="news">오늘의 뉴스</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scraped-summary">요약글</Label>
                  <Textarea
                    id="scraped-summary"
                    value={editableSummary}
                    onChange={e => setEditableSummary(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>이미지 선택</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                        className="flex items-center gap-1 text-xs"
                      >
                        <Upload className="w-3 h-3" />
                        업로드
                      </Button>
                    </div>
                  </div>

                  {/* 업로드된 이미지 섹션 */}
                  {uploadedImages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-blue-600 mb-2">
                        업로드된 이미지
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {uploadedImages.map((image, index) => (
                          <div
                            key={`uploaded-${index}`}
                            className={`relative border-2 rounded-lg cursor-pointer transition-all ${
                              selectedImage === image
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() =>
                              setSelectedImage(
                                selectedImage === image ? "" : image
                              )
                            }
                          >
                            <img
                              src={image}
                              alt={`업로드된 이미지 ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            {selectedImage === image && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                <Search className="w-3 h-3" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                removeUploadedImage(index);
                              }}
                              className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 스크래핑된 이미지 섹션 */}
                  {scrapedContent.images.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-green-600 mb-2">
                        웹페이지에서 수집된 이미지
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {scrapedContent.images
                          .slice(0, 4)
                          .map((imageUrl, index) => (
                            <div
                              key={`scraped-${index}`}
                              className={`relative border-2 rounded-lg cursor-pointer transition-all ${
                                selectedImage === imageUrl
                                  ? "border-purple-500 ring-2 ring-purple-200"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => setSelectedImage(imageUrl)}
                            >
                              <img
                                src={imageUrl}
                                alt={`수집된 이미지 ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg"
                                onError={e => {
                                  e.currentTarget.parentElement?.classList.add(
                                    "hidden"
                                  );
                                }}
                              />
                              {selectedImage === imageUrl && (
                                <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full p-1">
                                  <Search className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {scrapedContent.images.length === 0 &&
                    uploadedImages.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 mb-1">
                          이미지를 업로드하거나
                        </p>
                        <p className="text-xs text-gray-400">
                          웹페이지에서 이미지를 수집해보세요
                        </p>
                      </div>
                    )}
                </div>

                <div>
                  <Label>AI 생성 해시태그</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editableTags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        #{tag}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  {scrapedContent.tags.filter(
                    tag => !editableTags.includes(tag)
                  ).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">추천 태그:</p>
                      <div className="flex flex-wrap gap-1">
                        {scrapedContent.tags
                          .filter(tag => !editableTags.includes(tag))
                          .map(tag => (
                            <Button
                              key={tag}
                              size="sm"
                              variant="outline"
                              onClick={() => addTag(tag)}
                              className="h-6 text-xs"
                            >
                              + #{tag}
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            {scrapedContent.metadata &&
              Object.keys(scrapedContent.metadata).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    원본 콘텐츠 정보
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {scrapedContent.metadata.author && (
                      <div>
                        <span className="text-gray-600">작성자:</span>
                        <p className="font-medium">
                          {scrapedContent.metadata.author}
                        </p>
                      </div>
                    )}
                    {scrapedContent.metadata.publishDate && (
                      <div>
                        <span className="text-gray-600">발행일:</span>
                        <p className="font-medium">
                          {scrapedContent.metadata.publishDate}
                        </p>
                      </div>
                    )}
                    {scrapedContent.metadata.readTime && (
                      <div>
                        <span className="text-gray-600">읽기 시간:</span>
                        <p className="font-medium">
                          {scrapedContent.metadata.readTime}
                        </p>
                      </div>
                    )}
                    {scrapedContent.metadata.wordCount && (
                      <div>
                        <span className="text-gray-600">글자 수:</span>
                        <p className="font-medium">
                          {scrapedContent.metadata.wordCount.toLocaleString()}자
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Content Preview */}
            <div>
              <Label>본문 내용 미리보기</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {scrapedContent.content.length > 500
                      ? `${scrapedContent.content.substring(0, 500)}...`
                      : scrapedContent.content}
                  </p>
                  {scrapedContent.content.length > 500 && (
                    <p className="text-xs text-gray-500 mt-2">
                      전체 {scrapedContent.content.length}자 중 일부만
                      표시됩니다.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Scheduling Options */}
            {publishType === "scheduled" && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    예약 발행 설정
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>발행 날짜</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left mt-1"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate
                              ? format(scheduledDate, "PPP", { locale: ko })
                              : "날짜 선택"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            disabled={date => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="scraped-time">발행 시간</Label>
                      <Input
                        id="scraped-time"
                        type="time"
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
