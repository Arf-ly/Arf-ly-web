import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./CommunityWrite.css";
import { createPost } from "./CommunityApi";

import BackIcon from "../../assets/community/back.svg";
import ImageIcon from "../../assets/community/image.svg";
import ExitImageIcon from "../../assets/community/exit_image.svg";

/** 새 게시글의 제목과 내용, 첨부 파일 입력 및 등록을 제공한다. */
function CommunityWrite() {
	const navigate = useNavigate();
	const fileInputRef = useRef(null);

	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [files, setFiles] = useState([]);
	const [previewItems, setPreviewItems] = useState([]);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isTitleEmpty = title.trim() === "";
	const isContentEmpty = content.trim() === "";
	const isActive = !isTitleEmpty && !isContentEmpty;

	useEffect(() => {
		return () => {
			previewItems.forEach((item) => URL.revokeObjectURL(item.url));
		};
	}, [previewItems]);

	/** 게시글 작성 화면에서 이전 화면으로 돌아간다. */
	const handleBackClick = () => {
		navigate(-1);
	};

	/** 게시글 제목 입력값과 내용에 맞는 입력창 높이를 갱신한다. */
	const handleTitleChange = (event) => {
		setTitle(event.target.value);

		event.target.style.height = "auto";
		event.target.style.height = `${event.target.scrollHeight}px`;
	};

	/** 게시글에 첨부할 파일을 선택하는 창을 연다. */
	const handleFileButtonClick = () => {
		fileInputRef.current.click();
	};

	/** 이름과 크기, 수정 시각을 비교해 중복 첨부 파일인지 확인한다. */
	const isSameFile = (fileA, fileB) => {
		return (
			fileA.name === fileB.name &&
			fileA.size === fileB.size &&
			fileA.lastModified === fileB.lastModified
		);
	};

	/** 게시글에 첨부할 수 있는 파일 형식인지 확인한다. */
	const isAllowedFile = (file) => {
		const allowedTypes = [
			"image/png",
			"image/jpeg",
			"image/jpg",
			"image/webp",
			"video/mp4",
			"video/quicktime",
		];

		return allowedTypes.includes(file.type);
	};

	/** 첨부 파일마다 미리보기 주소와 식별 정보를 생성한다. */
	const makePreviewItems = (targetFiles) => {
		return targetFiles.map((file) => ({
			url: URL.createObjectURL(file),
			type: file.type.startsWith("video/") ? "video" : "image",
			name: file.name,
		}));
	};

	/** 파일 형식과 중복, 개수를 확인하고 첨부 목록에 추가한다. */
	const handleFileChange = (event) => {
		const selectedFiles = Array.from(event.target.files);

		if (selectedFiles.length === 0) {
			return;
		}

		const allowedFiles = selectedFiles.filter((file) => isAllowedFile(file));

		if (allowedFiles.length !== selectedFiles.length) {
			alert(
				"이미지 또는 동영상 파일만 업로드할 수 있습니다."
			);
		}

		const newFiles = allowedFiles.filter((selectedFile) => {
			return !files.some((existingFile) =>
				isSameFile(existingFile, selectedFile)
			);
		});

		if (newFiles.length === 0) {
			event.target.value = "";
			return;
		}

		const nextFiles = [...files, ...newFiles];
		const limitedFiles = nextFiles.slice(0, 5);

		if (nextFiles.length > 5) {
			alert("파일은 최대 5개까지 업로드할 수 있습니다.");
		}

		previewItems.forEach((item) => URL.revokeObjectURL(item.url));

		setFiles(limitedFiles);
		setPreviewItems(makePreviewItems(limitedFiles));

		event.target.value = "";
	};

	/** 선택한 첨부 파일을 제거하고 관련 미리보기 주소를 정리한다. */
	const handleRemoveFile = (removeIndex) => {
		const nextFiles = files.filter((_, index) => index !== removeIndex);

		previewItems.forEach((item) => URL.revokeObjectURL(item.url));

		setFiles(nextFiles);
		setPreviewItems(makePreviewItems(nextFiles));
	};

	/** 입력한 게시글과 첨부 파일을 등록하고 커뮤니티 목록으로 이동한다. */
	const handleSubmit = async () => {
		setIsSubmitted(true);

		if (!isActive || isSubmitting) {
			return;
		}

		try {
			setIsSubmitting(true);

			await createPost({
				title: title.trim(),
				content: content.trim(),
				files,
			});

			navigate("/community");
		} catch {
			alert("게시글 작성에 실패했습니다.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="community_write_page">
			<header className="community_write_header">
				<button
					className="community_write_back_button"
					type="button"
					onClick={handleBackClick}
					aria-label="뒤로가기"
				>
					<img src={BackIcon} alt="" />
				</button>

				<h1>글 쓰기</h1>

				<button
					className={`community_write_submit_button ${
						isActive ? "active" : ""
					}`}
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
				>
					완료
				</button>
			</header>

			{isSubmitting ? (
				<main className="community_write_main">
					<p className="community_write_state_text">
						게시글을 업로드 중입니다.
					</p>
				</main>
			) : (
				<main className="community_write_main">
					<section className="community_write_field">
						<textarea
							className={`community_write_title_input ${
								isSubmitted && isTitleEmpty ? "error" : ""
							}`}
							value={title}
							onChange={handleTitleChange}
							placeholder="제목을 입력해주세요."
							maxLength={50}
							rows={1}
						/>

						{isSubmitted && isTitleEmpty && (
							<p className="community_write_error_text">
								* 제목을 입력해주세요
							</p>
						)}
					</section>

					<section className="community_write_field content">
						<textarea
							className={`community_write_content_input ${
								isSubmitted && isContentEmpty ? "error" : ""
							}`}
							value={content}
							onChange={(event) => setContent(event.target.value)}
							placeholder={
								"우리 아이의 이야기, 궁금한 점, 일상 등\n반려동물 이야기를 자유롭게 적어보세요."
							}
						/>

						{isSubmitted && isContentEmpty && (
							<p className="community_write_error_text">
								* 내용을 입력해주세요
							</p>
						)}
					</section>

					<section className="community_write_file_section">
						<button
							className="community_write_file_add_button"
							type="button"
							onClick={handleFileButtonClick}
						>
							<img src={ImageIcon} alt="" />
							<span>사진 추가</span>
						</button>

						{previewItems.map((item, index) => (
							<div className="community_write_file_preview" key={item.url}>
								{item.type === "image" ? (
									<img src={item.url} alt={`첨부 이미지 ${index + 1}`} />
								) : (
									<video src={item.url} muted playsInline />
								)}

								{item.type === "video" && (
									<span className="community_write_video_badge">
										동영상
									</span>
								)}

								<button
									type="button"
									onClick={() => handleRemoveFile(index)}
									aria-label="파일 삭제"
								>
									<img src={ExitImageIcon} alt="" />
								</button>
							</div>
						))}
					</section>

					<input
						ref={fileInputRef}
						className="community_write_file_input"
						type="file"
						accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime"
						multiple
						onChange={handleFileChange}
					/>
				</main>
			)}
		</div>
	);
}

export default CommunityWrite;
