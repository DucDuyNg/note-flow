const LOCALE_TAG = { vi: 'vi-VN', en: 'en-US' };

const RELATIVE_LABELS = {
  vi: {
    justNow: 'vừa xong',
    minutes: (n) => `${n} phút trước`,
    hours: (n) => `${n} giờ trước`,
    days: (n) => `${n} ngày trước`,
  },
  en: {
    justNow: 'just now',
    minutes: (n) => `${n} minute${n === 1 ? '' : 's'} ago`,
    hours: (n) => `${n} hour${n === 1 ? '' : 's'} ago`,
    days: (n) => `${n} day${n === 1 ? '' : 's'} ago`,
  },
};

export function formatDate(iso, lang = 'vi') {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(LOCALE_TAG[lang] || LOCALE_TAG.vi, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatRelative(iso, lang = 'vi') {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const labels = RELATIVE_LABELS[lang] || RELATIVE_LABELS.vi;
  if (sec < 60) return labels.justNow;
  if (min < 60) return labels.minutes(min);
  if (hr < 24) return labels.hours(hr);
  if (day < 30) return labels.days(day);
  return formatDate(iso, lang);
}

export function isOverdue(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export function todayIso() {
  return new Date().toISOString();
}
