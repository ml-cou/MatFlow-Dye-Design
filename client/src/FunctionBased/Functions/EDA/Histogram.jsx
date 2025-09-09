// src/FunctionBased/Components/Histogram/Histogram.jsx

import styled from "@emotion/styled";
import {Slider, Stack} from "@mui/material";
import {Checkbox, Input, Loading} from "@nextui-org/react";
import React, {useEffect, useRef, useState} from "react";
import Plot from "react-plotly.js";
import {useSelector} from "react-redux";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import Plotly from "plotly.js-dist";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector"; // Import LayoutSelector

// Styled component for the slider
const PrettoSlider = styled(Slider)({
    color: "#52af77",
    height: 8,
    "& .MuiSlider-track": {
        border: "none",
    },
    "& .MuiSlider-thumb": {
        height: 24,
        width: 24,
        backgroundColor: "#fff",
        border: "2px solid currentColor",
        "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
            boxShadow: "inherit",
        },
        "&:before": {
            display: "none",
        },
    },
    "& .MuiSlider-valueLabel": {
        lineHeight: 1.2,
        fontSize: 12,
        background: "unset",
        padding: 0,
        width: 32,
        height: 32,
        borderRadius: "50% 50% 50% 0",
        backgroundColor: "#52af77",
        transformOrigin: "bottom left",
        transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
        "&:before": {display: "none"},
        "&.MuiSlider-valueLabelOpen": {
            transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
        },
        "& > *": {
            transform: "rotate(45deg)",
        },
    },
});

function Histogram({csvData}) {
    const plotRef = useRef(null);
    const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

    const [plotlyData, setPlotlyData] = useState([]); // Initialize as an empty array
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // State for error handling

    const [stringColumn, setStringColumn] = useState([]);
    const [numberColumn, setNumberColumn] = useState([]);
    const [activeNumberColumn, setActiveNumberColumn] = useState([]);
    const [activeHueColumn, setActiveHueColumn] = useState("");
    const [orientation, setOrientation] = useState("Vertical");
    const [showTitle, setShowTitle] = useState(false);
    const [titleValue, setTitleValue] = useState("");
    const [title, setTitle] = useState("");
    const [aggregate, setAggregate] = useState("count");
    const [KDE, setKDE] = useState(false);
    const [legend, setLegend] = useState(false);
    const [showAutoBin, setShowAutoBin] = useState(true);
    const [autoBinValue, setAutoBinValue] = useState(10);
    const [colorPalette, setColorPalette] = useState("husl"); // Optional: Allow user to select palette

    useEffect(() => {
        if (activeCsvFile && activeCsvFile.name && csvData.length > 0) {
            const getData = () => {
                const tempStringColumn = [];
                const tempNumberColumn = [];

                Object.entries(csvData[0]).forEach(([key, value]) => {
                    if (typeof value === "string" || isNaN(value)) {
                        tempStringColumn.push(key);
                    } else {
                        tempNumberColumn.push(key);
                    }
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
            setPlotlyData([]); // Reset plotlyData
            setError(null); // Reset error state

            const resp = await fetch(
                `${import.meta.env.VITE_APP_API_URL}${
                    import.meta.env.VITE_APP_API_EDA_HISTOGRAM}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        var: activeNumberColumn.length > 0 ? activeNumberColumn : "-", // Ensure it's a list
                        hue: activeHueColumn || "-",
                        orient: orientation,
                        title: title || "",
                        file: csvData,
                        agg: aggregate,
                        autoBin: !showAutoBin ? autoBinValue : 0,
                        kde: KDE,
                        legend: legend,
                        color_palette: colorPalette, // Optional: Allow user to select or hardcode
                    }),
                });

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
                setPlotlyData([data.plotly]); // Wrap single plot in an array
            } else {
                setPlotlyData([]); // Empty array if unexpected format
            }
        } catch (error) {
            console.error("Error fetching Plotly data:", error);
            setError(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Dropdowns for selecting variables */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-center gap-8 mt-8">
                <div className="w-full">
                    <p className="text-lg font-medium tracking-wide">Variable</p>
                    <MultipleDropDown
                        columnNames={numberColumn}
                        setSelectedColumns={setActiveNumberColumn}
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
                        Aggregate Statistics
                    </label>
                    <select
                        value={aggregate}
                        className="bg-transparent p-2 focus:border-[#06603b] border-2 rounded-lg"
                        onChange={(e) => setAggregate(e.target.value)}
                    >
                        <option value="probability">Probability</option>
                        <option value="count">Count</option>
                        <option value="percent">Percent</option>
                        <option value="density">Density</option>
                    </select>
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
                    isSelected={showAutoBin}
                    onChange={(e) => setShowAutoBin(e.valueOf())}
                >
                    Auto Bin
                </Checkbox>
                <Checkbox
                    color="success"
                    isSelected={KDE}
                    onChange={(e) => setKDE(e.valueOf())}
                >
                    KDE
                </Checkbox>
                <Checkbox
                    color="success"
                    isSelected={legend}
                    onChange={(e) => setLegend(e.valueOf())}
                >
                    Legend
                </Checkbox>
            </div>

            {/* Slider for manual bin selection */}
            {!showAutoBin && (
                <div className="mt-12">
                    <Stack spacing={1} direction="row" sx={{mb: 1}} alignItems="center">
                        <span>1</span>
                        <PrettoSlider
                            aria-label="Auto Bin Slider"
                            min={1}
                            max={35}
                            step={1}
                            value={autoBinValue}
                            onChange={(e) => setAutoBinValue(parseInt(e.target.value, 10))}
                            valueLabelDisplay="on"
                            color="primary"
                        />
                        <span>35</span>
                    </Stack>
                </div>
            )}

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
            {plotlyData.length > 0 && <LayoutSelector plotlyData={plotlyData}/>}
        </div>
    );
}

export default Histogram;
