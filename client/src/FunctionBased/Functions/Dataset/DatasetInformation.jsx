import { Popover } from '@nextui-org/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AgGridComponent from '../../Components/AgGridComponent/AgGridComponent';
import { clearIndexedDB } from '../../../util/indexDB';

const DatasetInformation = ({ csvData }) => {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const previousFile = useSelector((state) => state.uploadedFile.previousFile);
  const dispatch = useDispatch();
  const [isDataCleared, setIsDataCleared] = useState(false);

  // Clear cache when file changes
  useEffect(() => {
    const clearCacheForFileChange = async () => {
      if (previousFile && previousFile !== activeCsvFile && activeCsvFile) {
        try {
          await clearIndexedDB(previousFile);
          console.log(`✅ Cache cleared for previous file: ${previousFile}`);
          setIsDataCleared(true);
          // Reset after a brief moment
          setTimeout(() => setIsDataCleared(false), 1000);
        } catch (error) {
          console.warn(`⚠️ Failed to clear cache for ${previousFile}:`, error);
        }
      }
    };

    clearCacheForFileChange();
  }, [activeCsvFile, previousFile]);

  // Force component re-render when active file changes
  useEffect(() => {
    if (activeCsvFile) {
      console.log(`📊 Loading information for: ${activeCsvFile}`);
    }
  }, [activeCsvFile]);

  const handleClearCache = async () => {
    if (activeCsvFile) {
      try {
        await clearIndexedDB(activeCsvFile);
        console.log(`🧹 Manual cache clear for: ${activeCsvFile}`);
        setIsDataCleared(true);
        setTimeout(() => setIsDataCleared(false), 2000);
        // Force page reload to show fresh data
        window.location.reload();
      } catch (error) {
        console.error(`❌ Failed to clear cache manually:`, error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center my-4">
        <h1 className="text-3xl font-bold">
          Dataset Information
          {isDataCleared && (
            <span className="ml-2 text-green-600 text-sm">
              ✅ Cache cleared
            </span>
          )}
        </h1>
        <button
          onClick={handleClearCache}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
          title="Clear cached data and reload"
        >
          🧹 Clear Cache
        </button>
      </div>
      {csvData && csvData.length > 0 && (
        <MyAgGridComponent rowData={csvData} key={activeCsvFile} />
      )}
    </div>
  );
};

const MyAgGridComponent = ({ rowData }) => {
  const [rangeIndex, setRangeIndex] = useState('');
  const [totalColumns, setTotalColumns] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);

  useEffect(() => {
    if (rowData && rowData.length > 0) {
      const startRowIndex = 0; // Start index assumed to be 1
      const endRowIndex = rowData.length;
      setRangeIndex(`${startRowIndex} - ${endRowIndex}`);

      const columnsCount = Object.keys(rowData[0]).length;
      setTotalColumns(columnsCount);

      // Calculate memory usage assuming each character takes 2 bytes
      const memoryUsageBytes = JSON.stringify(rowData).length * 2;
      const memoryUsageKB = Math.round(memoryUsageBytes / 1024); // Convert to kilobytes
      setMemoryUsage(memoryUsageKB);
    }
  }, [rowData]);

  const data = useMemo(() => {
    const columns = Object.keys(rowData[0] || {});
    const columnInfo = [];

    columns.forEach((column) => {
      const uniqueValues = new Set();
      let nonNullCount = 0;

      if (column !== 'id') {
        rowData.forEach((row) => {
          const value = row[column];
          if (value !== undefined && value !== null) {
            uniqueValues.add(value);
            nonNullCount++;
          }
        });

        const nullCount = rowData.length - nonNullCount;
        const nullPercentage = (nullCount / rowData.length) * 100;
        const dtype = typeof rowData[0][column];

        columnInfo.push({
          column,
          uniqueValues: uniqueValues.size,
          nonNullCount,
          nullPercentage,
          dtype,
        });
      }
    });

    return columnInfo;
  }, [rowData]);

  const columnDefs = useMemo(() => {
    const columns = Object.keys(data[0] || {});
    return columns.map((column) => ({
      headerName: column,
      field: column,
      filter: true,
      filterParams: {
        suppressAndOrCondition: true, // Optional: Suppress 'and'/'or' filter conditions
        newRowsAction: 'keep', // Optional: Preserve filter when new rows are loaded
      },
      sortable: true,
      flex: 1,
    }));
  }, [data]);

  return (
    <div className="w-full">
      <div className="ag-theme-alpine h-[600px] w-full">
        {columnDefs && data && (
          <>
            <div className="w-full flex mb-2 justify-end">
              <Popover placement={'bottom-right'} shouldFlip isBordered>
                <Popover.Trigger>
                  <h3 className="text-base underline cursor-pointer text-[#06603b] font-medium tracking-wide">
                    Dataset Details
                  </h3>
                </Popover.Trigger>
                <Popover.Content>
                  <div className="min-w-[175px] px-6 py-4 flex flex-col gap-1 bg-[#0a8b55] text-slate-200">
                    <p className="text-md">
                      <span className="font-medium tracking-wide">
                        Range Index :
                      </span>{' '}
                      {rangeIndex}
                    </p>
                    <p className="text-md">
                      <span className="font-medium tracking-wide">
                        Total Columns :
                      </span>{' '}
                      {totalColumns}
                    </p>
                    <p className="text-md">
                      <span className="font-medium tracking-wide">
                        Memory Usage :
                      </span>{' '}
                      {memoryUsage}+ KB
                    </p>
                  </div>
                </Popover.Content>
              </Popover>
            </div>
            <AgGridComponent rowData={data} columnDefs={columnDefs} />
          </>
        )}
      </div>
    </div>
  );
};

export default DatasetInformation;
