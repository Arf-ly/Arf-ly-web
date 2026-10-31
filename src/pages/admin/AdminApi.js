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

export const getMemberList = async ({ page = 0, size = 20 }) => {
	const response = await api.get("/api/admin/members", {
		params: {
			page,
			size,
		},
	});

	return response.data;
};

export const getMemberDetail = async (memberId) => {
	const response = await api.get(`/api/admin/members/${memberId}`);
	return response.data;
};

export const suspendMember = async (memberId) => {
	const response = await api.patch(`/api/admin/members/${memberId}/suspend`);
	return response.data;
};

export const unsuspendMember = async (memberId) => {
	const response = await api.patch(`/api/admin/members/${memberId}/unsuspend`);
	return response.data;
};

export const getReportList = async () => {
	const response = await api.get("/api/admin/reports");
	return response.data;
};

export const getReportDetail = async (reportId) => {
	const response = await api.get(`/api/admin/reports/${reportId}`);
	return response.data;
};

export const rejectReport = async (reportId) => {
	const response = await api.patch(`/api/admin/reports/${reportId}/reject`);
	return response.data;
};

export const deleteAdminPost = async (postId) => {
	const response = await api.delete(`/api/admin/posts/${postId}`);
	return response.data;
};

export default api;
