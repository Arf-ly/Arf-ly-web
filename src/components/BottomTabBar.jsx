import { useNavigate, useLocation } from "react-router-dom";
import "./BottomTabBar.css";

import homeIcon from "../assets/bottom_tab_bar/home.svg";
import homeActiveIcon from "../assets/bottom_tab_bar/home_active.svg";
import communityIcon from "../assets/bottom_tab_bar/community.svg";
import communityActiveIcon from "../assets/bottom_tab_bar/community_active.svg";
import mapIcon from "../assets/bottom_tab_bar/map.svg";
import mapActiveIcon from "../assets/bottom_tab_bar/map_active.svg";
import myIcon from "../assets/bottom_tab_bar/my.svg";
import myActiveIcon from "../assets/bottom_tab_bar/my_active.svg";

const TABS = [
	{
		id: "home",
		label: "홈",
		path: "/home",
		icon: homeIcon,
		activeIcon: homeActiveIcon,
	},
	{
		id: "community",
		label: "커뮤니티",
		path: "/community",
		icon: communityIcon,
		activeIcon: communityActiveIcon,
	},
	{
		id: "map",
		label: "지도",
		path: "/map",
		icon: mapIcon,
		activeIcon: mapActiveIcon,
	},
	{
		id: "my",
		label: "마이페이지",
		path: "/mypage",
		icon: myIcon,
		activeIcon: myActiveIcon,
	},
];

/** 현재 경로에 맞는 하단 탭과 이동 버튼을 표시한다. */
function BottomTabBar() {
	const navigate = useNavigate();
	const location = useLocation();

	/** 선택한 하단 탭의 경로로 이동한다. */
	const handleTabClick = (tab) => {
		navigate(tab.path);
	};

	return (
		<nav className="bottom_tab_bar">
			{TABS.map((tab) => {
				const isActive = location.pathname === tab.path;

				let buttonClass = "bottom_tab_item";
				if (isActive) {
					buttonClass = "bottom_tab_item active";
				}

				let displayIcon = tab.icon;
				if (isActive) {
					displayIcon = tab.activeIcon;
				}

				return (
					<button
						key={tab.id}
						className={buttonClass}
						onClick={() => handleTabClick(tab)}
					>
						<img
							src={displayIcon}
							alt={tab.label}
							className="tab_icon"
						/>
						<span className="tab_label">{tab.label}</span>
					</button>
				);
			})}
		</nav>
	);
}

export default BottomTabBar;