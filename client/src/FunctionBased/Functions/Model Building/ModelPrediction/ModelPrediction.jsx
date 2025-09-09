import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchDataFromIndexedDB } from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import ShowDataClassifier from "./ShowDataClassifier";
import ShowDataRegressor from "./ShowDataRegressor";
import { Modal } from "@nextui-org/react";
import Docs from "../../../../Docs/Docs";

const RESULT_CLASSIFIER = [
  "Target Value",
  "Accuracy",
  "Precision",
  "Recall",
  "F1-Score",
  "Classification Report",
  "Confusion Matrix",
  "Actual vs. Predicted",
  "Precision-Recall Curve",
  "ROC Curve",
];

const RESULT_REGRESSOR = [
  "Target Value",
  "R-Squared",
  "Mean Absolute Error",
  "Mean Squared Error",
  "Root Mean Squared Error",
  "Regression Line Plot",
  "Actual vs. Predicted",
  "Residuals vs. Predicted",
  "Histogram of Residuals",
  "QQ Plot",
  "Box Plot of Residuals",
];

function ModelPrediction({ csvData }) {
  const [selectDataset, setSelectDataset] = useState();
  const [allDataset, setAllDataset] = useState();
  const [allModels, setAllModels] = useState();
  const [select_data, setSelectData] = useState();
  const [target_variable, setTargetVariable] = useState("Vertical");
  const [select_model, setSelectModel] = useState();
  const [currentModels, setCurrentModels] = useState();
  const [modelData, setModelData] = useState();
  const [result, setResult] = useState();
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    const fetchData = async () => {
      let tempDatasets = await fetchDataFromIndexedDB("splitted_dataset");
      tempDatasets = tempDatasets.map((val) => Object.keys(val)[0]);
      setAllDataset(tempDatasets);

      let tempModels = await fetchDataFromIndexedDB("models");

      setAllModels(tempModels);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (type === "Categorical") setResult(RESULT_CLASSIFIER[0]);
    else setResult(RESULT_REGRESSOR[0]);
  }, [type]);

  const handleSelectDataset = async (e) => {
    setData();
    setSelectDataset(e);
    let temp = allModels.map((val) => {
      if (Object.keys(val)[0] === e) {
        return val[e];
      }
    });
    temp = temp.filter((val) => val !== undefined && val !== null)[0];
    setCurrentModels(Object.keys(temp));
    let tempDatasets = await fetchDataFromIndexedDB("splitted_dataset");
    tempDatasets = tempDatasets.map((val) => {
      if (Object.keys(val)[0] === e) {
        return val[e];
      }
    });
    tempDatasets = tempDatasets.filter(
      (val) => val !== undefined && val !== null
    )[0];
    setType(tempDatasets[0]);
    setSelectData(tempDatasets[4]);
    setTargetVariable(tempDatasets[3]);
  };

  const handleModelChange = async (e) => {
    setData();
    setSelectModel(e);
    let res = await fetchDataFromIndexedDB("models");

    res = res.map((val) => val[selectDataset]);
    res = res.filter((val) => val !== undefined && val !== null)[0][e];

    setModelData(res);
  };

  const handleSave = async () => {
    try {
      if (result in modelData.metrics) {
        setData(modelData.metrics[result]);
        return;
      }
      setLoading(true);
      const tempCsv = await fetchDataFromIndexedDB(select_data);

      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_MODEL_PREDICTION
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "Target Variable": target_variable,
            model: modelData.metrics_table,
            file: tempCsv,
            Result: result,
            y_pred: modelData.y_pred,
            type: modelData.type,
            regressor: modelData.regressor,
          }),
        }
      );

      const Data = await res.json();

      setData(Data);

      if (Data.error) {
        toast.error(JSON.stringify(Data.error), {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        setData();
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  if (!allDataset) return <div>Loading...</div>;
  if (!allModels || allModels.length === 0)
    return (
      <h1 className="mt-8 font-medium tracking-wider text-3xl">
        No Models Found...
      </h1>
    );
  return (
    <div className="mt-8">
      <div className="mb-4">
        <p>Select Test Train Dataset</p>
        <SingleDropDown
          columnNames={allDataset}
          onValueChange={(e) => handleSelectDataset(e)}
        />
      </div>
      <div>
        <p>Select Model</p>
        <SingleDropDown
          columnNames={currentModels || []}
          onValueChange={(e) => handleModelChange(e)}
        />
      </div>
      <div className="flex items-end gap-8 mt-4">
        <div className="w-full">
          <p>Select Data</p>
          <SingleDropDown
            columnNames={select_data ? [select_data] : []}
            initValue={select_data}
            onValueChange={setSelectData}
          />
        </div>
        <div className="w-full">
          <p>Target Variable</p>
          <SingleDropDown
            columnNames={target_variable ? [target_variable] : []}
            initValue={target_variable}
            onValueChange={setTargetVariable}
          />
        </div>
      </div>
      <div className="mt-4">
        <p>Result</p>
        <SingleDropDown
          columnNames={
            type === "Categorical" ? RESULT_CLASSIFIER : RESULT_REGRESSOR
          }
          initValue={result}
          onValueChange={(e) => {
            setResult(e);
            setData();
          }}
        />
      </div>
      <button
        className="self-start border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2 mt-8"
        onClick={handleSave}
        disabled={loading}
      >
        Show Result
      </button>
      {data &&
        (type === "Categorical" ? (
          <div className="mt-4">
            <ShowDataClassifier data={data} result={result} />
          </div>
        ) : (
          <div className="mt-4">
            <ShowDataRegressor data={data} result={result} />
          </div>
        ))}

      {/* DOCS */}
      <button
        className="fixed bottom-5 right-5 bg-primary-btn text-2xl font-black text-white rounded-full p-4 py-2 shadow-lg"
        onClick={openModal}
      >
        ?
      </button>
      <Modal
        open={visible}
        onClose={closeModal}
        aria-labelledby="help-modal"
        aria-describedby="help-modal-description"
        width="800px"
        scroll
        closeButton
      >
        <div className="bg-white text-left rounded-lg shadow-lg px-6 overflow-auto">
          <Docs section={"modelPrediction"} />
        </div>
      </Modal>
    </div>
  );
}

export default ModelPrediction;
