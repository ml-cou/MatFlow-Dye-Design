import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useSelector } from "react-redux";
import NextTable from "../../../../Components/NextTable/NextTable";

function MutualInformation({ csvData }) {
  const method = useSelector((state) => state.featureSelection.method);
  const target_var = useSelector(
    (state) => state.featureSelection.target_variable
  );
  const [data, setData] = useState();

  useEffect(() => {
    if (method === "Mutual Information") {
      (async function () {
        const res = await fetch(
          `${import.meta.env.VITE_APP_API_URL}${
            import.meta.env.VITE_APP_API_FEATURE_SELECTION
          }`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              method,
              target_var,
              dataset: csvData,
            }),
          }
        );

        const Data = await res.json();

        setData(Data.selected_features);
      })();
    }
  }, [method, target_var, csvData]);

  return (
    <div>
      {data && (
        <div className="mt-8">
          <div>
            <h3 className="font-medium text-lg mb-1">
              Selected Features and Scores:{" "}
            </h3>
            <NextTable rowData={data.selected_features} />
          </div>
          {data.graph_data && data.graph_data.scatter_plot && (
            <div className="flex justify-center mt-4">
              <Plot
                data={JSON.parse(data.graph_data.scatter_plot).data}
                layout={{
                  ...JSON.parse(data.graph_data.scatter_plot).layout,
                  showlegend: true,
                }}
                config={{
                  editable: true,
                  responsive: true,
                }}
              />
            </div>
          )}
          {data.graph_data && data.graph_data.bar_plot && (
            <div className="flex justify-center mt-4">
              <Plot
                data={JSON.parse(data.graph_data.bar_plot).data}
                layout={{
                  ...JSON.parse(data.graph_data.bar_plot).layout,
                  showlegend: true,
                }}
                config={{
                  editable: true,
                  responsive: true,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MutualInformation;
