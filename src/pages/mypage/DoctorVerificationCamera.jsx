import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Camera from "../home/Camera.jsx";
import { isMobileDevice } from "../../utils/device.js";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

/** 증빙 이미지를 파일로 변환해 의사 인증 신청을 전송한다. */
const submitDoctorVerification = async ({ image }) => {
  if (!image) {
    throw new Error("제출할 사진을 선택해주세요.");
  }

  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
  }

  const imageResponse = await fetch(image);
  const imageBlob = await imageResponse.blob();
  const extension = imageBlob.type.split("/")[1] || "png";
  const imageFile = new File(
    [imageBlob],
    `doctor-verification.${extension}`,
    { type: imageBlob.type || "image/png" },
  );
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await fetch(`${API_BASE_URL}/api/verifications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      typeof errorData?.message === "string" && errorData.message
        ? errorData.message
        : "의사 인증 사진을 제출하지 못했습니다.";
    throw new Error(message);
  }
};

/** 의사 인증 증빙 이미지 선택과 제출 과정을 관리한다. */
export default function DoctorVerificationCamera() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const initialImage = typeof state?.image === "string" ? state.image : null;
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 선택한 증빙 이미지로 의사 인증을 신청하고 완료 후 마이페이지로 이동한다. */
  const handleComplete = async (image) => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await submitDoctorVerification({ image });
      alert("의사 인증 사진이 제출되었습니다.");
      navigate("/mypage", { replace: true });
    } catch (error) {
      alert(error.message || "의사 인증 사진을 제출하지 못했습니다.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Camera
      purpose="doctorVerification"
      initialImage={initialImage}
      allowCapture={isMobileDevice()}
      onBack={() => navigate(-1)}
      onComplete={handleComplete}
      isSubmitting={isSubmitting}
    />
  );
}
