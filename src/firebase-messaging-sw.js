import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { app } from "./utils/firebase.js";

const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  // Firebase already displays messages with a notification payload.
  if (payload.notification) return;

  const title = payload.data?.title?.trim();
  const body = payload.data?.body?.trim();
  if (!title && !body) return;

  return self.registration.showNotification(title || "Arfly", {
    body: body || "",
  });
});
