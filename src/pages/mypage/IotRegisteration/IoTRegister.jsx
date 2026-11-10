import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./IoTRegister.css";

import IOTREGISTERBACK from "../../../assets/login/system/backbtn.svg";
import IOTREGISTERWIFI from "../../../assets/mypage/IotRegistration/IoTRegister_wifi.svg";
import IOTREGISTERPWD from "../../../assets/login/system/password.svg";
import IOTREGISTEROPENPWD from "../../../assets/login/system/open_password.svg";
import IOTREGISTERCLOSEPWD from "../../../assets/login/system/close_password.svg";
import IOTREGISTERDEVICE from "../../../assets/mypage/IotRegistration/IoTRegister_device.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;
const PICO_URL = import.meta.env.VITE_PICO_URL;

/** 기기의 와이파이 연결 설정과 계정에 대한 IoT 기기 등록을 진행한다. */
const IoTRegister = () => {
  const navigate = useNavigate();

  const [wifiId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [picoUid, setPicoUid] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /** 기기 등록 단계에 따라 와이파이 입력 또는 이전 화면으로 돌아간다. */
  const handleGoBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  /** 입력한 와이파이 정보를 기기에 전달하고 기기 식별자를 받아온다. */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!wifiId || !password) {
      alert("와이파이 이름과 비밀번호를 모두 입력해주세요.");
      return;
    }

    const encodedSsid = encodeURIComponent(wifiId);
    const encodedPw = encodeURIComponent(password);

    const picoUrl = `${PICO_URL}/set?ssid=${encodedSsid}&pw=${encodedPw}`;

    setIsLoading(true);
    try {
      const response = await fetch(picoUrl, {
        method: "GET",
      });

      const data = await response.json();
      setPicoUid(data.uid);
      setStep(2);
      setIsLoading(false);
    } catch {
      alert(
        "전송 실패 😢 스마트폰이 기기의 와이파이에 제대로 연결되어 있는지, 모바일 데이터(LTE/5G)가 꺼져 있는지 확인해 주세요.",
      );
      setIsLoading(false);
    }
  };

  /** 기기 식별자를 현재 계정에 등록한 뒤 마이페이지로 이동한다. */
  const handlePicoUid = async () => {
    const accessToken = localStorage.getItem("accessToken");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/iot/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ deviceUid: picoUid }),
      });

      if (!response.ok) {
        throw new Error("IoT 기기 등록 실패");
      }
      const text = await response.text();
      // 빈 응답은 허용하되 잘못된 JSON 응답은 기존 실패 처리로 보낸다.
      if (text) JSON.parse(text);

      navigate("/mypage");
    } catch {
      alert(
        "서버에 기기를 등록하는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="iotregister-wrapper">
      {step === 1 && (
        <>
          <div className="iotregister-top">
            <button
              className="iotregister-back-button"
              type="button"
              onClick={() => navigate(-1)}
            >
              <img src={IOTREGISTERBACK} alt="뒤로가기" />
            </button>
            <span>IoT 기기 등록 {step}/2</span>
          </div>
          <div className="iotregister-text">
            <h2>
              IoT 기기 등록을 위해
              <br />
              홈-와이파이 이름과 비밀번호를 입력해 주세요!
            </h2>
          </div>
          <div className="iotregister-explain-text">
            <span>
              1. 기기의 Ap모드 버튼을 눌러, <br />
              &nbsp;&nbsp;&nbsp;&nbsp;노란색 불이 들어오는걸 확인해 주세요.
            </span>
            <span>2. Wi-Fi 설정에서 Arfly_Setup 네트워크에 연결해주세요.</span>
            <span>
              3. 아래 입력 칸에 산책 정보를 전송할 때 사용할 <br />
              &nbsp;&nbsp;&nbsp;&nbsp;홈 Wi-Fi의 이름과 비밀번호를 입력해
              주세요.
            </span>
          </div>
          <div className="iotregister-login-form">
            <div className="iotregister-input-container">
              <img src={IOTREGISTERWIFI} />
              <input
                id="wifiId"
                type="text"
                placeholder="Wi-Fi 이름"
                value={wifiId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div className="iotregister-input-container">
              <img src={IOTREGISTERPWD} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="PW"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                id="toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <img
                  src={showPassword ? IOTREGISTEROPENPWD : IOTREGISTERCLOSEPWD}
                  alt="비밀번호 숨기기"
                />
              </button>
            </div>
          </div>
          <div className="iotregister-confirm">
            <button
              type="button"
              onClick={handleRegister}
              disabled={!wifiId || !password}
            >
              다음
            </button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <div className="iotregister-top">
            <button
              className="iotregister-back-button"
              type="button"
              onClick={handleGoBack}
            >
              <img src={IOTREGISTERBACK} alt="뒤로가기" />
            </button>
            <span>IoT 기기 등록 {step}/2</span>
          </div>
          <div className="iotregister-text">
            <h2>
              기기번호 등록을 위해
              <br />홈 Wi-Fi에 다시 연결해 주세요!
            </h2>
          </div>
          <div className="iotregister-explain-text">
            <span>1. 기기의 Ap모드 버튼을 다시 한 번 눌러서 꺼주세요.</span>
            <span>2. 기존에 사용하던 Wi-Fi에 접속해 주세요.</span>
            <span>3. 아래 등록하기 버튼을 눌러 주세요. </span>
          </div>
          <div className="iotregister-login-form">
            <div className="iotregister-input-container">
              <img src={IOTREGISTERDEVICE} />
              <input id="picoUid" type="text" placeholder={picoUid} value={picoUid} readOnly/>
            </div>
          </div>
          <div className="iotregister-confirm">
            <button
              type="button"
              onClick={handlePicoUid}
              disabled={!picoUid || isLoading}
            >
              등록하기
            </button>
          </div>
        </>
      )}
      {isLoading && (
        <div className="iotregister-loading-overlay">
          <div className="iotregister-loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default IoTRegister;
