const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

/** 현재 세션의 리프레시 토큰으로 액세스 토큰을 재발급하고 저장한다. */
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("로그인 후 토큰을 재발급해주세요.");
  }

  if (!API_BASE_URL) {
    throw new Error("인증 서버 설정을 확인해주세요.");
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}/auth/token/refresh`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    },
  );

  if (!response.ok) {
    throw new Error("액세스 토큰 재발급에 실패했습니다.");
  }

  const data = await response.json();
  if (typeof data.accessToken !== "string" || !data.accessToken.trim()) {
    throw new Error("토큰 재발급 응답에 accessToken이 없습니다.");
  }

  // 갱신 중 계정이 바뀌면 이전 세션의 토큰으로 새 세션을 덮어쓰지 않는다.
  if (localStorage.getItem("refreshToken") !== refreshToken) {
    throw new Error("로그인 정보가 변경되었습니다. 다시 시도해주세요.");
  }

  localStorage.setItem("accessToken", data.accessToken);
  return data.accessToken;
};
