import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./UserProfile.css";

import USERPROFILEBACK from "../../assets/login/system/backbtn.svg";
import USERPROFILEIMG from "../../assets/mypage/UserProfile/UserProfile_profileImg.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

/** 사용자 닉네임과 주소의 수정 및 저장을 제공한다. */
export default function UserProfile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const userInfo = state?.userInfo || {};
  const initialNickname = state?.nickname || userInfo.nickname || "";
  const initialAddress = state?.address || userInfo.roadAddress || "";
  const [nickname, setNickname] = useState(initialNickname);
  const [address, setAddress] = useState(initialAddress);
  const [isChanging, setIsChanging] = useState(false);
  const [isNicknameTouched, setIsNicknameTouched] = useState(false);
  const [nicknameCheckStatus, setNicknameCheckStatus] = useState("idle");
  const trimmedNickname = nickname.trim();
  const isUnchanged =
    nickname === initialNickname && address === initialAddress;
  const isNicknameEmpty = trimmedNickname.length === 0;
  const isNicknameInvalid =
    isNicknameEmpty ||
    nicknameCheckStatus === "duplicate" ||
    nicknameCheckStatus === "checking";
  const isChangeDisabled = isUnchanged || isChanging || isNicknameInvalid;
  const nicknameMessage = !isNicknameTouched
    ? ""
    : isNicknameEmpty
      ? "*닉네임은 필수 입력사항입니다."
      : nicknameCheckStatus === "duplicate"
        ? "*중복된 닉네임은 사용할 수 없습니다."
        : nicknameCheckStatus === "available"
          ? "*사용가능한 닉네임입니다."
          : "";

  useEffect(() => {
    if (!isNicknameTouched) {
      setNicknameCheckStatus("idle");
      return;
    }

    if (!trimmedNickname) {
      setNicknameCheckStatus("required");
      return;
    }

    const controller = new AbortController();

    /** 변경한 닉네임의 중복 여부를 조회해 사용 가능 상태를 갱신한다. */
    const checkNickname = async () => {
      const accessToken = localStorage.getItem("accessToken");

      try {
        setNicknameCheckStatus("checking");

        const response = await fetch(`${API_BASE_URL}/member/check-username`, {
          method: "POST",
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nickname: trimmedNickname }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("nickname check failed");
        }

        const result = await response.json();
        const isAvailable =
          typeof result === "boolean" ? result : Boolean(result?.available);

        setNicknameCheckStatus(isAvailable ? "available" : "duplicate");
      } catch (error) {
        if (error.name !== "AbortError") {
          setNicknameCheckStatus("duplicate");
        }
      }
    };

    checkNickname();

    return () => {
      controller.abort();
    };
  }, [isNicknameTouched, trimmedNickname]);

  /** 우편번호 검색 창을 열고 선택한 주소를 입력값에 반영한다. */
  const handleAddressSearch = () => {
    if (!window.daum?.Postcode) {
      alert("주소 검색 서비스를 불러오지 못했습니다.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        const selectedAddress = data.roadAddress || data.jibunAddress || "";
        setAddress(selectedAddress);
      },
    }).open();
  };

  /** 변경한 닉네임과 주소를 서버에 저장하고 이전 화면으로 돌아간다. */
  const handleChange = async () => {
    if (isChangeDisabled) return;

    const accessToken = localStorage.getItem("accessToken");

    try {
      setIsChanging(true);
      const formData = new FormData();
      const requestBody = {
        nickname: trimmedNickname,
        roadAddress: address,
      };

      formData.append("request", JSON.stringify(requestBody));

      const response = await fetch(`${API_BASE_URL}/member/me`, {
        method: "POST",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("profile update failed");
      }

      navigate(-1);
    } catch {
      alert("프로필 수정에 실패했습니다.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="userProfile-wrapper">
      <div className="userProfile-top">
        <button
          className="userProfile-back-button"
          type="button"
          onClick={() => navigate(-1)}
        >
          <img src={USERPROFILEBACK} alt="뒤로가기" />
        </button>
        <span>프로필 수정</span>
      </div>
      <div className="userProfile-profileImg">
        <img className="userProfile-profileImg-main" src={USERPROFILEIMG} />
      </div>
      <div className="userProfile-login-form">
        <span className="userProfile-login-form-text"> 닉네임 </span>
        <div className="userProfile-input-container">
          <input
            id="nickname"
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => {
              setIsNicknameTouched(true);
              setNickname(e.target.value);
            }}
          />
        </div>
        {nicknameMessage && (
          <span
            className={`userProfile-nickname-message ${nicknameCheckStatus}`}
          >
            {nicknameMessage}
          </span>
        )}
        <span className="userProfile-login-form-text"> 주소 </span>
        <div className="userProfile-input-container">
          <input
            id="address"
            type="text"
            placeholder="주소"
            value={address}
            readOnly
            onClick={handleAddressSearch}
          />
        </div>
      </div>
      <div className="userProfile-confirm">
        <button
          type="button"
          disabled={isChangeDisabled}
          onClick={handleChange}
        >
          변경하기
        </button>
      </div>
    </div>
  );
}
