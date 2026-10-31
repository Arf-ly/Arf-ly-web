import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AdminMembers.css";
import { getMemberList, getMemberDetail, suspendMember, unsuspendMember } from "./AdminApi";
import AdminModal from "./AdminModal";
import AdminPagination from "./AdminPagination";
import BackIcon from "../../assets/community/back.svg";
import NextIcon from "../../assets/mypage/mypage_next_arrow.svg";

const getMemberStatusLabel = (status) => {
	if (status === "ACTIVE") {
		return "활동 중";
	}

	if (status === "SUSPENDED") {
		return "이용 정지";
	}
	return status || "-";
};

const getMemberRoleLabel = (role) => {
	if (role === "USER") {
		return "일반 회원";
	}

	if (role === "DOCTOR") {
		return "의사";
	}

	if (role === "ADMIN") {
		return "관리자";
	}
	return role || "-";
};

const getSocialTypeLabel = (socialType) => {
	if (socialType === "LOCAL") {
		return "일반 로그인";
	}

	if (socialType === "GOOGLE") {
		return "구글";
	}

	if (socialType === "KAKAO") {
		return "카카오";
	}

	if (socialType === "NAVER") {
		return "네이버";
	}
	return socialType || "-";
};

function AdminMembers({ actionSubmittingRef, isActionSubmitting, setIsActionSubmitting }) {
	const navigate = useNavigate();
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedMemberId, setSelectedMemberId] = useState(null);
	const [selectedMember, setSelectedMember] = useState(null);
	const [members, setMembers] = useState([]);
	const [memberMeta, setMemberMeta] = useState(null);
	const [isMemberLoading, setIsMemberLoading] = useState(true);
	const [isMemberDetailLoading, setIsMemberDetailLoading] = useState(false);
	const [memberError, setMemberError] = useState("");
	const [memberDetailError, setMemberDetailError] = useState("");
	const [memberRefreshKey, setMemberRefreshKey] = useState(0);
	const [modalType, setModalType] = useState(null);
	const isDetailOpen = selectedMemberId !== null;
	const canSuspendMember = selectedMember?.status === "ACTIVE" &&
		selectedMember.role !== "ADMIN";
	const canUnsuspendMember = selectedMember?.status === "SUSPENDED";
	const totalCount = memberMeta?.totalCount ?? 0;
	const totalPages = memberMeta?.totalPages ?? 0;
	const pageStart = memberMeta ? memberMeta.page * memberMeta.size : 0;
	const hasNext = memberMeta?.hasNext ?? false;
	const pageTitle = isDetailOpen ? "회원 상세" : "회원 관리";
	const pageDescription = memberMeta ? `전체 ${memberMeta.totalCount}명` : "회원 목록";

	useEffect(() => {
		let isCancelled = false;

		const fetchMemberList = async () => {
			try {
				setIsMemberLoading(true);
				setMemberError("");

				const data = await getMemberList({
					page: currentPage - 1,
				});

				if (isCancelled) {
					return;
				}
				if (!Array.isArray(data.members)) {
					throw new Error("회원 목록 응답을 확인해 주세요.");
				}

				if (data.totalPages > 0 && currentPage > data.totalPages) {
					setCurrentPage(data.totalPages);
					return;
				}

				setMembers(data.members);
				setMemberMeta({
					page: data.page,
					size: data.size,
					totalCount: data.totalCount,
					totalPages: data.totalPages,
					hasNext: data.hasNext,
				});
			} catch {
				if (!isCancelled) {
					setMembers([]);
					setMemberMeta(null);
					setMemberError("회원 목록을 불러오지 못했습니다.");
				}
			} finally {
				if (!isCancelled) {
					setIsMemberLoading(false);
				}
			}
		};

		fetchMemberList();

		return () => {
			isCancelled = true;
		};
	}, [currentPage, memberRefreshKey]);

	useEffect(() => {
		if (selectedMemberId === null) {
			return;
		}

		let isCancelled = false;

		const fetchMemberDetail = async () => {
			try {
				setIsMemberDetailLoading(true);
				setMemberDetailError("");

				const data = await getMemberDetail(selectedMemberId);

				if (isCancelled) {
					return;
				}
				if (
					data.memberId === undefined ||
					data.memberId === null ||
					String(data.memberId) !== String(selectedMemberId)
				) {
					throw new Error("회원 상세 응답을 확인해 주세요.");
				}

				setSelectedMember(data);
			} catch {
				if (!isCancelled) {
					setSelectedMember(null);
					setMemberDetailError("회원 정보를 불러오지 못했습니다.");
				}
			} finally {
				if (!isCancelled) {
					setIsMemberDetailLoading(false);
				}
			}
		};

		fetchMemberDetail();

		return () => {
			isCancelled = true;
		};
	}, [selectedMemberId, memberRefreshKey]);

	const handleBackClick = () => {
		if (actionSubmittingRef.current) {
			return;
		}
		setSelectedMemberId(null);
		setSelectedMember(null);
		setMemberDetailError("");
	};

	const handleMemberClick = (memberId) => {
		if (actionSubmittingRef.current) {
			return;
		}

		setSelectedMemberId(memberId);
		setSelectedMember(null);
		setMemberDetailError("");
		setIsMemberDetailLoading(true);
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
		if (actionSubmittingRef.current) {
			return;
		}
		if (modalType === "suspend-member" && (!canSuspendMember || selectedMemberId === null)) {
			return;
		}
		if (modalType === "unsuspend-member" && (!canUnsuspendMember || selectedMemberId === null)) {
			return;
		}

		actionSubmittingRef.current = true;
		setIsActionSubmitting(true);
		let errorMessage = "처리에 실패했습니다.";

		try {
			if (modalType === "suspend-member") {
				errorMessage = "회원 정지에 실패했습니다.";
				await suspendMember(selectedMemberId);
			}

			if (modalType === "unsuspend-member") {
				errorMessage = "회원 정지 해제에 실패했습니다.";
				await unsuspendMember(selectedMemberId);
			}

			if (modalType === "suspend-member" || modalType === "unsuspend-member") {
				setIsMemberDetailLoading(true);
				setIsMemberLoading(true);
				setMemberRefreshKey((key) => key + 1);
			}

			setModalType(null);
		} catch {
			alert(errorMessage);
		} finally {
			actionSubmittingRef.current = false;
			setIsActionSubmitting(false);
		}
	};

	let modalTitle = "회원 이용을 정지하시겠어요?";
	let modalDescription = `${selectedMember?.nickName || "선택한 회원"} 님의 서비스 이용이 중지됩니다.`;
	let modalButtonText = "회원 정지";
	let isDanger = true;

	if (modalType === "unsuspend-member") {
		modalTitle = "회원 정지를 해제하시겠어요?";
		modalDescription = `${selectedMember?.nickName || "선택한 회원"} 님을 정상 상태로 되돌립니다.`;
		modalButtonText = "정지 해제";
		isDanger = false;
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
							{!isMemberLoading && !memberError && members.map((item) => (
								<button
									className="admin_list_card"
									type="button"
									key={item.memberId}
									onClick={() => handleMemberClick(item.memberId)}
								>
									<div className="admin_card_title_row">
										<strong>{item.nickName}</strong>
										<span className="admin_status">{getMemberRoleLabel(item.role)}</span>
									</div>
									<p>{item.loginId}</p>
									<div className="admin_card_bottom_row">
										<span>
											회원 ID {item.memberId}
											{item.status && item.status !== "ACTIVE" && (
												<> · {getMemberStatusLabel(item.status)}</>
											)}
										</span>
										<img src={NextIcon} alt="" />
									</div>
								</button>
							))}
							{isMemberLoading && (
								<p className="admin_empty_text">회원 목록을 불러오는 중입니다.</p>
							)}
							{memberError && (
								<p className="admin_empty_text" role="alert">{memberError}</p>
							)}
							{!isMemberLoading && !memberError && members.length === 0 && (
								<p className="admin_empty_text">회원이 없습니다.</p>
							)}
						</div>
						{!isMemberLoading && !memberError && totalPages > 0 && (
							<AdminPagination
								currentPage={currentPage}
								totalPages={totalPages}
								pageStart={pageStart}
								totalCount={totalCount}
								visibleCount={members.length}
								hasNext={hasNext}
								setCurrentPage={setCurrentPage}
							/>
						)}
					</>
				)}
				{selectedMemberId !== null && isMemberDetailLoading && (
					<p className="admin_empty_text">회원 정보를 불러오는 중입니다.</p>
				)}
				{selectedMemberId !== null && memberDetailError && (
					<p className="admin_empty_text" role="alert">{memberDetailError}</p>
				)}
				{selectedMember && !isMemberDetailLoading && !memberDetailError && (
					<>
						<section className="admin_detail_card">
							<div className="admin_card_title_row">
								<h2>{selectedMember.nickName}</h2>
								<span
									className={`admin_status ${selectedMember.status === "SUSPENDED" ? "rejected" : ""}`}
								>
									{getMemberStatusLabel(selectedMember.status)}
								</span>
							</div>
							<p className="admin_member_account">회원 ID {selectedMember.memberId} · {selectedMember.loginId}</p>
							<dl className="admin_detail_info">
								<div>
									<dt>전화번호</dt>
									<dd>{selectedMember.phoneNumber || "-"}</dd>
								</div>
								<div>
									<dt>주소</dt>
									<dd>{selectedMember.roadAddress || "-"}</dd>
								</div>
								<div>
									<dt>로그인 방식</dt>
									<dd>{getSocialTypeLabel(selectedMember.socialType)}</dd>
								</div>
							</dl>
						</section>
						<section className="admin_stats member" aria-label="회원 활동">
							<div className="admin_stat_card">
								<p>작성 게시글</p>
								<strong>{selectedMember.postCount ?? "-"}</strong>
								<span>전체 작성 기록</span>
							</div>
							<div className="admin_stat_card">
								<p>작성 댓글</p>
								<strong>{selectedMember.commentCount ?? "-"}</strong>
								<span>전체 댓글 기록</span>
							</div>
						</section>
						<section className="admin_detail_card">
							<h2 className="admin_small_title">회원 정보</h2>
							<dl className="admin_detail_info">
								<div>
									<dt>회원 구분</dt>
									<dd>{getMemberRoleLabel(selectedMember.role)}</dd>
								</div>
								<div>
									<dt>반려동물</dt>
									<dd>{selectedMember.petCount === undefined || selectedMember.petCount === null ? "-" : `${selectedMember.petCount}마리`}</dd>
								</div>
							</dl>
						</section>
						<section className="admin_detail_card">
							<h2 className="admin_small_title">작성 게시글</h2>
							<div className="admin_member_posts">
								{(selectedMember.posts || []).map((post) => (
									<button
										className="admin_member_post_button"
										type="button"
										key={post.id ?? post.postId}
										onClick={() => navigate(`/community/${post.id ?? post.postId}`)}
									>
										<strong>{post.title}</strong>
										{post.content && (
											<p className="admin_member_post_content">{post.content}</p>
										)}
										<div className="admin_member_post_meta">
											{post.createdAt && (
												<span>{post.createdAt.replace("T", " ")}</span>
											)}
											{post.thumbnails?.length > 0 && (
												<span>사진 {post.thumbnails.length}장</span>
											)}
											{post.hasVideo && (
												<span>동영상 포함</span>
											)}
										</div>
									</button>
								))}
								{!selectedMember.posts?.length && (
									<p className="admin_empty_text">작성한 게시글이 없습니다.</p>
								)}
							</div>
						</section>
					</>
				)}
				{selectedMember && !isMemberDetailLoading && !memberDetailError && (
					<footer className="admin_detail_actions">
						<>
							<button
								className="admin_outline_button"
								type="button"
								onClick={handleBackClick}
								disabled={isActionSubmitting}
							>
								목록으로
							</button>
							<button
								className={canUnsuspendMember ? "admin_primary_button" : "admin_danger_button"}
								type="button"
								onClick={() => handleModalOpen(canUnsuspendMember ? "unsuspend-member" : "suspend-member")}
								disabled={isActionSubmitting || (!canSuspendMember && !canUnsuspendMember)}
								title={!canSuspendMember && !canUnsuspendMember ? "현재 회원 상태에서는 정지할 수 없습니다." : undefined}
							>
								{canUnsuspendMember ? "정지 해제" : "회원 정지"}
							</button>
						</>
					</footer>
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

export default AdminMembers;
