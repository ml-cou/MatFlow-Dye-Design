import React, { useState } from "react";
import { useSelector } from "react-redux";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";

let id = 1;

const DatasetDisplay = ({ csvData }) => {
  const [value] = useState("All");
  const [filterText] = useState("");

  

  // Define the row data based on the selected view option
  let rowData;
  if (value === "Head") {
    rowData = csvData.slice(0, 10); // Display the first 10 rows
  } else if (value === "Tail") {
    rowData = csvData.slice(-10); // Display the last 10 rows
  } else if (value === "Custom") {
    // Apply custom filtering based on filterText
    rowData = csvData.filter((row) =>
      Object.values(row).some(
        (value) =>
          value !== null &&
          value.toString().toLowerCase().includes(filterText.toLowerCase())
      )
    );
  } else {
    rowData = csvData; // Display all rows
  }

  const columnDefs =
    csvData.length > 0
      ? Object.keys(csvData[0]).map((key) => ({
          headerName: key,
          field: key,
          valueGetter: (params) => {
            return params.data[key];
          },
        }))
      : [];

  // console.log(columnDefs);

  return (
    <>
      <h1 className="text-3xl mt-4 font-bold">Display Dataset</h1>

      <div className="mt-4 w-full">
        {rowData.length > 0 && (
          <div
            className="ag-theme-alpine"
            style={{ height: "600px", width: "100%" }}
          >
            <AgGridComponent rowData={rowData} columnDefs={columnDefs} />
          </div>
        )}
      </div>
    </>
  );
};

export default DatasetDisplay;
