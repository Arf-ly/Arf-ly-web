import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  registerFcmTokenOnce,
  validatePushConfiguration,
} from "../utils/pushNotifications.js";
import "./NotificationPrompt.css";

const NotificationPromptContext = createContext(null);
const PROMPT_SEEN_KEY = "arfly:notification-prompt-seen";

/** 알림 안내를 본 이력을 저장하고 하위 화면에 공유한다. */
export function NotificationPromptProvider({ children }) {
  const [hasSeenPrompt, setHasSeenPrompt] = useState(() => {
    try {
      return localStorage.getItem(PROMPT_SEEN_KEY) === "true";
    } catch {
      return false;
    }
  });

  /** 알림 안내 확인 이력을 브라우저 저장소와 현재 화면 상태에 반영한다. */
  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(PROMPT_SEEN_KEY, "true");
    } catch {
      // 저장소가 차단되어도 현재 방문에서는 안내를 본 상태로 처리한다.
    }
    setHasSeenPrompt(true);
  }, []);

  return (
    <NotificationPromptContext.Provider value={{ hasSeenPrompt, markSeen }}>
      {children}
    </NotificationPromptContext.Provider>
  );
}

/** 알림 안내 표시 여부를 관리하고 권한이 있으면 푸시 토큰을 등록한다. */
export default function NotificationPrompt() {
  const { hasSeenPrompt, markSeen } = useContext(NotificationPromptContext);
  // 표시 이력을 기록한 뒤에도 이미 열린 안내 창은 사용자 선택까지 유지한다.
  const [isOpen, setIsOpen] = useState(
    () => !hasSeenPrompt && window.Notification?.permission !== "granted",
  );

  useEffect(() => {
    if (window.Notification?.permission !== "granted") return;

    markSeen();
    registerFcmTokenOnce().catch((error) => {
      console.error("푸시 알림 등록 실패:", error.message);
    });
  }, [markSeen]);

  return isOpen ? (
    <NotificationDialog onShown={markSeen} onDismiss={() => setIsOpen(false)} />
  ) : null;
}

/** 알림 권한 요청과 등록 결과를 안내하는 대화상자를 표시한다. */
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
    onShown();

    return () => {
      activeRef.current = false;
      requestRef.current?.abort();
      dialog.close();
    };
  }, [onShown]);

  /** 진행 중인 알림 등록을 취소하고 안내 창을 닫는다. */
  const handleDismiss = () => {
    activeRef.current = false;
    requestRef.current?.abort();
    onDismiss();
  };

  /** 사용자 클릭으로 알림 권한을 요청하고 현재 세션의 푸시 토큰을 등록한다. */
  const handleEnable = async () => {
    if (pendingRef.current) return;

    const session = localStorage.getItem("refreshToken");
    const accessToken = localStorage.getItem("accessToken");
    /** 비동기 요청을 시작한 로그인 세션이 여전히 유효한지 확인한다. */
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

      // 브라우저의 사용자 동작 조건을 만족하도록 다른 비동기 작업보다 먼저 요청한다.
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

      await registerFcmTokenOnce({ signal: controller.signal });
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
        댓글 언급과 반려동물의 이상 징후를 알림으로 받아보세요.
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
