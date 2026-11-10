import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Community.css";
import BottomTabBar from "../../components/BottomTabBar";
import CommunityThumbnailImage from "../../components/CommunityThumbnailImage.jsx";

import { getPostList } from "./CommunityApi";

import AlarmIcon from "../../assets/community/alarm.svg";
import SearchIcon from "../../assets/community/search.svg";
import PostIcon from "../../assets/community/post.svg";
import SortArrowIcon from "../../assets/community/sort_^.svg";
import AdBackground from "../../assets/community/ad_background.svg";
import AdIcon from "../../assets/community/ad_icon.svg";

/** 게시글 작성 시각을 경과 시간 또는 날짜 문구로 변환한다. */
const format_created_at = (created_at) => {
	if (!created_at) {
		return "";
	}

	const created_date = new Date(created_at);

	if (Number.isNaN(created_date.getTime())) {
		return created_at;
	}

	const now = new Date();
	const diff_ms = now - created_date;
	const diff_minutes = Math.floor(diff_ms / 1000 / 60);
	const diff_hours = Math.floor(diff_minutes / 60);
	const diff_days = Math.floor(diff_hours / 24);

	if (diff_minutes < 1) {
		return "방금";
	}

	if (diff_minutes < 60) {
		return `${diff_minutes}분 전`;
	}

	if (diff_hours < 24) {
		return `${diff_hours}시간 전`;
	}

	if (diff_days < 7) {
		return `${diff_days}일 전`;
	}

	return created_at.slice(0, 10);
};

/** 게시글 위치에 따라 광고 배너를 표시할지 결정한다. */
const should_show_ad_banner = (index) => {
	return index === 2 || (index > 2 && (index - 2) % 10 === 0);
};

/** 커뮤니티 목록에 삽입되는 광고 배너를 표시한다. */
function CommunityAdBanner() {
	return (
		<section className="community_ad_banner">
			<img
				className="community_ad_background"
				src={AdBackground}
				alt=""
			/>

			<div className="community_ad_text">
				<strong>
					반려동물을 등록하고
					<br />
					활동량 측정기를 받아보세요!
				</strong>

				<span>활동량 측정기 더 알아보기 →</span>
			</div>

			<img className="community_ad_icon" src={AdIcon} alt="" />
		</section>
	);
}

