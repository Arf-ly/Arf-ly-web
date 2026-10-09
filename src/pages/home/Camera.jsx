import { useEffect, useRef, useState } from "react";
import "./Camera.css";

import CAMERAFLASH from "../../assets/home/Camera/camera_flash.svg";
import CAMERAROTATE from "../../assets/home/Camera/camera_rotate.svg";
import CAMERAPHOTOPLUS from "../../assets/home/Camera/camera_photo_plus.svg";
import CAMERABACK from "../../assets/home/Camera/camera_back.svg";

const cameraConfigurations = {
  diagnosis: {
    instruction: ["테두리 안에 이상 부위가", "잘 보이도록 찍어주세요!"],
    submitLabel: "스마트 검사 시작하기",
  },
  doctorVerification: {
    instruction: ["의사 인증에 필요한 서류가", "잘 보이도록 찍어주세요!"],
    submitLabel: "인증 사진 제출하기",
  },
};

export default function Camera({
  purpose,
  pet,
  onBack,
  onComplete,
  isSubmitting = false,
  initialImage = null,
  allowCapture = true,
}) {
  const isValidPurpose =
    purpose === "diagnosis" || purpose === "doctorVerification";
  const configuration = isValidPurpose ? cameraConfigurations[purpose] : null;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(initialImage);
  const [facingMode, setFacingMode] = useState("environment");
  const [isFlashOn, setIsFlashOn] = useState(false);

  useEffect(() => {
    let isActive = true;
    let cameraStream = null;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert(
            "현재 브라우저 또는 접속 환경에서는 카메라를 사용할 수 없습니다.",
          );
          return;
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
          },
          audio: false,
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        cameraStream = stream;
        streamRef.current = stream;
        setIsFlashOn(false);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (isActive) {
          alert("카메라를 실행하지 못했습니다. 카메라 접근 권한을 확인해주세요.");
        }
      }
    }

    if (isValidPurpose && allowCapture && !capturedImage) {
      startCamera();
    }

    return () => {
      isActive = false;
      cameraStream?.getTracks().forEach((track) => track.stop());
      if (streamRef.current === cameraStream) {
        streamRef.current = null;
      }
    };
  }, [allowCapture, capturedImage, facingMode, isValidPurpose, purpose]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (
      !allowCapture ||
      isSubmitting ||
      !video ||
      !video.videoWidth ||
      !video.videoHeight
    ) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setCapturedImage(canvas.toDataURL("image/png"));
  };

  const handleGalleryClick = () => {
    if (isSubmitting) return;
    fileInputRef.current?.click();
  };

  const handleGalleryChange = (event) => {
    if (isSubmitting) return;
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일을 선택해주세요.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    if (isSubmitting) return;
    setCapturedImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRotateCamera = () => {
    if (!allowCapture || isSubmitting) return;
    setCapturedImage(null);
    setFacingMode((current) =>
      current === "environment" ? "user" : "environment",
    );
  };

  const handleToggleFlash = async () => {
    if (!allowCapture || isSubmitting) return;
    const videoTrack = streamRef.current?.getVideoTracks?.()[0];

    if (!videoTrack) {
      alert("카메라가 아직 준비되지 않았습니다.");
      return;
    }

    const capabilities = videoTrack.getCapabilities?.();

    if (!capabilities?.torch) {
      alert("이 기기 또는 브라우저에서는 플래시를 지원하지 않습니다.");
      return;
    }

    try {
      const nextFlashState = !isFlashOn;

      await videoTrack.applyConstraints({
        advanced: [
          {
            torch: nextFlashState,
          },
        ],
      });

      setIsFlashOn(nextFlashState);
    } catch {
      alert("플래시를 전환할 수 없습니다.");
    }
  };

  const handleComplete = () => {
    if (!configuration || !capturedImage || isSubmitting) return;
    if (typeof onComplete !== "function") return;

    onComplete(capturedImage);
  };

  if (!configuration) {
    return (
      <div className="camera-wrapper">
        <p>올바른 카메라 진입 경로를 찾을 수 없습니다.</p>
        <button type="button" onClick={onBack}>돌아가기</button>
      </div>
    );
  }

  return (
    <div
      className="camera-wrapper"
      data-camera-purpose={purpose}
      data-capture-enabled={allowCapture}
    >
      {capturedImage ? (
        <img className="camera-video" src={capturedImage} alt="captured" />
      ) : allowCapture ? (
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
        />
      ) : null}

      <div className="camera-top">
        <button
          className="camera-back-button"
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <img src={CAMERABACK} />
        </button>

        {purpose === "diagnosis" && pet && (
          <button type="button" className="camera-pet-chip">
            <img src={pet.img} alt={pet.name} />
            <span>{pet.name}</span>
          </button>
        )}
      </div>

      {!capturedImage && (
        <div className="camera-frame">
          <p>
            {configuration.instruction[0]}
            <br />{configuration.instruction[1]}
          </p>
        </div>
      )}

      {allowCapture && (
        <div className="camera-tool-toggle">
          <button
            type="button"
            onClick={handleToggleFlash}
            disabled={isSubmitting || Boolean(capturedImage)}
            className={isFlashOn ? "active" : ""}
          >
            <img src={CAMERAFLASH} alt="" />
            <span>플래시</span>
          </button>

          <button
            type="button"
            onClick={handleRotateCamera}
            disabled={isSubmitting}
          >
            <img src={CAMERAROTATE} alt="" />
            <span>전환</span>
          </button>
        </div>
      )}

      <div className="camera-bottom">
        <input
          ref={fileInputRef}
          className="camera-file-input"
          type="file"
          accept="image/*"
          onChange={handleGalleryChange}
          disabled={isSubmitting}
        />

        <button
          className="camera-gallery-button"
          type="button"
          onClick={handleGalleryClick}
          disabled={isSubmitting}
        >
          <img src={CAMERAPHOTOPLUS} alt="" />
          <span>가져오기</span>
        </button>

        {allowCapture && (
          <>
            <button
              type="button"
              className="camera-capture-button"
              onClick={handleCapture}
              disabled={isSubmitting || Boolean(capturedImage)}
            />
            <button
              className="camera-retake-button"
              type="button"
              onClick={handleRetake}
              disabled={isSubmitting}
            >
              다시 찍기
            </button>
          </>
        )}

        <button
          className="camera-start-button"
          type="button"
          disabled={!capturedImage || isSubmitting || typeof onComplete !== "function"}
          onClick={handleComplete}
        >
          {isSubmitting ? "제출 중..." : configuration.submitLabel}
        </button>
      </div>
    </div>
  );
}
