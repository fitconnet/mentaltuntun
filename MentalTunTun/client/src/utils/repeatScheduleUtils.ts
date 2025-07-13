// 지침서 기반 반복 일정 생성 유틸리티

export interface RepeatRule {
  type: "none" | "weekly" | "monthly";
  interval: number; // 반복 주기 (1 = 매주/매월, 2 = 격주/격월)
  weekdays?: number[]; // 주간 반복용 요일 (0~6)
  basis?: "weekday" | "date"; // 월간 반복 기준
  // 반복 횟수는 항상 12주/12개월로 고정
  baseDate: string; // 최초 일정 생성일
}

export interface AppointmentData {
  userId?: number;
  type: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  reminderMinutes?: number;
  memo?: string;
  status?: string;
  groupId?: string;
  baseDate: string;
  repeatType: string;
  repeatInterval?: number;
  repeatWeekdays?: number[];
  repeatDates?: number[];
  monthlyBasis?: string;
  // 반복 횟수는 항상 12주/12개월로 고정
}

// 날짜의 n번째 요일을 구하는 함수
function getNthWeekday(
  year: number,
  month: number,
  weekday: number,
  nth: number
): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const targetDate = 1 + offset + nth * 7;
  return new Date(year, month, targetDate);
}

// 주간 반복 일정 생성
function generateWeeklyEvents(
  rule: RepeatRule,
  appointmentData: AppointmentData
): AppointmentData[] {
  const events: AppointmentData[] = [];
  const base = new Date(rule.baseDate);
  const maxWeeks = 6; // 6주로 단축 (성능 개선)

  console.log("주간 반복 처리:", {
    maxWeeks,
    weekInterval: rule.interval,
    repeatWeekdays: rule.weekdays,
    baseDate: rule.baseDate,
  });

  // 선택된 요일만 처리 (사용자가 실제로 선택한 요일들)
  if (!rule.weekdays || rule.weekdays.length === 0) {
    console.log("선택된 요일이 없음");
    return events;
  }

  // 중복 방지를 위한 Set
  const generatedDates = new Set<string>();
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  // 각 선택된 요일에 대해 처리
  for (const selectedDay of rule.weekdays) {
    const dayNameKorean = ["일", "월", "화", "수", "목", "금", "토"][
      selectedDay
    ];
    console.log(
      `선택된 요일 처리: ${dayNames[selectedDay]} (${selectedDay}) = ${dayNameKorean}요일`
    );

    // 주간 반복으로 최대 12주간 생성
    for (let weekIndex = 1; weekIndex <= maxWeeks; weekIndex++) {
      // 기본 날짜로부터 n주 후의 해당 요일 계산
      const targetDate = new Date(base);

      // 기본 날짜 이후 첫 번째 해당 요일 찾기
      // selectedDay는 JavaScript getDay() 기준: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
      const baseDayOfWeek = base.getDay(); // 기본 날짜의 요일
      const baseDayName = ["일", "월", "화", "수", "목", "금", "토"][
        baseDayOfWeek
      ];
      const daysUntilTarget = (selectedDay - baseDayOfWeek + 7) % 7;

      if (weekIndex === 1) {
        console.log(
          `요일 계산: 기본날짜(${rule.baseDate})=${baseDayName}요일(${baseDayOfWeek}), 목표=${dayNameKorean}요일(${selectedDay}), 차이=${daysUntilTarget}일`
        );
      }

      let firstOccurrence: Date;

      if (daysUntilTarget === 0) {
        // 기본 날짜와 같은 요일이면 1주 간격으로 시작
        firstOccurrence = new Date(base);
        firstOccurrence.setDate(base.getDate() + 7 * rule.interval);
      } else {
        // 기본 날짜 이후 첫 번째 해당 요일
        firstOccurrence = new Date(base);
        firstOccurrence.setDate(base.getDate() + daysUntilTarget);
      }

      // n주 간격으로 반복
      targetDate.setTime(firstOccurrence.getTime());
      targetDate.setDate(
        firstOccurrence.getDate() + (weekIndex - 1) * 7 * rule.interval
      );

      const dateStr = targetDate.toISOString().split("T")[0];
      const createdDayOfWeek = targetDate.getDay();
      const createdDayName = ["일", "월", "화", "수", "목", "금", "토"][
        createdDayOfWeek
      ];

      // 중복 방지 및 기본 날짜 제외
      if (dateStr !== rule.baseDate && !generatedDates.has(dateStr)) {
        generatedDates.add(dateStr);
        console.log(
          `주간 일정 생성: 주${weekIndex} ${dayNameKorean}요일 → ${dateStr} (실제생성: ${createdDayName}요일)`
        );

        events.push({
          ...appointmentData,
          date: dateStr,
          groupId: `weekly_${rule.baseDate}_${appointmentData.title}_${selectedDay}`,
        });
      }
    }
  }

  return events;
}

