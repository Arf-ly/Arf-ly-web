import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import BottomTabBar from "../../components/BottomTabBar.jsx";
import PhotoSourceSheet from "../../components/PhotoSourceSheet.jsx";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

import HOMELOGO from "../../assets/home/home_logo.svg";
import HOMEBELL from "../../assets/home/home_bell.svg";
import HOMEMALE from "../../assets/home/home_male.svg";
import HOMEFEMALE from "../../assets/home/home_female.svg";
import HOMEPAW from "../../assets/home/home_paw.svg";
import HOMEWALKEDBUTTON from "../../assets/home/home_walked_button.svg";
import HOMEBROWNPAW from "../../assets/home/home_brown_paw.svg";
import HOMEPINKARROW from "../../assets/home/home_pink_arrow.svg";
import HOMESTAR from "../../assets/home/home_star.svg";
import HOMEDOWNARROW from "../../assets/home/home_down_arrow.svg";
import HOMEPREVIOUS200 from "../../assets/home/home_previous_200.svg";
import HOMEPREVIOUS500 from "../../assets/home/home_previous_500.svg";
import HOMENEXT200 from "../../assets/home/home_next_200.svg";
import HOMENEXT500 from "../../assets/home/home_next_500.svg";
import HOMENEXTBROWN from "../../assets/home/home_next_brown.svg";
import HOMEDOG from "../../assets/home/home_dog.svg";
import HOMECAT from "../../assets/home/home_cat.svg";

const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];
const weekKeys = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const dayKeyByDateIndex = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const formatDateForQuery = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getAgeFromBirth = (birth) => {
  if (!birth) return 0;

  const birthYear = Number(String(birth).slice(0, 4));
  if (!Number.isFinite(birthYear)) return 0;

  return Math.max(new Date().getFullYear() - birthYear, 0);
};

const normalizeSex = (sex) =>
  String(sex).toUpperCase() === "FEMALE" ? "female" : "male";

const getDefaultPetImage = ({ species, breed }) => {
  const petTypeText = `${species || ""} ${breed || ""}`.toUpperCase();

  if (petTypeText.includes("CAT")) {
    return HOMECAT;
  }

  return HOMEDOG;
};

const getWeekValues = (week, fieldName) =>
  weekKeys.map((key) => Number(week?.[key]?.[fieldName] ?? 0));

const getTodayWeekValue = (week, fieldName) => {
  const todayKey = dayKeyByDateIndex[new Date().getDay()];
  return Number(week?.[todayKey]?.[fieldName] ?? 0);
};

const getReportWeek = (data) => data?.week || data?.pet?.week || {};

const getDiagnosisList = (data) => {
  const list = data?.diagnosis || data?.diagnoses || data?.data || [];
  return Array.isArray(list) ? list : [];
};

const getAuthHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};
};

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

const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

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
  const rawParts = text.split(`--${boundary}`);

  rawParts.forEach((rawPart) => {
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

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartFormData(response);
  }

  return response.json();
};

