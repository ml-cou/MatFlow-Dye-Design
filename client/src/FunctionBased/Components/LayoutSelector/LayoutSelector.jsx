// src/FunctionBased/Components/LayoutSelector/LayoutSelector.jsx

import React, { useState } from "react";
import PropTypes from "prop-types";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist";
import { Input } from "@nextui-org/react";

function LayoutSelector({ plotlyData }) {
  const [columns, setColumns] = useState(1);
  const [title, setTitle] = useState("");

  // Handler for columns input change
  const handleColumnsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setColumns(value);
    }
  };

  // Handler for title input
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  return (
    <div className="mt-8">
      {/*/!*Optional: Color Palette Selection *!/*/}
      {/*  <div className="flex flex-wrap items-center gap-8 mt-4">*/}
      {/*      <div className="w-full md:w-1/3 flex flex-col gap-1">*/}
      {/*          <label className="text-lg font-medium tracking-wide">Color Palette</label>*/}
      {/*          <select*/}
      {/*              value={colorPalette}*/}
      {/*              className="bg-transparent p-2 focus:border-[#06603b] border-2 rounded-lg"*/}
      {/*              onChange={(e) => setColorPalette(e.target.value)}*/}
      {/*          >*/}
      {/*              <option value="husl">HUSL</option>*/}
      {/*              <option value="tab10">Tab10</option>*/}
      {/*              <option value="tab20">Tab20</option>*/}
      {/*              <option value="Set2">Set2</option>*/}
      {/*              <option value="viridis">Viridis</option>*/}
      {/*              <option value="plasma">Plasma</option>*/}
      {/*              <option value="inferno">Inferno</option>*/}
      {/*              <option value="magma">Magma</option>*/}
      {/*          </select>*/}
      {/*      </div>*/}      {/*  </div>*/}

      {/* Title Input */}
      <div className="mb-6">
        <Input
          clearable
          bordered
          color="success"
          size="lg"
          label="Input Title"
          placeholder="Enter your desired title"
          fullWidth
          value={title}
          onChange={handleTitleChange}
        />
      </div>

      {/* Grid Layout for Plots */}
      <div className="mt-8 ">
        <div
          className={`grid gap-8 place-items-center grid-cols-${columns}`}
          style={{
            // gridAutoRows: "auto",
          }}
        >
          {plotlyData.map((figure, index) => (
            <div key={index} className="w-full overflow-auto">
              <Plot
              key={index}
                data={figure.data}
                layout={{
                  ...figure.layout,
                  title: {
                    text: title || figure.layout.title,
                    x: 0.5,
                    xanchor: 'center'
                  },
                  showlegend: true,
                  autosize: true,
                }}
                config={{
                  editable: true,
                  responsive: true,
                  modeBarButtonsToAdd: [
                    {
                      name: "Download plot as SVG",
                      icon: Plotly.Icons.camera,
                      direction: "up",
                      click: function (gd) {
                        Plotly.downloadImage(gd, { format: "svg" })
                          .then(function (filename) {
                            console.log("Downloaded SVG:", filename);
                          })
                          .catch(function (err) {
                            console.error("Error downloading SVG:", err);
                          });
                      },
                    },
                  ],
                }}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

LayoutSelector.propTypes = {
  plotlyData: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default LayoutSelector;
