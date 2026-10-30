import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { sendFcmToken } from "../pages/mypage/NotificationApi.js";
import {
  getFcmToken,
  validatePushConfiguration,
} from "../utils/pushNotifications.js";
import "./NotificationPrompt.css";

const NotificationPromptContext = createContext(null);
const PROMPT_SEEN_KEY = "arfly:notification-prompt-seen";

export function NotificationPromptProvider({ children }) {
  const [hasSeenPrompt, setHasSeenPrompt] = useState(() => {
    try {
      return localStorage.getItem(PROMPT_SEEN_KEY) === "true";
    } catch {
      return false;
    }
  });

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(PROMPT_SEEN_KEY, "true");
    } catch {
      // Keep the current visit working when browser storage is unavailable.
    }
    setHasSeenPrompt(true);
  }, []);

  return (
    <NotificationPromptContext.Provider value={{ hasSeenPrompt, markSeen }}>
      {children}
    </NotificationPromptContext.Provider>
  );
}

export default function NotificationPrompt() {
  const { hasSeenPrompt, markSeen } = useContext(NotificationPromptContext);
  // Recording the first display must not close the dialog that is already open.
  const [isOpen, setIsOpen] = useState(() => !hasSeenPrompt);

  return isOpen ? (
    <NotificationDialog onShown={markSeen} onDismiss={() => setIsOpen(false)} />
  ) : null;
}

function NotificationDialog({ onShown, onDismiss }) {
  const dialogRef = useRef(null);
  const activeRef = useRef(false);
  const pendingRef = useRef(false);
  const requestRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    activeRef.current = true;
    const dialog = dialogRef.current;
    dialog.showModal();
    // Persist immediately, including when the user refreshes before choosing.
    onShown();

    return () => {
      activeRef.current = false;
      requestRef.current?.abort();
      dialog.close();
    };
  }, [onShown]);

  const handleDismiss = () => {
    activeRef.current = false;
    requestRef.current?.abort();
    onDismiss();
  };

  const handleEnable = async () => {
    if (pendingRef.current) return;

    const session = localStorage.getItem("refreshToken");
    const accessToken = localStorage.getItem("accessToken");
    const isCurrentSession = () =>
      activeRef.current &&
      Boolean(localStorage.getItem("accessToken")) &&
      (session
        ? localStorage.getItem("refreshToken") === session
        : localStorage.getItem("accessToken") === accessToken);

    pendingRef.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (!accessToken) throw new Error("로그인 후 알림을 설정해주세요.");
      if (
        !window.isSecureContext ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        throw new Error(
          "이 환경에서는 푸시 알림을 사용할 수 없습니다. HTTPS로 접속한 지원 브라우저에서 다시 시도해주세요.",
        );
      }

      validatePushConfiguration();

      // Request directly from the click before awaiting Firebase or a worker.
      const permission = await Notification.requestPermission();
      if (!isCurrentSession()) return;
      if (permission === "denied") {
        throw new Error(
          "브라우저에서 알림이 차단되어 있습니다. 사이트 설정에서 알림을 허용한 뒤 다시 시도해주세요.",
        );
      }
      if (permission !== "granted") {
        onDismiss();
        return;
      }

      const fcmToken = await getFcmToken();
      if (!isCurrentSession()) return;

      // Read the latest access token in case it was refreshed during permission.
      await sendFcmToken(fcmToken, localStorage.getItem("accessToken"), {
        signal: controller.signal,
      });
      if (isCurrentSession()) onDismiss();
    } catch (error) {
      if (isCurrentSession()) {
        setErrorMessage(
          error.message || "알림 설정에 실패했습니다. 다시 시도해주세요.",
        );
      }
    } finally {
      pendingRef.current = false;
      if (activeRef.current) setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="notification-prompt"
      aria-labelledby="notification-prompt-title"
      aria-describedby="notification-prompt-description"
      aria-busy={isSubmitting}
      onCancel={(event) => {
        event.preventDefault();
        handleDismiss();
      }}
    >
      <h2 id="notification-prompt-title">알림을 받아보시겠어요?</h2>
      <p id="notification-prompt-description">
        반려동물의 케어 소식과 복약 알림을 받아보세요.
      </p>
      {errorMessage && (
        <p className="notification-prompt-error" role="alert">
          {errorMessage}
        </p>
      )}
      <div className="notification-prompt-actions">
        <button type="button" onClick={handleDismiss}>
          {isSubmitting ? "취소" : "나중에"}
        </button>
        <button
          type="button"
          className="notification-prompt-confirm"
          onClick={handleEnable}
          disabled={isSubmitting}
        >
          {isSubmitting ? "알림 설정 중…" : "알림 받기"}
        </button>
      </div>
    </dialog>
  );
}
