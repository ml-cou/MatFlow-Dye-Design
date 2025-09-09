import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useRef } from "react";

function AgGridAutoDataComponent({
  rowData,
  rowHeight = 50,
  paginationPageSize = 10,
  headerHeight = 50,
  download = false,
  height = "600px",
}) {
  const gridRef = useRef();

  const columnDefs =
    rowData && rowData.length > 0
      ? Object.keys(rowData[0]).map((key) => ({
          headerName: key,
          field: key,
          valueGetter: (params) => {
            return params.data[key];
          },
        }))
      : [];

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
      ></AgGridReact>
      <div className="flex items-center gap-2 mt-4 pb-8">
        <button
          className="rounded px-4 py-2 border-2 border-[#097045]"
          onClick={sizeToFit}
        >
          Size to Fit
        </button>
        <button
          className="rounded px-4 py-2 border-2 border-[#097045]"
          onClick={() => autoSizeAll(false)}
        >
          Auto-Size All
        </button>
        {download && (
          <button
            className="rounded px-4 py-2 border-2 border-[#097045]"
            onClick={() => gridRef.current.api.exportDataAsCsv()}
          >
            Download
          </button>
        )}
      </div>
    </div>
  );
}

export default AgGridAutoDataComponent;
