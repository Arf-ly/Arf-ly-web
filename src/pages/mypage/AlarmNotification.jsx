import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AlarmNotification.css";

import ALARMNOTIFICATIONBACK from "../../assets/login/system/backbtn.svg";
import NotificationBell from "../../assets/mypage/notification_bell.svg";
import useNotifications from "./useNotifications.js";
import {
  formatNotificationTime,
  groupNotificationsByDate,
} from "./notificationFormat.js";

function NotificationImage({ imageUrl, title }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <p className="alarmNotification-image-error">
        사진을 불러올 수 없어요. 상단에서 새로고침해 주세요.
      </p>
    );
  }

  return (
    <img
      className="alarmNotification-photo"
      src={imageUrl}
      alt={`${title} 사진`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

export default function AlarmNotification() {
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const loadMoreRef = useRef(null);
  const { notifications, hasNext, isLoading, error, loadMore, retry, refresh } =
    useNotifications();
  const groups = groupNotificationsByDate(notifications);

  useEffect(() => {
    if (
      !hasNext ||
      isLoading ||
      error ||
      !loadMoreRef.current ||
      !window.IntersectionObserver
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { root: contentRef.current, rootMargin: "160px", threshold: 0 },
    );
    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNext, isLoading, error, loadMore]);

  const handleRefresh = () => {
    refresh();
    contentRef.current?.scrollTo({ top: 0 });
  };

  const handleLogin = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/", { replace: true });
  };

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }

    navigate("/home", { replace: true });
  };

  return (
    <main className="alarmNotification-wrapper">
      <header className="alarmNotification-top">
        <button
          className="alarmNotification-back-button"
          type="button"
          aria-label="뒤로가기"
          onClick={handleBack}
        >
          <img src={ALARMNOTIFICATIONBACK} alt="" />
        </button>
        <h1>알림</h1>
        <button
          className="alarmNotification-refresh-button"
          type="button"
          disabled={isLoading || error?.unauthorized}
          onClick={handleRefresh}
        >
          새로고침
        </button>
      </header>
      <section
        className="alarmNotification-content"
        aria-label="알림 목록"
        aria-busy={isLoading}
        tabIndex={0}
        ref={contentRef}
      >
        {groups.map((group) => (
          <section
            className="alarmNotification-group"
            aria-labelledby={`alarmNotification-date-${group.key}`}
            key={group.key}
          >
            <h2 id={`alarmNotification-date-${group.key}`}>{group.label}</h2>
            <ul className="alarmNotification-list">
              {group.notifications.map((notification) => (
                <li className="alarmNotification-card" key={notification.id}>
                  <img
                    className="alarmNotification-icon"
                    src={NotificationBell}
                    alt=""
                  />
                  <div className="alarmNotification-card-content">
                    <h3>{notification.title}</h3>
                    <p>{notification.content}</p>
                    <span className="alarmNotification-time">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                    {notification.imageUrl && (
                      <NotificationImage
                        key={notification.imageUrl}
                        imageUrl={notification.imageUrl}
                        title={notification.title}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div
          className={`alarmNotification-state${notifications.length === 0 ? " alarmNotification-state-full" : ""}`}
        >
          {isLoading && <p role="status">알림을 불러오는 중이에요.</p>}
          {error && (
            <>
              <p role="alert">{error.message}</p>
              <button
                className="alarmNotification-action-button"
                type="button"
                onClick={error.unauthorized ? handleLogin : retry}
              >
                {error.unauthorized ? "다시 로그인" : "다시 시도"}
              </button>
            </>
          )}
          {!isLoading && !error && notifications.length === 0 && !hasNext && (
            <p>새로운 알림이 없습니다!</p>
          )}
          {!isLoading && !error && hasNext && (
            <button
              className="alarmNotification-action-button"
              type="button"
              onClick={loadMore}
              ref={loadMoreRef}
            >
              알림 더 보기
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
