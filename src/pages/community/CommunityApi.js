import axios from "axios";

const BASE_URL = import.meta.env.VITE_SERVER_API_BASE_URL;

const api = axios.create({
	baseURL: BASE_URL,
	timeout: 10000,
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("accessToken");

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

/** 정렬 조건과 커서에 맞는 게시글 목록을 요청한다. */
export const getPostList = async ({ sort = "latest", cursor, size = 20 }) => {
	const params = {
		sort,
		size,
	};

	if (cursor !== undefined && cursor !== null) {
		params.cursor = cursor;
	}

	const response = await api.get("/api/posts", {
		params,
	});

	return response.data;
};

/** 게시글 내용과 첨부 파일을 묶어 새 게시글 등록을 요청한다. */
export const createPost = async ({ title, content, files }) => {
	const formData = new FormData();

	formData.append(
		"request",
		new Blob(
			[
				JSON.stringify({
					title,
					content,
				}),
			],
			{
				type: "application/json",
			}
		)
	);

	files.forEach((file) => {
		formData.append("files", file);
	});

	const response = await api.post("/api/posts", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});

	return response.data;
};

/** 검색어와 정렬 조건, 커서에 맞는 게시글을 요청한다. */
export const searchPosts = async ({
	keyword,
	sort = "latest",
	cursor,
	size = 20,
}) => {
	const params = {
		keyword,
		sort,
		size,
	};

	if (cursor !== undefined && cursor !== null) {
		params.cursor = cursor;
	}

	const response = await api.get("/api/posts/search", {
		params,
	});

	return response.data;
};

/** 지정한 검색어를 서버의 최근 검색 기록에서 삭제한다. */
export const deleteRecentSearch = async (keyword) => {
	const response = await api.delete(`/api/search/recent/${keyword}`);
	return response.data;
};

/** 선택한 게시글의 상세 내용을 요청한다. */
export const getPostDetail = async (postId) => {
	const response = await api.get(`/api/posts/${postId}`);
	return response.data;
};

/** 선택한 게시글의 좋아요 상태 전환을 요청한다. */
export const togglePostLike = async (postId) => {
	const response = await api.post(`/api/posts/${postId}/likes`);
	return response.data;
};

/** 댓글 내용과 언급한 사용자 정보를 서버에 전달한다. */
export const createComment = async ({
	postId,
	content,
	mentionedUserIds = [],
}) => {
	const response = await api.post(`/api/posts/${postId}/comments`, {
		content,
		mentionedUserIds,
	});

	return response.data;
};

/** 선택한 게시글의 삭제를 요청한다. */
export const deletePost = async (postId) => {
	const response = await api.delete(`/api/posts/${postId}`);
	return response.data;
};

/** 게시글 수정 내용과 첨부 파일 변경 사항을 서버에 전달한다. */
export const updatePost = async ({
	postId,
	title,
	content,
	files = [],
	deleteFileIds = [],
}) => {
	const formData = new FormData();

	const requestBody = {
		title,
		content,
		deleteFileIds,
	};

	formData.append(
		"request",
		new Blob([JSON.stringify(requestBody)], {
			type: "application/json",
		})
	);

	files.forEach((file) => {
		formData.append("files", file);
	});

	const response = await api.patch(`/api/posts/${postId}`, formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});

	return response.data;
};

/** 게시글 식별자와 신고 내용을 서버에 전달한다. */
export const submitCommunityReport = async ({ postId, detail }) => {
	const response = await api.post(`/api/posts/${postId}/reports`, {
		reason: "ETC",
		detail,
	});

	return response.data;
};

export default api;