// 월간 반복 일정 생성
function generateMonthlyEvents(
  rule: RepeatRule,
  appointmentData: AppointmentData
): AppointmentData[] {
  const events: AppointmentData[] = [];
  const base = new Date(rule.baseDate);
  const baseDay = base.getDate(); // 기본 날짜의 일
  const selectedDates = appointmentData.repeatDates || [];
  let monthIndex = 0;
  const maxMonths = 6; // 6개월로 단축 (성능 개선)

  console.log("월간 반복 처리:", {
    maxMonths,
    monthInterval: rule.interval,
    monthlyBasis: rule.basis,
  });

  const generatedDates = new Set<string>();

  // 첫 번째 반복 시작점 결정
  let startFromCurrentMonth = false;
  for (const selectedDate of selectedDates) {
    if (selectedDate > baseDay) {
      startFromCurrentMonth = true;
      break;
    }
  }

  // 시작 월 결정: 설정일이 기본일보다 뒤에 있으면 같은 달부터, 아니면 다음 달부터
  const startMonthOffset = startFromCurrentMonth ? 0 : 1;

  while (monthIndex < maxMonths) {
    const currentMonth = new Date(base);
    currentMonth.setMonth(
      base.getMonth() + rule.interval * monthIndex + startMonthOffset
    );

    // 월간 날짜 기준 처리 - 선택된 날짜들에 대해 반복
    for (const selectedDate of selectedDates) {
      const targetMonth = new Date(currentMonth);
      targetMonth.setDate(selectedDate);

      // 해당 월에 선택한 날짜가 존재하는지 확인 (2월 30일 같은 경우 방지)
      if (targetMonth.getMonth() === currentMonth.getMonth()) {
        const dateStr = targetMonth.toISOString().split("T")[0];

        // 기본 날짜와 중복되지 않고, 기본 날짜보다 미래인 경우만 추가
        if (
          dateStr !== rule.baseDate &&
          !generatedDates.has(dateStr) &&
          targetMonth >= base
        ) {
          generatedDates.add(dateStr);
          console.log(
            `월간 날짜 일정 생성: 월${monthIndex + 1} ${selectedDate}일 → ${dateStr}`
          );

          events.push({
            ...appointmentData,
            date: dateStr,
            groupId: `monthly_date_${rule.baseDate}_${appointmentData.title}`,
          });
        }
      }
    }
    monthIndex++;
  }

  return events;
}

// 지침서 기반 메인 반복 일정 생성 함수 (기본 일정 제외하고 추가 반복 일정만 생성)
export function generateRepeatAppointments(
  appointmentData: AppointmentData
): AppointmentData[] {
  const appointments: AppointmentData[] = [];

  console.log("반복 일정 생성 시작:", {
    baseDate: new Date(appointmentData.date).toDateString(),
    repeatType: appointmentData.repeatType,
    repeatWeekdays: appointmentData.repeatWeekdays,
  });

  // 반복 타입에 따른 추가 일정 생성 (기본 일정은 제외)
  if (appointmentData.repeatType === "none") {
    return appointments; // 빈 배열 반환
  }

  const rule: RepeatRule = {
    type: appointmentData.repeatType as "weekly" | "monthly",
    interval: appointmentData.repeatInterval || 1,
    weekdays: appointmentData.repeatWeekdays,
    basis: appointmentData.monthlyBasis as "weekday" | "date",
    baseDate: appointmentData.date,
  };

  let additionalEvents: AppointmentData[] = [];

  if (rule.type === "weekly") {
    additionalEvents = generateWeeklyEvents(rule, appointmentData);
  } else if (rule.type === "monthly") {
    additionalEvents = generateMonthlyEvents(rule, appointmentData);
  }

  appointments.push(...additionalEvents);

  console.log(`추가 반복 일정 ${appointments.length}개 생성 완료`);
  return appointments;
}

// 그룹 기반 삭제 함수
export async function deleteRepeatEvents(
  userId: number,
  groupId: string,
  deleteType: "single" | "future" | "all" = "all",
  fromDate?: string
): Promise<{ message: string; deletedCount: number }> {
  try {
    const endpoint = `/api/users/${userId}/schedule/appointments/group/${groupId}`;
    const body = { deleteType, fromDate };

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("그룹 일정 삭제에 실패했습니다");
    }

    return await response.json();
  } catch (error) {
    console.error("그룹 삭제 오류:", error);
    throw error;
  }
}
