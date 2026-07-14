import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';

const DataTable = ({ columns, data = [], searchPlaceholder = "Search records..." }) => {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Search filter
  const filteredData = data.filter(item => {
    return Object.keys(item).some(key => {
      const val = item[key];
      if (val === null || val === undefined) return false;
      // Skip object serialization checks
      if (typeof val === 'object') return false;
      return String(val).toLowerCase().includes(search.toLowerCase());
    });
  });

  // Sort logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const sortedData = [...filteredData];
  if (sortField) {
    sortedData.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) aVal = "";
      if (bVal === null || bVal === undefined) bVal = "";

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const pageStart = (page - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(pageStart, pageStart + itemsPerPage);

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const nextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-gray-500">
          Showing {filteredData.length} records
        </div>
      </div>

      {/* Responsive Table wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-gray-800">
          <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.accessor}
                  onClick={() => col.sortable !== false && handleSort(col.accessor)}
                  className={`px-6 py-3.5 border-b border-gray-100 ${
                    col.sortable !== false ? 'cursor-pointer select-none hover:bg-gray-100/50 transition-colors' : ''
                  }`}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable !== false && (
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                  {columns.map((col) => (
                    <td key={col.accessor} className="px-6 py-4 truncate">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400 font-medium">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-4 select-none bg-gray-50/50">
          <span className="text-xs text-gray-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={page === 1}
              className="p-1.5 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPage}
              disabled={page === totalPages}
              className="p-1.5 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
