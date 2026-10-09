const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

export const sendFcmToken = async (
  fcmToken,
  accessToken = localStorage.getItem("accessToken"),
) => {
  if (!accessToken) {
    throw new Error("로그인 후 알림을 설정해주세요.");
  }

  if (typeof fcmToken !== "string" || !fcmToken.trim()) {
    throw new Error("알림 토큰을 발급하지 못했습니다. 다시 시도해주세요.");
  }

  if (!API_BASE_URL) {
    throw new Error("알림 서버 설정을 확인해주세요.");
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}/notification/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fcmToken, deviceType: "DESKTOP" }),
    },
  );

  if (!response.ok) {
    throw new Error("푸시 알림 등록에 실패했습니다. 다시 시도해주세요.");
  }
};
