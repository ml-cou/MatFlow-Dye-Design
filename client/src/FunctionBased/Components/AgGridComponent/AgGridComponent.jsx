import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useRef } from "react";

function AgGridComponent({
  rowData,
  columnDefs,
  rowHeight = 50,
  headerHeight = 50,
  download = false,
}) {
  const gridRef = useRef();

  const defaultColDef = useMemo(() => {
    return {
      valueFormatter: (data) => {
        return data.value !== null ? data.value : "N/A";
      },
      filter: true,
      filterParams: {
        suppressAndOrCondition: true,
        newRowsAction: "keep",
      },
      sortable: true,
      resizable: true,
    };
  }, []);

  const sizeToFit = useCallback(() => {
    gridRef.current.api.sizeColumnsToFit();
  }, []);

  const autoSizeAll = useCallback(() => {
    const allColumnIds = [];
    gridRef.current.columnApi.getColumns().forEach((column) => {
      allColumnIds.push(column.getId());
    });
    gridRef.current.columnApi.autoSizeAllColumns();
  }, []);

  return (
    <>
      <div
        className="ag-theme-alpine"
        style={{ width: "100%", height: "600px" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          rowHeight={rowHeight}
          defaultColDef={defaultColDef}
          headerHeight={headerHeight}
          rowModelType="clientSide"
          // Enable row virtualization (enabled by default)
          suppressRowVirtualisation={false}
          // Adjust the row buffer to improve performance (default is 10)
          rowBuffer={20}
          domLayout="normal"
        ></AgGridReact>
      </div>
      <div className="flex items-center gap-2 mt-4 pb-8">
        <button
          className="rounded px-4 py-2 border-2 border-[#097045]"
          onClick={sizeToFit}
        >
          Size to Fit
        </button>
        <button
          className="rounded px-4 py-2 border-2 border-[#097045]"
          onClick={autoSizeAll}
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
    </>
  );
}

export default AgGridComponent;
