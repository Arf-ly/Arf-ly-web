import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./WeeklyActive.css";

import WEEKLYBACK from "../../assets/home/weeklyActive/weeklyActive_back.svg";
import HOMEDOG from "../../assets/home/home_dog.svg";
import HOMECAT from "../../assets/home/home_cat.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];
const koreanDayLabels = ["월", "화", "수", "목", "금", "토", "일"];
const weekKeys = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const CHART_HEIGHT = 500;
const TOOLTIP_TOP = -96;
const TOOLTIP_HEIGHT = 54;

/** 주어진 날짜가 속한 주의 월요일 자정을 구한다. */
function getMonday(date) {
  const copiedDate = new Date(date);
  const day = copiedDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  copiedDate.setDate(copiedDate.getDate() + diff);
  copiedDate.setHours(0, 0, 0, 0);

  return copiedDate;
}

/** 원본 날짜를 유지하면서 지정한 일수만큼 이동한 날짜를 반환한다. */
function addDays(date, days) {
  const copiedDate = new Date(date);
  copiedDate.setDate(copiedDate.getDate() + days);
  return copiedDate;
}

/** 원본 날짜를 유지하면서 지정한 주수만큼 이동한 날짜를 반환한다. */
function addWeeks(date, weeks) {
  return addDays(date, weeks * 7);
}

