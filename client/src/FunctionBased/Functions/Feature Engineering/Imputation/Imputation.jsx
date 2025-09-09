import { Checkbox, Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setSaveAsNew } from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import { CreateFile } from "../../../../util/utils";

function Imputation({
  csvData,
  type = "function",
  initValue = undefined,
  onValueChange = undefined,
}) {
  const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
  const [dataset_name, setDatasetName] = useState("");
  const dispatch = useDispatch();
  const [imputationNotExist, setImputationNotExist] = useState(true);
  const [nullVar, setNullVar] = useState([]);
  const [select_column, setSelectColumn] = useState();
  const [group_by, setGroupBy] = useState([]);
  const [strategy, setStrategy] = useState([]);
  const [activeStrategy, setActiveStrategy] = useState();
  const [mode, setMode] = useState("Select Mode");
  const [modeData, setModeData] = useState([]);
  const [optionValue, setOptionValue] = useState();
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [constant, setConstant] = useState();
  const [fill_group, setFillGroup] = useState();
  const render = useSelector((state) => state.uploadedFile.rerender);

  useEffect(() => {
    if (type === "node" && initValue) {
      setGroupBy(initValue.group_by || []);
      setModeData(initValue.modeData || []);

      setConstant(initValue.constant || []);
      setFillGroup(initValue.fill_group);
      setActiveStrategy(initValue.activeStrategy);
      setSelectColumn(initValue.select_column);
      if (typeof csvData[0][initValue.select_column] === "number")
        setStrategy(["mean", "median", "constant"]);
      else setStrategy(["mode", "value"]);
    }
  }, []);

  useEffect(() => {
    if (type === "node") {
      onValueChange({
        group_by,
        modeData,
        activeStrategy,
        constant,
        fill_group,
        select_column,
        strategy,
      });
    }
  }, [
    group_by,
    modeData,
    activeStrategy,
    constant,
    fill_group,
    select_column,
    strategy,
  ]);

  useEffect(() => {
    setImputationNotExist(true);
    setNullVar([]);
    setStrategy(null);
    // setActiveStrategy();

    const fetchData = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_IMPUTATION_DATA1
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: csvData,
          }),
        }
      );

      const data = await res.json();

      if ((!data.null_var || data.null_var.length === 0) && type === "function")
        setImputationNotExist(true);
      else setImputationNotExist(false);
      setNullVar(data.null_var);

      if (select_column) {
        if (typeof csvData[0][select_column] === "number")
          setStrategy(["mean", "median", "constant"]);
        else setStrategy(["mode", "value"]);
      }
    };
    fetchData();
  }, [csvData, select_column]);

  const handleSave = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_APP_API_URL}${
        import.meta.env.VITE_APP_API_IMPUTATION_RESULT
      }`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: csvData,
          Select_columns: select_column,
          strategy: activeStrategy === "mode" ? "constant" : activeStrategy,
          fill_group,
          constant,
        }),
      }
    );

    let Data = await res.json();

    Data = Data.dataset;

    let fileName = activeCsvFile.name;

    if (savedAsNewDataset) {
      fileName = dataset_name;
      await CreateFile({
        data: Data,
        filename: fileName,
        foldername: activeFolder,
      });
    } else {
      await updateDataInIndexedDB(fileName, data);
    }

    toast.success(`Data updated successfully!`, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
    dispatch(setReRender(!render));
  };

  async function handleSelectColumn(e) {
    if (typeof csvData[0][e] === "number")
      setStrategy(["mean", "median", "constant"]);
    else setStrategy(["mode", "value"]);
    setSelectColumn(e);

    const res = await fetch(
      `${import.meta.env.VITE_APP_API_URL}${
        import.meta.env.VITE_APP_API_IMPUTATION_DATA2
      }`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: csvData,
          Select_columns: e,
        }),
      }
    );

    const data = await res.json();

    setGroupBy(data.group_by);
    if (data.mode) setModeData(Object.values(data.mode));
  }

  if (imputationNotExist)
    return (
      <h1 className="my-8 text-3xl font-medium">Imputation doesn't exist</h1>
    );

  return (
    <div className="my-8 space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex-grow">
          <p>Select Columns</p>
          <SingleDropDown
            columnNames={nullVar}
            onValueChange={(e) => handleSelectColumn(e)}
            initValue={select_column}
          />
        </div>
        {type === "function" && (
          <Checkbox label="Add to pipeline" color="success" />
        )}
      </div>
      <div className="">
        <p>Strategy</p>
        <SingleDropDown
          columnNames={strategy}
          onValueChange={(e) => {
            setActiveStrategy(e);
            setConstant();
          }}
          initValue={activeStrategy}
        />
      </div>

      {activeStrategy && strategy && strategy[0] === "mean" && (
        <div>
          {activeStrategy === "constant" ? (
            <Input
              fullWidth
              label="Value"
              type="number"
              step={0.01}
              value={constant || 0}
              onChange={(e) => setConstant(e.target.value)}
            />
          ) : (
            <div>
              <p>Group By</p>
              <SingleDropDown
                columnNames={group_by}
                onValueChange={setFillGroup}
                initValue={fill_group}
              />
            </div>
          )}
        </div>
      )}
      {activeStrategy && strategy && strategy[0] === "mode" && (
        <div>
          {activeStrategy === "value" ? (
            <Input
              fullWidth
              label="Value"
              type="number"
              step={0.01}
              value={constant || 0}
              onChange={(e) => setConstant(e.target.value)}
            />
          ) : (
            <div className="flex gap-4">
              <div className="w-full">
                <p>Options</p>
                <SingleDropDown
                  columnNames={["Select Mode", "Group Mode"]}
                  onValueChange={(e) => {
                    setMode(e);
                    setOptionValue("");
                    setConstant();
                    setFillGroup();
                  }}
                />
              </div>
              {mode === "Group Mode" && (
                <div className="w-full">
                  <p>Group By</p>
                  <SingleDropDown
                    columnNames={group_by}
                    initValue={optionValue}
                    onValueChange={setFillGroup}
                  />
                </div>
              )}

              {mode === "Select Mode" && (
                <div className="w-full">
                  <p>Mode value</p>
                  <SingleDropDown
                    columnNames={modeData}
                    initValue={optionValue}
                    onValueChange={setConstant}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {type === "function" && (
        <div className="mt-4 flex flex-col gap-4">
          <Checkbox
            color="success"
            onChange={(e) => {
              setSavedAsNewDataset(e.valueOf());
              dispatch(setSaveAsNew(e.valueOf()));
            }}
          >
            Save as New Dataset
          </Checkbox>
          {savedAsNewDataset && (
            <div>
              <Input
                label="New Dataset Name"
                fullWidth
                clearable
                value={dataset_name}
                onChange={(e) => {
                  setDatasetName(e.target.value);
                }}
              />
            </div>
          )}
          <button
            className="self-start border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

export default Imputation;
