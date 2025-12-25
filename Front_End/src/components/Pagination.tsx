import React from 'react';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100]
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  // 生成页码数组，最多显示5个页码
  const generatePageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      if (currentPage > 3) {
        pageNumbers.push('...');
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (currentPage < totalPages - 2) {
        pageNumbers.push('...');
      }

      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
      {/* 每页显示数量 */}
      {onPageSizeChange && (
        <div className="flex items-center space-x-2">
          <label htmlFor="pageSize" className="text-sm text-slate-700 dark:text-slate-300">
            每页显示:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 分页信息 */}
      <div className="text-sm text-slate-700 dark:text-slate-300">
        显示 {Math.min((currentPage - 1) * pageSize + 1, totalItems)} - 
        {Math.min(currentPage * pageSize, totalItems)} 条，共 {totalItems} 条
      </div>

      {/* 分页按钮 */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          首页
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          上一页
        </button>

        {generatePageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={typeof page === 'string'}
            className={`px-3 py-1 border ${typeof page === 'number' && page === currentPage 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'} rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-100 disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          下一页
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          末页
        </button>
      </div>
    </div>
  );
};

export default Pagination;