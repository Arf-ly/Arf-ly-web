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

/** 지도에 표시할 동물병원 목록을 요청한다. */
export const getMapList = async () => {
	const response = await api.get("/api/maps");
	return response.data;
};

/** 선택한 동물병원의 상세 정보를 요청한다. */
export const getMapDetail = async (placesId) => {
	const response = await api.get(`/api/maps/${placesId}`);
	return response.data;
};

/** 병원 사진을 지정한 크기로 요청해 이미지 Blob을 반환한다. */
export const getMapPhotoBlob = async (photoName, maxHeight = 400) => {
	if (!photoName) {
		return null;
	}

	const response = await api.get("/api/maps/photo", {
		params: {
			photoName,
			maxHeight,
		},
		responseType: "blob",
	});

	return response.data;
};

export default api;