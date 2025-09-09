import { Loading } from "@nextui-org/react";
import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import { useSelector } from "react-redux";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import Plotly from "plotly.js-dist";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector";

function CustomPlot({ csvData }) {
  // const [csvData, setCsvData] = useState();
  const plotRef = useRef(null);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [numberColumn, setNumberColumn] = useState([]);
  const [stringColumn, setStringColumn] = useState([]);
  const [x_var, setX_var] = useState([]);
  const [y_bar, setY_var] = useState("");
  const [activeHue, setActiveHue] = useState("");
  const [loading, setLoading] = useState(false);
  const [plotlyData, setPlotlyData] = useState([]);
  const [error, setError] = useState(null); // State for error handling

  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name) {
      const getData = async () => {
        const tempStringColumn = [];
        const tempNumberColumn = [];

        Object.entries(csvData[0]).forEach(([key, value]) => {
          if (typeof csvData[0][key] === "string") tempStringColumn.push(key);
          else tempNumberColumn.push(key);
        });

        setStringColumn(tempStringColumn);
        setNumberColumn(tempNumberColumn);
      };

      getData();
    }
  }, [activeCsvFile, csvData]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setPlotlyData([]);
      const resp = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_EDA_CUSTOMPLOT
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: csvData,
            x_var,
            y_var: y_bar,
            hue: activeHue || "None",
          }),
        }
      );

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Failed to fetch plots.");
      }

      let data = await resp.json();
      console.log(data);
      data = data.plotly;
      setPlotlyData(data);
    } catch (error) {
      console.error("Error fetching Plotly data:", error);
      setError(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-center gap-8 mt-8">
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">X Variable</p>
          <MultipleDropDown
            columnNames={numberColumn}
            setSelectedColumns={setX_var}
          />
        </div>
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">Y Variable</p>
          <SingleDropDown
            columnNames={numberColumn}
            initValue={y_bar}
            onValueChange={setY_var}
          />
        </div>
        <div className="w-full flex flex-col tracking-wider">
          <p className="text-lg font-medium tracking-wide">Hue Variable</p>
          <SingleDropDown
            columnNames={stringColumn}
            onValueChange={setActiveHue}
          />
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

      {loading && (
        <div className="grid place-content-center mt-12 w-full h-full">
          <Loading color={"success"} size="xl">
            Fetching Data...
          </Loading>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="mt-4 text-red-500 text-center">{error}</div>}

      {/* Render LayoutSelector with Plotly Data */}
      {plotlyData.length > 0 && <LayoutSelector plotlyData={plotlyData} />}
    </div>
  );
}

export default CustomPlot;
