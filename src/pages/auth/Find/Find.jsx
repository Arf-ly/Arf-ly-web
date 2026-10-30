import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../../utils/firebase.js";
import "./Find.css";

import BackBtn from "../../../assets/login/system/backbtn.svg";
import UserIcon from "../../../assets/login/system/user.svg";
import PasswordIcon from "../../../assets/login/system/password.svg";
import OpenPassword from "../../../assets/login/system/open_password.svg";
import ClosePassword from "../../../assets/login/system/close_password.svg";
import RightIcon from "../../../assets/login/system/right.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

const passwordPattern =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[a-zA-Z\d\W_]{8,20}$/;

const Find = () => {
  const navigate = useNavigate();
  const recaptchaContainerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  const recaptchaRenderPromiseRef = useRef(null);

  const [activeTab, setActiveTab] = useState("id");
  const [passwordStep, setPasswordStep] = useState("id");
  const [userId, setUserId] = useState("");
  const [foundId, setFoundId] = useState("");
  const [passwordResetToken, setPasswordResetToken] = useState("");

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [codeStatus, setCodeStatus] = useState("idle");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState("idle");
  const [isLoading, setIsLoading] = useState(false);

  const isPhoneMode =
    activeTab === "id" ||
    (activeTab === "password" && passwordStep === "phone");

  const resetPhoneAuth = () => {
    setPhone("");
    setCode("");
    setIsCodeSent(false);
    setTimeLeft(300);
    setCodeStatus("idle");
    setConfirmationResult(null);
  };

  const clearRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }

    recaptchaRenderPromiseRef.current = null;

    if (recaptchaContainerRef.current) {
      recaptchaContainerRef.current.innerHTML = "";
    }
  };

  const setupRecaptcha = async () => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    if (recaptchaRenderPromiseRef.current) {
      return recaptchaRenderPromiseRef.current;
    }

    if (!recaptchaContainerRef.current) {
      return null;
    }

    recaptchaContainerRef.current.innerHTML = "";
    const recaptchaElement = document.createElement("div");
    recaptchaContainerRef.current.appendChild(recaptchaElement);

    const verifier = new RecaptchaVerifier(auth, recaptchaElement, {
      size: "invisible",
      callback: () => {},
    });

    recaptchaRenderPromiseRef.current = verifier
      .render()
      .then(() => {
        recaptchaVerifierRef.current = verifier;
        return verifier;
      })
      .catch((error) => {
        verifier.clear();
        recaptchaVerifierRef.current = null;
        recaptchaRenderPromiseRef.current = null;
        throw error;
      });

    return recaptchaRenderPromiseRef.current;
  };

  const handleGoBack = () => {
    if (activeTab === "password" && passwordStep === "phone") {
      resetPhoneAuth();
      setPasswordStep("id");
      return;
    }

    if (activeTab === "password" && passwordStep === "reset") {
      setPasswordStep("phone");
      return;
    }

    navigate(-1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFoundId("");
    setPasswordStep("id");
    setUserId("");
    setPasswordResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordStatus("idle");
    resetPhoneAuth();
  };

  useEffect(() => {
    let timerId;
    if (isCodeSent && timeLeft > 0) {
      timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (isCodeSent && timeLeft <= 0) {
      setCodeStatus("expired");
    }
    return () => clearInterval(timerId);
  }, [isCodeSent, timeLeft]);

  useEffect(() => {
    if (isPhoneMode) {
      setupRecaptcha().catch(() => {
        clearRecaptcha();
      });
    } else {
      clearRecaptcha();
    }
  }, [isPhoneMode]);

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length > 3 && value.length <= 7) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length > 7) {
      value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }
    setPhone(value);
    setCodeStatus("idle");
  };

  const requestPhoneAuth = async () => {
    if (phone.length !== 13 || isLoading) return;

    try {
      setIsLoading(true);
      const verifier = await setupRecaptcha();

      if (!verifier) {
        alert("reCAPTCHA가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const phoneNumber = `+82${phone.replace(/-/g, "").substring(1)}`;
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        verifier,
      );

      setConfirmationResult(confirmation);
      setIsCodeSent(true);
      setTimeLeft(300);
      setCodeStatus("idle");
      setCode("");
    } catch {
      alert("인증번호 발송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value.replace(/[^0-9]/g, ""));
    setCodeStatus("idle");
  };

  const readPayloadValue = (data, keys) => {
    if (typeof data === "string") return data;

    for (const key of keys) {
      if (data?.[key]) return data[key];
    }
    return "";
  };

  const parseResponseBody = async (response) => {
    const text = await response.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const completeIdFind = async (firebaseToken) => {
    const response = await fetch(`${API_BASE_URL}/auth/id/find`, {
      method: "POST",
      headers: {
        "X-FirebaseToken": firebaseToken,
      },
    });

    if (!response.ok) {
      throw new Error("아이디를 찾지 못했어요.");
    }

    const data = await parseResponseBody(response);
    const nextFoundId =
      typeof data === "string" ? data : readPayloadValue(data, ["userId"]);

    if (!nextFoundId) {
      throw new Error("아이디를 확인하지 못했어요.");
    }

    setFoundId(nextFoundId);
  };

  const completePasswordVerify = async (firebaseToken) => {
    const response = await fetch(`${API_BASE_URL}/auth/password/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-FirebaseToken": firebaseToken,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error("일치하는 아이디를 찾지 못했어요!");
    }

    const data = await parseResponseBody(response);
    const resetToken =
      typeof data === "string"
        ? data
        : readPayloadValue(data, ["passwordResetToken"]);

    if (!resetToken) {
      throw new Error("비밀번호 재설정 토큰을 확인하지 못했어요.");
    }

    setPasswordResetToken(resetToken);
    setPasswordStep("reset");
  };

  const handlePhoneComplete = async () => {
    if (!confirmationResult || code.length !== 6 || isLoading) return;

    try {
      setIsLoading(true);
      const result = await confirmationResult.confirm(code);
      const firebaseToken = await result.user.getIdToken();

      if (activeTab === "id") {
        await completeIdFind(firebaseToken);
      } else {
        await completePasswordVerify(firebaseToken);
      }

      setCodeStatus("match");
    } catch (error) {
      setCodeStatus("mismatch");
      alert(error.message || "인증 처리에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (value, type) => {
    const nextPassword = type === "password" ? value : newPassword;
    const nextConfirm = type === "confirm" ? value : confirmPassword;

    if (type === "password") {
      setNewPassword(value);
    } else {
      setConfirmPassword(value);
    }

    if (nextPassword && !passwordPattern.test(nextPassword)) {
      setPasswordStatus("invalid_format");
      return;
    }

    if (nextConfirm) {
      setPasswordStatus(nextPassword === nextConfirm ? "match" : "mismatch");
      return;
    }

    setPasswordStatus(nextPassword ? "valid_format" : "idle");
  };

  const handlePasswordReset = async () => {
    if (passwordStatus !== "match" || isLoading) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passwordResetToken,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await parseResponseBody(response);
        throw new Error(errorData.message || "비밀번호 변경에 실패했습니다.");
      }

      alert("비밀번호가 변경되었습니다.");
      navigate("/login", { replace: true });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const title = useMemo(() => {
    if (foundId) return "아이디를 찾았어요!";
    if (activeTab === "id")
      return "아이디를 찾기 위해서\n전화번호 인증이 필요해요!";
    if (passwordStep === "id") {
      return "비밀번호 변경을 위해서\n아이디를 먼저 알려주세요!";
    }
    if (passwordStep === "phone") {
      return "비밀번호 변경을 위해서\n전화번호 인증이 필요해요!";
    }
    return "새로운 비밀번호를 입력해주세요.";
  }, [activeTab, foundId, passwordStep]);

  const phoneInvalid = phone.length > 0 && phone.length < 13;
  const canCompletePhone =
    code.length === 6 &&
    codeStatus !== "expired" &&
    Boolean(confirmationResult) &&
    !isLoading;
  const canResetPassword =
    passwordStatus === "match" && Boolean(passwordResetToken) && !isLoading;

  return (
    <div className="FindWrapper">
      <div ref={recaptchaContainerRef} id="find-recaptcha-container"></div>

      <div className="FindBackBtn">
        <button type="button" onClick={handleGoBack}>
          <img src={BackBtn} alt="뒤로가기" />
        </button>
      </div>

      <div
        className={`FindTabs ${activeTab === "password" ? "passwordActive" : "idActive"}`}
        role="tablist"
        aria-label="계정 찾기 방식"
      >
        <button
          type="button"
          className={activeTab === "id" ? "active" : ""}
          onClick={() => handleTabChange("id")}
        >
          아이디
        </button>
        <button
          type="button"
          className={activeTab === "password" ? "active" : ""}
          onClick={() => handleTabChange("password")}
        >
          비밀번호
        </button>
      </div>

      <main className="FindContent">
        <h2>
          {title.split("\n").map((line, index, lines) => (
            <React.Fragment key={`${line}-${index}`}>
              {line}
              {index < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </h2>

        {foundId ? (
          <>
            <div className="FindInputContainer">
              <img src={UserIcon} alt="" />
              <input type="text" value={foundId} readOnly />
            </div>
            <div className="FindHelper">
              <span>문제가 생겼나요?</span>
              <button type="button" onClick={() => handleTabChange("password")}>
                비밀번호 바꾸기
              </button>
            </div>
          </>
        ) : (
          <>
            {activeTab === "password" && passwordStep === "id" && (
              <>
                <div className="FindInputContainer">
                  <img src={UserIcon} alt="" />
                  <input
                    type="text"
                    placeholder="ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                <div className="FindHelper">
                  <span>문제가 생겼나요?</span>
                  <button type="button" onClick={() => handleTabChange("id")}>
                    아이디 찾기
                  </button>
                </div>
              </>
            )}

            {isPhoneMode && (
              <div className="FindPhoneFields">
                <div
                  className={`FindInputContainer ${phoneInvalid ? "errorBorder" : ""}`}
                >
                  <input
                    type="tel"
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={13}
                  />
                  {phone.length === 13 && (
                    <button
                      type="button"
                      className="FindIconButton"
                      onClick={requestPhoneAuth}
                      disabled={isLoading}
                    >
                      <img src={RightIcon} alt="인증요청" />
                    </button>
                  )}
                </div>
                {phoneInvalid && (
                  <p className="FindMessage errorText">
                    * 전화번호를 제대로 입력해 주세요.
                  </p>
                )}

                {isCodeSent && (
                  <div className="FindCodeRow">
                    <div className="FindInputContainer FindCodeInput">
                      <input
                        type="tel"
                        placeholder="6자리 입력"
                        value={code}
                        onChange={handleCodeChange}
                        maxLength={6}
                      />
                    </div>
                    <button
                      type="button"
                      className="FindResendButton"
                      onClick={timeLeft > 0 ? undefined : requestPhoneAuth}
                      disabled={isLoading}
                    >
                      {timeLeft > 0 ? formatTime(timeLeft) : "재요청"}
                    </button>
                  </div>
                )}

                {codeStatus === "mismatch" && (
                  <p className="FindMessage errorText">
                    * 인증번호가 일치하지 않습니다.
                  </p>
                )}
                {codeStatus === "expired" && (
                  <p className="FindMessage errorText">
                    * 인증시간이 만료되었습니다. 재요청 해주세요.
                  </p>
                )}
              </div>
            )}

            {activeTab === "password" && passwordStep === "reset" && (
              <div className="FindPasswordFields">
                <div className="FindInputContainer">
                  <img src={PasswordIcon} alt="" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="PW"
                    value={newPassword}
                    onChange={(e) =>
                      handlePasswordChange(e.target.value, "password")
                    }
                  />
                  <button
                    type="button"
                    className="FindPasswordToggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <img
                      src={showPassword ? OpenPassword : ClosePassword}
                      alt="비밀번호 보기"
                    />
                  </button>
                </div>
                <p
                  className={`FindMessage ${
                    passwordStatus === "invalid_format" ? "errorText" : ""
                  }`}
                >
                  * 8자 이상, 20자 이하의 영문자, 숫자, 특수문자를 조합하여
                  작성해주세요.
                </p>
                <div
                  className={`FindInputContainer ${
                    passwordStatus === "mismatch" ? "errorBorder" : ""
                  }`}
                >
                  <img src={PasswordIcon} alt="" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="PW 확인"
                    value={confirmPassword}
                    onChange={(e) =>
                      handlePasswordChange(e.target.value, "confirm")
                    }
                  />
                  <button
                    type="button"
                    className="FindPasswordToggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    <img
                      src={showConfirmPassword ? OpenPassword : ClosePassword}
                      alt="비밀번호 확인 보기"
                    />
                  </button>
                </div>
                {passwordStatus === "mismatch" && (
                  <p className="FindMessage errorText">
                    * 비밀번호가 일치하지 않습니다.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <div className="FindBottomButton">
        {foundId ? (
          <button type="button" onClick={() => navigate("/login")}>
            로그인 하러가기
          </button>
        ) : activeTab === "password" && passwordStep === "id" ? (
          <button
            type="button"
            onClick={() => setPasswordStep("phone")}
            disabled={!userId}
          >
            다음
          </button>
        ) : activeTab === "password" && passwordStep === "reset" ? (
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={!canResetPassword}
          >
            비밀번호 변경
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePhoneComplete}
            disabled={!canCompletePhone}
          >
            인증 완료
          </button>
        )}
      </div>
    </div>
  );
};

export default Find;
