/** 사용자 에이전트와 터치 지원 여부로 모바일 기기인지 확인한다. */
export const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";

  return (
    navigator.userAgentData?.mobile === true ||
    /Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)
  );
};

/** 사용자 에이전트에서 푸시 토큰 등록에 사용할 기기 유형을 구한다. */
export const getDeviceType = () => {
  if (typeof navigator === "undefined") return "DESKTOP";

  const userAgent = navigator.userAgent || "";
  if (
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)
  ) {
    return "IOS";
  }
  if (/Android/i.test(userAgent)) return "ANDROID";

  return "DESKTOP";
};
