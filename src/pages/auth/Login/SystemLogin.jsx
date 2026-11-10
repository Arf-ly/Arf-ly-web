import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SystemLogin.css";

import BackBtn from "../../../assets/login/system/backbtn.svg";
import UserIcon from "../../../assets/login/system/user.svg";
import PasswordIcon from "../../../assets/login/system/password.svg";
import OpenPassword from "../../../assets/login/system/open_password.svg";
import ClosePassword from "../../../assets/login/system/close_password.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

/** 아이디와 비밀번호를 입력받아 일반 로그인을 처리한다. */
const SystemLogin = () => {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  /** 일반 로그인 화면에서 이전 화면으로 돌아간다. */
  const handleGoBack = () => {
    navigate(-1);
  };

  /** 아이디와 비밀번호로 로그인하고 발급된 인증 토큰을 저장한다. */
  const handleLogin = async () => {
    setLoginError(false);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/doLogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        navigate("/home");
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    }
  };

  return (
    <div className="SystemLoginWrapper">
      <div className="BackBtn">
        <button type="button" onClick={handleGoBack}>
          <img src={BackBtn} alt="뒤로가기" />
        </button>
      </div>
      <div className="LoginText">
        <h2>
          ARFLY와 다시 한번
          <br />
          건강한 반려인 라이프를 즐겨요!
        </h2>
      </div>
      <div className="LoginInputForm">
        <div className="IdInput InputContainer">
          <img src={UserIcon} alt="아이디" />
          <input
            id="userId"
            type="text"
            placeholder="ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <div className="PwInput InputContainer">
          <img src={PasswordIcon} alt="비밀번호" />
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
              src={showPassword ? OpenPassword : ClosePassword}
              alt="비밀번호 숨기기"
            />
          </button>
        </div>
        {loginError && (
          <div className="LoginErrorMessage">
            * 아이디 또는 비밀번호가 일치하지 않습니다.
          </div>
        )}
      </div>
      <div className="findIdPw">
        <span className="problemText">문제가 생겼나요?</span>
        <a href="/auth/find" className="findLink">
          아이디 비밀번호 찾기
        </a>
      </div>
      <div className="summitLogin">
        <button
          type="button"
          onClick={handleLogin}
          disabled={!userId || !password}
        >
          로그인 하기
        </button>
      </div>
    </div>
  );
};

export default SystemLogin;
