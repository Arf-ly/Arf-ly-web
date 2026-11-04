import { useNavigate } from "react-router-dom";
import BellIcon from "../assets/home/home_bell.svg";
import "./NotificationButton.css";

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
