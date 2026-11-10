import { isMobileDevice } from "../utils/device.js";
import CameraIcon from "../assets/home/home_camera.svg";
import ImportIcon from "../assets/home/home_get.svg";
import "./PhotoSourceSheet.css";

/** 사진 촬영과 파일 가져오기 선택지를 하단 시트에 표시한다. */
export default function PhotoSourceSheet({ onClose, onCapture, onImport }) {
  return (
    <div className="photo-source-overlay" onClick={onClose}>
      <div
        className="photo-source-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="사진 선택"
        onClick={(event) => event.stopPropagation()}
      >
        {isMobileDevice() && (
          <button type="button" onClick={onCapture}>
            <img src={CameraIcon} alt="" />
            사진 찍기
          </button>
        )}
        <button type="button" onClick={onImport}>
          <img src={ImportIcon} alt="" />
          가져오기
        </button>
      </div>
    </div>
  );
}
