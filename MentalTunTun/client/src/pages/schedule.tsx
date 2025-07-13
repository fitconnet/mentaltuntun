import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  Plus,
  Bell,
  Repeat,
  Edit,
  Trash2,
  Tag,
  FileText,
  Check,
  X,
  Heart,
  MessageCircle,
  Building2,
  Hospital,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { User, ScheduleAppointment } from "@/types";
import {
  generateRepeatAppointments,
  deleteRepeatEvents,
  type AppointmentData,
} from "@/utils/repeatScheduleUtils";

const APPOINTMENT_TYPES = [
  {
    value: "감정일기",
    label: "감정일기",
    icon: Heart,
    color: "pink",
    bgColor: "bg-pink-100",
    borderColor: "border-pink-300",
    textColor: "text-pink-700",
  },
  {
    value: "AI상담",
    label: "AI상담",
    icon: MessageCircle,
    color: "blue",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    textColor: "text-blue-700",
  },
  {
    value: "심리상담센터",
    label: "심리상담센터",
    icon: Building2,
    color: "purple",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
    textColor: "text-purple-700",
  },
  {
    value: "병원예약",
    label: "병원예약",
    icon: Plus,
    color: "green",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    textColor: "text-green-700",
  },
];

const REPEAT_OPTIONS = [
  { value: "none", label: "반복 없음" },
  { value: "weekly", label: "주간" },
  { value: "monthly", label: "월간" },
];

const WEEK_INTERVALS = [
  { value: 1, label: "매주" },
  { value: 2, label: "격주" },
  { value: 3, label: "3째주마다" },
  { value: 4, label: "4째주마다" },
  { value: 5, label: "5째주마다" },
  { value: 6, label: "6째주마다" },
  { value: 7, label: "7째주마다" },
  { value: 8, label: "8째주마다" },
  { value: 9, label: "9째주마다" },
  { value: 10, label: "10째주마다" },
];

const MONTH_INTERVALS = [
  { value: 1, label: "매월" },
  { value: 2, label: "격월" },
  { value: 3, label: "3개월마다" },
  { value: 4, label: "4개월마다" },
  { value: 5, label: "5개월마다" },
  { value: 6, label: "6개월마다" },
  { value: 7, label: "7개월마다" },
  { value: 8, label: "8개월마다" },
  { value: 9, label: "9개월마다" },
  { value: 10, label: "10개월마다" },
];

const MONTHLY_TYPES = [
  { value: "weekday", label: "요일 기준" },
  { value: "date", label: "날짜 기준" },
];

