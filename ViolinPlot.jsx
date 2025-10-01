// src/FunctionBased/Components/ViolinPlot/ViolinPlot.jsx

import { Checkbox, Input, Loading } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector.jsx"; // Import LayoutSelector
import { toast } from "react-toastify"; // Import react-toastify for notifications

function ViolinPlot({ csvData }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

  const [stringColumn, setStringColumn] = useState([]);
  const [numberColumn, setNumberColumn] = useState([]);
  const [activeStringColumns, setActiveStringColumns] = useState([]);
  const [activeNumberColumn, setActiveNumberColumn] = useState("");
  const [activeHueColumn, setActiveHueColumn] = useState("");
  const [orientation, setOrientation] = useState("Vertical");
  const [showTitle, setShowTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [title, setTitle] = useState("");
  const [dodge, setDodge] = useState(false);
  const [split, setSplit] = useState(false);

  const [plotlyData, setPlotlyData] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State for error handling

  // Listen for chatbot-generated violin plot requests
  useEffect(() => {
    const handleChatbotViolinPlot = (event) => {
      const { categorical, numerical, hue, orientation, dodge, split, title } = event.detail;
      console.log('🤖 Chatbot triggered violin plot generation with params:', event.detail);

      // Validate parameters before setting state
      if (!categorical || categorical.length === 0 || !numerical) {
        console.warn('🤖 Invalid parameters from chatbot - missing categorical or numerical data');
        setError("Please select at least one categorical variable and one numerical variable.");
        return;
      }

      setActiveStringColumns(categorical || []);
      setActiveNumberColumn(numerical || "");
      setActiveHueColumn(hue || "");
      setOrientation(orientation || "Vertical");
      setDodge(dodge || false);
      setSplit(split || false);
      setTitle(title || "");

      generatePlotWithParams(categorical, numerical, hue, orientation, dodge, split, title);
    };

    window.addEventListener('chatbotGenerateViolinPlot', handleChatbotViolinPlot);
    return () => {
      window.removeEventListener('chatbotGenerateViolinPlot', handleChatbotViolinPlot);
    };
  }, [csvData]);

  // Generate plot with direct parameters (for chatbot)
  const generatePlotWithParams = async (categorical, numerical, hue, orientation, dodge, split, title) => {
    try {
      setLoading(true);
      setPlotlyData([]);
      setError(null);

      const resp = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_EDA_VIOLINPLOT
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cat: categorical.length > 0 ? categorical : ["-"],
            num: numerical || "-",
            hue: hue || "-",
            orient: orientation || "Vertical",
            dodge: dodge || false,
            split: split || false,
            title: title || "",
            file: csvData,
          }),
        }
      );

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Failed to fetch plots.");
      }

      let data = await resp.json();
      console.log("Received data from backend:", data);

      // Ensure plotlyData is an array
      if (Array.isArray(data.plotly)) {
        setPlotlyData(data.plotly);
      } else if (typeof data.plotly === "object") {
        setPlotlyData([data.plotly]);
      } else {
        setPlotlyData([]);
      }
    } catch (error) {
      console.error("Error fetching Plotly data:", error);
      setError(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Extract string and number columns from CSV data
  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name && csvData.length > 0) {
      const tempStringColumn = [];
      const tempNumberColumn = [];

      csvData.forEach((row) => {
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === "string") {
            tempStringColumn.push(key);
          } else if (typeof value === "number" && !isNaN(value)) {
            tempNumberColumn.push(key);
          }
        });
      });

      // Remove duplicates
      const uniqueStringColumns = [...new Set(tempStringColumn)];
      const uniqueNumberColumns = [...new Set(tempNumberColumn)];

      setStringColumn(uniqueStringColumns);
      setNumberColumn(uniqueNumberColumns);
    }
  }, [activeCsvFile, csvData]);

  const handleGenerate = async () => {
    if (!["Vertical", "Horizontal"].includes(orientation)) {
      toast.error("Invalid orientation selected.");
      return;
    }
    try {
      setLoading(true);
      setPlotlyData([]); // Reset plotlyData
      setError(null); // Reset error state

      const resp = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_EDA_VIOLINPLOT
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cat: activeStringColumns.length > 0 ? activeStringColumns : "-", // Ensure it's a list
            num: activeNumberColumn || "-",
            hue: activeHueColumn || "-",
            orient: orientation,
            dodge: dodge,
            split: split,
            title: title || "",
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-center gap-8 mt-8">
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">
            Numerical Variable
          </p>
          <SingleDropDown
            columnNames={numberColumn}
            onValueChange={setActiveNumberColumn}
          />
        </div>
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">
            Categorical Variable
          </p>
          <MultipleDropDown
            columnNames={stringColumn}
            setSelectedColumns={setActiveStringColumns}
          />
        </div>
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">Hue</p>
          <SingleDropDown
            onValueChange={setActiveHueColumn}
            columnNames={stringColumn}
          />
        </div>
        <div className="w-full flex flex-col gap-1">
          <label className="text-lg font-medium tracking-wide">
            Orientation
          </label>
          <select
            value={orientation}
            className="bg-transparent p-2 focus:border-[#06603b] border-2 rounded-lg"
            onChange={(e) => setOrientation(e.target.value)}
          >
            <option value="Vertical">Vertical</option>
            <option value="Horizontal">Horizontal</option>
          </select>
        </div>
      </div>

      {/* Checkboxes for additional options */}
      <div className="flex items-center gap-4 mt-4 tracking-wider">
        <Checkbox
          color="success"
          isSelected={dodge}
          onChange={(e) => setDodge(e.valueOf())}
        >
          Dodge
        </Checkbox>
        <Checkbox
          color="success"
          isSelected={split}
          onChange={(e) => setSplit(e.valueOf())}
        >
          Split
        </Checkbox>
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

export default ViolinPlot;
