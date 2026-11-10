import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./PetDetail.css";

import PETDETAILBACK from "../../assets/login/system/backbtn.svg";
import PETDETAILECT from "../../assets/mypage/PetDetail/PetDetail_ect.svg";
import PETDETAILMALE from "../../assets/mypage/PetDetail/PetDetail_male.svg";
import PETDETAILFEMALE from "../../assets/mypage/PetDetail/PetDetail_female.svg";
import HOMEDOG from "../../assets/home/home_dog.svg";
import HOMECAT from "../../assets/home/home_cat.svg";
import HOMEPAW from "../../assets/home/home_paw.svg";
import WALKBROWNPAW from "../../assets/home/home_brown_paw.svg";
import PETDETAILEDIT from "../../assets/mypage/PetDetail/PetDetail_edit.svg";
import PETDETAILTRASH from "../../assets/mypage/PetDetail/PetDetail_trash.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

/** 저장된 액세스 토큰이 있으면 인증 헤더를 구성한다. */
const getAuthHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

/** 비어 있지 않은 조회 조건을 쿼리 문자열로 붙여 API 주소를 만든다. */
const createApiUrl = (path, query = {}) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;
};

/** 문자열이 JSON이면 해석하고 그렇지 않으면 원래 값을 반환한다. */
const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/** multipart 응답의 경계와 필드 이름을 해석해 응답 객체를 구성한다. */
const parseMultipartFormData = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const boundary =
    contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] ||
    contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];
  const text = await response.text();

  if (!boundary) {
    return parseMaybeJson(text);
  }

  const parsedParts = {};

  text.split(`--${boundary}`).forEach((rawPart) => {
    const part = rawPart.trim();
    if (!part || part === "--") return;

    const [rawHeaders, ...bodyParts] = part.split(/\r?\n\r?\n/);
    const body = bodyParts
      .join("\n\n")
      .replace(/\r?\n--$/, "")
      .trim();
    const name = rawHeaders.match(/name="([^"]+)"/)?.[1];
    const value = parseMaybeJson(body);

    if (name) {
      parsedParts[name] = value;
      return;
    }

    if (value && typeof value === "object") {
      Object.assign(parsedParts, value);
    }
  });

  return parsedParts;
};

/** 응답 형식에 따라 JSON 또는 multipart 본문을 해석한다. */
const readApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartFormData(response);
  }

  return response.json();
};

/** 인증 정보를 포함해 데이터를 조회하고 응답 본문을 반환한다. */
const fetchApiData = async (path, query) => {
  const response = await fetch(createApiUrl(path, query), {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      Accept: "application/json, multipart/form-data",
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${path}`);
  }

  return readApiResponse(response);
};

/** 인증 헤더를 포함해 지정된 API 리소스의 삭제를 요청한다. */
const deleteApiData = async (path) => {
  const response = await fetch(createApiUrl(path), {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${path}`);
  }
};

/** 산책 응답을 날짜와 활동 수치, 반려동물이 포함된 표시용 기록으로 변환한다. */
const normalizeWalk = (walk, fallbackPet) => {
  const durationMinutes = Number(walk.durationMinutes ?? 0);
  const pet = walk.pet || fallbackPet || {};

  return {
    id: walk.id,
    year: walk.date?.year,
    month: walk.date?.month,
    date: walk.date?.day,
    dayOfWeek: walk.date?.dayOfWeek,
    startTime: walk.startTime,
    endTime: walk.endTime,
    hour: Math.floor(durationMinutes / 60),
    minute: durationMinutes % 60,
    distance: Number(walk.distanceKm ?? 0),
    count: Number(walk.score ?? 0),
    petId: pet.id,
    petName: pet.name,
    petImg: pet.profileImage || pet.img || HOMEDOG,
  };
};

