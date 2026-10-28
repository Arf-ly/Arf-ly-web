import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./CommunityDetail.css";

import {
	createComment,
	deletePost,
	getPostDetail,
	togglePostLike,
} from "./CommunityApi";

import BackIcon from "../../assets/community/back.svg";
import EctIcon from "../../assets/community/ect.svg";
import HeartIcon from "../../assets/community/heart.svg";
import HeartActiveIcon from "../../assets/community/heart_active.svg";
import SendIcon from "../../assets/community/send.svg";
import SendActiveIcon from "../../assets/community/send_active.svg";
import ComplainIcon from "../../assets/community/complain.svg";
import DeleteIcon from "../../assets/community/delete.svg";
import EditIcon from "../../assets/community/edit.svg";

const formatDate = (createdAt) => {
	if (!createdAt) {
		return "";
	}

	const date = new Date(createdAt);

	if (Number.isNaN(date.getTime())) {
		return createdAt;
	}

	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hour = String(date.getHours()).padStart(2, "0");
	const minute = String(date.getMinutes()).padStart(2, "0");

	return `${month}/${day} ${hour}:${minute}`;
};

const renderCommentContent = (content) => {
	if (!content) {
		return "";
	}

	const parts = [];
	const mentionRegex = /@\[([^\]]+)\]\(user:\d+\)/g;

	let lastIndex = 0;
	let match = mentionRegex.exec(content);

	while (match) {
		if (match.index > lastIndex) {
			parts.push(content.slice(lastIndex, match.index));
		}

		parts.push(
			<span
				className="community_detail_comment_mention"
				key={`${match[1]}-${match.index}`}
			>
				@{match[1]}
			</span>
		);

		lastIndex = mentionRegex.lastIndex;
		match = mentionRegex.exec(content);
	}

	if (lastIndex < content.length) {
		parts.push(content.slice(lastIndex));
	}

	return parts;
};

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

			return {
				id:
					image?.fileId ||
					image?.id ||
					image?.fileKey ||
					imageUrl ||
					index,
				url: imageUrl,
			};
		})
		.filter((image) => image.url);
};

const getComments = (post) => {
	const comments =
		post?.comments ||
		post?.commentList ||
		post?.postComments ||
		post?.commentResponses ||
		[];

	if (!Array.isArray(comments)) {
		return [];
	}

	return comments;
};

const getWriterName = (post) => {
	return (
		post?.authorNickname ||
		post?.authorNickName ||
		post?.writerName ||
		post?.authorName ||
		post?.nickname ||
		post?.userNickname ||
		post?.memberName ||
		post?.name ||
		""
	);
};

const getCommentWriterName = (comment) => {
	return (
		comment.authorNickName ||
		comment.authorNickname ||
		comment.writerName ||
		comment.authorName ||
		comment.nickname ||
		comment.userNickname ||
		comment.memberName ||
		comment.name ||
		""
	);
};

const getCommentWriterId = (comment) => {
	return (
		comment.authorId ||
		comment.writerId ||
		comment.userId ||
		comment.memberId ||
		comment.commentWriterId ||
		null
	);
};

const checkIsMine = (post) => {
	if (!post) {
		return false;
	}

	if (typeof post.mine === "boolean") {
		return post.mine;
	}

	if (typeof post.isMine === "boolean") {
		return post.isMine;
	}

	if (typeof post.myPost === "boolean") {
		return post.myPost;
	}

	if (typeof post.isAuthor === "boolean") {
		return post.isAuthor;
	}

	if (typeof post.owner === "boolean") {
		return post.owner;
	}

	if (typeof post.isOwner === "boolean") {
		return post.isOwner;
	}

	if (typeof post.createdByMe === "boolean") {
		return post.createdByMe;
	}

	const myUserId =
		localStorage.getItem("userId") ||
		localStorage.getItem("memberId") ||
		localStorage.getItem("id");

	const writerId =
		post.authorId ||
		post.writerId ||
		post.userId ||
		post.memberId ||
		post.postWriterId;

	if (myUserId && writerId) {
		return String(myUserId) === String(writerId);
	}

	const myNickname =
		localStorage.getItem("nickname") ||
		localStorage.getItem("userNickname") ||
		localStorage.getItem("authorNickname") ||
		localStorage.getItem("authorNickName");

	const writerNickname = getWriterName(post);

	if (myNickname && writerNickname) {
		return myNickname === writerNickname;
	}

	return false;
};

const getLikeCount = (post) => {
	return Number(post.likeCount || post.likesCount || post.likes || 0);
};

const getLiked = (post) => {
	return Boolean(post.liked || post.isLiked || post.likeStatus);
};

