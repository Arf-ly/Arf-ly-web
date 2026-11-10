/** 입력된 날짜를 해석하고 유효하지 않으면 빈 결과를 반환한다. */
function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 알림 날짜를 날짜 그룹에 표시할 문자열로 변환한다. */
function formatDay(date, now) {
  const monthDay = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return date.getFullYear() === now.getFullYear()
    ? monthDay
    : `${date.getFullYear()}년 ${monthDay}`;
}

/** 알림 생성 시각을 화면에 표시할 시간 문자열로 변환한다. */
export function formatNotificationTime(createdAt, now = new Date()) {
  const date = parseDate(createdAt);
  if (!date) return "";

  const minutes = Math.floor(Math.max(now - date, 0) / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
  return formatDay(date, now);
}

/** 알림을 오늘, 어제 또는 날짜별 그룹으로 묶는다. */
export function groupNotificationsByDate(notifications, now = new Date()) {
  const groups = new Map();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const notification of notifications) {
    const date = parseDate(notification.createdAt);
    const key = date
      ? `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      : "unknown";

    if (!groups.has(key)) {
      let label = "이전 알림";
      if (date) {
        if (date.toDateString() === now.toDateString()) label = "오늘";
        else if (date.toDateString() === yesterday.toDateString()) label = "어제";
        else label = formatDay(date, now);
      }
      groups.set(key, { key, label, notifications: [] });
    }

    groups.get(key).notifications.push(notification);
  }

  return [...groups.values()];
}
