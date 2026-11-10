import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./DiseaseCheck.css";

import DISEASECHECKBACK from "../../assets/home/diseaseCheck/diseaseCheck_back.svg";
import DISEASECHECKSTAR from "../../assets/home/diseaseCheck/diseaseCheck_star.svg";
import DISEASECHECKBOX from "../../assets/home/diseaseCheck/diseaseCheck_checkbox.svg";
import DISEASECHECKPERSON from "../../assets/home/diseaseCheck/diseaseCheck_person.svg";
import DISEASECHECKMARK from "../../assets/home/diseaseCheck/diseaseCheck_mark.svg";
import DISEASECHECKMALE from "../../assets/home/diseaseCheck/diseaseCheck_male.svg";
import DISEASECHECKFEMALE from "../../assets/home/diseaseCheck/diseaseCheck_female.svg";
import DISEASECHECKMAP from "../../assets/home/diseaseCheck/diseaseCheck_map.svg";
import HOMEDOG from "../../assets/home/home_dog.svg";
import HOMECAT from "../../assets/home/home_cat.svg";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

const weekLabels = ["일", "월", "화", "수", "목", "금", "토"];

/** 출생 연도에서 현재 연도 기준의 나이를 계산한다. */
const getAgeFromBirth = (birth) => {
  if (!birth) return 0;

  const birthYear = Number(String(birth).slice(0, 4));
  if (!Number.isFinite(birthYear)) return 0;

  return Math.max(new Date().getFullYear() - birthYear, 0);
};

/** 날짜를 한국어 연월일 형식으로 변환한다. */
const formatKoreanDate = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");
  const weekday = weekLabels[safeDate.getDay()];

  return `${year}년 ${month}월 ${day}일 (${weekday})`;
};

/** 서버의 성별 값을 화면에서 사용하는 구분 값으로 변환한다. */
const normalizeSex = (sex) =>
  String(sex).toUpperCase() === "FEMALE" ? "female" : "male";

/** 반려동물 종류에 맞는 기본 프로필 이미지를 반환한다. */
const getDefaultPetImage = (species) =>
  String(species).toUpperCase() === "CAT" ? HOMECAT : HOMEDOG;

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

/** 반려동물의 지정된 진단 보고서를 조회한다. */
const fetchDiagnosisReport = async (reportId) => {
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetch(
    `${API_BASE_URL}/api/pets/diagnoses/${reportId}`,
    {
      method: "GET",
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        Accept: "application/json, multipart/form-data",
      },
    },
  );

  if (!response.ok) {
    throw new Error("진단 리포트를 불러오지 못했습니다.");
  }

  return readApiResponse(response);
};

/** 응답 형식에 따라 JSON 또는 multipart 본문을 해석한다. */
const readApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartFormData(response);
  }

  return response.json();
};

/** 이미지 데이터 URL을 업로드 가능한 파일로 변환한다. */
const dataUrlToFile = async (dataUrl, fileName = "diagnosis-image.png") => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = blob.type.split("/")[1] || "png";

  return new File([blob], fileName.replace(/\.[^.]+$/, `.${extension}`), {
    type: blob.type || "image/png",
  });
};

/** 선택한 반려동물과 이미지를 전송해 진단 보고서를 생성한다. */
const createDiagnosisReport = async ({ petId, image }) => {
  if (!petId) {
    throw new Error("반려동물 정보를 찾을 수 없습니다.");
  }

  if (!image) {
    throw new Error("진단할 이미지를 찾을 수 없습니다.");
  }

  const accessToken = localStorage.getItem("accessToken");
  const formData = new FormData();
  const imageFile = await dataUrlToFile(image);

  formData.append("file", imageFile);

  const response = await fetch(`${API_BASE_URL}/api/pets/${petId}/diagnoses`, {
    method: "POST",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      Accept: "application/json, multipart/form-data",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("스마트 진단에 실패했습니다.");
  }

  return readApiResponse(response);
};

/** 진단 관리 안내문을 번호별 제목과 본문으로 나눈다. */
const parseManagement = (management) => {
  if (!management) return [];

  const lines = String(management).split(/\r?\n/);
  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    const headingMatch = line.match(/^\s*(\d+)\.\s*(.*)$/);

    if (headingMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        big: `${headingMatch[1]}. ${headingMatch[2]}`.trim(),
        small: "",
      };
      return;
    }

    if (!currentSection) {
      currentSection = {
        big: "관리방법",
        small: line,
      };
      return;
    }

    currentSection.small = currentSection.small
      ? `${currentSection.small}\n${line}`
      : line;
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
};

