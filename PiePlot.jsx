// src/FunctionBased/Components/PiePlot/PiePlot.jsx

import { Checkbox, Input, Loading } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector.jsx";
import { toast } from "react-toastify";

function PiePlot({ csvData }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

  const [stringColumn, setStringColumn] = useState([]);
  const [activeStringColumn, setActiveStringColumn] = useState([]);
  const [title, setTitle] = useState("");
  const [plotlyData, setPlotlyData] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State for error handling
  const [label, setLabel] = useState(true);
  const [percentage, setPercentage] = useState(true);
  const [gap, setGap] = useState(0);

  // Listen for chatbot-generated pie plot requests
  useEffect(() => {
    const handleChatbotPiePlot = (event) => {
      const { categorical, title: chatbotTitle, label: chatbotLabel, percentage: chatbotPercentage, gap: chatbotGap } = event.detail;
      console.log('🤖 Chatbot triggered pie plot generation with params:', event.detail);

      // Validate parameters before setting state
      if (!categorical || categorical.length === 0) {
        console.warn('🤖 Invalid parameters from chatbot - missing categorical data');
        setError("Please select at least one categorical variable.");
        return;
      }

      setActiveStringColumn(categorical || []);
      setTitle(chatbotTitle || "");
      setLabel(chatbotLabel !== undefined ? chatbotLabel : true);
      setPercentage(chatbotPercentage !== undefined ? chatbotPercentage : true);
      setGap(chatbotGap || 0);

      generatePlotWithParams(categorical, chatbotTitle, chatbotLabel, chatbotPercentage, chatbotGap);
    };

    window.addEventListener('chatbotGeneratePiePlot', handleChatbotPiePlot);
    return () => {
      window.removeEventListener('chatbotGeneratePiePlot', handleChatbotPiePlot);
    };
  }, [csvData]);

  // Generate plot with direct parameters (for chatbot)
  const generatePlotWithParams = async (categorical, title, label, percentage, gap) => {
    if (gap < 0 || gap > 1) {
      toast.error("Explode value should be between 0 and 1");
      return;
    }
    try {
      setLoading(true);
      setPlotlyData([]);
      setError(null);

      const resp = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_EDA_PIEPLOT
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cat: categorical.length > 0 ? categorical : ["-"],
            file: csvData,
            title: title || "",
            label: label !== undefined ? label : true,
            percentage: percentage !== undefined ? percentage : true,
            gap: gap || 0,
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

  // Extract string columns from CSV data
  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name && csvData.length > 0) {
      const tempStringColumn = [];

      csvData.forEach((row) => {
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === "string") tempStringColumn.push(key);
        });
      });

      // Remove duplicates
      const uniqueStringColumns = [...new Set(tempStringColumn)];
      setStringColumn(uniqueStringColumns);
    }
  }, [activeCsvFile, csvData]);

  const handleGenerate = async () => {
    if (gap < 0 || gap > 1) {
      toast.error("Explode value should be between 0 and 1");
      return;
    }
    try {
      setLoading(true);
      setPlotlyData([]); // Reset plotlyData
      setError(null); // Reset error state

      const resp = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_EDA_PIEPLOT
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cat: activeStringColumn.length > 0 ? activeStringColumn : ["-"], // Ensure it's a list
            file: csvData,
            title: title || "",
            label,
            percentage,
            gap,
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

  // Handler for gap input
  const handleGapChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setGap(value);
    }
  };

  return (
    <div>
      {/* Dropdowns for selecting categorical variable and explode value */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-center gap-8 mt-8">
        <div className="w-full">
          <p className="text-lg font-medium tracking-wide">
            Categorical Variable
          </p>
          <MultipleDropDown
            columnNames={stringColumn}
            setSelectedColumns={setActiveStringColumn}
          />
        </div>

        <div className="w-full flex flex-col gap-1">
          <label
            htmlFor="explode"
            className="text-lg font-medium tracking-wide"
          >
            Explode Value
          </label>
          <Input
            id="explode"
            type="number"
            bordered
            min={0}
            max={1}
            color="success"
            placeholder="Expected value (0 - 1)."
            step={"0.01"}
            helperText="Press Enter to apply"
            onChange={handleGapChange}
            value={gap}
          />
        </div>
      </div>

      {/* Checkboxes for additional options */}
      <div className="mt-8 flex gap-10">
        <Checkbox
          color="success"
          isSelected={label}
          onChange={() => setLabel(!label)}
        >
          Label
        </Checkbox>
        <Checkbox
          color="success"
          isSelected={percentage}
          onChange={() => setPercentage(!percentage)}
        >
          Percentage
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

export default PiePlot;