/** 선택한 반려동물의 프로필과 산책 기록을 표시하고 수정 및 삭제 진입을 제공한다. */
export default function PetDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const pet = location.state?.pet;
  const petProfileImg =
    pet?.img ||
    pet?.profileImageUrl ||
    pet?.profileImage ||
    (pet?.species === "CAT" ? HOMECAT : HOMEDOG);
  const [walkRecords, setWalkRecords] = useState([]);
  const [isWalkRecordsLoading, setIsWalkRecordsLoading] = useState(false);
  const [walkRecordsErrorMessage, setWalkRecordsErrorMessage] = useState("");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingPet, setIsDeletingPet] = useState(false);
  const shouldShowWalkRecords =
    isWalkRecordsLoading || walkRecordsErrorMessage || walkRecords.length > 0;

  /** 숫자를 앞자리 0이 포함된 두 자리 문자열로 변환한다. */
  const padTwo = (value) => String(value).padStart(2, "0");
  /** 활동 수치를 천 단위 구분이 포함된 문자열로 변환한다. */
  const formatCount = (value) => Number(value).toLocaleString();
  /** 산책 날짜를 화면에 표시할 요일로 변환한다. */
  const getDayLabel = (year, month, date) => {
    const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
    const dayIndex = new Date(year, month - 1, date).getDay();
    return dayLabels[dayIndex];
  };

  /** 선택한 반려동물을 삭제하고 마이페이지로 돌아간다. */
  const handleDeletePet = async () => {
    if (!pet?.id || isDeletingPet) return;

    try {
      setIsDeletingPet(true);
      await deleteApiData(`/api/pets/${pet.id}`);
      navigate("/mypage", { replace: true });
    } catch {
      alert("반려동물 정보를 삭제하지 못했습니다.");
    } finally {
      setIsDeletingPet(false);
    }
  };

  useEffect(() => {
    if (!pet?.id) return;

    let isActive = true;

    /** 선택한 반려동물의 산책 기록을 조회해 화면에 반영한다. */
    const loadWalkRecords = async () => {
      try {
        setIsWalkRecordsLoading(true);
        setWalkRecordsErrorMessage("");

        const walkData = await fetchApiData("/api/walks", { petId: pet.id });

        if (!isActive) return;

        setWalkRecords(
          (walkData?.walks || []).map((walk) => normalizeWalk(walk, pet)),
        );
      } catch {
        if (isActive) {
          setWalkRecordsErrorMessage("산책 정보를 불러올 수 없습니다.");
        }
      } finally {
        if (isActive) {
          setIsWalkRecordsLoading(false);
        }
      }
    };

    loadWalkRecords();

    return () => {
      isActive = false;
    };
  }, [pet]);

  return (
    <div className="petDetail-wrapper">
      <div className="petDetail-top">
        <button
          className="petDetail-back-button"
          type="button"
          onClick={() => navigate(-1)}
        >
          <img src={PETDETAILBACK} />
        </button>
        <span>반려동물 프로필</span>
        <button
          className="petDetail-ect-button"
          type="button"
          onClick={() => setIsActionModalOpen((prev) => !prev)}
        >
          <img className="petDetail-ect" src={PETDETAILECT} />
        </button>

        {isActionModalOpen && (
          <div className="petDetail-action-modal">
            <button
              className="petDetail-action-item"
              type="button"
              onClick={() =>
                navigate("/pet/register", { state: { entry: "edit", pet } })
              }
            >
              <span>수정</span>
              <img src={PETDETAILEDIT} />
            </button>
            <button
              className="petDetail-action-item"
              type="button"
              onClick={() => {
                setIsActionModalOpen(false);
                setIsDeleteConfirmOpen(true);
              }}
              disabled={isDeletingPet}
            >
              <span>삭제</span>
              <img src={PETDETAILTRASH} />
            </button>
          </div>
        )}
      </div>

      {isDeleteConfirmOpen && (
        <div className="petDetail-delete-overlay">
          <div className="petDetail-delete-modal">
            <div className="petDetail-delete-icon">
              <img src={PETDETAILTRASH} alt="" />
            </div>
            <strong>정말 삭제하시겠어요?</strong>
            <p>삭제 후에는 되돌릴 수 없어요.</p>
            <button
              className="petDetail-delete-cancel"
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeletingPet}
            >
              취소
            </button>
            <button
              className="petDetail-delete-submit"
              type="button"
              onClick={handleDeletePet}
              disabled={isDeletingPet}
            >
              {isDeletingPet ? "삭제 중" : "삭제"}
            </button>
          </div>
        </div>
      )}

      {pet && (
        <>
          <div className="petDetail-profile">
            <div className="petDetail-profile-top">
              <img
                className="petDetail-sex"
                src={pet.sex === "male" ? PETDETAILMALE : PETDETAILFEMALE}
                alt={pet.sex}
              />
              <span>{pet.neuter ? "중성화 완료" : "중성화 미완료"}</span>
            </div>

            <div className="petDetail-profile-middle">
              <img
                className="petDetail-pet-img"
                src={petProfileImg}
                alt={pet.name}
              />
              <strong>
                {pet.name} ({pet.age}
                살)
              </strong>
              <span>{pet.breed}</span>
              <span className="petDetail-profile-middle-weight">
                {pet.weight}kg
              </span>
            </div>

            <div className="petDetail-profile-bottom">
              <span className="petDetail-section-title">알러지 정보</span>
              <div className="petDetail-profile-bottom-allergic">
                {pet.allergic?.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>

              <span className="petDetail-section-title">특이사항</span>
              <span className="petDetail-note">{pet.note}</span>
            </div>
          </div>

          {shouldShowWalkRecords && (
          <div className="petDetail-records">
            <div className="petDetail-records-section">
              <span>{pet.name}의 활동기록이에요!</span>
              <img src={HOMEPAW} />
            </div>

            {isWalkRecordsLoading ? (
              <div className="petDetail-records-state">산책 정보를 불러오는 중입니다.</div>
            ) : walkRecordsErrorMessage ? (
              <div className="petDetail-records-state">
                산책 정보를 불러올 수 없습니다.
              </div>
            ) : (
              <div className="petDetail-records-list">
                {walkRecords.map((walked, index) => (
                  <div
                    className="petDetail-records-item"
                    key={
                      walked.id ||
                      `${walked.petId}-${walked.year}-${walked.month}-${walked.date}-${index}`
                    }
                  >
                    <div className="petDetail-records-item-content">
                      <span className="petDetail-records-item-day">
                        {walked.year}년 {padTwo(walked.month)}월{" "}
                        {padTwo(walked.date)}일(
                        {getDayLabel(walked.year, walked.month, walked.date)})
                      </span>
                      <span className="petDetail-records-item-time">
                        {padTwo(walked.hour)}시간 {padTwo(walked.minute)}분
                      </span>
                      <div className="petDetail-records-item-distance">
                        <span>{walked.distance}</span>
                        <span>km</span>
                      </div>
                      <div className="petDetail-records-item-count">
                        <img src={WALKBROWNPAW} />
                        <span>{formatCount(walked.count)}젤리</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </>
      )}
    </div>
  );
}
