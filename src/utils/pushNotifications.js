import { getMessaging, getToken, isSupported } from "firebase/messaging";
import messagingWorkerUrl from "../firebase-messaging-sw.js?worker&url";
import { app, firebaseConfig } from "./firebase.js";
import { sendFcmToken } from "../pages/mypage/NotificationApi.js";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
const WORKER_ACTIVATION_TIMEOUT_MS = 15000;
const REGISTRATION_KEY = "arfly:fcm-registration";
const pendingRegistrations = new Map();
const completedSessions = new Set();

/** 푸시 알림에 필요한 환경 설정을 확인하고 누락된 경우 오류를 알린다. */
export function validatePushConfiguration() {
  const requiredValues = {
    VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
    VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
    VITE_FIREBASE_APP_ID: firebaseConfig.appId,
    VITE_FIREBASE_VAPID_KEY: vapidKey,
    VITE_SERVER_API_BASE_URL: import.meta.env.VITE_SERVER_API_BASE_URL,
  };
  const missingVariables = Object.entries(requiredValues)
    .filter(([, value]) => typeof value !== "string" || !value.trim())
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new Error(
      import.meta.env.DEV
        ? `푸시 알림 설정 누락: ${missingVariables.join(", ")}. .env 설정 후 개발 서버를 다시 시작해주세요.`
        : "알림 서비스 설정이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.",
    );
  }
}

/** 현재 브라우저와 접속 환경이 Firebase 푸시 알림을 지원하는지 확인한다. */
export async function isPushSupported() {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return false;
  }

  try {
    return await isSupported();
  } catch {
    return false;
  }
}

/** 서비스 워커가 활성화될 때까지 기다리고 실패나 시간 초과를 처리한다. */
function waitForActiveWorker(registration) {
  if (registration.active?.state === "activated") {
    return Promise.resolve(registration);
  }

  const worker =
    registration.installing || registration.waiting || registration.active;

  if (!worker) {
    return Promise.reject(new Error("알림 서비스를 시작하지 못했습니다."));
  }

  return new Promise((resolve, reject) => {
    /** 서비스 워커 활성화 대기의 타이머와 상태 변경 리스너를 정리한다. */
    const cleanup = () => {
      clearTimeout(timeout);
      worker.removeEventListener("statechange", onStateChange);
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error("알림 서비스 준비 시간이 초과되었습니다. 다시 시도해주세요."),
      );
    }, WORKER_ACTIVATION_TIMEOUT_MS);

    /** 서비스 워커 상태에 따라 활성화 대기를 완료하거나 실패로 종료한다. */
    function onStateChange() {
      if (worker.state === "activated") {
        cleanup();
        resolve(registration);
      } else if (worker.state === "redundant") {
        cleanup();
        reject(
          new Error("알림 서비스를 시작하지 못했습니다. 다시 시도해주세요."),
        );
      }
    }

    worker.addEventListener("statechange", onStateChange);
    onStateChange();
  });
}

/** 알림 설정과 권한을 확인하고 서비스 워커를 통해 FCM 토큰을 발급한다. */
export async function getFcmToken() {
  validatePushConfiguration();

  if (!(await isPushSupported())) {
    throw new Error("이 브라우저에서는 푸시 알림을 지원하지 않습니다.");
  }

  if (Notification.permission !== "granted") {
    throw new Error("브라우저에서 알림 권한을 허용해주세요.");
  }

  const registration = await navigator.serviceWorker.register(messagingWorkerUrl, {
    type: "module",
    updateViaCache: "none",
  });
  await waitForActiveWorker(registration);

  // 대기 중 권한이 바뀌면 getToken이 사용자 클릭 밖에서 권한 창을 열지 않게 한다.
  if (Notification.permission !== "granted") {
    throw new Error("브라우저에서 알림 권한을 허용해주세요.");
  }

  const token = await getToken(getMessaging(app), {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("알림 토큰을 발급하지 못했습니다. 다시 시도해주세요.");
  }

  return token;
}

/** 안내 표시 이력과 별개로 현재 세션의 FCM 등록을 처리하고 중복 요청을 합친다. */
export function registerFcmTokenOnce({ signal } = {}) {
  const accessToken = localStorage.getItem("accessToken");
  const session = localStorage.getItem("refreshToken") || accessToken;
  if (!accessToken) return Promise.reject(new Error("로그인이 필요합니다."));
  if (completedSessions.has(session)) return Promise.resolve();
  if (pendingRegistrations.has(session)) return pendingRegistrations.get(session);

  /** 비동기 요청을 시작한 로그인 세션이 여전히 유효한지 확인한다. */
  const isCurrentSession = () =>
    Boolean(localStorage.getItem("accessToken")) &&
    (localStorage.getItem("refreshToken") || localStorage.getItem("accessToken")) ===
      session;

  const registration = (async () => {
    signal?.throwIfAborted();
    const token = await getFcmToken();
    signal?.throwIfAborted();
    if (!isCurrentSession()) throw new Error("로그인 정보가 변경되었습니다.");

    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify([session, token])),
    );
    const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    let registeredFingerprint = null;
    try {
      registeredFingerprint = sessionStorage.getItem(REGISTRATION_KEY);
    } catch {
      // 저장소를 사용할 수 없어도 메모리의 세션 기록으로 중복 등록을 막는다.
    }

    signal?.throwIfAborted();
    if (!isCurrentSession()) throw new Error("로그인 정보가 변경되었습니다.");
    if (registeredFingerprint !== fingerprint) {
      try {
        await sendFcmToken(token, localStorage.getItem("accessToken"), { signal });
      } catch (error) {
        if (signal?.aborted) throw error;
        throw new Error(
          error.response?.status === 401
            ? "로그인이 만료되었습니다. 다시 로그인한 뒤 알림을 설정해주세요."
            : "푸시 알림 등록에 실패했습니다. 다시 시도해주세요.",
        );
      }

      if (!isCurrentSession() || signal?.aborted) return;
      try {
        sessionStorage.setItem(REGISTRATION_KEY, fingerprint);
      } catch {
        // 서버 등록은 완료되었으므로 현재 방문의 성공 상태는 메모리에 남긴다.
      }
    }

    completedSessions.add(session);
  })().finally(() => pendingRegistrations.delete(session));

  pendingRegistrations.set(session, registration);
  return registration;
}
