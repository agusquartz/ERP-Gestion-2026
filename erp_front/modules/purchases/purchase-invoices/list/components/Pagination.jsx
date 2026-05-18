export function Pagination({ currentPage, totalPages, hasMore, goToPage }) {
    // Build the list of page numbers we know about.
    // If hasMore is true we show one extra "..." or an arrow for the next page.
    const knownPages = totalPages; // cursors.length = pages discovered so far

    return (
        <div className="flex items-center justify-center gap-1 pt-4">

            {/* Previous */}
            <button
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-[#F2F3F7] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
                ← Anterior
            </button>

            {/* Page numbers */}
            {Array.from({ length: knownPages }, (_, i) => i + 1).map((page) => (
                <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`
                        rounded-[5px] border px-3 py-1.5 text-[13px] font-semibold transition-colors
                        ${page === currentPage
                            ? "border-[#2b6df5] bg-[#2b6df5] text-white"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }
                    `}
                >
                    {page}
                </button>
            ))}

            {/* Show a greyed-out next page button when hasMore but we haven't fetched it yet */}
            {hasMore && currentPage + 1 > totalPages && (
                <button
                    onClick={() => goToPage(currentPage + 1)}
                    className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    {currentPage + 1}
                </button>
            )}

            {/* Next */}
            <button
                disabled={!hasMore && currentPage === knownPages}
                onClick={() => goToPage(currentPage + 1)}
                className="rounded-[5px] border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-[#F2F3F7] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
                Siguiente →
            </button>
        </div>
    );
}