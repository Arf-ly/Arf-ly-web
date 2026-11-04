import axios from "axios";
import { getDeviceType } from "../../utils/device.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API_BASE_URL,
  timeout: 10000,
});

export async function sendFcmToken(
  fcmToken,
  accessToken = localStorage.getItem("accessToken"),
  { signal } = {},
) {
  if (!accessToken) throw new Error("로그인 후 알림을 설정해주세요.");
  if (typeof fcmToken !== "string" || !fcmToken.trim()) {
    throw new Error("알림 토큰을 발급하지 못했습니다. 다시 시도해주세요.");
  }
  if (!import.meta.env.VITE_SERVER_API_BASE_URL) {
    throw new Error("알림 서버 설정을 확인해주세요.");
  }

  await api.post(
    "/notification/token",
    { fcmToken, deviceType: getDeviceType() },
    { signal, headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export async function getNotifications({ cursor, size = 20, signal } = {}) {
  const accessToken = localStorage.getItem("accessToken");
  const params = { size };

  if (cursor !== undefined && cursor !== null) {
    params.cursor = cursor;
  }

  const { data } = await api.get("/notification", {
    params,
    signal,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (
    !Array.isArray(data?.notifications) ||
    typeof data?.meta?.hasNext !== "boolean" ||
    (data.meta.hasNext &&
      (data.meta.nextCursor == null ||
        String(data.meta.nextCursor) === String(cursor)))
  ) {
    throw new Error("Invalid notification response");
  }

  return data;
}