/** 날짜를 한국어 연월일 형식으로 변환한다. */
function formatKoreanDate(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/** 조회 날짜를 API에서 사용하는 연월일 문자열로 변환한다. */
function formatDateForQuery(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** 월요일부터 일요일까지의 날짜 범위를 한국어로 표시한다. */
function formatWeekRange(mondayDate) {
  const sundayDate = addDays(mondayDate, 6);
  return `${formatKoreanDate(mondayDate)} ~ ${formatKoreanDate(sundayDate)}`;
}

/** 현재 주는 오늘 날짜를, 이전 주는 해당 주 월요일을 조회 기준으로 사용한다. */
function getQueryDate(weekOffset, mondayDate) {
  if (weekOffset === 0) {
    return formatDateForQuery(new Date());
  }

  return formatDateForQuery(mondayDate);
}

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

/** 선택한 반려동물의 기준 날짜에 해당하는 주간 보고서를 조회한다. */
const fetchReport = async ({ petId, type, date }) => {
  const accessToken = localStorage.getItem("accessToken");
  const endpoint =
    type === "steps"
      ? `/api/pets/${petId}/report/steps`
      : `/api/pets/${petId}/report/distance`;
  const params = new URLSearchParams({ date });
  const response = await fetch(`${API_BASE_URL}${endpoint}?${params}`, {
    method: "GET",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      Accept: "application/json, multipart/form-data",
    },
  });

  if (!response.ok) {
    throw new Error("주간 활동 정보를 불러오지 못했습니다.");
  }

  return readApiResponse(response);
};

/** 주간 보고서에서 선택한 지표의 요일별 값을 추출한다. */
const getReportValues = (week, fieldName) =>
  weekKeys.map((key) => Number(week?.[key]?.[fieldName] ?? 0));

/** 반려동물 종류에 맞는 기본 프로필 이미지를 반환한다. */
const getDefaultPetImage = ({ species, breed }) => {
  const petTypeText = `${species || ""} ${breed || ""}`.toUpperCase();

  if (petTypeText.includes("CAT")) {
    return HOMECAT;
  }

  return HOMEDOG;
};

/** 주간 보고서 응답을 반려동물 정보와 활동 지표로 정리한다. */
const normalizeReport = (data, type, fallbackPet) => {
  const pet = data?.pet || {};
  const fieldName = type === "steps" ? "activityScore" : "distanceKm";
  const averageKey =
    type === "steps" ? "averageActivityScore" : "averageDistanceKm";
  const alternativeAverageKey = "averageDistancekm";
  const values = getReportValues(data?.week, fieldName);
  const fallbackImage = getDefaultPetImage({
    species: fallbackPet?.species || pet.species,
    breed: pet.breed || fallbackPet?.breed,
  });

  return {
    pet: {
      id: fallbackPet?.id,
      img: pet.profileImage || fallbackPet?.img || fallbackImage,
      name: pet.aiName || fallbackPet?.name || "",
      breed: pet.breed || fallbackPet?.breed || "",
      age: pet.age ?? fallbackPet?.age ?? 0,
      species: fallbackPet?.species || pet.species,
    },
    values,
    average:
      Number(data?.[averageKey] ?? data?.[alternativeAverageKey]) ||
      values.reduce((sum, value) => sum + value, 0) / values.length,
  };
};

/** 주간 활동 지표를 표시하고 조회 주와 지표, 선택 요일을 관리한다. */
export default function WeeklyActive() {
  const navigate = useNavigate();
  const { petId } = useParams();
  const { state } = useLocation();
  const fallbackPet = state?.pet;
  const [isWalkedOpen, setIsWalkedOpen] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [reportCache, setReportCache] = useState({});
  const [currentPet, setCurrentPet] = useState(fallbackPet || null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const didFetchInitialReports = useRef(false);
  const currentWeekMonday = getMonday(new Date());
  const visibleWeekMonday = addWeeks(currentWeekMonday, weekOffset);
  const queryDate = getQueryDate(weekOffset, visibleWeekMonday);
  const weekRangeText = formatWeekRange(visibleWeekMonday);
  const isLatestWeek = weekOffset === 0;
  const activeType = isWalkedOpen ? "steps" : "distance";
  const activeCacheKey = `${activeType}:${queryDate}`;
  const activeReport = reportCache[activeCacheKey];
  const activeValues = activeReport?.values || [0, 0, 0, 0, 0, 0, 0];
  const activeUnit = isWalkedOpen ? "젤리" : "km";
  const maxValue = Math.max(...activeValues, 1);
  const middleValue = maxValue / 2;
  const activeAverage = activeReport?.average ?? 0;
  const selectedValue =
    selectedDayIndex === null ? null : activeValues[selectedDayIndex];
  const selectedBarPercent =
    selectedValue === null ? 0 : Math.max((selectedValue / maxValue) * 100, 8);
  const selectedBarTop = CHART_HEIGHT * (1 - selectedBarPercent / 100);
  const tooltipLineHeight = selectedBarTop - TOOLTIP_TOP - TOOLTIP_HEIGHT;
  const selectedTooltipLeft =
    selectedDayIndex === null
      ? "0px"
      : `calc(44px + ((100% - 44px) / 7) * ${selectedDayIndex} + ((100% - 44px) / 14))`;
  const selectedDate =
    selectedDayIndex === null
      ? null
      : addDays(visibleWeekMonday, selectedDayIndex);
  /** 선택한 활동 지표에 맞는 자릿수로 수치를 표시한다. */
  const formatValue = (value) => {
    if (isWalkedOpen) {
      return Math.round(value).toLocaleString();
    }
    return Number(value.toFixed(1)).toString();
  };

  useEffect(() => {
    if (!petId) return;

    let isActive = true;

    /** 지정한 주의 활동 보고서를 조회하고 유효한 화면에 결과를 반영한다. */
    const loadReport = async (type) => {
      const cacheKey = `${type}:${queryDate}`;
      if (reportCache[cacheKey]) return;

      const reportData = await fetchReport({
        petId,
        type,
        date: queryDate,
      });
      const normalizedReport = normalizeReport(reportData, type, fallbackPet);

      if (!isActive) return;

      setReportCache((prev) => ({
        ...prev,
        [cacheKey]: normalizedReport,
      }));
      setCurrentPet((prev) => normalizedReport.pet || prev);
    };

    /** 최초에는 걸음 수와 거리 보고서를 함께 조회하고 이후에는 선택한 지표를 조회한다. */
    const loadReports = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        if (!didFetchInitialReports.current) {
          didFetchInitialReports.current = true;
          await Promise.all([loadReport("steps"), loadReport("distance")]);
          return;
        }

        await loadReport(activeType);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      isActive = false;
    };
  }, [activeType, fallbackPet, petId, queryDate, reportCache]);

  /** 표시할 활동 지표를 변경하고 선택한 요일을 초기화한다. */
  const handleSelectTab = (nextIsWalkedOpen) => {
    setIsWalkedOpen(nextIsWalkedOpen);
    setSelectedDayIndex(null);
  };
  /** 차트에서 상세 수치를 볼 요일을 선택하거나 기존 선택을 해제한다. */
  const handleSelectDay = (index) => {
    setSelectedDayIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  if (!currentPet && isLoading) {
    return (
      <div className="weeklyActive-wrapper">
        <div className="weeklyActive-top">
          <button
            className="weeklyActive-back-button"
            type="button"
            onClick={() => navigate(-1)}
          >
            <img src={WEEKLYBACK} alt="뒤로가기" />
          </button>
          <span>주간 활동 리포트</span>
        </div>
        <div className="weeklyActive-state">
          주간 활동 정보를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (!currentPet && !isLoading) {
    return (
      <div className="weeklyActive-wrapper">펫 정보를 찾을 수 없습니다.</div>
    );
  }

  return (
    <div className="weeklyActive-wrapper">
      <div className="weeklyActive-top">
        <button
          className="weeklyActive-back-button"
          type="button"
          onClick={() => navigate(-1)}
        >
          <img src={WEEKLYBACK} alt="뒤로가기" />
        </button>
        <span>주간 활동 리포트</span>
      </div>

      <div className="weeklyActive-middle">
        <div className="weeklyActive-pet-selection">
          <img
            className="weeklyActive-pet-image"
            src={currentPet.img}
            alt={currentPet.name}
          />
          <div className="weeklyActive-pet-profile">
            <span className="weeklyActive-pet-name">{currentPet.name}</span>
            <span className="weeklyActive-pet-breed">{currentPet.breed}</span>
            <span className="weeklyActive-pet-age">{currentPet.age}살</span>
          </div>
        </div>
        <div className="weeklyActive-active-tabs">
          <button
            type="button"
            className={isWalkedOpen ? "active" : ""}
            onClick={() => handleSelectTab(true)}
          >
            활동 점수
          </button>
          <button
            type="button"
            className={!isWalkedOpen ? "active" : ""}
            onClick={() => handleSelectTab(false)}
          >
            산책 거리
          </button>
        </div>
        {errorMessage && (
          <div className="weeklyActive-state">{errorMessage}</div>
        )}
        <div className="weeklyActive-report">
          <div className="weeklyActive-week-header">
            <button
              type="button"
              className="weeklyActive-week-arrow"
              onClick={() => {
                setWeekOffset(weekOffset - 1);
                setSelectedDayIndex(null);
              }}
            >
              ‹
            </button>
            <span>{weekRangeText}</span>
            <button
              type="button"
              className={`weeklyActive-week-arrow ${isLatestWeek ? "disabled" : ""}`}
              onClick={() => {
                if (!isLatestWeek) {
                  setWeekOffset(weekOffset + 1);
                  setSelectedDayIndex(null);
                }
              }}
            >
              ›
            </button>
          </div>
          <div className="weeklyActive-average">
            <span>평균</span>
            <strong>{formatValue(Number(activeAverage))}</strong>
            <em>{activeUnit}</em>
          </div>
          <div className="weeklyActive-chart">
            {selectedDayIndex !== null && (
              <div
                className="weeklyActive-bar-tooltip"
                style={{
                  left: selectedTooltipLeft,
                  "--line-height": `${Math.max(tooltipLineHeight, 12)}px`,
                }}
              >
                <span className="weeklyActive-bar-tooltip-date">
                  {formatKoreanDate(selectedDate)}{" "}
                  {koreanDayLabels[selectedDayIndex]}요일
                </span>
                <span className="weeklyActive-bar-tooltip-value">
                  {formatValue(selectedValue)}
                  <em>{activeUnit}</em>
                </span>
              </div>
            )}
            <div className="weeklyActive-chart-grid">
              <span>{formatValue(maxValue)}</span>
              <span>{formatValue(middleValue)}</span>
              <span>0</span>
            </div>
            <div className="weeklyActive-chart-bars">
              {activeValues.map((value, index) => {
                const barHeight = `${Math.max((value / maxValue) * 100, 8)}%`;
                const isSelected = selectedDayIndex === index;
                const isDimmed = selectedDayIndex !== null && !isSelected;

                return (
                  <button
                    type="button"
                    className={`weeklyActive-chart-bar ${isSelected ? "selected" : ""} ${
                      isDimmed ? "dimmed" : ""
                    }`}
                    style={{ height: barHeight }}
                    key={`${weekLabels[index]}-${index}`}
                    onClick={() => handleSelectDay(index)}
                  />
                );
              })}
            </div>
          </div>
          <div className="weeklyActive-chart-labels">
            {weekLabels.map((label, index) => (
              <button
                type="button"
                className={`${selectedDayIndex === index ? "selected" : ""} ${
                  index === 5 ? "saturday" : index === 6 ? "sunday" : ""
                }`}
                key={`${label}-${index}`}
                onClick={() => handleSelectDay(index)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
