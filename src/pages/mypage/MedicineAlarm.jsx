import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MedicineAlarm.css";

import MEDICINEALARMBACK from "../../assets/login/system/backbtn.svg";
import MEDICINEALARMPLUS from "../../assets/mypage/MedicineAlarm/MedicineAlarm_plus.svg";
import MEDICINEEMPTYCAT from "../../assets/mypage/MedicineAlarm/MedicineAlarm_empty_cat.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

/** 저장된 액세스 토큰이 있으면 인증 헤더를 구성한다. */
const getAuthHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

/** 복약 알림 시간을 화면에서 사용하는 시각 형식으로 변환한다. */
const formatReminderTime = (reminderTime) => {
  const [hourText, minuteText = "00"] = String(reminderTime || "00:00").split(
    ":",
  );
  const hour = Number(hourText);
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;

  return {
    period,
    time: `${displayHour}:${minuteText.padStart(2, "0")}`,
  };
};

/** 복약 알림 시각에서 시간 선택기에 사용할 시와 분을 추출한다. */
const getTimeParts = (reminderTime) => {
  const [hourText = "00", minuteText = "00"] = String(
    reminderTime || "00:00",
  ).split(":");

  return {
    hour: Number(hourText) || 0,
    minute: Number(minuteText) || 0,
  };
};

