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
  Clock,
  Image,
  Plus,
  X,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ContentCreatorProps {
  onBack: () => void;
  initialData?: any;
}

export default function ContentCreator({
  onBack,
  initialData,
}: ContentCreatorProps) {
  const [activeTab, setActiveTab] = useState<"card" | "article">("card");
  const [title, setTitle] = useState(initialData?.title || "");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [category, setCategory] = useState(
    initialData?.category || "psychology"
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialData?.thumbnailUrl || ""
  );
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState("");
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

  // 콘텐츠 저장/수정 mutation
  const saveContent = useMutation({
    mutationFn: async (contentData: any) => {
      const url = initialData
        ? `/api/admin/content/${initialData.id}`
        : "/api/admin/content";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentData),
      });
      return response.json();
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      const message = initialData
        ? "콘텐츠가 성공적으로 수정되었습니다."
        : "콘텐츠가 성공적으로 저장되었습니다.";
      toast({ title: message });
      onBack();
    },
    onError: () => {
      const message = initialData
        ? "콘텐츠 수정에 실패했습니다."
        : "콘텐츠 저장에 실패했습니다.";
      toast({ title: message, variant: "destructive" });
    },
  });

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "제목을 입력해주세요.", variant: "destructive" });
      return;
    }

    const contentData = {
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      category,
      tags,
      selectedImage: selectedImage || thumbnailUrl,
      thumbnailUrl: selectedImage || thumbnailUrl,
      type: activeTab,
      publishType,
      scheduledDate: publishType === "scheduled" ? scheduledDate : null,
      scheduledTime: publishType === "scheduled" ? scheduledTime : null,
      status: publishType === "immediate" ? "published" : "scheduled",
    };

    saveContent.mutate(contentData);
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
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? "콘텐츠 수정" : "콘텐츠 직접 작성"}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPublishType("scheduled")}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            예약 발행
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveContent.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveContent.isPending
              ? "저장중..."
              : initialData
                ? "수정 완료"
                : publishType === "immediate"
                  ? "바로 발행"
                  : "예약 설정"}
          </Button>
        </div>
      </div>

      {/* Content Type Tabs */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex gap-4 mb-6">
            <Button
              variant={activeTab === "card" ? "default" : "outline"}
              onClick={() => setActiveTab("card")}
              className="flex-1"
            >
              카드뉴스 형식
            </Button>
            <Button
              variant={activeTab === "article" ? "default" : "outline"}
              onClick={() => setActiveTab("article")}
              className="flex-1"
            >
              아티클 형식
            </Button>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="콘텐츠 제목을 입력하세요"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category">카테고리</Label>
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
                <Label htmlFor="summary">요약글</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="콘텐츠 요약을 입력하세요 (2-3줄 권장)"
                  rows={3}
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
                      <Image className="w-3 h-3" />
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
                              <Image className="w-3 h-3" />
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

                {/* URL 입력 섹션 */}
                <div className="mb-2">
                  <Label htmlFor="thumbnail" className="text-xs">
                    또는 이미지 URL 직접 입력
                  </Label>
                  <Input
                    id="thumbnail"
                    value={thumbnailUrl}
                    onChange={e => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                  {thumbnailUrl && (
                    <div className="mt-2">
                      <img
                        src={thumbnailUrl}
                        alt="썸네일 미리보기"
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={e => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {uploadedImages.length === 0 && !thumbnailUrl && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">
                      이미지를 업로드하거나
                    </p>
                    <p className="text-xs text-gray-400">URL을 입력해보세요</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="tags">해시태그</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder="태그 입력 후 추가 버튼 클릭"
                    onKeyPress={e => e.key === "Enter" && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
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
              </div>
            </div>
          </div>

          {/* Content Editor */}
          {activeTab === "card" ? (
            <CardNewsEditor content={content} onChange={setContent} />
          ) : (
            <ArticleEditor content={content} onChange={setContent} />
          )}

          {/* Scheduling Options */}
          {publishType === "scheduled" && (
            <Card className="mt-6 border-purple-200 bg-purple-50">
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
                    <Label htmlFor="time">발행 시간</Label>
                    <Input
                      id="time"
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
    </div>
  );
}

// 카드뉴스 에디터 컴포넌트
function CardNewsEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Label>카드뉴스 내용</Label>
      <div className="border rounded-lg p-4 min-h-[400px] bg-gray-50">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            카드뉴스 형식으로 간결하고 임팩트 있는 내용을 작성하세요.
          </p>
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="outline">
              <Image className="w-4 h-4 mr-1" />
              이미지 추가
            </Button>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              카드 추가
            </Button>
          </div>
        </div>
        <Textarea
          value={content}
          onChange={e => onChange(e.target.value)}
          placeholder="카드뉴스 내용을 입력하세요. 각 카드는 2-3줄로 구성하며, '---'로 카드를 구분하세요."
          className="min-h-[300px] bg-white"
          rows={15}
        />
      </div>
    </div>
  );
}

// 아티클 에디터 컴포넌트 (네이버 블로그 스타일)
function ArticleEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Label>아티클 본문</Label>
      <div className="border rounded-lg overflow-hidden">
        {/* 에디터 툴바 */}
        <div className="bg-gray-100 p-3 border-b flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <Bold className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Italic className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Underline className="w-4 h-4" />
          </Button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <Button size="sm" variant="outline">
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <AlignRight className="w-4 h-4" />
          </Button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <Button size="sm" variant="outline">
            <List className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Link className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Image className="w-4 h-4" />
          </Button>
        </div>

        {/* 에디터 영역 */}
        <div className="p-4 bg-white">
          <Textarea
            value={content}
            onChange={e => onChange(e.target.value)}
            placeholder="본문 내용을 입력하세요. 마크다운 문법을 지원합니다.&#10;&#10;# 제목 1&#10;## 제목 2&#10;**굵은 글씨**&#10;*기울임*&#10;- 목록 항목&#10;[링크](URL)&#10;![이미지](이미지URL)"
            className="min-h-[400px] border-0 resize-none focus:ring-0"
            rows={20}
          />
        </div>
      </div>

      {/* 에디터 도움말 */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>
          <strong>작성 팁:</strong>
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>제목은 # 또는 ## 를 사용하여 계층 구조를 만드세요</li>
          <li>중요한 내용은 **굵게** 표시하세요</li>
          <li>목록은 - 또는 1. 을 사용하세요</li>
          <li>이미지는 ![설명](URL) 형식으로 삽입하세요</li>
        </ul>
      </div>
    </div>
  );
}
