import { useEffect, useState } from "react";

import "./AdminVerification.css";
import { getVerificationList, getVerificationDetail, approveVerification, rejectVerification } from "./AdminApi";
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

function AdminVerification({ selectedVerificationId, setSelectedVerificationId, actionSubmittingRef, isActionSubmitting, setIsActionSubmitting }) {
	const [verifications, setVerifications] = useState([]);
	const [selectedVerification, setSelectedVerification] = useState(null);
	const [isVerificationLoading, setIsVerificationLoading] = useState(true);
	const [isVerificationDetailLoading, setIsVerificationDetailLoading] = useState(false);
	const [verificationError, setVerificationError] = useState("");
	const [verificationDetailError, setVerificationDetailError] = useState("");
	const [verificationRefreshKey, setVerificationRefreshKey] = useState(0);
	const [verificationDetailRefreshKey, setVerificationDetailRefreshKey] = useState(0);
	const [modalType, setModalType] = useState(null);
	const [reason, setReason] = useState("");
	const isDetailOpen = selectedVerificationId !== null;
	const trimmedReason = reason.trim();
	const isReasonValid = trimmedReason.length > 0 && trimmedReason.length <= 255;
	const pageTitle = isDetailOpen ? "인증 상세 심사" : "의사 인증";
	const pageDescription = isVerificationLoading || verificationError
		? "인증 신청 목록"
		: `심사 대기 ${verifications.length}건 · 오래된 접수순`;

	useEffect(() => {
		let isCancelled = false;

		const fetchVerificationList = async () => {
			try {
				setIsVerificationLoading(true);
				setVerificationError("");

				const data = await getVerificationList();

				if (isCancelled) {
					return;
				}
				if (!Array.isArray(data)) {
					throw new Error("인증 신청 목록 응답을 확인해 주세요.");
				}

				setVerifications(data);
			} catch {
				if (!isCancelled) {
					setVerifications([]);
					setVerificationError("인증 신청 목록을 불러오지 못했습니다.");
				}
			} finally {
				if (!isCancelled) {
					setIsVerificationLoading(false);
				}
			}
		};

		fetchVerificationList();

		return () => {
			isCancelled = true;
		};
	}, [verificationRefreshKey]);

	useEffect(() => {
		if (selectedVerificationId === null) {
			return;
		}

		let isCancelled = false;

		const fetchVerificationDetail = async () => {
			try {
				setIsVerificationDetailLoading(true);
				setVerificationDetailError("");

				const data = await getVerificationDetail(selectedVerificationId);

				if (isCancelled) {
					return;
				}
				if (
					data.verificationId === undefined ||
					data.verificationId === null ||
					String(data.verificationId) !== String(selectedVerificationId)
				) {
					throw new Error("인증 신청 상세 응답을 확인해 주세요.");
				}

				setSelectedVerification(data);
			} catch {
				if (!isCancelled) {
					setSelectedVerification(null);
					setVerificationDetailError("인증 신청 정보를 불러오지 못했습니다.");
				}
			} finally {
				if (!isCancelled) {
					setIsVerificationDetailLoading(false);
				}
			}
		};

		fetchVerificationDetail();

		return () => {
			isCancelled = true;
		};
	}, [selectedVerificationId, verificationDetailRefreshKey]);

	const handleBackClick = () => {
		if (actionSubmittingRef.current) {
			return;
		}

		setSelectedVerificationId(null);
		setSelectedVerification(null);
		setVerificationDetailError("");
	};

	const handleVerificationClick = (verificationId) => {
		if (actionSubmittingRef.current) {
			return;
		}

		setSelectedVerificationId(verificationId);
		setSelectedVerification(null);
		setVerificationDetailError("");
		setIsVerificationDetailLoading(true);
	};

	const handleImageRefreshClick = () => {
		if (actionSubmittingRef.current) {
			return;
		}

		setIsVerificationDetailLoading(true);
		setVerificationDetailRefreshKey((key) => key + 1);
	};

	const handleModalOpen = (type) => {
		if (actionSubmittingRef.current) {
			return;
		}

		setReason("");
		setModalType(type);
	};

	const handleModalClose = () => {
		if (actionSubmittingRef.current) {
			return;
		}

		setModalType(null);
		setReason("");
	};

	const handleConfirmClick = async () => {
		if (actionSubmittingRef.current || selectedVerificationId === null || !selectedVerification) {
			return;
		}
		if (modalType !== "approve-verification" && modalType !== "reject-verification") {
			return;
		}
		if (modalType === "reject-verification" && !isReasonValid) {
			return;
		}

		actionSubmittingRef.current = true;
		setIsActionSubmitting(true);
		let errorMessage = "의사 인증 승인에 실패했습니다.";

		try {
			if (modalType === "reject-verification") {
				errorMessage = "의사 인증 반려에 실패했습니다.";
				await rejectVerification({
					verificationId: selectedVerificationId,
					reason: trimmedReason,
				});
			} else {
				await approveVerification(selectedVerificationId);
			}

			setIsVerificationLoading(true);
			setSelectedVerificationId(null);
			setSelectedVerification(null);
			setVerificationDetailError("");
			setModalType(null);
			setReason("");
			setVerificationRefreshKey((key) => key + 1);
		} catch {
			alert(errorMessage);
		} finally {
			actionSubmittingRef.current = false;
			setIsActionSubmitting(false);
		}
	};

	let modalTitle = "의사 인증을 승인하시겠어요?";
	let modalDescription = `${selectedVerification?.nickName || "선택한 회원"} 님을 의사로 인증합니다.`;
	let modalButtonText = "인증 승인";
	const isReject = modalType === "reject-verification";

	if (isReject) {
		modalTitle = "의사 인증을 반려하시겠어요?";
		modalDescription = "반려 사유를 입력해 주세요.";
		modalButtonText = "인증 반려";
	}

	return (
		<>
			<main className="admin_main">
				<div className="admin_title_row">
					<div className="admin_title">
						{isDetailOpen && (
							<button
								className="admin_back_button"
								type="button"
								onClick={handleBackClick}
								disabled={isActionSubmitting}
								aria-label="목록으로 돌아가기"
							>
								<img src={BackIcon} alt="" />
							</button>
						)}
						<h1>{pageTitle}</h1>
					</div>
				</div>
				{!isDetailOpen && (
					<>
						<p className="admin_description">{pageDescription}</p>
						<div className="admin_list">
							{!isVerificationLoading && !verificationError && verifications.map((item) => (
								<button
									className="admin_list_card"
									type="button"
									key={item.verificationId}
									onClick={() => handleVerificationClick(item.verificationId)}
								>
									<div className="admin_card_title_row">
										<strong>{item.nickName}</strong>
										<span className="admin_status pending">심사 대기</span>
									</div>
									<p>신청 번호 {item.verificationId}</p>
									<div className="admin_card_bottom_row">
										<span>{formatDate(item.createdAt) || "-"}</span>
										<img src={NextIcon} alt="" />
									</div>
								</button>
							))}
							{isVerificationLoading && (
								<p className="admin_empty_text">인증 신청 목록을 불러오는 중입니다.</p>
							)}
							{verificationError && (
								<p className="admin_empty_text" role="alert">{verificationError}</p>
							)}
							{!isVerificationLoading && !verificationError && verifications.length === 0 && (
								<p className="admin_empty_text">심사 대기 중인 인증 신청이 없습니다.</p>
							)}
						</div>
					</>
				)}
				{isDetailOpen && isVerificationDetailLoading && (
					<p className="admin_empty_text">인증 신청 정보를 불러오는 중입니다.</p>
				)}
				{isDetailOpen && verificationDetailError && (
					<p className="admin_empty_text" role="alert">{verificationDetailError}</p>
				)}
				{selectedVerification && !isVerificationDetailLoading && !verificationDetailError && (
					<>
						<section className="admin_detail_card">
							<div className="admin_card_title_row">
								<h2>{selectedVerification.nickName}</h2>
								<span className="admin_status pending">심사 대기</span>
							</div>
							<dl className="admin_detail_info">
								<div>
									<dt>신청 번호</dt>
									<dd>{selectedVerification.verificationId}</dd>
								</div>
								<div>
									<dt>전화번호</dt>
									<dd>{selectedVerification.phoneNumber || "-"}</dd>
								</div>
								<div>
									<dt>신청일</dt>
									<dd>{formatDate(selectedVerification.createdAt) || "-"}</dd>
								</div>
							</dl>
						</section>
						<section className="admin_detail_card">
							<div className="admin_verification_attachment_header">
								<div>
									<h2 className="admin_small_title">의사 면허증</h2>
									<p className="admin_verification_attachment_description">제출된 면허증 사진</p>
								</div>
								<button
									className="admin_verification_refresh_button"
									type="button"
									onClick={handleImageRefreshClick}
									disabled={isActionSubmitting}
								>
									사진 다시 불러오기
								</button>
							</div>
							{selectedVerification.licenseImageUrl && (
								<a
									className="admin_outline_button admin_verification_image_link"
									href={selectedVerification.licenseImageUrl}
									target="_blank"
									rel="noopener noreferrer"
									aria-disabled={isActionSubmitting}
									onClick={(event) => {
										if (actionSubmittingRef.current) {
											event.preventDefault();
										}
									}}
								>
									첨부 사진 확인
								</a>
							)}
							{!selectedVerification.licenseImageUrl && (
								<p className="admin_verification_image_error" role="alert">면허증 사진을 불러오지 못했습니다.</p>
							)}
						</section>
						<section className="admin_verification_notice">
							<h2>심사 전 확인해 주세요</h2>
							<p>제출된 면허증 사진을 확인한 후 승인 또는 반려해 주세요.</p>
						</section>
						<footer className="admin_detail_actions admin_verification_footer">
							<button
								className="admin_outline_button"
								type="button"
								onClick={() => handleModalOpen("reject-verification")}
								disabled={isActionSubmitting}
							>
								인증 반려
							</button>
							<button
								className="admin_primary_button"
								type="button"
								onClick={() => handleModalOpen("approve-verification")}
								disabled={isActionSubmitting}
							>
								인증 승인
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
				isDanger={isReject}
				isActionSubmitting={isActionSubmitting}
				isConfirmDisabled={isReject && !isReasonValid}
				handleModalClose={handleModalClose}
				handleConfirmClick={handleConfirmClick}
			>
				{isReject && (
					<div className="admin_verification_reason">
						<label htmlFor="admin-verification-reason">반려 사유 (필수)</label>
						<textarea
							id="admin-verification-reason"
							value={reason}
							onChange={(event) => setReason(event.target.value)}
							placeholder="반려 사유를 입력해 주세요."
							maxLength={255}
							required
							disabled={isActionSubmitting}
						/>
						<span>{reason.length}/255</span>
					</div>
				)}
			</AdminModal>
		</>
	);
}

export default AdminVerification;
