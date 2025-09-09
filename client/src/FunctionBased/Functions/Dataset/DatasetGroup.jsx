import { Checkbox, Input, Popover } from "@nextui-org/react";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";

function DatasetGroup({ csvData }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [initialData, setInitialData] = useState([]);

  const [rowData, setRowData] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectValue, setSelectValue] = useState("count");

  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnNames, setColumnNames] = useState([]);

  const columnDefs = useMemo(() => {
    if (!rowData) return;
    let columns = Object.keys(rowData[0] || {});
    columns = columns.filter((col) => col !== "id");
    return columns.map((column) => ({
      headerName: column,
      field: column,
      valueGetter: (params) => {
        return params.data[column];
      },
    }));
  }, [rowData]);

  useEffect(() => {
    if (activeCsvFile) {
      const fetchCSVData = async () => {
        try {
          // const res = await fetchDataFromIndexedDB(activeCsvFile.name);
          setRowData(csvData);
          let tempColumns = Object.keys(csvData[0]);
          setInitialData(csvData);

          tempColumns = tempColumns.filter((col) => col !== "id");
          setColumnNames(tempColumns);
          setSelectedColumns([...selectedColumns, tempColumns[0]]);
        } catch (error) {
          console.error("Error:", error);
        }
      };

      fetchCSVData();
    }
  }, [activeCsvFile, csvData]);

  useEffect(() => {
    if (initialData && initialData.length) {
      const fetchData = async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_API_URL}${
              import.meta.env.VITE_APP_API_DISPLAY_GROUP
            }`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                file: initialData,
                group_var: selectedColumns,
                agg_func: selectValue,
              }),
            }
          );

          let { data } = await res.json();
          const tempData = JSON.parse(data);
          setRowData(tempData);
        } catch (error) {
          console.error(error);
        }
      };

      fetchData();
    }
  }, [initialData, selectValue, selectedColumns]);

  const handleColumnToggle = (column) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(
        selectedColumns.filter((selectedColumn) => selectedColumn !== column)
      );
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const filteredColumns = columnNames.filter((column) =>
    column.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between mt-4 items-end">
        <h1 className="text-3xl font-bold">Group Data</h1>
        <div>
          <Popover placement={"bottom-right"} shouldFlip isBordered>
            <Popover.Trigger>
              <h3 className="text-base underline cursor-pointer text-[#06603b] font-medium tracking-wide">
                Apply Aggregation
              </h3>
            </Popover.Trigger>
            <Popover.Content>
              <div className="px-6 py-4 min-w-[350px] max-w-xl">
                <div className="w-full">
                  <div className="flex gap-2 mb-2 items-center">
                    <p className="font-titillium font-semibold tracking-wide text-sm">
                      Aggregate Function:{" "}
                    </p>
                    <select
                      name="aggFunc"
                      value={selectValue}
                      onChange={(e) => setSelectValue(e.target.value)}
                      className="flex-grow p-2 rounded border-2 border-[#097045] bg-transparent"
                    >
                      <option value="count">count</option>
                      <option value="sum">sum</option>
                      <option value="min">min</option>
                      <option value="max">max</option>
                      <option value="mean">mean</option>
                      <option value="median">median</option>
                      <option value="std">std</option>
                      <option value="var">var</option>
                    </select>
                  </div>
                  <p className="mb-2 tracking-wide font-semibold font-titillium">
                    Column Name
                  </p>
                  <Input
                    width="100%"
                    color="success"
                    bordered
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Enter Column Name"
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
      </div>
      <div className="ag-theme-alpine w-full h-[600px] mt-4">
        {rowData && columnDefs && (
          <AgGridComponent rowData={rowData} columnDefs={columnDefs} />
        )}
      </div>
    </div>
  );
}

export default DatasetGroup;