const normalizeDiagnosis = (diagnosis, fallbackPetId) => {
  const createdAt = diagnosis.createdAt ? new Date(diagnosis.createdAt) : null;
  const isValidDate = createdAt && !Number.isNaN(createdAt.getTime());
  const reportId = diagnosis.reportId ?? diagnosis.id;
  const petId = diagnosis.petId ?? fallbackPetId;

  return {
    id: `${petId || "unknown"}-${reportId || createdAt?.getTime() || ""}`,
    reportId,
    petId,
    createdAt: diagnosis.createdAt,
    month: isValidDate ? createdAt.getMonth() + 1 : "",
    day: isValidDate ? createdAt.getDate() : "",
    disease: diagnosis.diseaseName,
    petName: diagnosis.petName,
    petBreed: diagnosis.breedName,
    petAge: getAgeFromBirth(diagnosis.birthYear),
    diseaseImg: diagnosis.imageUrl,
  };
};

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [pets, setPets] = useState([]);
  const [diagnosesByPetId, setDiagnosesByPetId] = useState({});
  const [allDiagnoses, setAllDiagnoses] = useState([]);
  const [isHomeLoading, setIsHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState("");
  const [isPetSelectOpen, setIsPetSelectOpen] = useState(false);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const currentPet = pets[currentPetIndex];
  const [selectedRecordPetIndex, setSelectedRecordPetIndex] = useState(null);
  const selectedRecordPetName =
    selectedRecordPetIndex === null
      ? "전체"
      : pets[selectedRecordPetIndex]?.name;
  const padTwo = (value) => String(value).padStart(2, "0");
  const visibleCheckRecords =
    selectedRecordPetIndex === null
      ? allDiagnoses
      : diagnosesByPetId[pets[selectedRecordPetIndex]?.id] || [];
  const maxWeekWalked = Math.max(...(currentPet?.weekWalked || []), 1);
  const todayWeekIndex = weekKeys.indexOf(
    dayKeyByDateIndex[new Date().getDay()],
  );
  const isFirstPet = currentPetIndex === 0;
  const isLastPet = currentPetIndex === pets.length - 1;
  const [isDiagnosisPetSheetOpen, setIsDiagnosisPetSheetOpen] = useState(false);
  const [selectedDiagnosisPet, setSelectedDiagnosisPet] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  const handleImportChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedImageTypes = ["image/png", "image/jpeg"];
    if (!allowedImageTypes.includes(file.type)) {
      alert("PNG 또는 JPEG 형식의 사진만 가져올 수 있습니다.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      navigate("/diseasecheck", {
        state: {
          pet: selectedDiagnosisPet,
          image: reader.result,
        },
      });
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        setPets([]);
        setAllDiagnoses([]);
        setDiagnosesByPetId({});
        setHomeError("로그인이 필요합니다.");
        setIsHomeLoading(false);
        return;
      }

      try {
        setIsHomeLoading(true);
        setHomeError("");

        const today = formatDateForQuery(new Date());
        const petsData = await fetchApiData("/api/pets");
        const petSummaries = Array.isArray(petsData?.pets) ? petsData.pets : [];

        const nextPets = await Promise.all(
          petSummaries.map(async (petSummary) => {
            const petId = petSummary.petId;
            const [detailData, stepsData, distanceData] = await Promise.all([
              fetchApiData(`/api/pets/${petId}`),
              fetchApiData(`/api/pets/${petId}/report/steps`, { date: today }),
              fetchApiData(`/api/pets/${petId}/report/distance`, {
                date: today,
              }),
            ]);

            const detail = detailData?.pet || detailData;
            const stepsWeek = getReportWeek(stepsData);
            const distanceWeek = getReportWeek(distanceData);

            const fallbackImage = getDefaultPetImage({
              species: detail.species,
              breed: detail.breed,
            });

            return {
              id: petId,
              petId,
              img:
                petSummary.profileImageUrl ||
                detail.profileImageUrl ||
                fallbackImage,
              sex: normalizeSex(detail.sex),
              neuter: Boolean(detail.neutered),
              name: detail.name || petSummary.name,
              breed: detail.breed,
              species: detail.species,
              age: getAgeFromBirth(detail.birth),
              weight: detail.weight ?? 0,
              allergic: Array.isArray(detail.allergies) ? detail.allergies : [],
              note: detail.note || "",
              todayWalked: getTodayWeekValue(stepsWeek, "activityScore"),
              weekWalked: getWeekValues(stepsWeek, "activityScore"),
              recentDistance: getTodayWeekValue(distanceWeek, "distanceKm"),
              weekDistance: getWeekValues(distanceWeek, "distanceKm"),
            };
          }),
        );

        const [allDiagnosisData, petDiagnosisEntries] = await Promise.all([
          fetchApiData("/api/pets/diagnoses", { size: 5 }),
          Promise.all(
            petSummaries.map(async (petSummary) => {
              const diagnosisData = await fetchApiData("/api/pets/diagnoses", {
                petId: petSummary.petId,
                size: 5,
              });

              return [
                petSummary.petId,
                getDiagnosisList(diagnosisData).map((diagnosis) =>
                  normalizeDiagnosis(diagnosis, petSummary.petId),
                ),
              ];
            }),
          ),
        ]);

        setPets(nextPets);
        setAllDiagnoses(
          getDiagnosisList(allDiagnosisData).map((diagnosis) =>
            normalizeDiagnosis(diagnosis, diagnosis.petId),
          ),
        );
        setDiagnosesByPetId(Object.fromEntries(petDiagnosisEntries));
        setCurrentPetIndex(0);
        setSelectedRecordPetIndex(null);
        setSelectedDiagnosisPet(null);
      } catch (error) {
        setPets([]);
        setAllDiagnoses([]);
        setDiagnosesByPetId({});
        setHomeError("홈 정보를 불러오지 못했습니다.");
      } finally {
        setIsHomeLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (isHomeLoading) {
    return (
      <div className="home-wrapper">
        <div className="home-top">
          <img src={HOMELOGO} alt="ARFLY" />
          <img src={HOMEBELL} alt="" />
        </div>
        <div className="home-loading-overlay">
          <div className="home-loading-spinner" />
        </div>
        <BottomTabBar />
      </div>
    );
  }

  if (homeError) {
    return (
      <div className="home-wrapper">
        <div className="home-top">
          <img src={HOMELOGO} alt="ARFLY" />
          <img src={HOMEBELL} alt="" />
        </div>
        <div className="home-empty-state">{homeError}</div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="home-wrapper">
      <div className="home-top">
        <img src={HOMELOGO} />
        <img src={HOMEBELL} />
      </div>
      <div className="home-middle">
        {currentPet && (
          <div className="home-pet-profile">
            <div className="home-pet-profile-top">
              <>
                <button
                  className="home-pet-profile-arrow left"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();

                    if (!isFirstPet) {
                      setCurrentPetIndex(currentPetIndex - 1);
                    }
                  }}
                >
                  <img
                    src={isFirstPet ? HOMEPREVIOUS200 : HOMEPREVIOUS500}
                    alt="이전"
                  />
                </button>

                <button
                  className="home-pet-profile-arrow right"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLastPet) {
                      setCurrentPetIndex(currentPetIndex + 1);
                    }
                  }}
                >
                  <img src={isLastPet ? HOMENEXT200 : HOMENEXT500} alt="다음" />
                </button>
              </>
              <img className="home-pet-image" src={currentPet.img} />
              <div className="home-pet-profile-detail">
                <div className="home-pet-detail-top">
                  <img
                    src={currentPet.sex === "male" ? HOMEMALE : HOMEFEMALE}
                  />
                  <span>
                    {currentPet.neuter ? "중성화 완료" : "중성화 미완료"}
                  </span>
                </div>
                <div className="home-pet-detail-middle">
                  <span className="home-pet-name">{currentPet.name}</span>
                </div>
                <div className="home-pet-detail-bottom">
                  <span className="home-pet-breed">{currentPet.breed}</span>
                  <span>
                    {currentPet.age}살 | {currentPet.weight}kg
                  </span>
                </div>
              </div>
            </div>
            <div className="home-pet-profile-bottom">
              <div className="home-walk">
                <p className="home-today-walked">
                  오늘 총{" "}
                  <strong>
                    {Number(currentPet.todayWalked).toLocaleString()}
                  </strong>
                  젤리만큼 활동했어요!
                </p>
                <img src={HOMEPAW} />
              </div>
              <div
                className="home-pet-profile-chart"
                onClick={() =>
                  navigate(`/weeklyactive/${currentPet.id}`, {
                    state: { pet: currentPet },
                  })
                }
              >
                <div className="home-chart-bars">
                  {currentPet.weekWalked.map((walked, index) => {
                    const barHeight = `${Math.max((walked / maxWeekWalked) * 100, 8)}%`;
                    return (
                      <div className="home-chart-bar-wrap" key={`bar-${index}`}>
                        <div
                          className="home-chart-bar"
                          style={{ height: barHeight }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="home-chart-label-row">
                  {weekLabels.map((label, index) => (
                    <span
                      className={`home-chart-label ${
                        index === todayWeekIndex
                          ? "today"
                          : index === 6
                            ? "sunday"
                            : ""
                      }`}
                      key={`${label}-${index}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="home-walked-and-disease">
          <div className="home-pet-walked">
            <div className="home-pet-walked-top">
              <span>최근 산책 기록</span>
              <button
                type="button"
                onClick={() => navigate("/walkedresult", { state: { pets } })}
              >
                <img src={HOMEWALKEDBUTTON} />
              </button>
            </div>
            {currentPet ? (
              <>
                <span className="home-pet-distance">
                  {currentPet.recentDistance}
                </span>
                <span className="home-pet-distance-unit">km</span>
                <div className="home-pet-recent-walk">
                  <img src={HOMEBROWNPAW} />
                  <span>
                    {Number(currentPet.todayWalked).toLocaleString()}젤리
                  </span>
                </div>
              </>
            ) : (
              <p className="home-pet-walked-empty">
                {
                  "기록이 없어요!\n기기를 사용해서 반려동물의\n운동량을 체크해봐요!"
                }
              </p>
            )}
          </div>
          <div className="home-pet-disease-check">
            <p>피부 질환 체크하기</p>
            <span className="home-pet-disease-check-span">
              {"사진 한장으로 빠르게\nAI가 피부 질환을 진단해요!"}
            </span>
            <div
              className="home-pet-go-check"
              onClick={() => setIsDiagnosisPetSheetOpen(true)}
            >
              <span>진단하기</span>
              <img src={HOMEPINKARROW} />
            </div>
          </div>
        </div>
        <div className="home-iot">
          <p className="home-iot-first-p">
            {"반려동물을 등록하고\n활동량 측정기를 받아보세요!"}
          </p>
          <p className="home-iot-second-p">활동량 측정기 더 알아보기 →</p>
        </div>
      </div>
      <div className="home-middle-line"></div>
      <div className="home-middle">
        <div className="home-ai-record">
          <div className="home-ai-record-tab">
            <div className="home-ai-record-tab-text">
              <img src={HOMESTAR} />
              <span>AI 스마트 진단 리스트</span>
            </div>
            <div
              className="home-pet-select"
              onClick={() => setIsPetSelectOpen(true)}
            >
              <span>{selectedRecordPetName}</span>
              <img src={HOMEDOWNARROW} />
            </div>
            {isPetSelectOpen && (
              <div
                className="home-pet-select-overlay"
                onClick={() => setIsPetSelectOpen(false)}
              >
                <div
                  className="home-pet-select-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="home-pet-select-modal-item"
                    type="button"
                    onClick={() => {
                      setSelectedRecordPetIndex(null);
                      setIsPetSelectOpen(false);
                    }}
                  >
                    <span className="home-pet-select-modal-all">전체</span>
                    {selectedRecordPetIndex === null && (
                      <span className="home-pet-select-modal-check">✓</span>
                    )}
                  </button>
                  {pets.map((pet, index) => {
                    const isSelected = selectedRecordPetIndex === index;
                    return (
                      <button
                        className="home-pet-select-modal-item"
                        type="button"
                        key={`${pet.name}-${index}`}
                        onClick={() => {
                          setSelectedRecordPetIndex(index);
                          setIsPetSelectOpen(false);
                        }}
                      >
                        <div className="home-pet-select-modal-pet">
                          <img src={pet.img} alt={pet.name} />
                          <span>{pet.name}</span>
                        </div>

                        {isSelected && (
                          <span className="home-pet-select-modal-check">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {visibleCheckRecords.length > 0 ? (
            <div className="home-ai-record-list">
              {visibleCheckRecords.map((record, index) => (
                <div
                  className="home-ai-record-item"
                  key={
                    record.id ||
                    `${record.petName}-${record.month}-${record.day}-${index}`
                  }
                  onClick={() => {
                    if (!record.reportId) return;
                    const recordPet = pets.find(
                      (pet) => pet.id === record.petId,
                    );

                    navigate("/diseasecheck", {
                      state: {
                        reportId: record.reportId,
                        petId: record.petId,
                        pet: recordPet,
                        diagnosis: record,
                      },
                    });
                  }}
                >
                  <div className="home-ai-record-image">
                    {record.diseaseImg && (
                      <img src={record.diseaseImg} alt={record.disease} />
                    )}
                  </div>
                  <div className="home-ai-record-content">
                    <span className="home-ai-record-date">
                      {padTwo(record.month)}.{padTwo(record.day)}
                    </span>
                    <span className="home-ai-record-disease">
                      {record.disease}
                    </span>
                    <span className="home-ai-record-pet-info">
                      {record.petName} | {record.petBreed} | {record.petAge}살
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="home-without-record-list">
              <div className="home-without-record-text">
                <strong>첫 진단을 시작해보세요!</strong>
                <span>사진 한 장으로 피부질환을 알려드릴게요</span>
              </div>
              <button className="home-without-record-button" type="button">
                <img
                  src={HOMENEXTBROWN}
                  alt="진단 시작"
                  onClick={() => setIsDiagnosisPetSheetOpen(true)}
                />
              </button>
            </div>
          )}
        </div>
      </div>
      {isDiagnosisPetSheetOpen && (
        <div
          className="home-diagnosis-overlay"
          onClick={() => setIsDiagnosisPetSheetOpen(false)}
        >
          <div
            className="home-diagnosis-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="home-diagnosis-title">어떤 친구를 진단할까요?</p>

            <div className="home-diagnosis-pet-list">
              {pets.map((pet) => {
                const isSelected = selectedDiagnosisPet?.id === pet.id;

                return (
                  <button
                    type="button"
                    key={pet.id}
                    className={`home-diagnosis-pet-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedDiagnosisPet(pet)}
                  >
                    <div className="home-diagnosis-card-top">
                      <img
                        className="home-diagnosis-sex"
                        src={pet.sex === "male" ? HOMEMALE : HOMEFEMALE}
                        alt={pet.sex}
                      />
                      <span className="home-diagnosis-is-neuter">
                        {pet.neuter ? "중성화 완료" : "중성화 미완료"}
                      </span>
                    </div>

                    <div className="home-diagnosis-card-main">
                      <img
                        className="home-diagnosis-pet-img"
                        src={pet.img}
                        alt={pet.name}
                      />
                      <div>
                        <strong>{pet.name}</strong>
                        <span className="home-diagnosis-breed">
                          {pet.breed}
                        </span>
                        <span className="home-diagnosis-age-weight">
                          {pet.age}세 | {pet.weight}kg
                        </span>
                      </div>
                    </div>

                    <div className="home-diagnosis-allergy-list">
                      {pet.allergic?.slice(0, 3).map((item) => (
                        <span key={item}>{item}</span>
                      ))}

                      {pet.allergic?.length > 3 && <span>...</span>}
                    </div>
                    <span
                      className="home-diagnosis-more-info"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/petdetail", { state: { pet } });
                      }}
                    >
                      자세히 보기 &gt;{" "}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                className="home-diagnosis-add-card"
                onClick={() => {
                  setSelectedDiagnosisPet(null);
                  setIsDiagnosisPetSheetOpen(false);
                  navigate("/pet/register", { state: { entry: "mypage-add" } })
                }}
              >
                <span>+</span>
                <p>
                  다른 친구를
                  <br />
                  진단하고 싶어요!
                </p>
              </button>
            </div>

            <button
              type="button"
              className="home-diagnosis-complete"
              disabled={!selectedDiagnosisPet}
              onClick={() => {
                if (!selectedDiagnosisPet) return;
                setIsDiagnosisPetSheetOpen(false);
                setIsPhotoModalOpen(true);
              }}
            >
              완료
            </button>
          </div>
        </div>
      )}
      {isPhotoModalOpen && (
        <PhotoSourceSheet
          onClose={() => setIsPhotoModalOpen(false)}
          onCapture={() =>
            navigate("/camera", { state: { pet: selectedDiagnosisPet } })
          }
          onImport={handleImportClick}
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: "none" }}
        onChange={handleImportChange}
      />
      <BottomTabBar></BottomTabBar>
    </div>
  );
}
