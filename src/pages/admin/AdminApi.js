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

/** 지정한 페이지와 조회 개수에 맞는 회원 목록을 요청한다. */
export const getMemberList = async ({ page = 0, size = 20 }) => {
	const response = await api.get("/api/admin/members", {
		params: {
			page,
			size,
		},
	});

	return response.data;
};

/** 선택한 회원의 상세 정보를 요청한다. */
export const getMemberDetail = async (memberId) => {
	const response = await api.get(`/api/admin/members/${memberId}`);
	return response.data;
};

/** 선택한 회원의 이용 정지를 요청한다. */
export const suspendMember = async (memberId) => {
	const response = await api.patch(`/api/admin/members/${memberId}/suspend`);
	return response.data;
};

/** 선택한 회원의 이용 정지 해제를 요청한다. */
export const unsuspendMember = async (memberId) => {
	const response = await api.patch(`/api/admin/members/${memberId}/unsuspend`);
	return response.data;
};

/** 게시글 신고 목록을 요청한다. */
export const getReportList = async () => {
	const response = await api.get("/api/admin/reports");
	return response.data;
};

/** 선택한 게시글 신고의 상세 내용을 요청한다. */
export const getReportDetail = async (reportId) => {
	const response = await api.get(`/api/admin/reports/${reportId}`);
	return response.data;
};

/** 선택한 게시글 신고의 반려를 요청한다. */
export const rejectReport = async (reportId) => {
	const response = await api.patch(`/api/admin/reports/${reportId}/reject`);
	return response.data;
};

/** 관리자 권한으로 게시글 삭제를 요청한다. */
export const deleteAdminPost = async (postId) => {
	const response = await api.delete(`/api/admin/posts/${postId}`);
	return response.data;
};

/** 의사 인증 신청 목록을 요청한다. */
export const getVerificationList = async () => {
	const response = await api.get("/api/admin/verifications");
	return response.data;
};

/** 선택한 의사 인증 신청의 상세 정보를 요청한다. */
export const getVerificationDetail = async (verificationId) => {
	const response = await api.get(`/api/admin/verifications/${verificationId}`);
	return response.data;
};

/** 의사 인증 신청의 승인을 요청한다. */
export const approveVerification = async (verificationId) => {
	const response = await api.patch(`/api/admin/verifications/${verificationId}/approve`);
	return response.data;
};

/** 반려 사유와 함께 의사 인증 신청의 반려를 요청한다. */
export const rejectVerification = async ({ verificationId, reason }) => {
	const response = await api.patch(`/api/admin/verifications/${verificationId}/reject`, {
		reason,
	});
	return response.data;
};

export default api;
