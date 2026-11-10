import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../../utils/firebase.js";
import Terms from "./Terms";
import "./Signup.css";

import BackBtn from "../../../assets/login/system/backbtn.svg";
import UserIcon from "../../../assets/login/system/user.svg";
import PasswordIcon from "../../../assets/login/system/password.svg";
import OpenPassword from "../../../assets/login/system/open_password.svg";
import ClosePassword from "../../../assets/login/system/close_password.svg";
import RightIcon from "../../../assets/login/system/right.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

/** 계정 입력, 휴대폰 인증, 약관 동의로 이어지는 회원가입을 관리한다. */
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

  const [authToken, setAuthToken] = useState("");

  /** 회원가입 단계에 따라 이전 입력 단계 또는 이전 화면으로 돌아간다. */
  const handleGoBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  /** 입력한 아이디의 중복 여부를 조회하고 사용 가능 상태를 갱신한다. */
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
    } catch {
      alert("아이디 중복 확인에 실패했습니다.");
      setIdStatus("idle");
    }
  };

  const passwordPattern =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[a-zA-Z\d\W_]{8,20}$/;

  /** 아이디 입력 완료 시 형식을 확인하고 중복 검사를 진행한다. */
  const handleIdBlurOrEnter = (e) => {
    if (e.type === "blur" || e.key === "Enter") {
      const idPattern = /^[A-Za-z0-9]{4,20}$/;
      if (!idPattern.test(id)) {
        setIdStatus("invalid_format");
        return;
      }
      checkDuplicateId(id);
    }
  };

  /** 아이디 입력값을 갱신하고 이전 중복 검사 결과를 초기화한다. */
  const handleIdChange = (e) => {
    setId(e.target.value);
    setIdStatus("idle");
  };

  /** 비밀번호 입력값과 형식 또는 일치 여부를 갱신한다. */
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (newPassword && !passwordPattern.test(newPassword)) {
      setPwMatchStatus("invalid_format");
    } else if (confirmPassword) {
      setPwMatchStatus(newPassword === confirmPassword ? "match" : "mismatch");
    } else {
      setPwMatchStatus(newPassword ? "valid_format" : "idle");
    }
  };

  /** 비밀번호 확인값을 갱신하고 형식과 일치 여부를 확인한다. */
  const handleConfirmPasswordChange = (e) => {
    const newConfirm = e.target.value;
    setConfirmPassword(newConfirm);

    if (newConfirm) {
      setPwMatchStatus(password === newConfirm ? "match" : "mismatch");
    } else if (password) {
      setPwMatchStatus(
        passwordPattern.test(password) ? "valid_format" : "invalid_format",
      );
    } else {
      setPwMatchStatus("idle");
    }
  };

  /** 회원가입의 다음 입력 단계로 이동한다. */
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

  useEffect(() => {
    let isActive = true;

    /** 휴대폰 인증 요청에 사용할 reCAPTCHA 인스턴스를 준비한다. */
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

  /** 전화번호를 표시 형식에 맞춰 정리하고 입력값을 갱신한다. */
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 3 && val.length <= 7)
      val = val.slice(0, 3) + "-" + val.slice(3);
    else if (val.length > 7)
      val = val.slice(0, 3) + "-" + val.slice(3, 7) + "-" + val.slice(7, 11);
    setPhone(val);
  };

  /** 입력한 전화번호로 인증번호를 발송하고 인증 대기 상태를 설정한다. */
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
    } catch {
      alert("인증번호 발송에 실패했습니다.");
    }
  };

  /** 인증번호 입력값을 갱신하고 이전 검증 상태를 초기화한다. */
  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCode(val);
    setCodeStatus("idle");
  };

  /** 휴대폰 인증번호를 검증하고 인증 토큰을 저장한 뒤 약관 단계로 이동한다. */
  const handleComplete = async () => {
    try {
      let result;
      if (codeStatus !== "match") {
        result = await confirmationResult.confirm(code);
      } else {
        result = { user: auth.currentUser };
      }

      const token = await result.user.getIdToken();
      setAuthToken(token);
      setCodeStatus("match");
      setStep(3);
    } catch {
      setCodeStatus("mismatch");
    }
  };

  /** 약관 동의와 인증된 계정 정보를 전송해 회원가입을 완료한다. */
  const handleTermsComplete = async (agreements) => {
    const termsMapping = {
      service: 1,
      privacy: 2,
      ai_ref: 3,
      location: 4,
      ai_collect: 5,
      push: 6,
      night: 7,
    };

    const userAgreements = Object.keys(agreements).map((key) => ({
      termId: termsMapping[key],
      termsOfServiceAgreed: agreements[key],
    }));

    const payload = {
      userId: id,
      password,
      token: {
        token: authToken,
      },
      userAgreements,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "회원가입에 실패했습니다.");
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      navigate("/pet/register", {
        replace: true,
        state: { entry: "signup" },
      });
    } catch (error) {
      alert(error.message);
    }
  };

  /** 인증 제한 시간을 분과 초로 표시한다. */
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
              {idStatus === "invalid_format" && (
                <div className="StatusMessage errorText">
                  * 4~20자의 영문자, 숫자만 사용 가능합니다.
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
                  className={
                    pwMatchStatus === "invalid_format" ? "errorText" : ""
                  }
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
              {pwMatchStatus === "invalid_format" ? (
                <div className="StatusMessage errorText">
                  * 8자 이상, 20자 이하의 영문자, 숫자, 특수문자를 조합하여
                  작성해주세요.
                </div>
              ) : (
                <div className="HintMessage">
                  * 8자 이상, 20자 이하의 영문자, 숫자, 특수문자를 조합하여
                  작성해주세요.
                </div>
              )}
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
                  * 비밀번호가 확인되었습니다.
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

      {step === 3 && (
        <div className="TermsModalOverlay">
          <div className="TermsModalContent">
            <Terms onComplete={handleTermsComplete} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
