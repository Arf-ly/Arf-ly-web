import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AdminReports.css";
import { getReportList, getReportDetail, rejectReport, deleteAdminPost } from "./AdminApi";
import { getPostDetail } from "../community/CommunityApi";
import AdminModal from "./AdminModal";

import BackIcon from "../../assets/community/back.svg";
import NextIcon from "../../assets/mypage/mypage_next_arrow.svg";

const formatDate = (createdAt) => {
	if (!createdAt) {
		return "";
	}

	const date = new Date(createdAt);

	if (Number.isNaN(date.getTime())) {
		return createdAt;
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hour = String(date.getHours()).padStart(2, "0");
	const minute = String(date.getMinutes()).padStart(2, "0");

	return `${year}.${month}.${day} ${hour}:${minute}`;
};

const getReportReasonLabel = (reason) => {
	if (reason === "ADVERTISEMENT") {
		return "광고";
	}

	if (reason === "ABUSE") {
		return "욕설·비방";
	}

	if (reason === "ETC") {
		return "기타";
	}
	return reason || "-";
};

function AdminReports({ actionSubmittingRef, isActionSubmitting, setIsActionSubmitting }) {
	const navigate = useNavigate();
	const [selectedReportId, setSelectedReportId] = useState(null);
	const [selectedReport, setSelectedReport] = useState(null);
	const [post, setPost] = useState(null);
	const [isPostLoading, setIsPostLoading] = useState(false);
	const [postError, setPostError] = useState("");
	const [reports, setReports] = useState([]);
	const [isReportLoading, setIsReportLoading] = useState(true);
	const [isReportDetailLoading, setIsReportDetailLoading] = useState(false);
	const [reportError, setReportError] = useState("");
	const [reportDetailError, setReportDetailError] = useState("");
	const [reportRefreshKey, setReportRefreshKey] = useState(0);
	const [modalType, setModalType] = useState(null);
	const isDetailOpen = selectedReportId !== null;
	const selectedPostId = selectedReport?.postId ?? null;
	const selectedReportSummary = reports.find(
		(item) => String(item.reportId) === String(selectedReportId)
	);
	const pageTitle = isDetailOpen ? "신고 게시물 상세" : "신고 관리";
	const pageDescription = isReportLoading || reportError
		? "신고 목록"
		: `처리 대기 ${reports.length}건 · 오래된 접수순`;

	useEffect(() => {
		let isCancelled = false;

		const fetchReportList = async () => {
			try {
				setIsReportLoading(true);
				setReportError("");

				const data = await getReportList();

				if (isCancelled) {
					return;
				}
				if (!Array.isArray(data)) {
					throw new Error("신고 목록 응답을 확인해 주세요.");
				}

				setReports(data);
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

		fetchReportList();

		return () => {
			isCancelled = true;
		};
	}, [reportRefreshKey]);

	useEffect(() => {
		if (selectedReportId === null) {
			return;
		}

		let isCancelled = false;

		const fetchReportDetail = async () => {
			try {
				setIsReportDetailLoading(true);
				setReportDetailError("");

				const data = await getReportDetail(selectedReportId);

				if (isCancelled) {
					return;
				}
				if (
					data.reportId === undefined ||
					data.reportId === null ||
					String(data.reportId) !== String(selectedReportId) ||
					data.postId === undefined ||
					data.postId === null
				) {
					throw new Error("신고 상세 응답을 확인해 주세요.");
				}

				setSelectedReport(data);
			} catch {
				if (!isCancelled) {
					setSelectedReport(null);
					setPost(null);
					setPostError("");
					setReportDetailError("신고 정보를 불러오지 못했습니다.");
				}
			} finally {
				if (!isCancelled) {
					setIsReportDetailLoading(false);
				}
			}
		};

		fetchReportDetail();

		return () => {
			isCancelled = true;
		};
	}, [selectedReportId]);

	useEffect(() => {
		if (selectedReportId === null || selectedPostId === null) {
			return;
		}

		let isCancelled = false;

		const fetchPostDetail = async () => {
			try {
				setIsPostLoading(true);
				setPostError("");

				const data = await getPostDetail(selectedPostId);

				if (!isCancelled) {
					setPost(data.post || data.data || data.result || data);
				}
			} catch {
				if (!isCancelled) {
					setPost(null);
					setPostError("게시글을 불러오지 못했습니다.");
				}
			} finally {
				if (!isCancelled) {
					setIsPostLoading(false);
				}
			}
		};

		fetchPostDetail();

		return () => {
			isCancelled = true;
		};
	}, [selectedReportId, selectedPostId]);

	const handleBackClick = () => {
		if (actionSubmittingRef.current) {
			return;
		}
		setSelectedReportId(null);
		setSelectedReport(null);
		setPost(null);
		setPostError("");
		setReportDetailError("");
	};

	const handleReportClick = (reportId) => {
		if (actionSubmittingRef.current) {
			return;
		}

		setSelectedReportId(reportId);
		setSelectedReport(null);
		setPost(null);
		setPostError("");
		setReportDetailError("");
		setIsReportDetailLoading(true);
	};

	const handleModalOpen = (type) => {
		if (actionSubmittingRef.current) {
			return;
		}

		setModalType(type);
	};

	const handleModalClose = () => {
		if (actionSubmittingRef.current) {
			return;
		}

		setModalType(null);
	};

	const handleConfirmClick = async () => {
		if (actionSubmittingRef.current || selectedReportId === null || !selectedReport) {
			return;
		}

		if (modalType !== "reject-report" && modalType !== "delete-post") {
			return;
		}

		actionSubmittingRef.current = true;
		setIsActionSubmitting(true);
		let errorMessage = "신고 반려에 실패했습니다.";

		try {
			if (modalType === "delete-post") {
				errorMessage = "게시글 삭제에 실패했습니다.";
				await deleteAdminPost(selectedReport.postId);
				setIsReportLoading(true);
			} else {
				await rejectReport(selectedReportId);
				setReports((items) => items.filter(
					(item) => String(item.reportId) !== String(selectedReportId)
				));
			}

			setSelectedReportId(null);
			setSelectedReport(null);
			setPost(null);
			setPostError("");
			setReportDetailError("");
			setReportRefreshKey((key) => key + 1);
			setModalType(null);
		} catch {
			alert(errorMessage);
		} finally {
			actionSubmittingRef.current = false;
			setIsActionSubmitting(false);
		}
	};

	let modalTitle = "신고를 반려하시겠어요?";
	let modalDescription = "반려된 신고는 처리 대기 목록에서 제외됩니다.";
	let modalButtonText = "신고 반려";
	const isDanger = modalType === "delete-post";

	if (modalType === "delete-post") {
		modalTitle = "게시글을 삭제하시겠어요?";
		modalDescription = "게시글과 댓글, 좋아요, 이미지, 신고 내역이 함께 삭제됩니다.";
		modalButtonText = "게시글 삭제";
	}

	return (
		<>
			<main className="admin_main">
				<div className="admin_title_row">
					<div className="admin_title">
						{isDetailOpen && (
							<button
								className="admin_back_button"
								disabled={isActionSubmitting}
								type="button"
								onClick={handleBackClick}
								aria-label="목록으로 돌아가기"
							>
								<img src={BackIcon} alt="" />
							</button>
						)}
						<h1>{pageTitle}</h1>
					</div>
				</div>
				{!isDetailOpen && (
					<p className="admin_description">{pageDescription}</p>
				)}
				{!isDetailOpen && (
					<>
						<div className="admin_list">
							{!isReportLoading && !reportError && reports.map((item) => (
								<button
									className="admin_list_card"
									type="button"
									key={item.reportId}
									onClick={() => handleReportClick(item.reportId)}
								>
									<div className="admin_card_title_row">
										<strong>{item.postTitle}</strong>
										<span className="admin_status pending">처리 대기</span>
									</div>
									<p>{`R-${item.reportId} · ${getReportReasonLabel(item.reason)}`}</p>
									<div className="admin_card_bottom_row">
										<span>{item.reporterNickName} · {formatDate(item.createdAt) || "-"}</span>
										<img src={NextIcon} alt="" />
									</div>
								</button>
							))}
							{isReportLoading && (
								<p className="admin_empty_text">신고 목록을 불러오는 중입니다.</p>
							)}
							{reportError && (
								<p className="admin_empty_text" role="alert">{reportError}</p>
							)}
							{!isReportLoading && !reportError && reports.length === 0 && (
								<p className="admin_empty_text">처리 대기 중인 신고가 없습니다.</p>
							)}
						</div>
					</>
				)}
				{selectedReportId !== null && isReportDetailLoading && (
					<p className="admin_empty_text">신고 정보를 불러오는 중입니다.</p>
				)}
				{selectedReportId !== null && reportDetailError && (
					<p className="admin_empty_text" role="alert">{reportDetailError}</p>
				)}
				{selectedReport && !isReportDetailLoading && !reportDetailError && (
					<>
						<section className="admin_detail_card">
							<div className="admin_report_post_top">
								<span className="admin_status pending">신고 게시글</span>
								<button
									className="admin_report_post_link"
									type="button"
									onClick={() => navigate(`/community/${selectedReport.postId}`)}
									disabled={isActionSubmitting}
								>
									게시글 보기
								</button>
							</div>
							<h2 className="admin_post_title">{post?.title || selectedReportSummary?.postTitle || "신고 대상 게시글"}</h2>
							<p className="admin_post_meta">
								{selectedReport.authorNickName}
								{(post?.createdAt || post?.createdDate) && (
									<> · {formatDate(post.createdAt || post.createdDate)}</>
								)}
							</p>
							{isPostLoading && (
								<p className="admin_report_post_state">게시글을 불러오는 중입니다.</p>
							)}
							{postError && (
								<p className="admin_report_post_state" role="alert">{postError}</p>
							)}
							{!isPostLoading && !postError && post?.content && (
								<p className="admin_report_post_content">{post.content}</p>
							)}
						</section>
						<section className="admin_detail_card">
							<h2 className="admin_small_title">신고 내역 R-{selectedReport.reportId}</h2>
							<dl className="admin_detail_info">
								<div>
									<dt>신고 사유</dt>
									<dd>{getReportReasonLabel(selectedReport.reason)}</dd>
								</div>
								<div>
									<dt>상세 사유</dt>
									<dd>{selectedReport.detail || "-"}</dd>
								</div>
								<div>
									<dt>신고자</dt>
									<dd>{selectedReport.reporterNickName}</dd>
								</div>
								<div>
									<dt>접수일</dt>
									<dd>{formatDate(selectedReport.createdAt) || "-"}</dd>
								</div>
							</dl>
						</section>
					</>
				)}
				{selectedReport && !isReportDetailLoading && !reportDetailError && (
					<>
						<div className="admin_report_actions">
							<button
								className="admin_outline_button"
								type="button"
								onClick={() => handleModalOpen("reject-report")}
								disabled={isActionSubmitting}
							>
								신고 반려
							</button>
						</div>
						<footer className="admin_report_footer">
							<button
								className="admin_outline_button"
								type="button"
								onClick={handleBackClick}
								disabled={isActionSubmitting}
							>
								목록으로
							</button>
							<button
								className="admin_danger_button"
								type="button"
								onClick={() => handleModalOpen("delete-post")}
								disabled={isActionSubmitting}
							>
								게시글 삭제
							</button>
						</footer>
					</>
				)}
			</main>
			<AdminModal
				modalType={modalType}
				modalTitle={modalTitle}
				modalDescription={modalDescription}
				modalButtonText={modalButtonText}
				isDanger={isDanger}
				isActionSubmitting={isActionSubmitting}
				handleModalClose={handleModalClose}
				handleConfirmClick={handleConfirmClick}
			/>
		</>
	);
}

export default AdminReports;