/** 진단 보고서 생성 또는 조회 결과와 반려동물 관리 안내를 표시한다. */
export default function DiseaseCheck() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const reportId = state?.reportId;
  const statePet = state?.pet;
  const stateDiagnosis = state?.diagnosis;
  const stateImage = state?.image;
  const petId = state?.petId || statePet?.petId || statePet?.id;
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(reportId || stateImage));
  const [errorMessage, setErrorMessage] = useState("");
  const hasRequestedDiagnosis = useRef(false);

  useEffect(() => {
    if (!reportId && !stateImage) {
      setIsLoading(false);
      return;
    }

    if (hasRequestedDiagnosis.current) return;
    hasRequestedDiagnosis.current = true;

    /** 진입 정보에 따라 진단 보고서를 생성하거나 조회하고 화면에 반영한다. */
    const loadDiagnosisReport = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const reportData = reportId
          ? await fetchDiagnosisReport(reportId)
          : await createDiagnosisReport({
              petId,
              image: stateImage,
            });

        setReport(reportData);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDiagnosisReport();
  }, [petId, reportId, stateImage]);

  const formattedDate = formatKoreanDate(
    report?.createdAt || stateDiagnosis?.createdAt,
  );
  const probability = Number(report?.probability ?? 0);
  const progressProbability = Math.min(Math.max(probability, 0), 100);
  const diseaseName = report?.diseaseName || stateDiagnosis?.disease || "";
  const controlAct = parseManagement(report?.management);
  const diagnosisImage =
    stateImage || report?.imageUrl || stateDiagnosis?.diseaseImg;
  const pet = report
    ? {
        img:
          statePet?.img ||
          report.petImageUrl ||
          report.petImageurl ||
          getDefaultPetImage(report.species),
        sex: normalizeSex(report.sex),
        neuter: Boolean(report.neutered),
        name: report.petName,
        breed: report.breed,
        species: report.species,
        age: getAgeFromBirth(report.birth),
        weight: report.weight,
        allergic: Array.isArray(report.allergies)
          ? report.allergies
          : statePet?.allergic || [],
      }
    : statePet;

  if (isLoading) {
    return (
      <div className="diseaseCheck-wrapper">
        <div className="diseaseCheck-top">
          <button
            className="diseaseCheck-back-button"
            type="button"
            onClick={() => navigate(-1)}
          >
            <img src={DISEASECHECKBACK} alt="뒤로가기" />
          </button>
          <span>AI 스마트 진단 리포트</span>
        </div>
        <div className="diseaseCheck-loading-overlay">
          <div className="diseaseCheck-loading-spinner" />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="diseaseCheck-wrapper">
        <div className="diseaseCheck-top">
          <button
            className="diseaseCheck-back-button"
            type="button"
            onClick={() => navigate(-1)}
          >
            <img src={DISEASECHECKBACK} alt="뒤로가기" />
          </button>
          <span>AI 스마트 진단 리포트</span>
        </div>
        <div className="diseaseCheck-state">{errorMessage}</div>
      </div>
    );
  }

  return (
    <div className="diseaseCheck-wrapper">
      <div className="diseaseCheck-top">
        <button
          className="diseaseCheck-back-button"
          type="button"
          onClick={() => navigate(-1)}
        >
          <img src={DISEASECHECKBACK} alt="뒤로가기" />
        </button>
        <span>AI 스마트 진단 리포트</span>
      </div>
      <div className="diseaseCheck-content">
        <div className="diseaseCheck-alert">
          <img src={DISEASECHECKMARK} alt="" />
          <p>
            발병 가능성이 아닌, 증상과 유사한 질병입니다. 반드시
            <br />
            동물병원에 방문하여 진료를 받으시기 바랍니다.
          </p>
        </div>

        <span className="diseaseCheck-date">{formattedDate}</span>

        {diagnosisImage && (
          <img
            className="diseaseCheck-image"
            src={diagnosisImage}
            alt="진단 이미지"
          />
        )}

        <section>
          <div className="diseaseCheck-section-title">
            <img src={DISEASECHECKSTAR} alt="" />
            <span>의심 질병</span>
          </div>

          <div className="diseaseCheck-disease-card">
            <div className="diseaseCheck-percent-circle">
              <svg viewBox="0 0 104 104">
                <circle
                  className="diseaseCheck-percent-bg"
                  cx="52"
                  cy="52"
                  r="43"
                />

                <circle
                  className="diseaseCheck-percent-progress"
                  cx="52"
                  cy="52"
                  r="43"
                  style={{
                    strokeDasharray: 2 * Math.PI * 43,
                    strokeDashoffset:
                      2 * Math.PI * 43 * (1 - progressProbability / 100),
                  }}
                />
              </svg>

              <span>{probability.toLocaleString()}%</span>
            </div>

            <strong>{diseaseName}</strong>
          </div>
        </section>

        <section>
          <div className="diseaseCheck-section-title">
            <img src={DISEASECHECKBOX} alt="" />
            <span>관리방법</span>
          </div>

          {controlAct.map((item, index) => (
            <div
              className="diseaseCheck-control-card"
              key={`${item.big}-${index}`}
            >
              <strong>{item.big}</strong>
              {item.small && <p>{item.small}</p>}
            </div>
          ))}
        </section>

        <img
          className="diseaseCheck-map"
          src={DISEASECHECKMAP}
          onClick={() => navigate("/map")}
        />

        <section>
          <div className="diseaseCheck-section-title">
            <img src={DISEASECHECKPERSON} alt="" />
            <span>반려동물 프로필</span>
          </div>

          {pet && (
            <div className="diseaseCheck-pet-card">
              <div className="diseaseCheck-pet-tags">
                <img
                  className="diseaseCheck-pet-sex"
                  src={
                    pet.sex === "male" ? DISEASECHECKMALE : DISEASECHECKFEMALE
                  }
                  alt={pet.sex}
                />

                <span className="diseaseCheck-pet-neuter">
                  {pet.neuter ? "중성화 완료" : "중성화 미완료"}
                </span>
              </div>

              <div className="diseaseCheck-pet-main">
                <img src={pet.img} alt={pet.name} />

                <div className="diseaseCheck-pet-info">
                  <strong>{pet.name}</strong>
                  <span>{pet.breed}</span>
                  <span>
                    {pet.age}살
                    {pet.weight !== undefined && pet.weight !== null
                      ? ` | ${pet.weight}kg`
                      : ""}
                  </span>
                </div>
              </div>

              <div className="diseaseCheck-pet-allergy-list">
                {pet.allergic?.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
