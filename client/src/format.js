export const STATUS_LABEL = {
  interest: '관심',
  planned: '참가 예정',
  ongoing: '진행 중',
  done: '완료',
};

export const STATUS_BADGE = {
  interest: 'badge-muted',
  planned: 'badge-info',
  ongoing: 'badge-warn',
  done: 'badge-ok',
};

export function formatDday(dday) {
  if (dday == null) return '일정 없음';
  const value = Number(dday);
  if (value === 0) return 'D-Day';
  return `D-${value}`;
}