function CommunityDetail() {
	const navigate = useNavigate();
	const { postId } = useParams();

	const [post, setPost] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const [commentContent, setCommentContent] = useState("");
	const [mentionedUsers, setMentionedUsers] = useState([]);
	const [isMentionListOpen, setIsMentionListOpen] = useState(false);

	const [isSubmittingComment, setIsSubmittingComment] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isLiking, setIsLiking] = useState(false);

	const isMine = checkIsMine(post);
	const postImages = getPostImages(post);
	const comments = getComments(post);
	const isCommentActive = commentContent.trim() !== "";
	const mentionedUserIds = mentionedUsers.map((user) => Number(user.userId));

	const mentionUsers = comments.reduce((acc, comment) => {
		const userId = getCommentWriterId(comment);
		const nickname = getCommentWriterName(comment);

		if (!userId || !nickname) {
			return acc;
		}

		const isDuplicated = acc.some(
			(user) => String(user.userId) === String(userId)
		);

		if (isDuplicated) {
			return acc;
		}

		return [
			...acc,
			{
				userId,
				nickname,
			},
		];
	}, []);

	const fetchPostDetail = async () => {
		try {
			setIsLoading(true);
			setErrorMessage("");

			const data = await getPostDetail(postId);

			setPost(data.post || data.data || data.result || data);
		} catch {
			setErrorMessage("게시글을 불러오지 못했습니다.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchPostDetail();
	}, [postId]);

	const shouldOpenMentionList = (value) => {
		const atIndex = value.lastIndexOf("@");

		if (atIndex === -1) {
			return false;
		}

		const textAfterAt = value.slice(atIndex + 1);

		if (textAfterAt.includes(" ")) {
			return false;
		}

		return true;
	};

	const handleBackClick = () => {
		navigate("/community");
	};

	const handleLikeClick = async () => {
		if (isLiking) {
			return;
		}

		try {
			setIsLiking(true);

			await togglePostLike(postId);

			setPost((prevPost) => {
				if (!prevPost) {
					return prevPost;
				}

				const prevLiked = getLiked(prevPost);
				const prevLikeCount = getLikeCount(prevPost);

				const nextLikeCount = prevLiked
					? Math.max(prevLikeCount - 1, 0)
					: prevLikeCount + 1;

				return {
					...prevPost,
					liked: !prevLiked,
					isLiked: !prevLiked,
					likeStatus: !prevLiked,
					likeCount: nextLikeCount,
					likesCount: nextLikeCount,
				};
			});
		} catch {
			alert("좋아요 처리에 실패했습니다.");
		} finally {
			setIsLiking(false);
		}
	};

	const handleReportClick = () => {
		setIsMenuOpen(false);

		navigate(`/community/${postId}/report`, {
			state: {
				postTitle: post?.title,
			},
		});
	};

	const handleEditClick = () => {
		setIsMenuOpen(false);

		navigate(`/community/${postId}/edit`, {
			state: {
				post,
			},
		});
	};

	const handleDeleteClick = () => {
		setIsMenuOpen(false);
		setIsDeleteModalOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (isDeleting) {
			return;
		}

		try {
			setIsDeleting(true);

			await deletePost(postId);

			navigate("/community");
		} catch {
			alert("게시글 삭제에 실패했습니다.");
		} finally {
			setIsDeleting(false);
		}
	};

	const makeSubmitCommentContent = () => {
		let submitContent = commentContent.trim();

		mentionedUsers.forEach((user) => {
			const visibleMention = `@${user.nickname}`;
			const submitMention = `@[${user.nickname}](user:${user.userId})`;

			submitContent = submitContent
				.split(visibleMention)
				.join(submitMention);
		});

		return submitContent;
	};

	const handleCommentSubmit = async () => {
		if (!isCommentActive || isSubmittingComment) {
			return;
		}

		try {
			setIsSubmittingComment(true);

			await createComment({
				postId,
				content: makeSubmitCommentContent(),
				mentionedUserIds,
			});

			setCommentContent("");
			setMentionedUsers([]);
			setIsMentionListOpen(false);

			await fetchPostDetail();
		} catch {
			alert("댓글 작성에 실패했습니다.");
		} finally {
			setIsSubmittingComment(false);
		}
	};

	const handleCommentChange = (event) => {
		const nextValue = event.target.value;

		setCommentContent(nextValue);

		if (shouldOpenMentionList(nextValue)) {
			setIsMentionListOpen(true);
		} else {
			setIsMentionListOpen(false);
		}

		setMentionedUsers((prevUsers) => {
			return prevUsers.filter((user) =>
				nextValue.includes(`@${user.nickname}`)
			);
		});
	};

	const handleMentionUserClick = (user) => {
		const mentionText = `@${user.nickname} `;
		const atIndex = commentContent.lastIndexOf("@");

		if (atIndex === -1) {
			setCommentContent(`${commentContent}${mentionText}`);
		} else {
			const beforeAt = commentContent.slice(0, atIndex);
			const afterAt = commentContent.slice(atIndex + 1);
			const afterSpaceIndex = afterAt.indexOf(" ");

			if (afterSpaceIndex === -1) {
				setCommentContent(`${beforeAt}${mentionText}`);
			} else {
				const afterMention = afterAt.slice(afterSpaceIndex + 1);
				setCommentContent(`${beforeAt}${mentionText}${afterMention}`);
			}
		}

		setMentionedUsers((prevUsers) => {
			const isDuplicated = prevUsers.some(
				(prevUser) => String(prevUser.userId) === String(user.userId)
			);

			if (isDuplicated) {
				return prevUsers;
			}

			return [...prevUsers, user];
		});

		setIsMentionListOpen(false);
	};

	if (isLoading) {
		return (
			<div className="community_detail_page">
				<p className="community_detail_state_text">
					게시글을 불러오는 중입니다.
				</p>
			</div>
		);
	}

	if (errorMessage) {
		return (
			<div className="community_detail_page">
				<p className="community_detail_state_text">{errorMessage}</p>
			</div>
		);
	}

	if (!post) {
		return null;
	}

	const liked = getLiked(post);
	const likeCount = getLikeCount(post);
	const createdAtText = formatDate(post.createdAt || post.createdDate);
	const writerName = getWriterName(post);

	return (
		<div className="community_detail_page">
			<header className="community_detail_header">
				<button
					className="community_detail_back_button"
					type="button"
					onClick={handleBackClick}
					aria-label="뒤로가기"
				>
					<img src={BackIcon} alt="" />
				</button>

				<h1>게시글 상세보기</h1>

				<div className="community_detail_menu_area">
					<button
						className="community_detail_more_button"
						type="button"
						onClick={() => setIsMenuOpen((prev) => !prev)}
						aria-label="더보기"
					>
						<img src={EctIcon} alt="" />
					</button>

					{isMenuOpen && (
						<div
							className={`community_detail_menu ${
								isMine ? "mine" : "other"
							}`}
						>
							{isMine ? (
								<>
									<button type="button" onClick={handleEditClick}>
										<span>수정</span>
										<img src={EditIcon} alt="" />
									</button>

									<button type="button" onClick={handleDeleteClick}>
										<span>삭제</span>
										<img src={DeleteIcon} alt="" />
									</button>
								</>
							) : (
								<button type="button" onClick={handleReportClick}>
									<span>신고</span>
									<img src={ComplainIcon} alt="" />
								</button>
							)}
						</div>
					)}
				</div>
			</header>

			<main className="community_detail_main">
				<section className="community_detail_post">
					<h2>{post.title}</h2>

					{writerName && (
						<p className="community_detail_writer">{writerName}</p>
					)}

					<p className="community_detail_content">{post.content}</p>

					{postImages.length > 0 && (
						<div className="community_detail_image_row">
							{postImages.slice(0, 3).map((image, index) => (
								<div
									className="community_detail_image_box"
									key={`${image.id}-${index}`}
								>
									<img
										src={image.url}
										alt={`게시글 이미지 ${index + 1}`}
									/>
								</div>
							))}
						</div>
					)}

					<div className="community_detail_post_bottom">
						<span>{createdAtText}</span>

						<button
							className="community_detail_like_button"
							type="button"
							onClick={handleLikeClick}
							disabled={isLiking}
						>
							<span>{likeCount}</span>
							<img src={liked ? HeartActiveIcon : HeartIcon} alt="" />
						</button>
					</div>
				</section>

				<section className="community_detail_comments">
					{comments.map((comment, index) => (
						<article
							className="community_detail_comment"
							key={comment.commentId || comment.id || index}
						>
							<p className="community_detail_comment_writer">
								{getCommentWriterName(comment)}
							</p>

							<p className="community_detail_comment_content">
								{renderCommentContent(comment.content)}
							</p>
						</article>
					))}
				</section>
			</main>

			<footer className="community_detail_comment_bar">
				{isMentionListOpen && mentionUsers.length > 0 && (
					<div className="community_detail_mention_list">
						{mentionUsers.map((user) => (
							<button
								key={user.userId}
								type="button"
								onClick={() => handleMentionUserClick(user)}
							>
								@{user.nickname}
							</button>
						))}
					</div>
				)}

				<div className="community_detail_comment_input_box">
					<input
						value={commentContent}
						onChange={handleCommentChange}
						placeholder="댓글을 입력하세요."
					/>

					<button
						className="community_detail_comment_send_button"
						type="button"
						onClick={handleCommentSubmit}
						disabled={!isCommentActive || isSubmittingComment}
						aria-label="댓글 전송"
					>
						<img src={isCommentActive ? SendActiveIcon : SendIcon} alt="" />
					</button>
				</div>
			</footer>

			{isDeleteModalOpen && (
				<div className="community_detail_modal_overlay">
					<div className="community_detail_modal delete">
						<div className="community_detail_modal_icon">
							<img src={DeleteIcon} alt="" />
						</div>

						<h2>정말 삭제하시겠어요?</h2>
						<p>삭제 후에는 되돌릴 수 없어요.</p>

						<button
							className="community_detail_modal_cancel_button"
							type="button"
							onClick={() => setIsDeleteModalOpen(false)}
						>
							취소
						</button>

						<button
							className="community_detail_modal_primary_button"
							type="button"
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
						>
							삭제
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default CommunityDetail;