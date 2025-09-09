import { Input, Modal, Radio } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { fetchDataFromIndexedDB } from "../../../util/indexDB";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../Components/SingleDropDown/SingleDropDown";
import { ReadFile } from "../../../util/utils";
import Docs from "../../../Docs/Docs";

function ModelDeployment({ csvData }) {
  const [allColumnNames, setAllColumnNames] = useState([]);
  const [allColumnValues, setAllColumnValues] = useState([]);
  const [splitted_datasets, setSplittedDatasets] = useState();
  const [datasetsName, setDatasetNames] = useState();
  const [allModels, setAllModels] = useState();
  const [modelNames, setModelsNames] = useState();
  const [current_dataset, setCurrentDataset] = useState();
  const [select_columns, setSelectColumns] = useState("all");
  const [filtered_column, setFilteredColumn] = useState(allColumnValues);
  const [train_data, setTrainData] = useState();
  const [target_val, setTargetVal] = useState();
  const [current_model, setCurrentModel] = useState();
  const [model_deploy, setModelDeploy] = useState();
  const [pred_result, setPredResult] = useState();
  const [dataframe, setDataframe] = useState();
  const [rowDef, setRowDef] = useState();
  const [columnDefs, setColumnDefs] = useState();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchDataFromIndexedDB("models");
      const sp_data = await fetchDataFromIndexedDB("splitted_dataset");
      const tempDatasets = res.map((val) => Object.keys(val)[0]);

      setDatasetNames(tempDatasets);
      setAllModels(res);
      setSplittedDatasets(sp_data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (allModels) {
      setModelDeploy(
        allModels.filter((val) => current_dataset in val)[0][current_dataset][
          current_model
        ]["model_deploy"]
      );
    }
  }, [current_model]);

  useEffect(() => {
    if (dataframe) {
      const temp =
        dataframe && dataframe.length > 0
          ? Object.keys(dataframe[0]).map((key) => ({
              headerName: key,
              field: key,
              valueGetter: (params) => {
                return params.data[key];
              },
            }))
          : [];
      setColumnDefs(temp);
      let tempFilteredCol = filtered_column.map((val) => val.col);
      tempFilteredCol = new Set(tempFilteredCol);

      const tempRow = dataframe.filter((val) =>
        tempFilteredCol.has(val["Name of Features"])
      );

      setRowDef(tempRow);
    }
  }, [dataframe, filtered_column]);

  const handleDatasetChange = async (name) => {
    setPredResult("");
    setCurrentDataset(name);
    const sp_ind = splitted_datasets.findIndex((obj) => name in obj);
    const res = allModels.map((val) => val[name]);
    const ind = allModels.findIndex((obj) => name in obj);
    if (ind !== -1) {
      const tempModel = Object.keys(allModels[ind][name]);
      setCurrentModel(tempModel[0]);
      setModelsNames(tempModel);
    }
    if (sp_ind !== -1) {
      setTargetVal(splitted_datasets[sp_ind][name][3]);

      const train = await ReadFile({
        foldername: splitted_datasets[sp_ind][name][5],
        filename: splitted_datasets[sp_ind][name][1] + ".csv",
      });

      setTrainData(train);
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_DEPLOY_DATA
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            train,
            target_var: splitted_datasets[sp_ind][name][3],
          }),
        }
      );
      const data = await res.json();

      console.log(data);
      setDataframe(data.dataframe);
      setAllColumnValues(data.result);
      setAllColumnNames(data.result.map((val) => val.col));
      setFilteredColumn(data.result);
    }
  };

  const handleChangeValue = (ind, value) => {
    setFilteredColumn(
      filtered_column.map((val, i) => {
        if (i === ind)
          return {
            ...val,
            value:
              val.data_type === "float" ? parseFloat(value) : parseInt(value),
          };
        return val;
      })
    );
  };

  const handleSave = async () => {
    let result = {};
    filtered_column.forEach((val) => {
      result = { ...result, [val.col]: val.value };
    });

    const res2 = await fetch(
      `${import.meta.env.VITE_APP_API_URL}${
        import.meta.env.VITE_APP_API_DEPLOY_RESULT
      }`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_deploy,
          result,
          train: train_data,
          target_var: target_val,
        }),
      }
    );

    const dat = await res2.json();

    setPredResult(dat.pred);
  };

  if (!datasetsName || datasetsName.length === 0)
    return (
      <div className="mt-8 font-semibold tracking-wide text-2xl">
        Split a dataset first...
      </div>
    );

  return (
    <div className="my-8">
      <div>
        <p>Select Test Train Dataset</p>
        <SingleDropDown
          columnNames={datasetsName}
          onValueChange={(e) => handleDatasetChange(e)}
        />
      </div>
      {modelNames && modelNames.length > 0 && (
        <>
          <div className="mt-4">
            <p>Select Model</p>
            <SingleDropDown
              columnNames={modelNames}
              onValueChange={(e) => {
                setCurrentModel(e);
                setPredResult("");
              }}
              initValue={current_model}
            />
          </div>
          <div className="mt-4">
            <Radio.Group
              label="Select Columns"
              orientation="horizontal"
              color="success"
              defaultValue={select_columns}
              onChange={(e) => {
                if (e === "all") {
                  setFilteredColumn(allColumnValues);
                } else {
                  setFilteredColumn([]);
                }
                setSelectColumns(e);
              }}
            >
              <Radio value="all">All Columns</Radio>
              <Radio value="custom">Custom Columns</Radio>
            </Radio.Group>
          </div>
          {select_columns === "custom" && (
            <div className="mt-4">
              <p>Custom Columns</p>
              <MultipleDropDown
                columnNames={allColumnNames}
                setSelectedColumns={(e) => {
                  const tempSet = new Set(e);
                  const temp = allColumnValues.filter((val) =>
                    tempSet.has(val.col)
                  );
                  setFilteredColumn(temp);
                }}
              />
            </div>
          )}
          {filtered_column && filtered_column.length > 0 && (
            <div className="grid grid-cols-2 gap-8 mt-4 relative">
              <div className="mt-4">
                <h3 className="font-medium text-3xl tracking-wide mb-4">
                  Input Values
                </h3>
                <div className="flex flex-col gap-4">
                  {filtered_column.map((val, ind) => (
                    <div key={ind}>
                      <p className="mb-1">{filtered_column[ind].col}</p>
                      <Input
                        bordered
                        color="success"
                        value={
                          filtered_column[ind].data_type === "float"
                            ? parseFloat(filtered_column[ind].value)
                            : parseInt(filtered_column[ind].value)
                        }
                        onChange={(e) => handleChangeValue(ind, e.target.value)}
                        fullWidth
                        step={
                          filtered_column[ind].data_type === "float" ? 0.01 : 1
                        }
                        type="number"
                        size="lg"
                      />
                    </div>
                  ))}
                </div>
                <button
                  className="self-start border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2 mt-8"
                  onClick={handleSave}
                >
                  Submit
                </button>
              </div>
              <div className="">
                <div className="mt-4">
                  <h1 className="font-medium text-3xl tracking-wide">
                    Prediction
                  </h1>
                  <p className="mt-4 text-2xl">
                    {target_val}:{" "}
                    <span className="font-semibold ml-2">{pred_result}</span>
                  </p>
                </div>
                {/* <div className="mt-8 w-full max-w-xl h-[610px] ag-theme-alpine">
                  <AgGridComponent rowData={rowDef} columnDefs={columnDefs} />
                </div> */}
              </div>
            </div>
          )}

                {/* DOCS */}
      <button
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
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
              <Docs section={"modelDeployment"} />
            </div>
          </Modal>
        </>
      )}
      {current_dataset && (!modelNames || modelNames.length === 0) && (
        <h1 className="mt-4 font-medium text-xl tracking-wide">
          Build a model first
        </h1>
      )}
    </div>
  );
}

export default ModelDeployment;
