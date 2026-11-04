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

export const deleteRecentSearch = async (keyword) => {
	const response = await api.delete(`/api/search/recent/${keyword}`);
	return response.data;
};

export const getPostDetail = async (postId) => {
	const response = await api.get(`/api/posts/${postId}`);
	return response.data;
};

export const togglePostLike = async (postId) => {
	const response = await api.post(`/api/posts/${postId}/likes`);
	return response.data;
};

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

export const deletePost = async (postId) => {
	const response = await api.delete(`/api/posts/${postId}`);
	return response.data;
};

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

export const submitCommunityReport = async ({ postId, detail }) => {
	const response = await api.post(`/api/posts/${postId}/reports`, {
		reason: "ETC",
		detail,
	});

	return response.data;
};

export default api;