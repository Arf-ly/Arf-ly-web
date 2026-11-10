import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import "./CommunityReport.css";
import { submitCommunityReport } from "./CommunityApi";

import BackIcon from "../../assets/community/back.svg";
import ComplainIcon from "../../assets/community/complain.svg";

/** 신고 내용 입력과 이탈 확인, 신고 접수 결과를 관리한다. */
function CommunityReport() {
	const navigate = useNavigate();
	const { postId } = useParams();
	const location = useLocation();

	const modalRef = useRef(null);
	const submittingRef = useRef(false);

	const [detail, setDetail] = useState("");
	const [modalType, setModalType] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isDetailEmpty = detail.trim() === "";
	const isActive = !isDetailEmpty;
	const isDirty = detail !== "";

	useEffect(() => {
		const element = modalRef.current;

		if (modalType && !element.open) {
			element.showModal();
		}

		if (!modalType && element.open) {
			element.close();
		}
	}, [modalType]);

	useEffect(() => {
		if (!isDirty || modalType === "success") {
			return;
		}

		/** 작성 중인 신고 내용이 있을 때 브라우저 이탈 확인을 요청한다. */
		const handleBeforeUnload = (event) => {
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener(
				"beforeunload",
				handleBeforeUnload
			);
		};
	}, [isDirty, modalType]);

	/** 신고 대상 게시글의 상세 화면으로 돌아간다. */
	const returnToPost = () => {
		navigate(`/community/${postId}`, { replace: true });
	};

	/** 작성한 신고 내용이 있으면 이탈을 확인하고 없으면 게시글로 돌아간다. */
	const handleBackClick = () => {
		if (isDirty) {
			setModalType("discard");
			return;
		}

		returnToPost();
	};

	/** 신고 접수 상태에 따라 확인 창을 닫거나 게시글로 돌아간다. */
	const handleModalClose = () => {
		if (submittingRef.current) {
			return;
		}

		if (modalType === "success") {
			returnToPost();
			return;
		}

		setModalType(null);
	};

	/** 유효한 신고 내용이 입력되어 있으면 접수 확인 창을 연다. */
	const handleReportClick = () => {
		if (isActive && !isSubmitting) {
			setModalType("confirm");
		}
	};

	/** 게시글 식별자와 입력 내용을 확인해 신고를 접수하고 결과를 표시한다. */
	const handleSubmit = async () => {
		if (!isActive || submittingRef.current) {
			return;
		}

		if (!/^[1-9]\d*$/.test(String(postId ?? ""))) {
			setModalType(null);
			alert("신고할 게시글을 찾을 수 없습니다.");
			return;
		}

		submittingRef.current = true;
		setIsSubmitting(true);

		try {
			await submitCommunityReport({
				postId,
				detail: detail.trim(),
			});

			setModalType("success");
		} catch {
			setModalType(null);
			alert("신고 접수에 실패했습니다.");
		} finally {
			submittingRef.current = false;
			setIsSubmitting(false);
		}
	};

	/** 신고 모달 상태에 따라 신고를 접수하거나 게시글로 돌아간다. */
	const handleModalPrimaryClick = () => {
		if (modalType === "success" || modalType === "discard") {
			returnToPost();
			return;
		}

		handleSubmit();
	};

	let modalTitle = "신고하시겠어요?";
	let modalPrimaryText = isSubmitting ? "접수 중…" : "신고하기";

	if (modalType === "success") {
		modalTitle = "신고 접수 완료";
		modalPrimaryText = "확인";
	}

	if (modalType === "discard") {
		modalTitle = "작성을 그만두시겠어요?";
		modalPrimaryText = "나가기";
	}

	return (
		<div className="community_report_page">
			<header className="community_report_header">
				<button
					className="community_report_back_button"
					type="button"
					onClick={handleBackClick}
					disabled={isSubmitting}
					aria-label="게시글로 돌아가기"
				>
					<img src={BackIcon} alt="" />
				</button>

				<h1>신고하기</h1>

				<button
					className={`community_report_submit_button ${
						isActive ? "active" : ""
					}`}
					type="button"
					onClick={handleReportClick}
					disabled={!isActive || isSubmitting}
				>
					완료
				</button>
			</header>

			<main className="community_report_main">
				<section className="community_report_field">
					{location.state?.postTitle && (
						<p className="community_report_target">
							신고할 게시글
							<strong>{location.state.postTitle}</strong>
						</p>
					)}

					<label
						className="community_report_field_label"
						htmlFor="report-detail"
					>
						신고 사유 <span>필수</span>
					</label>

					<textarea
						id="report-detail"
						className="community_report_content_input"
						value={detail}
						onChange={(event) => setDetail(event.target.value)}
						placeholder={
							"신고 사유를 작성해주세요.\n어떤 내용이 문제인지 자세히 알려주세요."
						}
						required
						disabled={isSubmitting}
						aria-describedby="report-detail-help"
					/>

					<p
						className="community_report_hint"
						id="report-detail-help"
					>
						작성해주신 내용을 확인한 후 처리할게요.
					</p>
				</section>
			</main>

			<dialog
				className="community_report_modal"
				ref={modalRef}
				aria-labelledby="report-modal-title"
				aria-describedby="report-modal-description"
				onCancel={(event) => {
					event.preventDefault();
					handleModalClose();
				}}
			>
				<div
					className="community_report_modal_icon"
					aria-hidden="true"
				>
					{modalType === "success" ? (
						<span>✓</span>
					) : (
						<img src={ComplainIcon} alt="" />
					)}
				</div>

				<h2 id="report-modal-title">{modalTitle}</h2>

				<p id="report-modal-description">
					{modalType === "success" ? (
						<>
							더 안전한 커뮤니티를 위해
							<br />
							운영팀이 내용을 꼼꼼히 확인할게요.
						</>
					) : modalType === "discard" ? (
						<>작성 중인 내용은 저장되지 않아요.</>
					) : (
						<>
							작성한 내용으로 게시글을 신고해요.
							<br />
							접수 전에 내용을 다시 확인해 주세요.
						</>
					)}
				</p>

				{modalType !== "success" && (
					<button
						className="community_report_modal_cancel_button"
						type="button"
						onClick={() => setModalType(null)}
						disabled={isSubmitting}
					>
						{modalType === "discard"
							? "계속 작성하기"
							: "취소"}
					</button>
				)}

				<button
					className="community_report_modal_primary_button"
					type="button"
					onClick={handleModalPrimaryClick}
					disabled={isSubmitting}
				>
					{modalPrimaryText}
				</button>
			</dialog>
		</div>
	);
}

export default CommunityReport;