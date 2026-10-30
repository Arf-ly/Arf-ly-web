import { useLocation, useNavigate } from "react-router-dom";
import Camera from "./Camera.jsx";

export default function DiagnosisCamera() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const pet = state?.pet;

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
