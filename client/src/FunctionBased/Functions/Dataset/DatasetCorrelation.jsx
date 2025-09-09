import { Checkbox, Input, Popover } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useSelector } from "react-redux";
import * as Stat from "statistics.js";
import { fetchDataFromIndexedDB } from "../../../util/indexDB";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import FeaturePair from "../../Components/FeaturePair/FeaturePair";

function DatasetCorrelation({ csvData }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [initialData, setInitialData] = useState([]);
  const [constRowData, setConstRowData] = useState([]);
  const [constColDef, setConstColDef] = useState([]);
  const [relationMethod, setRelationMethod] = useState("pearson");
  const [displayType, setDisplayType] = useState("table");
  const [colWithInd, setColWithInd] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [columnNames, setColumnNames] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showAnnotate, setShowAnnotate] = useState(false);
  const [plotlyData, setPlotlyData] = useState();

  useEffect(() => {
    if (activeCsvFile) {
      const calculateCorrelations = (data) => {
        let columnNames = Object.keys(data[0]);
        columnNames = columnNames.filter(
          (val) => typeof data[0][val] === "number" && val !== "id"
        );
        const correlations = {};

        for (let i = 0; i < columnNames.length; i++) {
          const column1 = columnNames[i];
          correlations[column1] = {};

          for (let j = 0; j < columnNames.length; j++) {
            const column2 = columnNames[j];
            const column1Data = [];
            const column2Data = [];
            const tempData = [];

            for (let k = 0; k < data.length; k++) {
              const val1 = parseFloat(data[k][column1]);
              const val2 = parseFloat(data[k][column2]);

              if (!isNaN(val1) && !isNaN(val2)) {
                column1Data.push(val1);
                column2Data.push(val2);

                tempData.push({
                  [column1]: val1,
                  [column2]: val2,
                });
              }
            }

            const bodyVars = {
              [column1]: "metric",
              [column2]: "metric",
            };

            const temp = new Stat(tempData, bodyVars);
            // Calculate the correlation coefficient using simple-statistics correlation function
            const l = Object.keys(bodyVars);

            if (relationMethod === "spearman") {
              const cc = temp.spearmansRho(
                l[0],
                l[l.length === 1 ? 0 : 1],
                true
              );

              // // Store the correlation coefficient in the correlations object
              correlations[column1][column2] = cc.rho.toFixed(3);
            } else if (relationMethod === "pearson") {
              const cc = temp.correlationCoefficient(
                l[0],
                l[l.length === 1 ? 0 : 1]
              );

              // // Store the correlation coefficient in the correlations object
              correlations[column1][column2] =
                cc.correlationCoefficient.toFixed(3);
            }
          }
        }

        return correlations;
      };

      const fetchCSVData = async () => {
        try {
          const res = await fetchDataFromIndexedDB(activeCsvFile.name);

          const correlations = calculateCorrelations(csvData);
          const { columnDefs, rowData } = generateAgGridData(correlations);

          setColumnDefs(columnDefs);
          setRowData(rowData);
          setInitialData(res);
          setConstRowData(rowData);
          setConstColDef(columnDefs);

          const allColumnName = Object.keys(rowData[0]);
          let tempColInd = {};
          for (let i = 0; i < allColumnName.length; i++) {
            tempColInd = { ...tempColInd, [allColumnName[i]]: i };
          }
          setColWithInd(tempColInd);
          setColumnNames(allColumnName);
          setSelectedColumns(allColumnName);
        } catch (error) {
          console.error("Error:", error);
        }
      };
      fetchCSVData();
    }
  }, [activeCsvFile, relationMethod, csvData]);

  useEffect(() => {
    if (relationMethod === "kendall") {
      const fetchData = async () => {
        const resp = await fetch(
          `${import.meta.env.VITE_APP_API_URL}${
            import.meta.env.VITE_APP_API_DISPLAY_CORRELATION
          }`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              file: initialData,
            }),
          }
        );
        let { data } = await resp.json();

        const tempData = JSON.parse(data);

        let columnName = Object.keys(tempData[0]);
        columnName = columnName.filter((val) => val !== "id");
        let newData = [];
        for (let i = 0; i < columnName.length; i++) {
          const { id, ...rest } = tempData[i];
          newData.push(rest);
        }

        let columnDefs = Object.keys(newData[0]).map((columnName) => ({
          headerName: columnName,
          field: columnName,
          valueGetter: (params) => {
            return params.data[columnName];
          },
        }));
        columnDefs = [{ headerName: "", field: "column_name" }, ...columnDefs];
        // let ind = 0;
        newData = newData.map((val, ind) => {
          return { ...val, column_name: columnName[ind] };
        });

        setRowData(newData);
        setConstRowData(newData);
        setColumnDefs(columnDefs);
        setConstColDef(columnDefs);
      };

      fetchData();
    }
  }, [relationMethod, initialData]);

  const generateAgGridData = (correlations) => {
    let columnDefs = Object.keys(correlations).map((columnName) => ({
      headerName: columnName,
      field: columnName,
      valueGetter: (params) => {
        return params.data[columnName];
      },
    }));
    columnDefs = [{ headerName: "", field: "column_name" }, ...columnDefs];
    const columnName = Object.keys(correlations);
    let ind = 0;

    let rowData = Object.values(correlations);
    rowData = rowData.map((val) => {
      return { ...val, column_name: columnName[ind++] };
    });

    return { columnDefs, rowData };
  };

  useEffect(() => {
    const columnSelected = new Set(selectedColumns);

    let tempData = JSON.parse(JSON.stringify(constRowData));
    let tempColDef = JSON.parse(JSON.stringify(constColDef));

    // Change Row Data
    for (let i = 0; i < columnNames.length; i++) {
      if (columnSelected.has(columnNames[i])) continue;
      const colInd = colWithInd[columnNames[i]];
      for (let j = 0; j < tempData.length; j++) {
        if (colInd === j) tempData[j] = {};
        delete tempData[j][columnNames[i]];
      }
    }
    tempData = tempData.filter((val) => Object.keys(val).length !== 0);

    // Change Column
    for (let i = 0; i < columnNames.length; i++) {
      if (columnSelected.has(columnNames[i])) continue;
      tempColDef = tempColDef.filter((val) => val.field !== columnNames[i]);
    }

    setRowData(tempData);
    setColumnDefs(tempColDef);
  }, [selectedColumns]);

  useEffect(() => {
    if (displayType === "heatmap") {
      const fetchData = async () => {
        const res = await fetch(
          `${import.meta.env.VITE_APP_API_URL}${
            import.meta.env.VITE_APP_API_DISPLAY_HEATMAP
          }`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              file: rowData,
            }),
          }
        );
        const data = await res.json();

        setPlotlyData(JSON.parse(data));
      };
      fetchData();
    }
  }, [rowData, displayType]);

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
    <div className="ag-theme-alpine w-full h-[600px]">
      <h1 className="text-3xl font-bold my-4">Feature Correlation</h1>
      {rowData && columnDefs && (
        <>
          <div className="text-lg items-end w-full mb-4">
            <div className="w-full flex">
              <Popover placement="bottom-left">
                <Popover.Trigger>
                  <h3 className="text-lg underline cursor-pointer text-[#06603b] font-medium tracking-wide">
                    Show/Hide Column
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
                        placeholder="Enter Column Name."
                      />
                    </div>
                    <div className="mt-3">
                      <ul className="max-h-96 overflow-y-auto">
                        {filteredColumns.map((column, index) => {
                          if (column !== "column_name") {
                            return (
                              <li
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  color="success"
                                  defaultSelected={selectedColumns.includes(
                                    column
                                  )}
                                  onChange={() => handleColumnToggle(column)}
                                >
                                  {column}
                                </Checkbox>
                              </li>
                            );
                          }
                        })}
                      </ul>
                    </div>
                  </div>
                </Popover.Content>
              </Popover>
            </div>
            <div className="flex text-lg mt-2 it gap-8 items-center">
              <div className="flex flex-col gap-1 ">
                <label className="" htmlFor="correlation-method">
                  Correlation Method
                </label>
                <select
                  className="text-xl p-2 rounded outline-none border-2 border-[#06603b] shadow bg-gray-100 min-w-[300px]"
                  name="correlation-method"
                  id="correlation-method"
                  value={relationMethod}
                  onChange={(e) => setRelationMethod(e.target.value)}
                >
                  <option value="pearson">Pearson</option>
                  <option value="kendall">Kendall</option>
                  <option value="spearman">Spearman</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 ">
                <label htmlFor="display-type">Display Type</label>
                <select
                  className="text-xl p-2 rounded outline-none border-2 border-[#06603b] shadow bg-gray-100 min-w-[300px]"
                  name="display-type"
                  id="display-type"
                  value={displayType}
                  onChange={(e) => setDisplayType(e.target.value)}
                >
                  <option value="table">Table</option>
                  <option value="heatmap">Heatmap</option>
                  <option value="feature_pair">Feature Pair</option>
                </select>
              </div>
            </div>
          </div>

          {displayType === "table" ? (
            <AgGridComponent columnDefs={columnDefs} rowData={rowData} />
          ) : displayType === "heatmap" ? (
            <div>
              {plotlyData && (
                <div className="flex justify-center mt-8">
                  <Plot
                    data={plotlyData?.data}
                    layout={{ ...plotlyData.layout, showlegend: true }}
                    config={{
                      editable: true,
                      responsive: true,
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <FeaturePair rowData={rowData} />
          )}
        </>
      )}
    </div>
  );
}

export default DatasetCorrelation;
