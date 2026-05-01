import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../../firebase";
import "./Signup.css";

import BackBtn from "../../../assets/login/system/backbtn.svg";
import UserIcon from "../../../assets/login/system/user.svg";
import PasswordIcon from "../../../assets/login/system/password.svg";
import OpenPassword from "../../../assets/login/system/open_password.svg";
import ClosePassword from "../../../assets/login/system/close_password.svg";
import RightIcon from "../../../assets/login/system/right.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

const Signup = () => {
  const navigate = useNavigate();
  const recaptchaContainerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  const [step, setStep] = useState(1);

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [idStatus, setIdStatus] = useState("idle");
  const [pwMatchStatus, setPwMatchStatus] = useState("idle");

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [codeStatus, setCodeStatus] = useState("idle");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // 뒤로 가기
  const handleGoBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  // 아이디 중복 체크
  const checkDuplicateId = async (currentId) => {
    if (!currentId) {
      setIdStatus("idle");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/member/check-userId`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentId }),
      });

      if (!response.ok) {
        throw new Error("ID duplicate check failed");
      }

      const data = await response.json();

      if (data?.available) {
        setIdStatus("available");
      } else {
        setIdStatus("duplicate");
      }
    } catch (error) {
      alert("아이디 중복 확인에 실패했습니다.");
      setIdStatus("idle");
    }
  };

  // 아이디 입력 창 없어나면 자동으로 id 중복 체크
  const handleIdBlurOrEnter = (e) => {
    if (e.type === "blur" || e.key === "Enter") {
      checkDuplicateId(id);
    }
  };

  // 아이디 입력값이 바뀌면 idle로 만들어 다시 중복 체크
  const handleIdChange = (e) => {
    setId(e.target.value);
    setIdStatus("idle");
  };

  // 비밀번호 입력
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (confirmPassword)
      setPwMatchStatus(newPassword === confirmPassword ? "match" : "mismatch");
    else setPwMatchStatus("idle");
  };

  // 비밀번호와 비밀번호 확인 칸의 두 값이 같은지 확인
  const handleConfirmPasswordChange = (e) => {
    const newConfirm = e.target.value;
    setConfirmPassword(newConfirm);
    if (newConfirm)
      setPwMatchStatus(password === newConfirm ? "match" : "mismatch");
    else setPwMatchStatus("idle");
  };

  // 다음 단계로
  const handleNext = () => {
    setStep(2);
  };

  const isNextEnabled =
    idStatus === "available" &&
    pwMatchStatus === "match" &&
    id !== "" &&
    password !== "" &&
    confirmPassword !== "";

  useEffect(() => {
    let timerId;
    if (isCodeSent && timeLeft > 0) {
      timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft <= 0) {
      setCodeStatus("expired");
    }
    return () => clearInterval(timerId);
  }, [isCodeSent, timeLeft]);

  // 전화번호 인증을 위한 recaptcha 생성
  //
  useEffect(() => {
    let isActive = true;

    const setupRecaptcha = async () => {
      if (
        step !== 2 ||
        recaptchaVerifierRef.current ||
        !recaptchaContainerRef.current
      ) {
        return;
      }

      const verifier = new RecaptchaVerifier(
        auth,
        recaptchaContainerRef.current,
        {
          size: "invisible",
          callback: () => {},
        },
      );

      await verifier.render();

      if (!isActive) {
        verifier.clear();
        return;
      }

      recaptchaVerifierRef.current = verifier;
    };

    setupRecaptcha();

    return () => {
      isActive = false;
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [step]);

  // 전화번호 입력
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 3 && val.length <= 7)
      val = val.slice(0, 3) + "-" + val.slice(3);
    else if (val.length > 7)
      val = val.slice(0, 3) + "-" + val.slice(3, 7) + "-" + val.slice(7, 11);
    setPhone(val);
  };

  // 인증번호 발송
  const RequestPhoneAuth = async () => {
    if (!phone || phone.length < 13) return;
    try {
      if (!recaptchaVerifierRef.current) {
        alert("reCAPTCHA가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      const phoneNumber = "+82" + phone.replace(/-/g, "").substring(1);
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifierRef.current,
      );
      setConfirmationResult(confirmation);
      setIsCodeSent(true);
      setTimeLeft(300);
      setCodeStatus("idle");
      setCode("");
    } catch (error) {
      alert("인증번호 발송에 실패했습니다.");
    }
  };

  // 번호 확인
  const verifyCode = async () => {
    if (!code || code.length !== 6 || !confirmationResult) return;
    try {
      await confirmationResult.confirm(code);
      setCodeStatus("match");
    } catch (error) {
      setCodeStatus("mismatch");
    }
  };

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCode(val);
    setCodeStatus("idle");
  };

  // 인증 완료
  const handleComplete = async () => {
    if (codeStatus !== "match") {
      await verifyCode();
    }
    if (codeStatus === "match") {
      navigate("/home");
    }
  };

  // 인증 남은 시간 표시
  const formatTime = (time) => {
    const m = Math.floor(time / 60);
    const s = time % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="SignupWrapper">
      <div ref={recaptchaContainerRef} id="recaptcha-container"></div>
      <div className="BackBtn">
        <button type="button" onClick={handleGoBack}>
          <img src={BackBtn} alt="뒤로가기" />
        </button>
      </div>

      {step === 1 && (
        <>
          <div className="SignupText">
            <h2>
              ARFLY에서 사용할
              <br />
              아이디와 비밀번호를 입력해주세요.
            </h2>
          </div>

          <div className="SignupInputForm">
            <div className="InputGroup">
              <div
                className={`InputContainer ${idStatus === "duplicate" ? "errorBorder" : idStatus === "available" ? "successBorder" : ""}`}
              >
                <img src={UserIcon} alt="아이디" />
                <input
                  id="id"
                  type="text"
                  placeholder="ID"
                  value={id}
                  onChange={handleIdChange}
                  onBlur={handleIdBlurOrEnter}
                  onKeyDown={handleIdBlurOrEnter}
                />
              </div>
              {idStatus === "duplicate" && (
                <div className="StatusMessage errorText">
                  * 중복된 아이디는 사용할 수 없습니다
                </div>
              )}
              {idStatus === "available" && (
                <div className="StatusMessage successText">
                  * 사용가능한 아이디 입니다.
                </div>
              )}
              {idStatus === "idle" && (
                <div className="HintMessage">
                  * 숫자와 문자만을 조합해 작성해주세요.
                </div>
              )}
            </div>

            <div className="InputGroup">
              <div className="InputContainer">
                <img src={PasswordIcon} alt="비밀번호" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="PW"
                  value={password}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  className="toggleBtn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <img
                    src={showPassword ? OpenPassword : ClosePassword}
                    alt="비밀번호 숨기기"
                  />
                </button>
              </div>
              <div className="HintMessage">
                * 8자 이상, 20자 이하의 영문자, 숫자, 특수문자를 조합하여
                작성해주세요.
              </div>
            </div>

            <div className="InputGroup">
              <div
                className={`InputContainer ${pwMatchStatus === "mismatch" ? "errorBorder" : pwMatchStatus === "match" ? "successBorder" : ""}`}
              >
                <img src={PasswordIcon} alt="비밀번호" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="PW 확인"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                />
                <button
                  type="button"
                  className="toggleBtn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <img
                    src={showConfirmPassword ? OpenPassword : ClosePassword}
                    alt="비밀번호 숨기기"
                  />
                </button>
              </div>
              {pwMatchStatus === "mismatch" && (
                <div className="StatusMessage errorText">
                  * 비밀번호가 일치하지 않습니다.
                </div>
              )}
              {pwMatchStatus === "match" && (
                <div className="StatusMessage successText">
                  * 비밀번호가 확인 되었습니다.
                </div>
              )}
            </div>
          </div>

          <div className="summitSignup">
            <button
              type="button"
              onClick={handleNext}
              disabled={!isNextEnabled}
            >
              다음
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="SignupText">
            <h2>전화번호 인증이 필요해요!</h2>
          </div>

          <div className="SignupInputForm">
            <div className="InputGroup">
              <div className="InputContainer phoneInputContainer">
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={13}
                  className="phoneInput"
                />
                {phone.length === 13 && (
                  <button
                    type="button"
                    className="phoneSendBtn"
                    onClick={RequestPhoneAuth}
                  >
                    <img src={RightIcon} alt="인증요청" />
                  </button>
                )}
              </div>
              {phone.length > 0 && phone.length < 13 && (
                <div className="StatusMessage errorText">
                  * 전화번호를 제대로 입력해 주세요.
                </div>
              )}
            </div>

            {isCodeSent && (
              <div className="InputGroup rowGroup">
                <div className="InputContainer codeInputContainer">
                  <input
                    type="tel"
                    placeholder="6자리 입력"
                    value={code}
                    onChange={handleCodeChange}
                    maxLength={6}
                    className="codeInput"
                  />
                </div>
                <button
                  type="button"
                  className="resendBtn"
                  onClick={RequestPhoneAuth}
                >
                  {timeLeft > 0 ? formatTime(timeLeft) : "재요청"}
                </button>
              </div>
            )}

            {codeStatus === "mismatch" && (
              <div className="StatusMessage errorText">
                *인증번호가 일치하지 않습니다.
              </div>
            )}
            {codeStatus === "expired" && (
              <div className="StatusMessage errorText">
                *인증시간이 만료되었습니다. 재요청 해주세요.
              </div>
            )}
          </div>

          <div className="summitSignup">
            <button
              type="button"
              onClick={handleComplete}
              disabled={code.length !== 6 || codeStatus === "expired"}
            >
              인증 완료
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Signup;
