import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import MYPAGELOGO from "../../assets/home/home_logo.svg";
import MYPAGEBELL from "../../assets/home/home_bell.svg";
import MYPAGENEXTARROW from "../../assets/mypage/mypage_next_arrow.svg";
import MYPAGEMAPMARK from "../../assets/mypage/mypage_map_mark.svg";
import MYPAGENOTICE from "../../assets/mypage/mypage_notice.svg";
import MYPAGEQUESTION from "../../assets/mypage/mypage_question.svg";
import MYPAGESERVICE from "../../assets/mypage/mypage_service.svg";
import MYPAGEIOT from "../../assets/mypage/mypage_iot.svg";
import PROFILEIMG from "../../assets/mypage/mypage_temp_profile_img.svg";
import MYPAGEMALE from "../../assets/home/home_male.svg";
import MYPAGEFEMALE from "../../assets/home/home_female.svg";
import HOMEDOG from "../../assets/home/home_dog.svg";
import HOMECAT from "../../assets/home/home_cat.svg";
import MYPAGEPILL from "../../assets/mypage/mypage_pill.svg";
import CERTIFICATION from "../../assets/mypage/mypage_doctor_certification.svg";
import VERIFICATION from "../../assets/mypage/mypage_doctor_verficiation.svg";

import "./MyPage.css";
import BottomTabBar from "../../components/BottomTabBar.jsx";
import PhotoSourceSheet from "../../components/PhotoSourceSheet.jsx";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

const getAuthHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const fetchApiData = async (path) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${path}`);
  }

  return response.json();
};

const getAgeFromBirth = (birth) => {
  if (!birth) return 0;

  const birthYear = Number(String(birth).slice(0, 4));
  if (!Number.isFinite(birthYear)) return 0;

  return Math.max(new Date().getFullYear() - birthYear, 0);
};

const normalizeSex = (sex) =>
  String(sex).toUpperCase() === "FEMALE" ? "female" : "male";

const getDefaultPetImage = (species) =>
  String(species).toUpperCase() === "CAT" ? HOMECAT : HOMEDOG;

const normalizeUserInfo = (data) => ({
  ...data,
  nickname: data?.nickname || "",
  roadAddress: data?.roadAddress || "",
  recordCount: Number(data?.diagnosisCounts ?? 0),
  postCount: Number(data?.postCounts ?? 0),
  commentCount: Number(data?.commentCounts ?? 0),
  dibsCount: Number(data?.likeCounts ?? 0),
});

const normalizePet = (summary, detail = {}) => {
  const species = detail.species || summary.species;

  return {
    id: summary.petId ?? summary.id,
    species,
    sex: normalizeSex(detail.sex),
    neuter: Boolean(detail.neutered),
    img:
      detail.profileImageUrl ||
      summary.profileImageUrl ||
      getDefaultPetImage(species),
    name: detail.name || summary.name,
    breed:
      detail.breed || detail.breeds || summary.breed || summary.breeds || "",
    age: getAgeFromBirth(detail.birth),
    weight: detail.weight ?? 0,
    allergic: Array.isArray(detail.allergies) ? detail.allergies : [],
    note: detail.note || summary.note || "",
  };
};

export default function MyPage() {
  const navigate = useNavigate();
  const doctorFileInputRef = useRef(null);
  const [isDoctorPhotoSheetOpen, setIsDoctorPhotoSheetOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [petList, setPetList] = useState([]);
  const [medicineAlarms, setMedicineAlarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDoctorPhotoImport = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      alert("PNG 또는 JPEG 형식의 사진만 가져올 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setIsDoctorPhotoSheetOpen(false);
      navigate("/doctor-verification/camera", {
        state: { image: reader.result },
      });
    };
    reader.onerror = () => alert("사진을 불러오지 못했습니다. 다시 선택해주세요.");
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      localStorage.removeItem("accessToken");
      navigate("/", { replace: true });
      return;
    }

    try {
      setIsLoggingOut(true);

      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("logout failed");
      }

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/", { replace: true });
    } catch (error) {
      alert("로그아웃에 실패했습니다.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const fetchMyPageData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [memberData, petsData, alarmsData] = await Promise.all([
          fetchApiData("/member/me"),
          fetchApiData("/api/pets"),
          fetchApiData("/api/alarms"),
        ]);

        const petSummaries = Array.isArray(petsData?.pets) ? petsData.pets : [];
        const nextMedicineAlarms = Array.isArray(alarmsData)
          ? alarmsData
          : alarmsData?.alarms || [];
        const nextPetList = await Promise.all(
          petSummaries.map(async (petSummary) => {
            const petId = petSummary.petId ?? petSummary.id;
            const detailData = await fetchApiData(`/api/pets/${petId}`);
            const detail = detailData?.pet || detailData;

            return normalizePet(petSummary, detail);
          }),
        );

        if (!isActive) return;

        setUserInfo(normalizeUserInfo(memberData));
        setPetList(nextPetList);
        setMedicineAlarms(nextMedicineAlarms);
      } catch (error) {
        if (!isActive) return;

        setUserInfo(null);
        setPetList([]);
        setMedicineAlarms([]);
        setErrorMessage("마이페이지를 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchMyPageData();

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mypage-wrapper">
        <div className="mypage-top">
          <img src={MYPAGELOGO} />
          <img src={MYPAGEBELL} onClick={() => navigate("/alarmnotification")} />
        </div>
        <div className="mypage-loading-overlay">
          <div className="mypage-loading-spinner" />
        </div>
        <BottomTabBar></BottomTabBar>
      </div>
    );
  }

  if (errorMessage || !userInfo) {
    return (
      <div className="mypage-wrapper">
        <div className="mypage-top">
          <img src={MYPAGELOGO} />
          <img src={MYPAGEBELL} onClick={() => navigate("/alarmnotification")} />
        </div>
        <div className="mypage-empty-state">{errorMessage}</div>
        <BottomTabBar></BottomTabBar>
      </div>
    );
  }

  return (
    <div className="mypage-wrapper">
      <div className="mypage-top">
        <img src={MYPAGELOGO} />
        <img src={MYPAGEBELL} onClick={() => navigate("/alarmnotification")} />
      </div>
      <div className="mypage-user-info">
        <img src={PROFILEIMG} />
        <div className="mypage-user-info-detail">
          <div className="mypage-user-info-detail-nickname">
            <span>{userInfo.nickname} </span>
            {userInfo.doctor === true && (
              <img
                className="mypage-doctor-verification"
                src={VERIFICATION}
                alt="의사 인증 완료"
              />
            )}
            <span>님</span>
            <img
              src={MYPAGENEXTARROW}
              onClick={() => {
                navigate("/userprofile", {
                  state: {
                    userInfo,
                    nickname: userInfo.nickname,
                    address: userInfo.roadAddress,
                  },
                });
              }}
            />
          </div>
          <div className="mypage-user-info-detail-address">
            <img src={MYPAGEMAPMARK} />
            <span>{userInfo.roadAddress}</span>
          </div>
        </div>
      </div>
      <div className="mypage-user-activites">
        <div className="mypage-user-activites-diagnosis">
          <span>{userInfo.recordCount}</span>
          <span>진단기록</span>
        </div>
        <div className="mypage-user-activites-post">
          <span>{userInfo.postCount}</span>
          <span>게시글</span>
        </div>
        <div className="mypage-user-activites-comment">
          <span>{userInfo.commentCount}</span>
          <span>댓글</span>
        </div>
        <div className="mypage-user-activites-dibs">
          <span>{userInfo.dibsCount}</span>
          <span>찜</span>
        </div>
      </div>
      <div className="mypage-user-pet-info">
        <div className="mypage-pet-list">
          {petList.map((pet) => {
            return (
              <button
                type="button"
                key={pet.id}
                className="mypage-pet-card"
                onClick={() => navigate("/petdetail", { state: { pet } })}
              >
                <div className="mypage-pet-card-top">
                  <img
                    className="mypage-pet-sex"
                    src={pet.sex === "male" ? MYPAGEMALE : MYPAGEFEMALE}
                    alt={pet.sex}
                  />
                  <span className="mypage-pet-is-neuter">
                    {pet.neuter ? "중성화 완료" : "중성화 미완료"}
                  </span>
                </div>

                <div className="mypage-pet-card-main">
                  <img
                    className="mypage-pet-img"
                    src={pet.img}
                    alt={pet.name}
                  />
                  <div>
                    <strong>{pet.name}</strong>
                    <span className="mypage-pet-breed">{pet.breed}</span>
                    <span className="mypage-pet-age-weight">
                      {pet.age}살 | {pet.weight}kg
                    </span>
                  </div>
                </div>

                <div className="mypage-pet-allergy-list">
                  {pet.allergic?.slice(0, 3).map((item) => (
                    <span key={item}>{item}</span>
                  ))}

                  {pet.allergic?.length > 3 && <span>...</span>}
                </div>
                <span className="mypage-pet-more-info">자세히 보기 &gt; </span>
              </button>
            );
          })}

          <button
            type="button"
            className="mypage-pet-add-card"
            onClick={() =>
              navigate("/pet/register", { state: { entry: "mypage-add" } })
            }
          >
            <span>+</span>
            <p>반려동물 더 키워요!</p>
          </button>
        </div>
      </div>
      <div className="mypage-medicine">
        <div
          className="mypage-medicine-register"
          onClick={() => navigate("/medicinealarm")}
        >
          {medicineAlarms.length > 0 ? (
            <div className="mypage-medicine-alarm-summary">
              <img src={MYPAGEPILL} alt="" />
              <span>
                등록된 복약알람이 <br />
                {medicineAlarms.length}개 있어요!
              </span>
            </div>
          ) : (
            <span className="mypage-medicine-start-text">
              아플리와 함께
              <br />
              복약관리를 시작해요!
            </span>
          )}
          <button type="button">등록된 알람 보러가기</button>
        </div>
      </div>
      <div className="mypage-tab">
        <div onClick={() => navigate("/iotregister")}>
          <img src={MYPAGEIOT} />
          <span>기기 등록</span>
        </div>
        <div>
          <img src={MYPAGENOTICE} />
          <span>공지사항</span>
        </div>
        <div>
          <img src={MYPAGEQUESTION} />
          <span>문의사항</span>
        </div>
        <div>
          <img src={MYPAGESERVICE} />
          <span>고객센터</span>
        </div>
        <div onClick={() => setIsDoctorPhotoSheetOpen(true)}>
          <img src={CERTIFICATION} />
          <span>의사 인증</span>
        </div>
      </div>
      <div className="mypage-bottom">
        <span onClick={handleLogout}>
          {isLoggingOut ? "로그아웃 중" : "로그아웃"}
        </span>
        <span>회원탈퇴</span>
      </div>
      {isDoctorPhotoSheetOpen && (
        <PhotoSourceSheet
          onClose={() => setIsDoctorPhotoSheetOpen(false)}
          onCapture={() => {
            setIsDoctorPhotoSheetOpen(false);
            navigate("/doctor-verification/camera");
          }}
          onImport={() => doctorFileInputRef.current?.click()}
        />
      )}
      <input
        ref={doctorFileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={handleDoctorPhotoImport}
      />
      <BottomTabBar></BottomTabBar>
    </div>
  );
}
