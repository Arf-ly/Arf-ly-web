import { useEffect, useState } from "react";

import "./AdminDashboard.css";
import { getMemberList, getReportList } from "./AdminApi";
import NextIcon from "../../assets/mypage/mypage_next_arrow.svg";

function AdminDashboard({ handleTabClick }) {
	const [memberMeta, setMemberMeta] = useState(null);
	const [reports, setReports] = useState([]);
	const [isReportLoading, setIsReportLoading] = useState(true);
	const [reportError, setReportError] = useState("");

	useEffect(() => {
		let isCancelled = false;

		const fetchMemberList = async () => {
			try {
				const data = await getMemberList({
					page: 0,
				});
				if (!Array.isArray(data.members)) {
					throw new Error("회원 목록 응답을 확인해 주세요.");
				}
				if (!isCancelled) {
					setMemberMeta(data);
				}
			} catch {
				if (!isCancelled) {
					setMemberMeta(null);
				}
			}
		};

		const fetchReportList = async () => {
			try {
				setIsReportLoading(true);
				setReportError("");
				const data = await getReportList();
				if (!Array.isArray(data)) {
					throw new Error("신고 목록 응답을 확인해 주세요.");
				}
				if (!isCancelled) {
					setReports(data);
				}
			} catch {
				if (!isCancelled) {
					setReports([]);
					setReportError("신고 목록을 불러오지 못했습니다.");
				}
			} finally {
				if (!isCancelled) {
					setIsReportLoading(false);
				}
			}
		};

		fetchMemberList();
		fetchReportList();

		return () => {
			isCancelled = true;
		};
	}, []);

	return (
		<main className="admin_main">
			<div className="admin_title_row">
				<div className="admin_title">
					<h1>대시보드</h1>
				</div>
			</div>
			<p className="admin_description">운영 현황</p>
			<section className="admin_stats" aria-label="운영 현황">
				<div className="admin_stat_card">
					<p>전체 회원</p>
					<strong>{memberMeta?.totalCount ?? "—"}</strong>
					<span>전체 등록 회원</span>
				</div>
				<div className="admin_stat_card">
					<p>처리 대기 신고</p>
					<strong>{isReportLoading || reportError ? "—" : reports.length}</strong>
					<span>전체 처리 대기 신고</span>
				</div>
			</section>
			<section className="admin_tasks">
				<h2>지금 확인할 업무</h2>
				<button
					className="admin_task_button"
					type="button"
					onClick={() => {
						handleTabClick("reports");
					}}
				>
					<div>
						<strong>처리 대기 신고 {isReportLoading || reportError ? "—" : reports.length}건</strong>
						<p>
							{reportError || (isReportLoading ? "신고 목록을 불러오는 중입니다." : reports[0] ? `R-${reports[0].reportId} · ${reports[0].postTitle}` : "처리 대기 중인 신고가 없습니다.")}
						</p>
					</div>
					<img src={NextIcon} alt="" />
				</button>
			</section>
		</main>
	);
}

export default AdminDashboard;
