import { useEffect, useState } from "react";

/** 이미지 로딩 결과를 반영하고 화면을 벗어난 요청의 결과는 무시한다. */
function LoadedThumbnailImage({ src, alt, className }) {
	const [image_src, set_image_src] = useState(null);

	useEffect(() => {
		let is_mounted = true;
		const image = new Image();

		image.onload = () => {
			if (is_mounted) {
				set_image_src(src);
			}
		};

		image.onerror = () => {
			if (is_mounted) {
				set_image_src(null);
			}
		};

		image.src = src;

		return () => {
			is_mounted = false;
		};
	}, [src]);

	if (!image_src) {
		return null;
	}

	return <img className={className} src={image_src} alt={alt} />;
}

/** 이미지 주소가 있을 때 썸네일을 표시하고 주소가 없어지면 로딩 상태를 함께 정리한다. */
export default function CommunityThumbnailImage({ src, alt, className }) {
	if (!src) {
		return null;
	}

	return <LoadedThumbnailImage src={src} alt={alt} className={className} />;
}
