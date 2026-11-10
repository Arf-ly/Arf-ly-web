import { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import "./CommunityEdit.css";

import { getPostDetail, updatePost } from "./CommunityApi";

import BackIcon from "../../assets/community/back.svg";

import ImageIcon from "../../assets/community/image.svg";

import ExitImageIcon from "../../assets/community/exit_image.svg";

/** 서로 다른 첨부 파일 응답 형식에서 이미지 주소를 추출한다. */
const getMediaUrl = (media) => {

	if (!media) {
		return "";
	}
	if (typeof media === "string") {
		if (media.startsWith("http://") || media.startsWith("https://")) {
			return media;
		}
		return "";
	}
	return (
		media.url ||
		media.fileUrl ||
		media.imageUrl ||
		media.thumbnailUrl ||
		media.mediaUrl ||
		media.s3Url ||
		media.uploadUrl ||
		media.originUrl ||
		media.presignedUrl ||
		media.accessUrl ||
		media.filePath ||
		""
	);

};

/** 게시글 응답의 첨부 파일 정보를 화면에서 사용할 이미지 목록으로 정리한다. */
const getPostImages = (post) => {

	if (!post) {
		return [];
	}
	const images =
		post.images ||
		post.imageUrls ||
		post.fileUrls ||
		post.mediaUrls ||
		post.postImages ||
		post.attachments ||
		post.imageUrlList ||
		post.mediaList ||
		post.medias ||
		post.files ||
		[];
	if (!Array.isArray(images)) {
		return [];
	}
	return images
		.map((image, index) => {
			const imageUrl = getMediaUrl(image);
			const fileId =
				image?.fileId ??
				image?.id ??
				image?.imageId ??
				image?.postImageId ??
				image?.postFileId ??
				image?.attachmentId ??
				image?.mediaId ??
				null;
			const mediaType =
				image?.type ||
				image?.contentType ||
				image?.mimeType ||
				image?.fileType ||
				"";
			return {
				id: fileId ?? image?.fileKey ?? imageUrl ?? index,
				fileId,
				url: imageUrl,
				type: mediaType.startsWith("video") ? "video" : "image",
				isExisting: true,
			};
		})
		.filter((image) => image.url);

};

/** 기존 게시글의 내용과 첨부 이미지를 불러와 수정 및 저장을 제공한다. */
function CommunityEdit() {

	const navigate = useNavigate();
	const location = useLocation();
	const { postId } = useParams();
	const fileInputRef = useRef(null);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [files, setFiles] = useState([]);
	const [previewItems, setPreviewItems] = useState([]);
	const [deleteFileIds, setDeleteFileIds] = useState([]);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const isTitleEmpty = title.trim() === "";
	const isContentEmpty = content.trim() === "";
	const isActive = !isTitleEmpty && !isContentEmpty;
	useEffect(() => {
		const post = location.state?.post;
		if (post) {
			const postImages = getPostImages(post);
			setTitle(post.title || "");
			setContent(post.content || "");
			setPreviewItems(postImages);
			return;
		}
		/** 게시글 상세 내용을 불러와 화면 상태를 갱신한다. */
		const fetchPostDetail = async () => {
			try {
				setIsLoading(true);
				const data = await getPostDetail(postId);
				const postData = data.post || data.data || data.result || data;
				const postImages = getPostImages(postData);
				setTitle(postData.title || "");
				setContent(postData.content || "");
				setPreviewItems(postImages);
			} catch {
				alert("게시글 정보를 불러오지 못했습니다.");
				navigate("/community");
			} finally {
				setIsLoading(false);
			}
		};
		fetchPostDetail();
	}, [location.state, navigate, postId]);
	useEffect(() => {
		return () => {
			previewItems.forEach((item) => {
				if (!item.isExisting) {
					URL.revokeObjectURL(item.url);
				}
			});
		};
	}, [previewItems]);
	/** 게시글 수정 화면에서 커뮤니티 목록으로 이동한다. */
	const handleBackClick = () => {
		navigate("/community");
	};
	/** 게시글 제목 입력값과 내용에 맞는 입력창 높이를 갱신한다. */
	const handleTitleChange = (event) => {
		setTitle(event.target.value);
		event.target.style.height = "auto";
		event.target.style.height = `${event.target.scrollHeight}px`;
	};
	/** 게시글에 첨부할 파일을 선택하는 창을 연다. */
	const handleFileButtonClick = () => {
		fileInputRef.current?.click();
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
			isExisting: false,
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
		const existingPreviewItems = previewItems.filter((item) => item.isExisting);
		const nextFiles = [...files, ...newFiles];
		const maxNewFileCount = 5 - existingPreviewItems.length;
		const limitedFiles = nextFiles.slice(0, maxNewFileCount);
		if (existingPreviewItems.length + nextFiles.length > 5) {
			alert("파일은 최대 5개까지 업로드할 수 있습니다.");
		}
		previewItems.forEach((item) => {
			if (!item.isExisting) {
				URL.revokeObjectURL(item.url);
			}
		});
		setFiles(limitedFiles);
		setPreviewItems([
			...existingPreviewItems,
			...makePreviewItems(limitedFiles),
		]);
		event.target.value = "";
	};
	/** 선택한 첨부 파일을 제거하고 관련 미리보기 주소를 정리한다. */
	const handleRemoveFile = (removeIndex) => {
		const removeItem = previewItems[removeIndex];
		if (
			removeItem.isExisting &&
			removeItem.fileId !== null &&
			removeItem.fileId !== undefined
		) {
			setDeleteFileIds((prevIds) => {
				const nextFileId = Number(removeItem.fileId);
				if (prevIds.includes(nextFileId)) {
					return prevIds;
				}
				return [...prevIds, nextFileId];
			});
		}
		if (!removeItem.isExisting) {
			URL.revokeObjectURL(removeItem.url);
		}
		const nextPreviewItems = previewItems.filter(
			(_, index) => index !== removeIndex
		);
		if (removeItem.isExisting) {
			setPreviewItems(nextPreviewItems);
			return;
		}
		const newFileIndex = previewItems
			.slice(0, removeIndex)
			.filter((item) => !item.isExisting).length;
		const nextFiles = files.filter((_, index) => index !== newFileIndex);
		setFiles(nextFiles);
		setPreviewItems(nextPreviewItems);
	};
	/** 변경한 게시글 내용과 첨부 파일을 저장하고 상세 화면으로 이동한다. */
	const handleSubmit = async () => {
		setIsSubmitted(true);
		if (!isActive || isSubmitting) {
			return;
		}
		try {
			setIsSubmitting(true);
			await updatePost({
				postId,
				title: title.trim(),
				content: content.trim(),
				files,
				deleteFileIds,
			});
			navigate(`/community/${postId}`);
		} catch {
			alert("게시글 수정에 실패했습니다.");
		} finally {
			setIsSubmitting(false);
		}
	};
	if (isLoading) {
		return (
			<div className="community_edit_page">
				<header className="community_edit_header">
					<button
						className="community_edit_back_button"
						type="button"
						onClick={handleBackClick}
						aria-label="뒤로가기"
					>
						<img src={BackIcon} alt="" />
					</button>
					<h1>글 수정</h1>
				</header>
				<main className="community_edit_main">
					<p className="community_edit_state_text">
						게시글 정보를 불러오는 중입니다.
					</p>
				</main>
			</div>
		);
	}
	return (
		<div className="community_edit_page">
			<header className="community_edit_header">
				<button
					className="community_edit_back_button"
					type="button"
					onClick={handleBackClick}
					aria-label="뒤로가기"
				>
					<img src={BackIcon} alt="" />
				</button>
				<h1>글 수정</h1>
				<button
					className={`community_edit_submit_button ${
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
				<main className="community_edit_main">
					<p className="community_edit_state_text">
						게시글을 수정 중입니다.
					</p>
				</main>
			) : (
				<main className="community_edit_main">
					<section className="community_edit_field">
						<textarea
							className={`community_edit_title_input ${
								isSubmitted && isTitleEmpty ? "error" : ""
							}`}
							value={title}
							onChange={handleTitleChange}
							placeholder="제목을 입력해주세요."
							maxLength={50}
							rows={1}
						/>
						{isSubmitted && isTitleEmpty && (
							<p className="community_edit_error_text">
								* 제목을 입력해주세요
							</p>
						)}
					</section>
					<section className="community_edit_field content">
						<textarea
							className={`community_edit_content_input ${
								isSubmitted && isContentEmpty ? "error" : ""
							}`}
							value={content}
							onChange={(event) => setContent(event.target.value)}
							placeholder={
								"우리 아이의 이야기, 궁금한 점, 일상 등\n반려동물 이야기를 자유롭게 적어보세요."
							}
						/>
						{isSubmitted && isContentEmpty && (
							<p className="community_edit_error_text">
								* 내용을 입력해주세요
							</p>
						)}
					</section>
					<section className="community_edit_file_section">
						<button
							className="community_edit_file_add_button"
							type="button"
							onClick={handleFileButtonClick}
						>
							<img src={ImageIcon} alt="" />
							<span>사진 추가</span>
						</button>
						{previewItems.map((item, index) => (
							<div
								className="community_edit_file_preview"
								key={`${item.url}-${index}`}
							>
								{item.type === "video" ? (
									<video src={item.url} muted playsInline />
								) : (
									<img src={item.url} alt={`첨부 이미지 ${index + 1}`} />
								)}
								{item.type === "video" && (
									<span className="community_edit_video_badge">
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
						className="community_edit_file_input"
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

export default CommunityEdit;