const MONTH_DATES = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}일`,
}));

const WEEKDAYS = [
  { value: "sun", label: "일" },
  { value: "mon", label: "월" },
  { value: "tue", label: "화" },
  { value: "wed", label: "수" },
  { value: "thu", label: "목" },
  { value: "fri", label: "금" },
  { value: "sat", label: "토" },
];

const REMINDER_OPTIONS = [
  { value: 10, label: "10분 전" },
  { value: 30, label: "30분 전" },
  { value: 60, label: "1시간 전" },
];

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
];

// 지침서 기반 새로운 반복 일정 유틸리티 사용

// 날짜를 YYYY-MM-DD 형식으로 포맷하는 함수 (시간대 차이 방지)
const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 유틸리티 함수들은 repeatScheduleUtils.ts로 이동됨

export default function SchedulePage() {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // 사용자 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const uid = localStorage.getItem("uid");
      const authToken = localStorage.getItem("authToken");

      if (!uid || !authToken) {
        setLocation("/login");
        return;
      }

      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } catch (error) {
          console.error("사용자 데이터 파싱 실패:", error);
          setLocation("/login");
        }
      } else {
        setLocation("/login");
      }
    };

    checkAuth();
  }, [setLocation]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRepeatCalendarOpen, setIsRepeatCalendarOpen] = useState(false);
  const [selectedDateForView, setSelectedDateForView] = useState<Date | null>(
    null
  );
  const [isDateDetailOpen, setIsDateDetailOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedAppointmentForDelete, setSelectedAppointmentForDelete] =
    useState<ScheduleAppointment | null>(null);
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    date: "",
    startTime: "",
    endTime: "none",
    repeatType: "none",
    repeatInterval: 1, // 1=매주/매월, 2=격주/격월
    repeatDays: [] as string[], // 기존 호환성용
    repeatWeekdays: [] as number[], // 새로운 표준 (0~6)
    repeatDates: [] as number[],
    monthlyBasis: "date" as "weekday" | "date", // 월간 반복 기준 (날짜 기준으로 고정)
    reminderMinutes: 30,
    memo: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    number | null
  >(null);

  // Check authentication
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [setLocation]);

  // Fetch appointments
  const { data: appointments = [], refetch } = useQuery({
    queryKey: ["/api/users/1/schedule/appointments"],
    enabled: !!user,
  });

  // Handler functions
  const handleWeekdayToggle = (day: string) => {
    // JavaScript getDay() 기준: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
    const dayIndex = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(
      day
    );
    const dayNameKorean = ["일", "월", "화", "수", "목", "금", "토"][dayIndex];
    console.log(
      `요일 토글: ${day} → ${dayNameKorean}요일 (인덱스: ${dayIndex})`
    );

    setFormData(prev => {
      const newRepeatWeekdays = prev.repeatWeekdays.includes(dayIndex)
        ? prev.repeatWeekdays.filter(d => d !== dayIndex)
        : [...prev.repeatWeekdays, dayIndex];

      // repeatDays 필드도 함께 업데이트 (기존 호환성 유지)
      const newRepeatDays = newRepeatWeekdays.map(
        idx => ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][idx]
      );

      console.log(`선택된 요일 인덱스들:`, newRepeatWeekdays);
      console.log(
        `선택된 요일 이름들:`,
        newRepeatWeekdays.map(
          idx => ["일", "월", "화", "수", "목", "금", "토"][idx]
        )
      );
      console.log(`선택된 요일 문자열들:`, newRepeatDays);

      return {
        ...prev,
        repeatWeekdays: newRepeatWeekdays,
        repeatDays: newRepeatDays,
      };
    });
  };

  const handleDateToggle = (date: number) => {
    setFormData(prev => ({
      ...prev,
      repeatDates: prev.repeatDates.includes(date)
        ? prev.repeatDates.filter(d => d !== date)
        : [...prev.repeatDates, date],
    }));
  };

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      if (isEditMode && editingAppointmentId) {
        // 수정 모드
        const response = await fetch(
          `/api/users/1/schedule/appointments/${editingAppointmentId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appointmentData),
          }
        );
        if (!response.ok) throw new Error("Failed to update appointment");
        return response.json();
      } else {
        // 생성 모드
        if (appointmentData.repeatType !== "none") {
          // 기본 일정에도 group_id 설정
          const baseGroupId =
            appointmentData.repeatType === "weekly"
              ? `weekly_${appointmentData.date}_${appointmentData.title}_${appointmentData.repeatWeekdays?.join(",") || "none"}`
              : `monthly_date_${appointmentData.date}_${appointmentData.title}`;

          const baseAppointmentData = {
            ...appointmentData,
            groupId: baseGroupId,
          };

          console.log("반복 일정 생성:", {
            repeatType: appointmentData.repeatType,
            repeatWeekdays: appointmentData.repeatWeekdays,
            repeatDates: appointmentData.repeatDates,
            baseGroupId: baseGroupId,
          });

          // 1. 먼저 기본 일정 생성
          const baseResponse = await fetch(
            "/api/users/1/schedule/appointments",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(baseAppointmentData),
            }
          );
          if (!baseResponse.ok)
            throw new Error("Failed to create base appointment");
          const baseAppointment = await baseResponse.json();

          // 2. 반복 일정들만 추가로 생성 (기본 일정 제외)
          const repeatAppointments =
            generateRepeatAppointments(appointmentData);
          console.log(`생성할 반복 일정 개수: ${repeatAppointments.length}`);

          const createdAppointments = [baseAppointment];

          for (const apt of repeatAppointments) {
            const response = await fetch("/api/users/1/schedule/appointments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(apt),
            });

            if (response.status === 409) {
              // 중복 일정인 경우 스킵
              console.log(`중복 일정 스킵: ${apt.date} - ${apt.title}`);
              continue;
            }

            if (!response.ok)
              throw new Error("Failed to create repeat appointment");
            const created = await response.json();
            createdAppointments.push(created);
          }

          console.log(
            `총 생성된 일정 개수: ${createdAppointments.length} (기본 1개 + 반복 ${createdAppointments.length - 1}개)`
          );
          return createdAppointments;
        } else {
          // 단일 일정 생성
          const response = await fetch("/api/users/1/schedule/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appointmentData),
          });
          if (!response.ok) throw new Error("Failed to create appointment");
          return response.json();
        }
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "일정이 수정되었습니다!" : "예약이 생성되었습니다!",
      });
      refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: isEditMode
          ? "일정 수정에 실패했습니다"
          : "예약 생성에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/users/1/schedule/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update appointment");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "예약 상태가 업데이트되었습니다!" });
      refetch();
    },
  });

  // Delete appointment mutation (그룹 기반 삭제 지원)
  const deleteAppointmentMutation = useMutation({
    mutationFn: async ({
      id,
      deleteType,
      selectedDate,
      groupId,
    }: {
      id: number;
      deleteType: "single" | "future" | "all";
      selectedDate?: string;
      groupId?: string;
    }) => {
      const body = { deleteType, selectedDate };

      // 그룹 기반 삭제인 경우
      if (groupId && deleteType !== "single") {
        const response = await fetch(
          `/api/users/1/schedule/appointments/group/${groupId}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deleteType, fromDate: selectedDate }),
          }
        );
        if (!response.ok) throw new Error("그룹 일정 삭제 실패");
        return response.json();
      } else {
        // 단일 일정 삭제
        const response = await fetch(
          `/api/users/1/schedule/appointments/${id}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        if (!response.ok) throw new Error("단일 일정 삭제 실패");
        return response.json();
      }
    },
    onSuccess: () => {
      toast({ title: "일정이 삭제되었습니다" });
      refetch();
      setDeleteConfirmOpen(false);
      setSelectedAppointmentForDelete(null);
      setIsDateDetailOpen(false);
    },
    onError: (error: any) => {
      console.error("삭제 오류 상세:", {
        message: error?.message,
        response: error?.response,
        error: error,
      });
      toast({
        title: "일정 삭제에 실패했습니다",
        description: error?.message || "알 수 없는 오류가 발생했습니다",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: "",
      title: "",
      date: "",
      startTime: "",
      endTime: "none",
      repeatType: "none",
      repeatInterval: 1,
      repeatDays: [], // 호환성을 위해 유지하되 비운 상태
      repeatWeekdays: [], // 실제 사용 필드
      repeatDates: [],
      monthlyBasis: "date", // 항상 date 기준으로 초기화
      reminderMinutes: 30,
      memo: "",
    });
    setIsEditMode(false);
    setEditingAppointmentId(null);
  };

  const handleCreateAppointment = () => {
    if (
      !formData.type ||
      !formData.title ||
      !formData.date ||
      !formData.startTime
    ) {
      toast({ title: "필수 항목을 모두 입력해주세요", variant: "destructive" });
      return;
    }

    // 반복 설정 검증
    if (
      formData.repeatType === "weekly" &&
      formData.repeatWeekdays.length === 0
    ) {
      toast({
        title: "주간 반복 설정 시 요일을 선택해주세요",
        variant: "destructive",
      });
      return;
    }
    if (
      formData.repeatType === "monthly" &&
      formData.repeatDates.length === 0
    ) {
      toast({
        title: "월간 반복 설정 시 날짜를 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    const appointmentData: AppointmentData = {
      userId: user?.id,
      ...formData,
      endTime: formData.endTime === "none" ? "" : formData.endTime,
      baseDate: formData.date,
      // 선택된 요일 인덱스를 항상 전달 (빈 배열이면 반복 없음)
      repeatWeekdays: formData.repeatWeekdays,
      // 선택된 날짜들도 전달 (월간 반복용)
      repeatDates: formData.repeatDates,
      // repeatDays 필드도 함께 저장 (기존 호환성 유지)
      repeatDays: formData.repeatWeekdays.map(
        dayIndex => ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayIndex]
      ),
    };

    console.log("생성할 일정 데이터:", appointmentData);

    createAppointmentMutation.mutate(appointmentData);
  };

  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    // 해당 날짜에 직접 저장된 일정만 반환 (반복 일정은 이미 생성 시점에 각 날짜별로 저장됨)
    const appointmentsForDate = (appointments as ScheduleAppointment[]).filter(
      (apt: ScheduleAppointment) => apt.date === dateKey
    );

    // 디버깅: 일정이 있는 날짜 로그
    if (appointmentsForDate.length > 0) {
      const dayOfWeek = date.getDay();
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      console.log(
        `${dateKey} (${dayNames[dayOfWeek]})에 일정 ${appointmentsForDate.length}개 발견:`,
        appointmentsForDate.map(apt => apt.title)
      );
    }

    return appointmentsForDate;
  };

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pt-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            스케줄 관리
          </h1>
          <p className="text-gray-600">
            상담 일정과 예약을 체계적으로 관리하세요
          </p>
        </div>

        {/* Calendar and Schedule */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-lg">
                      {currentDate.getFullYear()}년{" "}
                      {monthNames[currentDate.getMonth()]}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentDate(
                          new Date(
                            currentDate.getFullYear(),
                            currentDate.getMonth() - 1
                          )
                        )
                      }
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentDate(
                          new Date(
                            currentDate.getFullYear(),
                            currentDate.getMonth() + 1
                          )
                        )
                      }
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays(currentDate).map(date => {
                    const appointments = getAppointmentsForDate(date);
                    const isToday =
                      formatDateKey(date) === formatDateKey(new Date());
                    const isCurrentMonth =
                      date.getMonth() === currentDate.getMonth();
                    const isWeekend =
                      date.getDay() === 0 || date.getDay() === 6;

                    return (
                      <div
                        key={date.toISOString()}
                        className={`h-24 p-1 border border-gray-100 rounded-lg relative transition-all hover:bg-white/60 cursor-pointer ${
                          isToday
                            ? "bg-blue-100 border-blue-300"
                            : isCurrentMonth
                              ? "bg-white/30"
                              : "bg-gray-50/30"
                        } ${appointments.length > 0 ? "hover:shadow-md" : ""}`}
                        onClick={() => {
                          setSelectedDateForView(date);
                          setIsDateDetailOpen(true);
                        }}
                      >
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isToday
                              ? "text-blue-700"
                              : !isCurrentMonth
                                ? "text-gray-400"
                                : isWeekend
                                  ? "text-red-500"
                                  : "text-gray-600"
                          }`}
                        >
                          {date.getDate()}
                        </div>

                        {/* Appointment indicators */}
                        <div className="space-y-1">
                          {appointments
                            .slice(0, 2)
                            .map(
                              (apt: ScheduleAppointment, aptIndex: number) => {
                                const typeInfo = APPOINTMENT_TYPES.find(
                                  t => t.value === apt.type
                                );
                                return (
                                  <div
                                    key={`${apt.id}-${apt.date}-${aptIndex}`}
                                    className={`w-full h-5 ${typeInfo?.bgColor} ${typeInfo?.borderColor} border rounded text-xs px-1.5 flex items-center gap-1.5 overflow-hidden`}
                                  >
                                    {typeInfo && (
                                      <typeInfo.icon
                                        className={`w-3 h-3 flex-shrink-0 ${typeInfo.textColor} ${apt.type === "병원예약" ? "w-4 h-4 font-bold" : ""}`}
                                      />
                                    )}
                                    <span
                                      className={`truncate text-xs ${typeInfo?.textColor} font-medium`}
                                    >
                                      {apt.startTime}
                                      {apt.endTime ? `-${apt.endTime}` : ""}
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          {appointments.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{appointments.length - 2}개 더
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Create Appointment Button */}
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => {
                setSelectedDate(new Date());
                setFormData(prev => ({
                  ...prev,
                  date: formatDateKey(new Date()),
                }));
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />새 예약 만들기
            </Button>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={open => {
                setIsCreateDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {isEditMode ? (
                      <>
                        <Edit className="w-5 h-5 text-purple-600" />
                        일정 수정
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5 text-purple-600" />새 예약
                        만들기
                      </>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Type Selection */}
                  <div className="space-y-2">
                    <Label>예약 종류*</Label>
                    <Select
                      value={formData.type}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="예약 종류를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPOINTMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label>제목*</Label>
                    <Input
                      value={formData.title}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="예약 제목을 입력하세요"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label>날짜*</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, date: e.target.value }))
                      }
                    />
                  </div>

                  {/* Start Time */}
                  <div className="space-y-2">
                    <Label>시작 시간*</Label>
                    <Select
                      value={formData.startTime}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, startTime: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="시작 시간을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* End Time */}
                  <div className="space-y-2">
                    <Label>종료 시간 (선택사항)</Label>
                    <Select
                      value={formData.endTime}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, endTime: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="종료 시간을 선택하세요 (생략 가능)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">선택 안 함</SelectItem>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Repeat */}
                  <div className="space-y-3">
                    <Label>반복 설정</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={
                          formData.repeatType === "none" ? "default" : "outline"
                        }
                        className={`h-12 ${formData.repeatType === "none" ? "bg-blue-600 text-white" : ""}`}
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            repeatType: "none",
                            repeatDays: [],
                          }))
                        }
                      >
                        반복 없음
                      </Button>
                      <Button
                        type="button"
                        variant={
                          formData.repeatType !== "none" ? "default" : "outline"
                        }
                        className={`h-12 ${formData.repeatType !== "none" ? "bg-purple-600 text-white" : ""}`}
                        onClick={() => setIsRepeatCalendarOpen(true)}
                      >
                        반복 설정
                      </Button>
                    </div>

                    {/* 현재 반복 설정 표시 */}
                    {formData.repeatType !== "none" && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">
                          현재 설정:
                        </p>
                        <p className="text-sm text-gray-600">
                          {
                            REPEAT_OPTIONS.find(
                              opt => opt.value === formData.repeatType
                            )?.label
                          }
                          {formData.repeatDays.length > 0 && (
                            <span className="ml-2">
                              (
                              {formData.repeatDays
                                .map(
                                  day =>
                                    WEEKDAYS.find(w => w.value === day)?.label
                                )
                                .join(", ")}
                              )
                            </span>
                          )}
                          {formData.repeatDates.length > 0 && (
                            <span className="ml-2">
                              ({formData.repeatDates.join("일, ")}일)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reminder */}
                  <div className="space-y-2">
                    <Label>알림 설정</Label>
                    <Select
                      value={formData.reminderMinutes.toString()}
                      onValueChange={value =>
                        setFormData(prev => ({
                          ...prev,
                          reminderMinutes: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REMINDER_OPTIONS.map(option => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Memo */}
                  <div className="space-y-2">
                    <Label>메모</Label>
                    <Textarea
                      value={formData.memo}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, memo: e.target.value }))
                      }
                      placeholder="추가 메모를 입력하세요"
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleCreateAppointment}
                    disabled={(() => {
                      const isFormValid =
                        formData.type &&
                        formData.title &&
                        formData.date &&
                        formData.startTime;
                      const isRepeatValid =
                        formData.repeatType === "none" ||
                        (formData.repeatType === "weekly" &&
                          formData.repeatWeekdays.length > 0) ||
                        (formData.repeatType === "monthly" &&
                          formData.repeatDates.length > 0);
                      return (
                        createAppointmentMutation.isPending ||
                        !isFormValid ||
                        !isRepeatValid
                      );
                    })()}
                    className={(() => {
                      const isFormValid =
                        formData.type &&
                        formData.title &&
                        formData.date &&
                        formData.startTime;
                      const isRepeatValid =
                        formData.repeatType === "none" ||
                        (formData.repeatType === "weekly" &&
                          formData.repeatWeekdays.length > 0) ||
                        (formData.repeatType === "monthly" &&
                          formData.repeatDates.length > 0);
                      const isEnabled =
                        isFormValid &&
                        isRepeatValid &&
                        !createAppointmentMutation.isPending;

                      return `w-full ${
                        isEnabled
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`;
                    })()}
                  >
                    {createAppointmentMutation.isPending
                      ? isEditMode
                        ? "수정 중..."
                        : "생성 중..."
                      : isEditMode
                        ? "일정 수정"
                        : "예약 만들기"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Repeat Calendar Dialog */}
            <Dialog
              open={isRepeatCalendarOpen}
              onOpenChange={setIsRepeatCalendarOpen}
            >
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>반복 설정</DialogTitle>
                  <DialogDescription>
                    반복 일정을 상세하게 설정하세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5">
                  {/* 반복 유형 선택 */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">반복 유형</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {REPEAT_OPTIONS.filter(
                        option => option.value !== "none"
                      ).map(option => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            formData.repeatType === option.value
                              ? "default"
                              : "outline"
                          }
                          className={`h-12 ${formData.repeatType === option.value ? "bg-purple-600 text-white" : ""}`}
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              repeatType: option.value,
                              repeatDays: [], // 호환성 유지
                              repeatWeekdays: [], // 실제 사용 필드 초기화
                              repeatDates: [],
                              monthlyBasis: "date",
                            }))
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 주간 설정 */}
                  {formData.repeatType === "weekly" && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          주간 간격
                        </Label>
                        <Select
                          value={formData.repeatInterval.toString()}
                          onValueChange={value =>
                            setFormData(prev => ({
                              ...prev,
                              repeatInterval: parseInt(value),
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WEEK_INTERVALS.map(interval => (
                              <SelectItem
                                key={interval.value}
                                value={interval.value.toString()}
                              >
                                {interval.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          요일 선택
                        </Label>
                        <div className="grid grid-cols-7 gap-2">
                          {WEEKDAYS.map(day => {
                            // JavaScript getDay() 기준으로 직접 매핑: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
                            const dayIndex = [
                              "sun",
                              "mon",
                              "tue",
                              "wed",
                              "thu",
                              "fri",
                              "sat",
                            ].indexOf(day.value);
                            const isSelected =
                              formData.repeatWeekdays.includes(dayIndex);
                            return (
                              <Button
                                key={day.value}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className={`h-10 text-xs ${isSelected ? "bg-blue-600 text-white" : ""}`}
                                onClick={() => handleWeekdayToggle(day.value)}
                              >
                                {day.label}
                              </Button>
                            );
                          })}
                        </div>
                        {formData.repeatWeekdays.length === 0 && (
                          <p className="text-sm text-red-500">
                            최소 1개의 요일을 선택해주세요
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          반복 횟수 (주 단위)
                        </Label>
                        <Select
                          value={
                            formData.repeatCount === undefined
                              ? "unlimited"
                              : formData.repeatCount.toString()
                          }
                          onValueChange={value =>
                            setFormData(prev => ({
                              ...prev,
                              repeatCount:
                                value === "unlimited"
                                  ? undefined
                                  : parseInt(value),
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="반복 횟수 선택" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="unlimited">
                              무한 반복 (12주 생성)
                            </SelectItem>
                            {Array.from({ length: 20 }, (_, i) => i + 1).map(
                              count => (
                                <SelectItem
                                  key={count}
                                  value={count.toString()}
                                >
                                  {count}주
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* 월간 설정 */}
                  {formData.repeatType === "monthly" && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          월간 간격
                        </Label>
                        <Select
                          value={formData.repeatInterval.toString()}
                          onValueChange={value =>
                            setFormData(prev => ({
                              ...prev,
                              repeatInterval: parseInt(value),
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTH_INTERVALS.map(interval => (
                              <SelectItem
                                key={interval.value}
                                value={interval.value.toString()}
                              >
                                {interval.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          날짜 선택 (복수 선택 가능)
                        </Label>
                        <div className="grid grid-cols-7 gap-2 max-h-48 overflow-y-auto">
                          {MONTH_DATES.map(date => (
                            <Button
                              key={date.value}
                              type="button"
                              variant={
                                formData.repeatDates.includes(date.value)
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              className={`h-10 text-xs ${formData.repeatDates.includes(date.value) ? "bg-green-600 text-white" : ""}`}
                              onClick={() => handleDateToggle(date.value)}
                            >
                              {date.label}
                            </Button>
                          ))}
                        </div>
                        {formData.repeatDates.length === 0 && (
                          <p className="text-sm text-red-500">
                            최소 1개의 날짜를 선택해주세요
                          </p>
                        )}
                        {formData.repeatDates.length > 0 && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-700">
                              선택된 날짜:{" "}
                              {formData.repeatDates
                                .sort((a, b) => a - b)
                                .join("일, ")}
                              일
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          반복 횟수 (월 단위)
                        </Label>
                        <Select
                          value={
                            formData.repeatCount === undefined
                              ? "unlimited"
                              : formData.repeatCount.toString()
                          }
                          onValueChange={value =>
                            setFormData(prev => ({
                              ...prev,
                              repeatCount:
                                value === "unlimited"
                                  ? undefined
                                  : parseInt(value),
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="반복 횟수 선택" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="unlimited">
                              무한 반복 (12개월 생성)
                            </SelectItem>
                            {Array.from({ length: 24 }, (_, i) => i + 1).map(
                              count => (
                                <SelectItem
                                  key={count}
                                  value={count.toString()}
                                >
                                  {count}개월
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* 설정 미리보기 */}
                  {formData.repeatType !== "none" && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">
                        설정 요약:
                      </p>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>
                          • 반복 유형:{" "}
                          {
                            REPEAT_OPTIONS.find(
                              opt => opt.value === formData.repeatType
                            )?.label
                          }
                        </p>
                        {formData.repeatType === "weekly" && (
                          <>
                            <p>
                              • 주간 간격:{" "}
                              {
                                WEEK_INTERVALS.find(
                                  i => i.value === formData.repeatInterval
                                )?.label
                              }
                            </p>
                            <p>
                              • 요일:{" "}
                              {formData.repeatWeekdays
                                .map(dayIndex => {
                                  // JavaScript getDay() 기준: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
                                  const dayNames = [
                                    "일",
                                    "월",
                                    "화",
                                    "수",
                                    "목",
                                    "금",
                                    "토",
                                  ];
                                  return dayNames[dayIndex];
                                })
                                .join(", ")}
                            </p>
                            <p>
                              • 반복 횟수:{" "}
                              {formData.repeatCount === undefined
                                ? "무한 반복"
                                : `${formData.repeatCount}회`}
                            </p>
                          </>
                        )}
                        {formData.repeatType === "monthly" && (
                          <>
                            <p>
                              • 월간 간격:{" "}
                              {
                                MONTH_INTERVALS.find(
                                  i => i.value === formData.repeatInterval
                                )?.label
                              }
                            </p>
                            <p>
                              • 기준:{" "}
                              {
                                MONTHLY_TYPES.find(
                                  t => t.value === formData.monthlyBasis
                                )?.label
                              }
                            </p>
                            {formData.monthlyBasis === "weekday" &&
                              formData.repeatWeekdays.length > 0 && (
                                <p>
                                  • 요일:{" "}
                                  {formData.repeatWeekdays
                                    .map(dayIndex => {
                                      // JavaScript getDay() 기준: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
                                      const dayNames = [
                                        "일",
                                        "월",
                                        "화",
                                        "수",
                                        "목",
                                        "금",
                                        "토",
                                      ];
                                      return dayNames[dayIndex];
                                    })
                                    .join(", ")}
                                </p>
                              )}
                            {formData.monthlyBasis === "date" &&
                              formData.repeatDates.length > 0 && (
                                <p>
                                  • 날짜:{" "}
                                  {formData.repeatDates
                                    .sort((a, b) => a - b)
                                    .join("일, ")}
                                  일
                                </p>
                              )}
                            <p>
                              • 반복 횟수:{" "}
                              {formData.repeatCount === undefined
                                ? "무한 반복"
                                : `${formData.repeatCount}회`}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsRepeatCalendarOpen(false);
                        setFormData(prev => ({
                          ...prev,
                          repeatType: "none",
                          repeatDays: [],
                          repeatWeekdays: [],
                          repeatDates: [],
                          repeatInterval: 1,
                          monthlyBasis: "date",
                          repeatCount: undefined,
                        }));
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      disabled={(() => {
                        const isDisabled =
                          formData.repeatType === "none" ||
                          (formData.repeatType === "weekly" &&
                            formData.repeatWeekdays.length === 0) ||
                          (formData.repeatType === "monthly" &&
                            formData.repeatDates.length === 0);

                        console.log("설정완료 버튼 상태 체크:", {
                          repeatType: formData.repeatType,
                          repeatWeekdays: formData.repeatWeekdays,
                          monthlyBasis: formData.monthlyBasis,
                          repeatDates: formData.repeatDates,
                          isDisabled: isDisabled,
                        });

                        return isDisabled;
                      })()}
                      onClick={() => {
                        console.log("반복 설정 완료 버튼 클릭:", {
                          repeatType: formData.repeatType,
                          repeatWeekdays: formData.repeatWeekdays,
                          monthlyBasis: formData.monthlyBasis,
                          repeatDates: formData.repeatDates,
                        });
                        setIsRepeatCalendarOpen(false);
                        toast({
                          title: "반복 설정 완료",
                          description: "반복 일정이 설정되었습니다.",
                        });
                      }}
                    >
                      설정 완료
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Today's Appointments */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  오늘의 일정
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const todayAppointments = getAppointmentsForDate(new Date());
                  if (todayAppointments.length === 0) {
                    return (
                      <p className="text-gray-500 text-center py-4">
                        오늘 예정된 일정이 없습니다
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {todayAppointments.map(
                        (apt: ScheduleAppointment, aptIndex: number) => {
                          const typeInfo = APPOINTMENT_TYPES.find(
                            t => t.value === apt.type
                          );
                          return (
                            <div
                              key={`today-${apt.id}-${aptIndex}`}
                              className={`p-3 border ${typeInfo?.borderColor} rounded-lg ${typeInfo?.bgColor} space-y-2`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {typeInfo && (
                                    <typeInfo.icon
                                      className={`w-5 h-5 ${typeInfo.textColor} ${apt.type === "병원예약" ? "w-6 h-6 font-bold" : ""}`}
                                    />
                                  )}
                                  <span
                                    className={`font-medium ${typeInfo?.textColor}`}
                                  >
                                    {apt.title}
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    apt.status === "completed"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {apt.status === "completed"
                                    ? "완료"
                                    : apt.status === "cancelled"
                                      ? "취소"
                                      : "예정"}
                                </Badge>
                              </div>
                              <div
                                className={`text-sm ${typeInfo?.textColor} opacity-80`}
                              >
                                {apt.startTime}
                                {apt.endTime ? ` - ${apt.endTime}` : ""}
                              </div>
                              {apt.status === "scheduled" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: apt.id,
                                        status: "completed",
                                      })
                                    }
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    완료
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: apt.id,
                                        status: "cancelled",
                                      })
                                    }
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    취소
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  일정 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {APPOINTMENT_TYPES.map(type => {
                    const count = (
                      appointments as ScheduleAppointment[]
                    ).filter(
                      (apt: ScheduleAppointment) => apt.type === type.value
                    ).length;
                    return (
                      <div
                        key={type.value}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          <span className="text-sm">{type.label}</span>
                        </div>
                        <Badge variant="secondary">{count}개</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Analysis Report Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  AI 스케줄 분석 리포트
                </div>
                <div className="text-sm text-gray-600 font-normal">
                  상담 흐름과 일정 관리 상태를 종합 분석
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-blue-200 bg-blue-50">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                AI 분석 기능은 현재 개발 중입니다. 곧 상담 패턴 분석, 일정 관리
                효율성 평가, 개인화된 스케줄 추천 등의 기능을 제공할 예정입니다.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Date Detail Dialog */}
        <Dialog open={isDateDetailOpen} onOpenChange={setIsDateDetailOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                {selectedDateForView &&
                  `${selectedDateForView.getFullYear()}년 ${selectedDateForView.getMonth() + 1}월 ${selectedDateForView.getDate()}일 일정`}
              </DialogTitle>
            </DialogHeader>

            {selectedDateForView && (
              <div className="space-y-4">
                {(() => {
                  const appointments =
                    getAppointmentsForDate(selectedDateForView);

                  if (appointments.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">
                          이 날짜에 예약된 일정이 없습니다.
                        </p>
                        <Button
                          className="mt-4 bg-purple-600 hover:bg-purple-700"
                          onClick={() => {
                            setSelectedDate(selectedDateForView);
                            setFormData(prev => ({
                              ...prev,
                              date: formatDateKey(selectedDateForView),
                            }));
                            setIsDateDetailOpen(false);
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />새 예약 만들기
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          총 {appointments.length}개의 일정
                        </p>
                      </div>

                      {appointments.map((apt: ScheduleAppointment, index) => {
                        const typeInfo = APPOINTMENT_TYPES.find(
                          t => t.value === apt.type
                        );
                        const isRepeating = apt.repeatType !== "none";

                        return (
                          <div
                            key={`${apt.id}-${index}`}
                            className="p-4 border border-gray-200 rounded-lg bg-white/50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {typeInfo && (
                                    <typeInfo.icon className="w-4 h-4 text-purple-600" />
                                  )}
                                  <span className="font-medium text-gray-900">
                                    {apt.title}
                                  </span>
                                  {isRepeating && (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                      반복
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {apt.startTime}
                                      {apt.endTime ? ` - ${apt.endTime}` : ""}
                                    </span>
                                  </div>

                                  {apt.type && (
                                    <div className="flex items-center gap-2">
                                      <Tag className="w-3 h-3" />
                                      <span>{typeInfo?.label}</span>
                                    </div>
                                  )}

                                  {apt.memo && (
                                    <div className="flex items-start gap-2">
                                      <FileText className="w-3 h-3 mt-0.5" />
                                      <span className="text-xs">
                                        {apt.memo}
                                      </span>
                                    </div>
                                  )}

                                  {isRepeating && (
                                    <div className="flex items-center gap-2">
                                      <Repeat className="w-3 h-3" />
                                      <span className="text-xs">
                                        {apt.repeatType === "weekly" && "매주"}
                                        {apt.repeatType === "biweekly" &&
                                          "격주"}
                                        {apt.repeatType === "monthly" && "매월"}
                                        {apt.repeatDays &&
                                          apt.repeatDays.length > 0 &&
                                          ` (${apt.repeatDays
                                            .map(
                                              day =>
                                                WEEKDAYS.find(
                                                  w => w.value === day
                                                )?.label
                                            )
                                            .join(", ")})`}
                                        {apt.repeatDates &&
                                          apt.repeatDates.length > 0 &&
                                          ` (${apt.repeatDates.join("일, ")}일)`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedDate(selectedDateForView);
                                    setFormData({
                                      type: apt.type,
                                      title: apt.title,
                                      date: formatDateKey(selectedDateForView),
                                      startTime: apt.startTime,
                                      endTime: apt.endTime || "none",
                                      repeatType: apt.repeatType || "none",
                                      repeatDays: apt.repeatDays || [],
                                      repeatDates: apt.repeatDates || [],
                                      reminderMinutes:
                                        apt.reminderMinutes || 30,
                                      memo: apt.memo || "",
                                    });
                                    setIsEditMode(true);
                                    setEditingAppointmentId(apt.id);
                                    setIsDateDetailOpen(false);
                                    setIsCreateDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedAppointmentForDelete({
                                      ...apt,
                                      selectedDate: selectedDateForView
                                        ? formatDateKey(selectedDateForView)
                                        : apt.date,
                                    });
                                    setDeleteConfirmOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                일정 삭제
              </DialogTitle>
            </DialogHeader>

            {selectedAppointmentForDelete && (
              <div className="space-y-4">
                <div className="p-3 border rounded-lg bg-gray-50">
                  <p className="font-medium">
                    {selectedAppointmentForDelete.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedAppointmentForDelete.startTime}
                    {selectedAppointmentForDelete.endTime
                      ? ` - ${selectedAppointmentForDelete.endTime}`
                      : ""}
                  </p>
                </div>

                {selectedAppointmentForDelete.repeatType !== "none" ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      이 일정은 반복 일정입니다. 어떻게 삭제하시겠습니까?
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          deleteAppointmentMutation.mutate({
                            id: selectedAppointmentForDelete.id,
                            deleteType: "single",
                            selectedDate:
                              selectedAppointmentForDelete.selectedDate ||
                              selectedAppointmentForDelete.date,
                          });
                          setDeleteConfirmOpen(false);
                        }}
                      >
                        이 일정만 삭제
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          deleteAppointmentMutation.mutate({
                            id: selectedAppointmentForDelete.id,
                            deleteType: "future",
                            selectedDate:
                              selectedAppointmentForDelete.selectedDate ||
                              selectedAppointmentForDelete.date,
                          });
                          setDeleteConfirmOpen(false);
                        }}
                      >
                        이후 일정 삭제
                      </Button>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setDeleteConfirmOpen(false)}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      이 일정을 삭제하시겠습니까?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setDeleteConfirmOpen(false)}
                      >
                        취소
                      </Button>
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={() => {
                          deleteAppointmentMutation.mutate({
                            id: selectedAppointmentForDelete.id,
                            deleteType: "single",
                          });
                          setDeleteConfirmOpen(false);
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
