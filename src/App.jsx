import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Home from "./pages/home/Home";
import WeeklyActive from "./pages/home/WeeklyActive";
import WalkedResult from "./pages/home/WalkedResult";
import DiagnosisCamera from "./pages/home/DiagnosisCamera.jsx";
import DiseaseCheck from "./pages/home/DiseaseCheck.jsx";

import Login from "./pages/auth/Login/Login";
import SystemLogin from "./pages/auth/Login/SystemLogin";
import Signup from "./pages/auth/Signup/Signup";
import Find from "./pages/auth/Find/Find";
import Terms from "./pages/auth/Signup/Terms";
import { refreshAccessToken } from "./pages/auth/AuthApi";

import Community from "./pages/community/Community";
import CommunityWrite from "./pages/community/CommunityWrite";
import CommunitySearch from "./pages/community/CommunitySearch";
import CommunityDetail from "./pages/community/CommunityDetail";
import CommunityEdit from "./pages/community/CommunityEdit";
import CommunityReport from "./pages/community/CommunityReport";

import MyPage from "./pages/mypage/MyPage";
import IoTRegister from "./pages/mypage/IotRegisteration/IoTRegister.jsx";
import PetDetail from "./pages/mypage/PetDetail.jsx";
import UserProfile from "./pages/mypage/UserProfile.jsx";
import MedicineAlarm from "./pages/mypage/MedicineAlarm.jsx";
import AlarmNotification from "./pages/mypage/AlarmNotification.jsx";
import DoctorVerificationCamera from "./pages/mypage/DoctorVerificationCamera.jsx";

import MapPage from "./pages/map/MapPage";
import PetRegister from "./pages/pet/PetRegister";

import Admin from "./pages/admin/Admin.jsx";

const API_BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

const termsMapping = {
  service: 1,
  privacy: 2,
  ai_ref: 3,
  location: 4,
  ai_collect: 5,
  push: 6,
  night: 7,
};

function ProtectedRoute({ children }) {
  const location = useLocation();
  const accessToken = localStorage.getItem("accessToken");
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const fetchTermsAgreement = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/terms/latest/agreement-status`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) return;

        const isAgreed = await response.json();
        setShowTerms(isAgreed === false);
      } catch (error) {
        setShowTerms(false);
      }
    };

    fetchTermsAgreement();
  }, [accessToken]);

  const handleTermsComplete = async (agreements) => {
    const userAgreements = Object.keys(agreements).map((key) => ({
      termId: termsMapping[key],
      termsOfServiceAgreed: agreements[key],
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/terms/oauth/agree`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userAgreements),
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data.accessToken !== "string" || !data.accessToken.trim()) {
          throw new Error("약관 동의 응답에 accessToken이 없습니다.");
        }

        localStorage.setItem("accessToken", data.accessToken);
        setShowTerms(false);
        return;
      }

      alert("약관 동의 처리에 실패했습니다.");
    } catch (error) {
      alert("약관 동의 처리 중 오류가 발생했습니다.");
    }
  };

  if (!accessToken) {
    alert("로그인이 필요한 페이지입니다.");
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return (
    <>
      {children}
      {showTerms && (
        <div className="terms-bottom-sheet-overlay">
          <div className="terms-bottom-sheet-content">
            <Terms onComplete={handleTermsComplete} />
          </div>
        </div>
      )}
    </>
  );
}

const protectedElement = (element) => (
  <ProtectedRoute>{element}</ProtectedRoute>
);

function App() {
  useLocation();
  const refreshToken = localStorage.getItem("refreshToken");
  const hasAccessToken = Boolean(localStorage.getItem("accessToken"));

  useEffect(() => {
    if (!hasAccessToken || !refreshToken) return;

    let isRefreshing = false;
    const timer = setInterval(
      () => {
        if (
          isRefreshing ||
          !localStorage.getItem("accessToken") ||
          localStorage.getItem("refreshToken") !== refreshToken
        ) {
          return;
        }

        isRefreshing = true;
        refreshAccessToken()
          .catch((error) => console.error("액세스 토큰 재발급 실패:", error))
          .finally(() => {
            isRefreshing = false;
          });
      },
      30 * 60 * 1000,
    );

    return () => clearInterval(timer);
  }, [hasAccessToken, refreshToken]);

  return (
    <Routes>
      {/* 로그인 관련 */}
      <Route path="/" element={<Login />} />
      <Route path="/oauth/*" element={<Login />} />{" "}
      <Route path="/login" element={<SystemLogin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/find" element={<Find />} />
      {/* 홈 관련 */}
      <Route path="/home" element={protectedElement(<Home />)} />
      {/* 주간 활동 리포트 관련 */}
      <Route
        path="/weeklyactive/:petId"
        element={protectedElement(<WeeklyActive />)}
      />
      <Route
        path="/walkedresult"
        element={protectedElement(<WalkedResult />)}
      />
      {/* 카메라 관련 */}
      <Route path="/camera" element={protectedElement(<DiagnosisCamera />)} />
      <Route
        path="/doctor-verification/camera"
        element={protectedElement(<DoctorVerificationCamera />)}
      />
      <Route
        path="/diseasecheck"
        element={protectedElement(<DiseaseCheck />)}
      />
      {/* 커뮤니티 관련 */}
      <Route path="/community" element={protectedElement(<Community />)} />
      <Route
        path="/community/write"
        element={protectedElement(<CommunityWrite />)}
      />
      <Route
        path="/community/search"
        element={protectedElement(<CommunitySearch />)}
      />
      <Route
        path="/community/:postId"
        element={protectedElement(<CommunityDetail />)}
      />
      <Route
        path="/community/:postId/edit"
        element={protectedElement(<CommunityEdit />)}
      />
      <Route
        path="/community/:postId/report"
        element={protectedElement(<CommunityReport />)}
      />
      {/* 마이페이지 관련 */}
      <Route path="/mypage" element={protectedElement(<MyPage />)} />
      <Route path="/pet/register" element={protectedElement(<PetRegister />)} />
      <Route path="/iotregister" element={protectedElement(<IoTRegister />)} />
      <Route path="/petdetail" element={protectedElement(<PetDetail />)} />
      <Route path="/userprofile" element={protectedElement(<UserProfile />)} />
      <Route
        path="/medicinealarm"
        element={protectedElement(<MedicineAlarm />)}
      />
      <Route
        path="/alarmnotification"
        element={protectedElement(<AlarmNotification />)}
      />
      {/* 지도 관련 */}
      <Route path="/map" element={protectedElement(<MapPage />)} />
      {/* 관리자 관련 */}
      <Route path="/admin" element={protectedElement(<Admin />)} />
    </Routes>
  );
}

export default App;
