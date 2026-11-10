import { useCallback, useEffect, useRef, useState } from "react";
import { getNotifications } from "./NotificationApi.js";

const initialMeta = { hasNext: false, nextCursor: null };

/** 알림 조회와 중복 제거, 커서 이동 및 요청 오류 상태를 관리한다. */
export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState(initialMeta);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [request, setRequest] = useState({ cursor: null, revision: 0 });
  const requestInFlight = useRef(true);

  useEffect(() => {
    const controller = new AbortController();

    getNotifications({ cursor: request.cursor, signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;

        setNotifications((previous) => {
          const items = request.cursor == null ? [] : previous;
          const seenIds = new Set(items.map((item) => String(item.id)));
          const newItems = data.notifications.filter((item) => {
            const id = String(item.id);
            if (seenIds.has(id)) return false;
            seenIds.add(id);
            return true;
          });

          return [...items, ...newItems];
        });
        setMeta(data.meta);
        setStatus("success");
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;

        const unauthorized = requestError.response?.status === 401;
        setError({
          unauthorized,
          message: unauthorized
            ? "로그인이 만료되었어요. 다시 로그인해 주세요."
            : "알림을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        });
        setStatus("error");
      })
      .finally(() => {
        if (!controller.signal.aborted) requestInFlight.current = false;
      });

    return () => controller.abort();
  }, [request]);

  /** 진행 중인 요청이 없고 다음 페이지가 있을 때 알림 추가 조회를 시작한다. */
  const loadMore = useCallback(() => {
    if (requestInFlight.current || status !== "success" || !meta.hasNext) {
      return;
    }

    requestInFlight.current = true;
    setStatus("loading");
    setRequest((previous) => ({
      cursor: meta.nextCursor,
      revision: previous.revision + 1,
    }));
  }, [meta, status]);

  /** 인증 오류가 아닌 실패한 알림 요청을 같은 커서로 다시 실행한다. */
  const retry = () => {
    if (requestInFlight.current || error?.unauthorized) return;

    requestInFlight.current = true;
    setError(null);
    setStatus("loading");
    setRequest((previous) => ({
      ...previous,
      revision: previous.revision + 1,
    }));
  };

  /** 알림 목록과 커서를 초기화하고 첫 페이지를 다시 조회한다. */
  const refresh = () => {
    if (requestInFlight.current || error?.unauthorized) return;

    requestInFlight.current = true;
    setNotifications([]);
    setMeta(initialMeta);
    setError(null);
    setStatus("loading");
    setRequest((previous) => ({
      cursor: null,
      revision: previous.revision + 1,
    }));
  };

  return {
    notifications,
    hasNext: meta.hasNext,
    isLoading: status === "loading",
    error,
    loadMore,
    retry,
    refresh,
  };
}
