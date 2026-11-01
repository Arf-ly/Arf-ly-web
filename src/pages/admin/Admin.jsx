import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Admin.css";
import "../../components/BottomTabBar.css";
import AdminDashboard from "./AdminDashboard";
import AdminVerification from "./AdminVerification";
import AdminReports from "./AdminReports";
import AdminMembers from "./AdminMembers";

import Logo from "../../assets/home/home_logo.svg";
import AlarmIcon from "../../assets/home/home_bell.svg";
import ReportIcon from "../../assets/community/complain.svg";
import HomeIcon from "../../assets/bottom_tab_bar/home.svg";
import HomeActiveIcon from "../../assets/bottom_tab_bar/home_active.svg";
import MemberIcon from "../../assets/bottom_tab_bar/my.svg";
import MemberActiveIcon from "../../assets/bottom_tab_bar/my_active.svg";
import CheckIcon from "../../assets/terms/gray_check_circle.svg";
import CheckActiveIcon from "../../assets/admin/check_active.svg";

function Admin() {
	const navigate = useNavigate();
	const actionSubmittingRef = useRef(false);
	const [activeTab, setActiveTab] = useState("dashboard");
	const [tabKey, setTabKey] = useState(0);
	const [isActionSubmitting, setIsActionSubmitting] = useState(false);
	const [selectedVerificationId, setSelectedVerificationId] = useState(null);
	const isVerificationDetailOpen = activeTab === "verifications" && selectedVerificationId !== null;

	const handleTabClick = (tab) => {
		if (actionSubmittingRef.current) {
			return;
		}

		setSelectedVerificationId(null);
		setActiveTab(tab);
		setTabKey((key) => key + 1);
	};

	const handleHomeClick = () => {
		if (actionSubmittingRef.current) {
			return;
		}

		navigate("/home");
	};

	return (
		<div className={`admin_page ${isVerificationDetailOpen ? "admin_verification_detail" : ""}`}>
			<header className="admin_header">
				<button
					className="admin_logo_button"
					disabled={isActionSubmitting}
					type="button"
					onClick={() => handleTabClick("dashboard")}
					aria-label="관리자 대시보드"
				>
					<img src={Logo} alt="ARFLY" />
				</button>
				<div className="admin_header_right">
					<button
						className="admin_home_button"
						type="button"
						onClick={handleHomeClick}
						disabled={isActionSubmitting}
					>
						홈으로
					</button>
					<button
						className="admin_alarm_button"
						disabled={isActionSubmitting}
						type="button"
						onClick={() => navigate("/alarmnotification")}
						aria-label="알림"
					>
						<img src={AlarmIcon} alt="" />
					</button>
				</div>
			</header>
			{activeTab === "dashboard" && (
				<AdminDashboard
					key={tabKey}
					handleTabClick={handleTabClick}
				/>
			)}
			{activeTab === "verifications" && (
				<AdminVerification
					key={tabKey}
					selectedVerificationId={selectedVerificationId}
					setSelectedVerificationId={setSelectedVerificationId}
					actionSubmittingRef={actionSubmittingRef}
					isActionSubmitting={isActionSubmitting}
					setIsActionSubmitting={setIsActionSubmitting}
				/>
			)}
			{activeTab === "reports" && (
				<AdminReports
					key={tabKey}
					actionSubmittingRef={actionSubmittingRef}
					isActionSubmitting={isActionSubmitting}
					setIsActionSubmitting={setIsActionSubmitting}
				/>
			)}
			{activeTab === "members" && (
				<AdminMembers
					key={tabKey}
					actionSubmittingRef={actionSubmittingRef}
					isActionSubmitting={isActionSubmitting}
					setIsActionSubmitting={setIsActionSubmitting}
				/>
			)}
			{!isVerificationDetailOpen && (
				<nav className="bottom_tab_bar" aria-label="관리자 메뉴">
					<button
						className={`bottom_tab_item ${activeTab === "dashboard" ? "active" : ""}`}
						type="button"
						disabled={isActionSubmitting}
						onClick={() => handleTabClick("dashboard")}
						aria-current={activeTab === "dashboard" ? "page" : undefined}
					>
						<img className="tab_icon" src={activeTab === "dashboard" ? HomeActiveIcon : HomeIcon} alt="" />
						<span className="tab_label">대시보드</span>
					</button>
					<button
						className={`bottom_tab_item ${activeTab === "verifications" ? "active" : ""}`}
						type="button"
						disabled={isActionSubmitting}
						onClick={() => handleTabClick("verifications")}
						aria-current={activeTab === "verifications" ? "page" : undefined}
					>
						<img
							className="tab_icon"
							src={activeTab === "verifications" ? CheckActiveIcon : CheckIcon}
							alt=""
						/>
						<span className="tab_label">의사 인증</span>
					</button>
					<button
						className={`bottom_tab_item ${activeTab === "reports" ? "active" : ""}`}
						type="button"
						disabled={isActionSubmitting}
						onClick={() => handleTabClick("reports")}
						aria-current={activeTab === "reports" ? "page" : undefined}
					>
						<img className="tab_icon" src={ReportIcon} alt="" />
						<span className="tab_label">신고 관리</span>
					</button>
					<button
						className={`bottom_tab_item ${activeTab === "members" ? "active" : ""}`}
						type="button"
						disabled={isActionSubmitting}
						onClick={() => handleTabClick("members")}
						aria-current={activeTab === "members" ? "page" : undefined}
					>
						<img
							className="tab_icon"
							src={activeTab === "members" ? MemberActiveIcon : MemberIcon}
							alt=""
						/>
						<span className="tab_label">회원 관리</span>
					</button>
				</nav>
			)}
		</div>
	);
}

export default Admin;
