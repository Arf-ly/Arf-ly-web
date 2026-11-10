import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { app } from "./utils/firebase.js";

const messaging = getMessaging(app);

/** 데이터 전용 푸시 메시지의 제목과 본문을 브라우저 알림으로 표시한다. */
onBackgroundMessage(messaging, (payload) => {
  // notification 메시지는 Firebase가 표시하므로 중복 알림을 만들지 않는다.
  if (payload.notification) return;

  const title = payload.data?.title?.trim();
  const body = (payload.data?.body || payload.data?.content)?.trim();
  if (!title && !body) return;

  return self.registration.showNotification(title || "Arfly", {
    body: body || "",
  });
});
