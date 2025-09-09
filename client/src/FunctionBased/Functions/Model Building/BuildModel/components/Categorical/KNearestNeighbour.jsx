import { Input, Loading } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setHyperparameterData,
  setModelSetting,
} from "../../../../../../Slices/ModelBuilding";
import MultipleDropDown from "../../../../../Components/MultipleDropDown/MultipleDropDown";
import NextTable from "../../../../../Components/NextTable/NextTable";
import SingleDropDown from "../../../../../Components/SingleDropDown/SingleDropDown";

const DISPLAY_METRICES = ["Accuracy", "Precision", "Recall", "F1-Score"];

function KNearestNeighbour({
  train,
  test,
  Type = "function",
  initValue = undefined,
  onValueChange = undefined,
}) {
  const hyperparameterOption = useSelector(
    (state) => state.modelBuilding.hyperparameter
  );
  const regressor = useSelector((state) => state.modelBuilding.regressor);
  const type = useSelector((state) => state.modelBuilding.type);
  const target_variable = useSelector(
    (state) => state.modelBuilding.target_variable
  );
  const dispatch = useDispatch();
  const [optimized_data, setOptimizedData] = useState({
    "Multiclass Average": "micro",
    n_neighbors: 2,
    weights: "uniform",
    metric: "minkowski",
  });
  const [hData, setHData] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Type === "node" && initValue) {
      setOptimizedData({
        ...optimized_data,
        ...initValue,
      });
    }
  }, []);

  useEffect(() => {
    dispatch(setModelSetting(optimized_data));
    if (Type === "node") {
      onValueChange(optimized_data);
    }
  }, [dispatch, optimized_data]);

  const handleOptimization = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_HYPERPARAMETER_OPTIMIZATION
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            train,
            test,
            [type === "regressor" ? "regressor" : "classifier"]: regressor,
            type,
            target_var: target_variable,
            ...hyperparameterOption,
          }),
        }
      );

      const data = await res.json();

      setHData(data);
      setOptimizedData({ ...optimized_data, ...data.param });
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  return (
    <div>
      {Type === "function" && (
        <div>
          <h1 className="text-2xl font-medium tracking-wide mb-2">
            Hyperparameter Optimization Settings
          </h1>
          <div className="grid grid-cols-2 gap-8">
            <div className="w-full flex flex-col justify-start gap-4 mt-2">
              <div className="w-full">
                <p className="mb-1">
                  Number of iterations for hyperparameter search
                </p>
                <Input
                  onChange={(e) =>
                    dispatch(
                      setHyperparameterData({
                        ...hyperparameterOption,
                        "Number of iterations for hyperparameter search":
                          e.target.value,
                      })
                    )
                  }
                  fullWidth
                  bordered
                  color="success"
                  type="number"
                />
              </div>
              <div className="w-full">
                <p className="mb-1">Number of cross-validation folds</p>
                <Input
                  onChange={(e) =>
                    dispatch(
                      setHyperparameterData({
                        ...hyperparameterOption,
                        "Number of cross-validation folds": e.target.value,
                      })
                    )
                  }
                  fullWidth
                  bordered
                  color="success"
                  type="number"
                />
              </div>
              <div className="w-full">
                <p className="mb-1">Random state for hyperparameter search</p>
                <Input
                  onChange={(e) =>
                    dispatch(
                      setHyperparameterData({
                        ...hyperparameterOption,
                        "Random state for hyperparameter search":
                          e.target.value,
                      })
                    )
                  }
                  fullWidth
                  bordered
                  color="success"
                  type="number"
                />
              </div>
            </div>
            <div className="w-full">
              {hData && hData.result && (
                <>
                  <p className="mb-2 font-medium tracking-wide">
                    Best Estimator
                  </p>
                  <NextTable rowData={hData.result} />
                </>
              )}
              {loading && (
                <div className="grid place-content-center h-full">
                  <Loading size="lg" color={"success"}>
                    Fetching Data...
                  </Loading>
                </div>
              )}
            </div>
          </div>
          <button
            className="self-start border-2 px-4 tracking-wider border-primary-btn text-black font-medium text-sm rounded-md py-2 mt-6"
            onClick={handleOptimization}
            disabled={loading}
          >
            Run Optimization
          </button>
        </div>
      )}
      <div className="mt-8">
        {Type === "function" && (
          <h1 className="text-2xl font-medium tracking-wide mb-3">
            Model Settings
          </h1>
        )}
        <div
          className={`grid grid-cols-3 gap-8 ${
            Type === "node" && "!grid-cols-2 !gap-4"
          }`}
        >
          <Input
            type="number"
            fullWidth
            bordered
            color="success"
            label="Number of neighbors"
            value={optimized_data.n_neighbors || 2}
            onChange={(e) =>
              setOptimizedData({
                ...optimized_data,
                n_neighbors: e.target.value,
              })
            }
            step={1}
          />

          <div>
            <p>Weight Function</p>
            <SingleDropDown
              columnNames={["uniform", "distance"]}
              initValue={optimized_data.weights || "uniform"}
              onValueChange={(e) =>
                setOptimizedData({ ...optimized_data, weights: e })
              }
            />
          </div>
          <div>
            <p>Distance Metric</p>
            <SingleDropDown
              columnNames={["minkowski", "euclidean", "manhattan"]}
              initValue={optimized_data.metric || "minkowski"}
              onValueChange={(e) =>
                setOptimizedData({ ...optimized_data, metric: e })
              }
            />
          </div>
          <div>
            <p>Multiclass Average</p>
            <SingleDropDown
              columnNames={["micro", "macro", "weighted"]}
              initValue={optimized_data["Multiclass Average"] || "micro"}
              onValueChange={(e) =>
                setOptimizedData({ ...optimized_data, "Multiclass Average": e })
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2">Display Metrices</p>
          <MultipleDropDown
            columnNames={DISPLAY_METRICES}
            defaultValue={
              optimized_data["Display Metrices"] || DISPLAY_METRICES
            }
            setSelectedColumns={(e) =>
              setOptimizedData({ ...optimized_data, "Display Metrices": e })
            }
          />
        </div>
      </div>
    </div>
  );
}

export default KNearestNeighbour;
