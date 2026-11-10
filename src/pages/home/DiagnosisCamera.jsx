import { useLocation, useNavigate } from "react-router-dom";
import Camera from "./Camera.jsx";

/** 선택한 반려동물의 질환 확인에 사용할 사진 촬영 흐름을 연결한다. */
export default function DiagnosisCamera() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const pet = state?.pet;

  /** 촬영 이미지와 반려동물 정보를 진단 결과 화면으로 전달한다. */
  const handleComplete = (image) => {
    navigate("/diseasecheck", {
      state: { pet, image },
    });
  };

  return (
    <Camera
      purpose="diagnosis"
      pet={pet}
      onBack={() => navigate(-1)}
      onComplete={handleComplete}
    />
  );
}