/** 복약 알림 목록과 활성화, 생성, 수정 및 삭제를 관리한다. */
export default function MedicineAlarm() {
  const navigate = useNavigate();
  const hourColumnRef = useRef(null);
  const minuteColumnRef = useRef(null);
  const [alarms, setAlarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState(null);
  const [alarmTitle, setAlarmTitle] = useState("");
  const [alarmMemo, setAlarmMemo] = useState("");
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isSubmittingAlarm, setIsSubmittingAlarm] = useState(false);
  const [isDeletingAlarm, setIsDeletingAlarm] = useState(false);

  /** 복약 알림 목록을 조회하고 로딩 상태와 오류 안내를 갱신한다. */
  const fetchAlarms = async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const response = await fetch(`${API_BASE_URL}/api/alarms`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("alarms request failed");
      }

      const data = await response.json();
      setAlarms(Array.isArray(data) ? data : data?.alarms || []);
    } catch {
      setAlarms([]);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAlarms();
  }, []);

  useEffect(() => {
    if (!isAlarmModalOpen) return;

    requestAnimationFrame(() => {
      if (hourColumnRef.current) {
        hourColumnRef.current.scrollTop = selectedHour * 28;
      }

      if (minuteColumnRef.current) {
        minuteColumnRef.current.scrollTop = selectedMinute * 28;
      }
    });
  }, [isAlarmModalOpen, selectedHour, selectedMinute]);

  /** 선택한 복약 알림의 활성화 상태를 서버와 화면에 반영한다. */
  const handleToggleAlarm = async (alarmId, active) => {
    const nextActive = !active;
    const previousAlarms = alarms;
    
    setAlarms((currentAlarms) =>
      currentAlarms.map((alarm) =>
        alarm.id === alarmId ? { ...alarm, active: nextActive } : alarm,
      ),
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/alarms/${alarmId}/status`,
        {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ active: nextActive }),
        },
      );

      if (!response.ok) {
        throw new Error("alarm status update failed");
      }
    } catch {
      setAlarms(previousAlarms);
      alert("업로드에 실패했습니다.");
    }
  };

  /** 새 복약 알림 입력값을 초기화하고 등록 창을 연다. */
  const openCreateAlarmModal = () => {
    setSelectedAlarm(null);
    setAlarmTitle("");
    setAlarmMemo("");
    setSelectedHour(0);
    setSelectedMinute(0);
    setIsAlarmModalOpen(true);
  };

  /** 기존 복약 알림의 제목과 시각을 채워 수정 창을 연다. */
  const openEditAlarmModal = (alarm) => {
    const { hour, minute } = getTimeParts(alarm.reminderTime);

    setSelectedAlarm(alarm);
    setAlarmTitle("");
    setAlarmMemo("");
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setIsAlarmModalOpen(true);
  };

  /** 복약 알림 등록 또는 수정 창을 닫는다. */
  const closeAlarmModal = () => {
    setIsAlarmModalOpen(false);
  };

  /** 시간 선택기의 스크롤 위치를 선택한 시로 반영한다. */
  const handleHourScroll = (event) => {
    const nextHour = Math.min(
      23,
      Math.max(0, Math.round(event.currentTarget.scrollTop / 28)),
    );

    setSelectedHour(nextHour);
  };

  /** 시간 선택기의 스크롤 위치를 선택한 분으로 반영한다. */
  const handleMinuteScroll = (event) => {
    const nextMinute = Math.min(
      59,
      Math.max(0, Math.round(event.currentTarget.scrollTop / 28)),
    );

    setSelectedMinute(nextMinute);
  };

  const selectedAlarmTime = selectedAlarm
    ? getTimeParts(selectedAlarm.reminderTime)
    : { hour: 0, minute: 0 };
  const isDoneActive = selectedAlarm
    ? (alarmTitle.trim() !== "" && alarmTitle.trim() !== selectedAlarm.title) ||
      (alarmMemo.trim() !== "" && alarmMemo.trim() !== selectedAlarm.memo) ||
      selectedHour !== selectedAlarmTime.hour ||
      selectedMinute !== selectedAlarmTime.minute
    : alarmTitle.trim() !== "";

  /** 복약 알림 입력을 확인하고 새 알림을 등록하거나 기존 알림을 수정한다. */
  const handleDoneClick = async () => {
    if (!isDoneActive || isSubmittingAlarm) return;

    const reminderTime = `${String(selectedHour).padStart(2, "0")}:${String(
      selectedMinute,
    ).padStart(2, "0")}:00`;

    setIsSubmittingAlarm(true);

    if (selectedAlarm) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/alarms/${selectedAlarm.id}`,
          {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: alarmTitle.trim() || selectedAlarm.title,
              reminderTime,
              memo: alarmMemo.trim() || selectedAlarm.memo || "",
            }),
          },
        );

        if (!response.ok) {
          throw new Error("alarm update failed");
        }

        await fetchAlarms({ showLoading: false });
        closeAlarmModal();
      } catch {
        alert("알람을 수정하지 못했습니다.");
      } finally {
        setIsSubmittingAlarm(false);
      }

      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/alarms`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: alarmTitle.trim(),
          reminderTime,
          memo: alarmMemo.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("alarm create failed");
      }

      await fetchAlarms({ showLoading: false });
      closeAlarmModal();
    } catch {
      alert("알람을 등록하지 못했습니다.");
    } finally {
      setIsSubmittingAlarm(false);
    }
  };

  /** 선택한 복약 알림을 서버와 화면 목록에서 삭제한다. */
  const handleDeleteAlarm = async () => {
    if (!selectedAlarm || isDeletingAlarm) return;

    try {
      setIsDeletingAlarm(true);

      const response = await fetch(
        `${API_BASE_URL}/api/alarms/${selectedAlarm.id}`,
        {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("alarm delete failed");
      }

      await fetchAlarms({ showLoading: false });
      closeAlarmModal();
    } catch {
      alert("알람을 삭제하지 못했습니다.");
    } finally {
      setIsDeletingAlarm(false);
    }
  };

  return (
    <div className="medicineAlarm-wrapper">
      <div className="medicineAlarm-top">
        <button
          className="medicineAlarm-back-button"
          type="button"
          onClick={() => navigate(-1)}
        >
          <img src={MEDICINEALARMBACK} />
        </button>
        <span>복약관리</span>
        <button
          className="medicineAlarm-plus-button"
          type="button"
          onClick={openCreateAlarmModal}
        >
          <img
            className="medicineAlarm-plus"
            src={MEDICINEALARMPLUS}
          />
        </button>
      </div>

      <div className="medicineAlarm-list">
        {isLoading && (
          <div className="medicineAlarm-loading-overlay">
            <div className="medicineAlarm-loading-spinner" />
          </div>
        )}

        {!isLoading && alarms.length === 0 && (
          <div className="medicineAlarm-empty">
            <p>등록한 복용약이 없어요.</p>
            <img src={MEDICINEEMPTYCAT} />
          </div>
        )}

        {!isLoading &&
          alarms.map((alarm) => {
            const { period, time } = formatReminderTime(alarm.reminderTime);

            return (
              <div
                className="medicineAlarm-item"
                key={alarm.id}
                role="button"
                tabIndex={0}
                onClick={() => openEditAlarmModal(alarm)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    openEditAlarmModal(alarm);
                  }
                }}
              >
                <div className="medicineAlarm-content">
                  <span className="medicineAlarm-title">{alarm.title}</span>
                  <div className="medicineAlarm-time-row">
                    <span className="medicineAlarm-period">{period}</span>
                    <span className="medicineAlarm-time">{time}</span>
                  </div>
                </div>
                <button
                  className={`medicineAlarm-toggle ${
                    alarm.active ? "active" : ""
                  }`}
                  type="button"
                  aria-label={`${alarm.title} "알람" ${
                    alarm.active ? "deactive" : "active"
                  }`}
                  aria-pressed={alarm.active}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggleAlarm(alarm.id, alarm.active);
                  }}
                >
                  <span />
                </button>
              </div>
            );
          })}
      </div>

      {isAlarmModalOpen && (
        <div className="medicineAlarm-modal">
          <div className="medicineAlarm-modal-top">
            <button
              className="medicineAlarm-modal-close"
              type="button"
              onClick={closeAlarmModal}
            >
              ×
            </button>
            <span>복약 알람 생성</span>
            <button
              className={`medicineAlarm-modal-done ${
                isDoneActive ? "active" : ""
              }`}
              type="button"
              disabled={isSubmittingAlarm}
              onClick={handleDoneClick}
            >
              {isSubmittingAlarm ? "처리 중" : "완료"}
            </button>
          </div>

          <div className="medicineAlarm-modal-content">
            <label className="medicineAlarm-modal-field">
              <span>약 이름</span>
              <input
                type="text"
                value={alarmTitle}
                onChange={(event) => setAlarmTitle(event.target.value)}
                placeholder={
                  selectedAlarm?.title || "약 이름을 입력 해주세요"
                }
              />
            </label>

            <div className="medicineAlarm-time-picker">
              <div className="medicineAlarm-time-highlight" />
              <div
                className="medicineAlarm-time-column"
                ref={hourColumnRef}
                onScroll={handleHourScroll}
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <button
                    className={`${hour === selectedHour ? "selected" : ""} ${
                      Math.abs(hour - selectedHour) <= 2 ? "near-selected" : ""
                    }`}
                    type="button"
                    key={hour}
                    onClick={() => setSelectedHour(hour)}
                  >
                    {String(hour).padStart(2, "0")}
                  </button>
                ))}
              </div>
              <span className="medicineAlarm-time-unit hour">시</span>
              <div
                className="medicineAlarm-time-column"
                ref={minuteColumnRef}
                onScroll={handleMinuteScroll}
              >
                {Array.from({ length: 60 }, (_, minute) => (
                  <button
                    className={`${
                      minute === selectedMinute ? "selected" : ""
                    } ${
                      Math.abs(minute - selectedMinute) <= 2
                        ? "near-selected"
                        : ""
                    }`}
                    type="button"
                    key={minute}
                    onClick={() => setSelectedMinute(minute)}
                  >
                    {String(minute).padStart(2, "0")}
                  </button>
                ))}
              </div>
              <span className="medicineAlarm-time-unit minute">분</span>
            </div>

            <label className="medicineAlarm-modal-field memo">
              <span>메모</span>
              <textarea
                value={alarmMemo}
                onChange={(event) => setAlarmMemo(event.target.value)}
                placeholder={
                  selectedAlarm?.memo ||
                  "복약 관련 메모가 있다면 적어주세요!"
                }
              />
            </label>

            {selectedAlarm && (
              <button
                className="medicineAlarm-delete-button"
                type="button"
                disabled={isDeletingAlarm}
                onClick={handleDeleteAlarm}
              >
                {isDeletingAlarm ? "삭제 중" : "알람 삭제"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
