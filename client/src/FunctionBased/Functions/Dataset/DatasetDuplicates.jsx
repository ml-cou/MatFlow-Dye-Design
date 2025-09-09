import { Checkbox, Input, Popover } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";

function DatasetDuplicates({ csvData }) {
  // const [rowData, setRowData] = useState([]);
  const [duplicateRows, setDuplicateRows] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [excludeKeys, setExcludeKeys] = useState(["id"]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnNames, setColumnNames] = useState([]);
  const render = useSelector((state) => state.uploadedFile.rerender);

  useEffect(() => {
    if (activeCsvFile) {
      // Function to find duplicate rows
      const findDuplicateRows = (data) => {
        const duplicates = [];
        const seen = new Set();


        data.forEach((obj) => {
          const excludedObj = {};
          for (const key in obj) {
            if (!excludeKeys.includes(key)) {
              excludedObj[key] = obj[key];
            }
          }
          const key = Object.values(excludedObj).join("|");
          if (seen.has(key)) {
            duplicates.push(obj);
          } else {
            seen.add(key);
          }
        });

        return duplicates;
      };
      const fetchCSVData = async () => {
        try {
          let cNames = Object.keys(csvData[0]);
          cNames = cNames.filter((val) => val !== "id");
          setColumnNames(cNames);

          const generatedColumnDefs = generateColumnDefs(csvData, excludeKeys);
          setColumnDefs(generatedColumnDefs);

          // Find duplicate rows
          const duplicates = findDuplicateRows(csvData);
          setDuplicateRows(duplicates);
        } catch (error) {
          console.error("Error:", error);
        }
      };

      fetchCSVData();
    }
  }, [activeCsvFile, excludeKeys, csvData]);

  useEffect(() => {
    if (csvData && csvData.length > 0) {
      const findMissingValues = (firstList, secondList) => {
        const firstSet = new Set(firstList);
        const missingValues = [];

        for (const value of secondList) {
          if (!firstSet.has(value)) {
            missingValues.push(value);
          }
        }
        return missingValues;
      };
      const colShowing = findMissingValues(
        excludeKeys,
        Object.keys(csvData[0])
      );
      setSelectedColumns(colShowing);
    }
  }, [excludeKeys, csvData]);

  // Function to generate column definitions dynamically
  const generateColumnDefs = (data, exKey) => {
    // Assuming your data contains headers as an array of strings
    const headers = data[0];
    const baadDibo = new Set(exKey);

    const columnName = Object.keys(headers);

    const columnDefs = [];
    for (let i = 0; i < columnName.length; i++) {
      if (baadDibo.has(columnName[i]) && columnName[i] !== "id") continue;
      columnDefs.push({
        headerName: columnName[i],
        field: columnName[i].toLowerCase().replace(/\s/g, ""),
        valueGetter: (params) => {
          return params.data[columnName[i]];
        },
      });
    }
    return columnDefs;
  };

  // Function to generate row data dynamically

  const handleColumnToggle = (column) => {
    if (selectedColumns.includes(column)) {
      setExcludeKeys([...excludeKeys, column]);
      setSelectedColumns(
        selectedColumns.filter((selectedColumn) => selectedColumn !== column)
      );
    } else {
      setExcludeKeys(excludeKeys.filter((val) => val !== column));
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const filteredColumns = columnNames.filter((column) =>
    column.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="mt-4">
      <div className="ag-theme-alpine w-full h-[600px]">
        <div className="w-full flex justify-between mb-2">
          <p className="">There are {duplicateRows.length} duplicate data.</p>
          <Popover placement={"bottom-right"} shouldFlip isBordered>
            <Popover.Trigger>
              <h3 className="text-base underline cursor-pointer text-[#06603b] font-medium tracking-wide">
                Filter Column
              </h3>
            </Popover.Trigger>
            <Popover.Content>
              <div className="px-6 py-4 min-w-[300px] max-w-xl">
                <div className="w-full">
                  <p className="mb-2 tracking-wide font-semibold font-titillium">
                    Column Name
                  </p>
                  <Input
                    width="100%"
                    color="success"
                    bordered
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Enter Column Name. (Check spelling)"
                  />
                </div>
                <div className="mt-3">
                  <ul className="max-h-96 overflow-y-auto">
                    {filteredColumns.map((column, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Checkbox
                          color="success"
                          defaultSelected={selectedColumns.includes(column)}
                          onChange={() => handleColumnToggle(column)}
                        >
                          {column}
                        </Checkbox>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Popover.Content>
          </Popover>
        </div>
        {duplicateRows && duplicateRows.length > 0 && (
          <AgGridComponent rowData={duplicateRows} columnDefs={columnDefs} />
        )}
      </div>
    </div>
  );
}

export default DatasetDuplicates;