/** 게시글 정렬과 추가 조회를 관리하고 커뮤니티 목록을 표시한다. */
function Community() {
	const navigate = useNavigate();
	const observer_target_ref = useRef(null);

	const [sort, set_sort] = useState("latest");
	const [is_sort_open, set_is_sort_open] = useState(false);

	const [posts, set_posts] = useState([]);
	const [meta, set_meta] = useState({
		hasNext: false,
		nextCursor: null,
		size: 20,
		totalCount: 0,
	});

	const [is_loading, set_is_loading] = useState(false);
	const [is_more_loading, set_is_more_loading] = useState(false);
	const [error_message, set_error_message] = useState("");

	const sort_text = sort === "latest" ? "최신순" : "인기순";
	const next_sort_text = sort === "latest" ? "인기순" : "최신순";
	const next_sort_value = sort === "latest" ? "likes" : "latest";

	/** 정렬 조건과 커서에 따라 게시글을 조회하고 목록을 갱신한다. */
	const fetch_posts = useCallback(async ({
		next_sort = sort,
		cursor,
		is_more = false,
	}) => {
		try {
			if (is_more) {
				set_is_more_loading(true);
			} else {
				set_is_loading(true);
			}

			set_error_message("");

			const data = await getPostList({
				sort: next_sort,
				cursor,
				size: 20,
			});

			const next_posts = data.posts || [];
			const next_meta = data.meta || {
				hasNext: false,
				nextCursor: null,
				size: 20,
				totalCount: 0,
			};

			if (is_more) {
				set_posts((prev_posts) => [...prev_posts, ...next_posts]);
			} else {
				set_posts(next_posts);
			}

			set_meta(next_meta);
		} catch {
			set_error_message("게시글을 불러오지 못했습니다.");
		} finally {
			set_is_loading(false);
			set_is_more_loading(false);
		}
	}, [sort]);

	useEffect(() => {
		fetch_posts({
			next_sort: sort,
			cursor: null,
			is_more: false,
		});
	}, [fetch_posts, sort]);

	useEffect(() => {
		if (!observer_target_ref.current) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const target = entries[0];

				if (
					target.isIntersecting &&
					meta.hasNext &&
					!is_loading &&
					!is_more_loading
				) {
					fetch_posts({
						next_sort: sort,
						cursor: meta.nextCursor,
						is_more: true,
					});
				}
			},
			{
				root: null,
				rootMargin: "160px",
				threshold: 0,
			}
		);

		observer.observe(observer_target_ref.current);

		return () => {
			observer.disconnect();
		};
	}, [fetch_posts, meta.hasNext, meta.nextCursor, is_loading, is_more_loading, sort]);

	/** 게시글 정렬 조건을 변경하고 정렬 선택 메뉴를 닫는다. */
	const handle_sort_change = (next_sort) => {
		set_sort(next_sort);
		set_is_sort_open(false);
	};

	return (
		<div className="community_page">
			<header className="community_header">
				<div className="community_sort">
					{is_sort_open ? (
						<div className="community_sort_menu">
							<button
								className="community_sort_menu_selected"
								type="button"
								onClick={() => set_is_sort_open(false)}
							>
								<span>{sort_text}</span>
								<img src={SortArrowIcon} alt="" />
							</button>

							<button
								type="button"
								onClick={() => handle_sort_change(next_sort_value)}
							>
								{next_sort_text}
							</button>
						</div>
					) : (
						<button
							className="community_sort_button"
							type="button"
							onClick={() => set_is_sort_open(true)}
						>
							<span>{sort_text}</span>
							<img src={SortArrowIcon} alt="" />
						</button>
					)}
				</div>

				<div className="community_header_icons">
					<button
						type="button"
						aria-label="알림"
						onClick={() => navigate("/alarmnotification")}
					>
						<img className="community_alarm_icon" src={AlarmIcon} alt="" />
					</button>

					<button
						type="button"
						aria-label="검색"
						onClick={() => navigate("/community/search")}
					>
						<img src={SearchIcon} alt="" />
					</button>

					<button
						type="button"
						aria-label="글쓰기"
						onClick={() => navigate("/community/write")}
					>
						<img src={PostIcon} alt="" />
					</button>
				</div>
			</header>

			<main className="community_list">
				{is_loading && (
					<p className="community_state_text">
						게시글을 불러오는 중입니다.
					</p>
				)}

				{!is_loading && error_message && (
					<p className="community_state_text">{error_message}</p>
				)}

				{!is_loading && !error_message && posts.length === 0 && (
					<p className="community_state_text">
						아직 작성된 게시글이 없습니다.
					</p>
				)}

				{!is_loading &&
					!error_message &&
					posts.map((post, index) => {
						const created_at_text = format_created_at(post.createdAt);
						const thumbnail_urls = (post.thumbnails || []).filter(Boolean);

						const media_items = thumbnail_urls.map((thumbnail_url) => ({
							type: "image",
							url: thumbnail_url,
						}));

						if (post.hasVideo) {
							media_items.push({
								type: "video",
							});
						}

						const total_media_count = media_items.length;
						const should_show_more = total_media_count > 3;

						const visible_media_items = should_show_more
							? media_items.slice(0, 3)
							: media_items;

						const hidden_media_count =
							total_media_count - visible_media_items.length;

						const should_show_media = visible_media_items.length > 0;

						return (
							<div key={post.id}>
								<article
									className={`community_post_card ${
										should_show_media ? "has_media" : "no_media"
									}`}
									onClick={() => navigate(`/community/${post.id}`)}
								>
									<div className="community_post_content">
										<h3>{post.title}</h3>

										<p className="community_post_preview">
											{post.content || ""}
										</p>

										{should_show_media && (
											<div className="community_thumbnail_row">
												{visible_media_items.map((item, media_index) => {
													if (item.type === "video") {
														return (
															<div
																className="community_thumbnail video"
																key={`${post.id}-video-${media_index}`}
															>
																<span>▶</span>
															</div>
														);
													}

													return (
														<CommunityThumbnailImage
															className="community_thumbnail"
															key={`${post.id}-${item.url}-${media_index}`}
															src={item.url}
															alt={`게시글 이미지 ${media_index + 1}`}
														/>
													);
												})}

												{should_show_more && hidden_media_count > 0 && (
													<div className="community_thumbnail more">
														+{hidden_media_count}
													</div>
												)}
											</div>
										)}
									</div>

									<span className="community_post_time">
										{created_at_text}
									</span>
								</article>

								{should_show_ad_banner(index) && <CommunityAdBanner />}
							</div>
						);
					})}

				<div ref={observer_target_ref} className="community_observer_target" />

				{is_more_loading && (
					<p className="community_more_loading_text">
						게시글을 더 불러오는 중입니다.
					</p>
				)}
			</main>

			<BottomTabBar />
		</div>
	);
}

export default Community;
