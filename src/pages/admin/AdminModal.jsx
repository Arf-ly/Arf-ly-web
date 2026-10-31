import { useEffect, useRef } from "react";

function AdminModal({ modalType, modalTitle, modalDescription, modalButtonText, isDanger = false, isActionSubmitting = false, isConfirmDisabled = false, handleModalClose, handleConfirmClick, children }) {
	const modalRef = useRef(null);

	useEffect(() => {
		const element = modalRef.current;

		if (modalType && !element.open) {
			element.showModal();
		}

		if (!modalType && element.open) {
			element.close();
		}
	}, [modalType]);

	return (
		<dialog
			className="admin_modal"
			ref={modalRef}
			aria-labelledby="admin-modal-title"
			aria-describedby="admin-modal-description"
			onCancel={(event) => {
				event.preventDefault();
				handleModalClose();
			}}
		>
			<h2 id="admin-modal-title">{modalTitle}</h2>
			<p id="admin-modal-description">{modalDescription}</p>
			{children}
			<div className="admin_modal_actions">
				<button
					className="admin_outline_button"
					type="button"
					onClick={handleModalClose}
					disabled={isActionSubmitting}
				>
					취소
				</button>
				<button
					className={isDanger ? "admin_danger_button" : "admin_primary_button"}
					type="button"
					onClick={handleConfirmClick}
					disabled={isActionSubmitting || isConfirmDisabled}
				>
					{isActionSubmitting ? "처리 중..." : modalButtonText}
				</button>
			</div>
		</dialog>
	);
}

export default AdminModal;
