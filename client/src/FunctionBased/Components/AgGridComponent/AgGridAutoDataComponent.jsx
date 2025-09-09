import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";

function AgGridAutoDataComponent({
  rowData,
  rowHeight = 50,
  paginationPageSize = 10,
  headerHeight = 50,
  download = false,
  height = "600px",
  customColumnOrder = null,
  downloadOptions = null,
}) {
  const gridRef = useRef();

  const columnDefs = useMemo(() => {
    if (!rowData || rowData.length === 0) return [];
    
    const allKeys = Object.keys(rowData[0]);
    let orderedKeys = allKeys;
    
    // Apply custom column ordering if provided
    if (customColumnOrder && Array.isArray(customColumnOrder)) {
      // First add columns in the specified order
      orderedKeys = customColumnOrder.filter(key => allKeys.includes(key));
      // Then add any remaining columns that weren't specified
      orderedKeys = [...orderedKeys, ...allKeys.filter(key => !customColumnOrder.includes(key))];
    }
    
    return orderedKeys.map((key) => ({
      headerName: key,
      field: key,
      valueGetter: (params) => {
        return params.data[key];
      },
    }));
  }, [rowData, customColumnOrder]);

  const defaultColDef = useMemo(() => {
    return {
      valueFormatter: (data) => {
        // console.log(data);
        return data.value !== null ? data.value : "N/A";
      },
      filter: true, // Enable filtering for the column
      filterParams: {
        suppressAndOrCondition: true, // Optional: Suppress 'and'/'or' filter conditions
        newRowsAction: "keep", // Optional: Preserve filter when new rows are loaded
      },
      sortable: true,
      resizable: true,
    };
  }, []);

  const sizeToFit = useCallback(() => {
    gridRef.current.api.sizeColumnsToFit();
  }, []);

  const autoSizeAll = useCallback((skipHeader) => {
    const allColumnIds = [];
    gridRef.current.columnApi.getColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current.columnApi.autoSizeAllColumns(skipHeader);
  }, []);

  // Function to reorder columns based on customColumnOrder
  const reorderColumns = useCallback(() => {
    if (gridRef.current && gridRef.current.columnApi && customColumnOrder && Array.isArray(customColumnOrder)) {
      const allColumns = gridRef.current.columnApi.getColumns();
      const orderedColumnIds = customColumnOrder.filter(key => 
        allColumns.some(col => col.getColId() === key)
      );
      const remainingColumnIds = allColumns
        .map(col => col.getColId())
        .filter(id => !customColumnOrder.includes(id));
      
      const finalOrder = [...orderedColumnIds, ...remainingColumnIds];
      gridRef.current.columnApi.setColumnOrder(finalOrder);
    }
  }, [customColumnOrder]);

  // Reorder columns when grid is ready
  const onGridReady = useCallback(() => {
    if (gridRef.current) {
      // Small delay to ensure grid is fully initialized
      setTimeout(() => {
        reorderColumns();
      }, 100);
    }
  }, [reorderColumns]);

  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadDropdown && !event.target.closest('.relative')) {
        setShowDownloadDropdown(false);
      }
    };

    if (showDownloadDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  // Reorder columns when customColumnOrder changes
  useEffect(() => {
    if (gridRef.current && gridRef.current.columnApi) {
      reorderColumns();
    }
  }, [customColumnOrder, reorderColumns]);

  const handleDownload = useCallback((downloadType) => {
    if (!rowData || rowData.length === 0) return;
    
    if (downloadType === 'full') {
      // Download all data
      gridRef.current.api.exportDataAsCsv();
    } else if (downloadType === 'minimal' && downloadOptions && downloadOptions.minimalColumns) {
      // Download only specified columns
      const minimalData = rowData.map(row => {
        const minimalRow = {};
        downloadOptions.minimalColumns.forEach(col => {
          if (row[col] !== undefined) {
            minimalRow[col] = row[col];
          }
        });
        return minimalRow;
      });
      
      // Create CSV content
      const headers = downloadOptions.minimalColumns.join(',');
      const csvContent = [
        headers,
        ...minimalData.map(row => 
          downloadOptions.minimalColumns.map(col => 
            row[col] !== undefined ? `"${row[col]}"` : '""'
          ).join(',')
        )
      ].join('\n');
      
      // Download the CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'results_minimal.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setShowDownloadDropdown(false);
  }, [rowData, downloadOptions]);

  return (
    <div className="ag-theme-alpine mb-12" style={{ height, width: "100%" }}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        rowHeight={rowHeight}
        // pagination
        // paginationPageSize={paginationPageSize}
        rowModelType="clientSide"
        suppressRowVirtualisation={false}
        rowBuffer={20}
        domLayout="normal"
        defaultColDef={defaultColDef}
        headerHeight={headerHeight}
        onGridReady={onGridReady}
      ></AgGridReact>
      <div className="flex flex-wrap items-center gap-2 mt-4 pb-8">
        <button
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-[#097045] text-[#097045] rounded hover:bg-[#097045] hover:text-white transition-all duration-200 font-medium text-xs"
          onClick={sizeToFit}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Size to Fit
        </button>
        
        <button
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-[#097045] text-[#097045] rounded hover:bg-[#097045] hover:text-white transition-all duration-200 font-medium text-xs"
          onClick={() => autoSizeAll(false)}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Auto-Size All
        </button>
        
        {download && (
          <div className="relative">
            {downloadOptions && downloadOptions.minimalColumns ? (
              // Show dropdown for SAS and DFT components - SAME STYLING AS OTHER BUTTONS
              <>
                <button
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-[#097045] text-[#097045] rounded hover:bg-[#097045] hover:text-white transition-all duration-200 font-medium text-xs"
                  onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                  <svg 
                    className={`w-3 h-3 transition-transform duration-200 ${showDownloadDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDownloadDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[160px] overflow-hidden">
                    <button
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-xs font-medium text-gray-700 border-b border-gray-100 transition-colors duration-150"
                      onClick={() => handleDownload('full')}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Full Download
                      </div>
                    </button>
                    <button
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors duration-150"
                      onClick={() => handleDownload('minimal')}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Minimal Download
                      </div>
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Show simple download button for other components - SAME STYLING AS OTHER BUTTONS
              <button
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-[#097045] text-[#097045] rounded hover:bg-[#097045] hover:text-white transition-all duration-200 font-medium text-xs"
                onClick={() => handleDownload('full')}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AgGridAutoDataComponent;
