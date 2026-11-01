function AdminPagination({ currentPage, totalPages, pageStart, totalCount, visibleCount, hasNext, setCurrentPage }) {
	const pageGroupStart = Math.floor((currentPage - 1) / 3) * 3;
	const pageNumbers = Array.from(
		{ length: Math.max(0, Math.min(3, totalPages - pageGroupStart)) },
		(_, index) => pageGroupStart + index + 1
	);

	return (
		<div className="admin_pagination">
			<span>
				{visibleCount > 0 ? pageStart + 1 : 0}–{pageStart + visibleCount} / {totalCount}건
			</span>
			<nav aria-label="목록 페이지">
				<button
					type="button"
					onClick={() => setCurrentPage(currentPage - 1)}
					disabled={currentPage === 1}
					aria-label="이전 페이지"
				>
					‹
				</button>
				{pageNumbers.map((page) => (
					<button
						className={currentPage === page ? "active" : ""}
						type="button"
						key={page}
						onClick={() => setCurrentPage(page)}
						aria-current={currentPage === page ? "page" : undefined}
					>
						{page}
					</button>
				))}
				<button
					type="button"
					onClick={() => setCurrentPage(currentPage + 1)}
					disabled={!hasNext}
					aria-label="다음 페이지"
				>
					›
				</button>
			</nav>
		</div>
	);
}

export default AdminPagination;
