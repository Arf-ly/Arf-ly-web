export const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";

  return (
    navigator.userAgentData?.mobile === true ||
    /Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)
  );
};

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
