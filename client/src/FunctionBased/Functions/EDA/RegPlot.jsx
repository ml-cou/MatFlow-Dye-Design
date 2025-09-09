// src/FunctionBased/Components/RegPlot/RegPlot.jsx

import { Checkbox, Input, Loading } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector.jsx"; // Import LayoutSelector
import { toast } from "react-toastify"; // Import react-toastify for notifications

function RegPlot({ csvData }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

  const [numberColumn, setNumberColumn] = useState([]);
  const [activeNumberColumns, setActiveNumberColumns] = useState([]);
  const [y_var, setY_var] = useState("");
  const [title, setTitle] = useState("");
  const [scatter, setScatter] = useState(true);

  const [plotlyData, setPlotlyData] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State for error handling

  // Extract numeric columns from CSV data
  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name && csvData.length > 0) {
      const tempNumberColumn = [];

      csvData.forEach((row) => {
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value !== "string" && !isNaN(value)) {
            tempNumberColumn.push(key);
          }
        });
      });

      // Remove duplicates
      const uniqueNumberColumns = [...new Set(tempNumberColumn)];
      setNumberColumn(uniqueNumberColumns);
    }
  }, [activeCsvFile, csvData]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setPlotlyData([]); // Reset plotlyData
      setError(null); // Reset error state

      const resp = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_EDA_REGPLOT
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            x_var: activeNumberColumns,
            y_var,
            title: title || "",
            scatter,
            file: csvData,
          }),
        }
      );

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Failed to fetch plots.");
      }

      const data = await resp.json();
      console.log("Received data from backend:", data);

      // Ensure plotlyData is an array
      if (Array.isArray(data.plotly)) {
        setPlotlyData(data.plotly);
      } else if (typeof data.plotly === "object") {
        setPlotlyData([data.plotly]); // Wrap single plot in an array
      } else {
        setPlotlyData([]); // Empty array if unexpected format
      }
    } catch (error) {
      console.error("Error fetching Plotly data:", error);
      setError(error.message || "An unexpected error occurred.");
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Dropdowns for selecting variables */}
      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 mt-8">
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">X Variable</p>
          <MultipleDropDown
            columnNames={numberColumn}
            setSelectedColumns={setActiveNumberColumns}
          />
        </div>
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">Y Variable</p>
          <SingleDropDown columnNames={numberColumn} onValueChange={setY_var} />
        </div>
        <div className="w-full">
          <Checkbox
            color="success"
            isSelected={scatter}
            onChange={(e) => setScatter(e.valueOf())}
          >
            Scatter
          </Checkbox>
        </div>
      </div>

      <div className="flex justify-end mt-4 my-12">
        <button
          className="border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2"
          onClick={handleGenerate}
          disabled={loading}
        >
          Generate
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="grid place-content-center mt-12 w-full h-full">
          <Loading color={"success"} size="xl">
            Fetching Data...
          </Loading>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="mt-4 text-red-500 text-center">{error}</div>}

      {/* Render Plotly Figures using LayoutSelector */}
      {plotlyData.length > 0 && <LayoutSelector plotlyData={plotlyData} />}
    </div>
  );
}

export default RegPlot;
