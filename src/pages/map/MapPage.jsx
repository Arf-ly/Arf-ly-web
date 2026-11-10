import { useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

import BottomTabBar from "../../components/BottomTabBar";
import { getMapDetail, getMapList, getMapPhotoBlob } from "./MapApi.js";

import "./MapPage.css";

import phoneIcon from "../../assets/map/phone.svg";
import pinPinkIcon from "../../assets/map/pin_pink.svg";
import pinIcon from "../../assets/map/pin.svg";
import returnIcon from "../../assets/map/return.svg";
import timeIcon from "../../assets/map/time.svg";
import markerPinkIcon from "../../assets/map/marker_pink.svg";
import markerBrownIcon from "../../assets/map/marker_brown.svg";
import exitIcon from "../../assets/map/exit.svg";
import defaultHospitalImage from "../../assets/map/default_hospital_image.svg";

const DEFAULT_LOCATION = {
  address: "경상북도 경산시 대학로 280 (대동)",
  lat: 35.8327,
  lng: 128.7574,
};

const DEFAULT_CENTER = {
  lat: DEFAULT_LOCATION.lat,
  lng: DEFAULT_LOCATION.lng,
};

/** 병원 정보에서 사진 요청에 사용할 이름 목록을 추출한다. */
const getPhotoNames = (imageUrl) => {
  if (Array.isArray(imageUrl)) {
    return imageUrl.filter(Boolean);
  }

  if (imageUrl) {
    return [imageUrl];
  }

  return [];
};

/** 병원의 영업시간 정보에서 오늘에 해당하는 안내를 추출한다. */
const getTodayOperatingTime = (operating) => {
  if (!Array.isArray(operating) || operating.length === 0) {
    return "운영시간 정보 없음";
  }

  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;

  const todayOperatingTime = operating[dayIndex];

  if (!todayOperatingTime) {
    return "운영시간 정보 없음";
  }

  const colonIndex = todayOperatingTime.indexOf(":");

  if (colonIndex !== -1) {
    return todayOperatingTime.slice(colonIndex + 1).trim();
  }

  return todayOperatingTime;
};

/** 동물병원 지도와 목록, 상세 정보 시트의 선택 및 이동을 관리한다. */
function MapPage() {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const [isListExpanded, setIsListExpanded] = useState(false);
  const touchStartY = useRef(0);
  const isDraggingSheet = useRef(false);

  const [baseAddress, setBaseAddress] = useState(DEFAULT_LOCATION.address);
  const [baseCenter, setBaseCenter] = useState(DEFAULT_CENTER);
  const [center, setCenter] = useState(DEFAULT_CENTER);

  const [isDetailMode, setIsDetailMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  /** 동물병원 목록을 조회하고 지도에 사용할 병원 정보를 구성한다. */
  const fetchHospitals = async () => {
    try {
      setIsLoading(true);

      const data = await getMapList();

      const hospitalList = Array.isArray(data)
        ? data
        : data?.hospitalList || data?.hospitals || [];

      if (!Array.isArray(hospitalList)) {
        setHospitals([]);
        return;
      }

      const userCenter = {
        lat: Number(data?.latitude) || DEFAULT_LOCATION.lat,
        lng: Number(data?.longitude) || DEFAULT_LOCATION.lng,
      };
      setBaseAddress(data?.roadAddress || DEFAULT_LOCATION.address);

      setBaseCenter(userCenter);
      setCenter(userCenter);
      setHospitals(hospitalList);
    } catch {
      setHospitals([]);
      setBaseAddress(DEFAULT_LOCATION.address);
      setBaseCenter(DEFAULT_CENTER);
      setCenter(DEFAULT_CENTER);
    } finally {
      setIsLoading(false);
    }
  };

  /** 선택한 병원의 상세 정보를 조회하고 지도와 시트에 반영한다. */
  const handleHospitalClick = async (hospital) => {
    try {
      setCenter({
        lat: Number(hospital.latitude),
        lng: Number(hospital.longitude),
      });

      setIsListExpanded(false);
      setIsDetailMode(true);
      setSelectedHospital(hospital);

      const detailData = await getMapDetail(hospital.id);

      setSelectedHospital({
        ...hospital,
        ...detailData,
      });
    } catch {
      setIsListExpanded(false);
      setSelectedHospital(hospital);
      setIsDetailMode(true);
    }
  };

  /** 지도를 기준 위치로 되돌리고 병원 선택 상태를 초기화한다. */
  const handleReturnToBase = () => {
    setSelectedHospital(null);
    setIsDetailMode(false);
    setIsListExpanded(false);
    setCenter(baseCenter);
  };

  /** 병원 정보 시트를 움직이기 위한 포인터 시작 위치를 저장한다. */
  const handleSheetPointerDown = (event) => {
    touchStartY.current = event.clientY;
    isDraggingSheet.current = false;

    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  /** 포인터 이동 방향과 거리에 따라 병원 정보 시트를 펼치거나 접는다. */
  const handleSheetPointerMove = (event) => {
    if (isDetailMode) {
      return;
    }

    const dragDistance = touchStartY.current - event.clientY;

    if (Math.abs(dragDistance) > 8) {
      isDraggingSheet.current = true;
    }

    if (dragDistance > 15) {
      setIsListExpanded(true);
    }

    if (dragDistance < -15) {
      setIsListExpanded(false);
    }
  };

  /** 드래그 여부를 확인하고 시트 손잡이 클릭으로 펼침 상태를 전환한다. */
  const handleSheetHandleClick = () => {
    if (isDetailMode || isDraggingSheet.current) {
      return;
    }

    setIsListExpanded((prev) => !prev);
  };

  const currentAddress =
    selectedHospital?.roadAddress || baseAddress || DEFAULT_LOCATION.address;

  if (loadError) {
    return (
      <div className="map_state_page">구글 지도를 불러오지 못했습니다.</div>
    );
  }

  if (!isLoaded) {
    return <div className="map_state_page">지도를 불러오는 중...</div>;
  }

  return (
    <div className="map_page">
      <GoogleMap
        mapContainerClassName="google_map"
        center={center}
        zoom={15}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
        }}
      >
        {baseCenter && (
          <Marker
            position={baseCenter}
            icon={{
              url: markerPinkIcon,
              scaledSize: new window.google.maps.Size(46, 46),
              anchor: new window.google.maps.Point(23, 46),
            }}
          />
        )}
        {hospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            position={{
              lat: Number(hospital.latitude),
              lng: Number(hospital.longitude),
            }}
            icon={{
              url: markerBrownIcon,
              scaledSize: new window.google.maps.Size(46, 46),
              anchor: new window.google.maps.Point(23, 46),
            }}
            onClick={() => handleHospitalClick(hospital)}
          />
        ))}
      </GoogleMap>

      <div className="map_top_area">
        <div className="map_address_box">
          <img src={pinPinkIcon} alt="" className="map_pin_pink_icon" />
          <span>{currentAddress}</span>
        </div>

        <button
          type="button"
          className="map_return_button"
          onClick={handleReturnToBase}
          aria-label="기준 위치로 돌아가기"
        >
          <img src={returnIcon} alt="" className="map_return_icon" />
        </button>
      </div>

      <section
        className={
          isDetailMode
            ? "map_bottom_sheet detail"
            : isListExpanded
              ? "map_bottom_sheet list expanded"
              : "map_bottom_sheet list"
        }
      >
        <div
          className="bottom_sheet_handle"
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onClick={handleSheetHandleClick}
        />

        {isDetailMode && selectedHospital ? (
          <HospitalDetail
            hospital={selectedHospital}
            onClose={handleReturnToBase}
          />
        ) : (
          <HospitalList
            hospitals={hospitals}
            isLoading={isLoading}
            onHospitalClick={handleHospitalClick}
          />
        )}
      </section>

      <BottomTabBar />
    </div>
  );
}

