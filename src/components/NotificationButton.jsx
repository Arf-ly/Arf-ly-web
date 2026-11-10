import { useNavigate } from "react-router-dom";
import BellIcon from "../assets/home/home_bell.svg";
import "./NotificationButton.css";

/** 알림 목록 화면으로 이동하는 버튼을 표시한다. */
export default function NotificationButton() {
  const navigate = useNavigate();

  return (
    <button
      className="notification-button"
      type="button"
      aria-label="알림"
      onClick={() => navigate("/alarmnotification")}
    >
      <img src={BellIcon} alt="" />
    </button>
  );
}
