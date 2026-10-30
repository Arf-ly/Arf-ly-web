import { getMessaging, getToken, isSupported } from "firebase/messaging";
import messagingWorkerUrl from "../firebase-messaging-sw.js?worker&url";
import { app, firebaseConfig } from "./firebase.js";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
const WORKER_ACTIVATION_TIMEOUT_MS = 15000;

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

  // getToken can request permission itself; keep that prompt in the user click handler.
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