/** 병원 목록과 선택 가능한 병원 요약 정보를 표시한다. */
function HospitalList({ hospitals, isLoading, onHospitalClick }) {
  if (isLoading) {
    return (
      <div className="hospital_empty_text">병원 정보를 불러오는 중...</div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="hospital_empty_text">
        주변 병원 정보를 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="hospital_list_area">
      <p className="hospital_count_text">
        근처에 동물병원이 <strong>{hospitals.length}</strong>개 있어요!
      </p>

      <div className="hospital_card_list">
        {hospitals.map((hospital) => (
          <button
            key={hospital.id}
            type="button"
            className="hospital_card"
            onClick={() => onHospitalClick(hospital)}
          >
            <HospitalImage
              photoName={getPhotoNames(hospital.imageUrl)[0]}
              alt={hospital.hospitalName}
              className="hospital_card_image"
            />

            <div className="hospital_card_info">
              <span className="open_badge">
                {hospital.opened ? "영업 중" : "영업 종료"}
              </span>

              <h2>{hospital.hospitalName}</h2>

              <div className="hospital_address_row">
                <img src={pinIcon} alt="" className="map_pin_icon" />
                <p>{hospital.roadAddress}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 선택한 병원의 사진, 위치, 연락처와 영업 정보를 표시한다. */
function HospitalDetail({ hospital, onClose }) {
  const todayOperatingTime = getTodayOperatingTime(hospital.operating);

  return (
    <div className="hospital_detail_area">
      <div className="hospital_detail_title_row">
        <div className="hospital_detail_title_group">
          <h1>{hospital.hospitalName}</h1>

          <span className="open_badge">
            {hospital.opened ? "영업 중" : "영업 종료"}
          </span>
        </div>

        <button
          type="button"
          className="hospital_detail_close_button"
          onClick={onClose}
          aria-label="상세 정보 닫기"
        >
          <img src={exitIcon} alt="" className="hospital_detail_close_icon" />
        </button>
      </div>

      <HospitalImageList
        imageUrl={hospital.imageUrl}
        alt={hospital.hospitalName}
      />

      <div className="hospital_detail_info">
        <div className="hospital_detail_row">
          <img src={pinIcon} alt="" className="map_pin_icon" />
          <p>{hospital.roadAddress}</p>
        </div>

        <div className="hospital_detail_row">
          <img src={timeIcon} alt="" className="map_time_icon" />
          <p>
            {hospital.opened ? "진료 중" : "진료 종료"} | {todayOperatingTime}
          </p>
        </div>

        <div className="hospital_detail_row">
          <img src={phoneIcon} alt="" className="map_phone_icon" />
          <p>{hospital.phoneNumber || "전화번호 정보 없음"}</p>
        </div>
      </div>
    </div>
  );
}

/** 병원 사진 목록 또는 기본 이미지를 표시한다. */
function HospitalImageList({ imageUrl, alt }) {
  const photoNames = getPhotoNames(imageUrl);

  if (photoNames.length === 0) {
    return (
      <div className="hospital_detail_empty_image_box">
        <img
          src={defaultHospitalImage}
          alt=""
          className="hospital_detail_default_image"
        />
        <p>등록된 이미지가 없습니다.</p>
      </div>
    );
  }

  return (
    <HospitalImage
      photoName={photoNames[0]}
      alt={alt}
      className="hospital_detail_image"
    />
  );
}

/** 병원 사진을 불러와 표시하고 실패 시 기본 이미지로 대체한다. */
function HospitalImage({ photoName, alt, className }) {
  const [imageSrc, setImageSrc] = useState("");
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    let isActive = true;
    let objectUrl = "";

    /** 병원 사진 Blob을 조회하고 화면이 유효하면 표시용 주소를 생성한다. */
    const fetchImage = async () => {
      setImageSrc("");
      setHasImageError(false);

      if (!photoName || typeof photoName !== "string") {
        setIsLoadingImage(false);
        setHasImageError(true);
        return;
      }

      try {
        setIsLoadingImage(true);

        const blob = await getMapPhotoBlob(photoName, 400);

        if (!isActive || !blob) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      } catch {
        if (isActive) {
          setImageSrc("");
          setHasImageError(true);
        }
      } finally {
        if (isActive) {
          setIsLoadingImage(false);
        }
      }
    };

    fetchImage();

    return () => {
      isActive = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [photoName]);

  if (imageSrc) {
    return <img src={imageSrc} alt={alt} className={className} />;
  }
  if (isLoadingImage || !hasImageError) {
    return (
      <div
        className={`${className} hospital_image_empty hospital_image_loading`}
        aria-label="병원 이미지 불러오는 중"
      />
    );
  }

  return (
    <div
      className={`${className} hospital_image_empty`}
      aria-label="병원 이미지 없음"
    >
      <img
        src={defaultHospitalImage}
        alt=""
        className="hospital_default_image"
      />
    </div>
  );
}

export default MapPage;
