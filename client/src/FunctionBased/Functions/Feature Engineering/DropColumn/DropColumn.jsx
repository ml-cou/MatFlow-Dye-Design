import { Checkbox, Input, Radio } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  setDatasetName,
  setSaveAsNew,
} from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import MultipleDropDown from "../../../Components/MultipleDropDown/MultipleDropDown";
import { CreateFile } from "../../../../util/utils";

function DropColumn({
  csvData,
  type = "function",
  onValueChange = undefined,
  initValue = undefined,
}) {
  const [defaultValue, setDefaultValue] = useState("Blank");
  const allColumns = csvData && csvData.length > 0 ? Object.keys(csvData[0]) : [];
  const [selectedColumns, setSelectedColumns] = useState();
  const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
  const dispatch = useDispatch();
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);
  const [add_to_pipeline, setAddToPipeline] = useState(false);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const featureData = useSelector((state) => state.featureEngineering);
  const render = useSelector((state) => state.uploadedFile.rerender);

  // Early return if no data is available
  if (!csvData || csvData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Dataset Available</h3>
          <p className="text-gray-500">Please upload a dataset to use the Drop Column feature.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (initValue) {
      setDefaultValue(initValue.default_value);
      setSelectedColumns(initValue.select_columns);
    }
  }, []);

  useEffect(() => {
    if (type === "node") {
      onValueChange({
        default_value: defaultValue,
        select_columns: selectedColumns,
      });
    }
  }, [type, defaultValue, selectedColumns]);

  useEffect(() => {
    if (!csvData || csvData.length === 0) return;
    
    if (defaultValue === "Blank" || defaultValue === "With Null")
      setSelectedColumns([]);
    if (defaultValue === "All") setSelectedColumns(Object.keys(csvData[0]));
    if (defaultValue === "Numerical")
      setSelectedColumns(
        Object.keys(csvData[0]).filter(
          (val) => typeof csvData[0][val] === "number"
        )
      );
    if (defaultValue === "Categorical")
      setSelectedColumns(
        Object.keys(csvData[0]).filter(
          (val) => typeof csvData[0][val] === "string"
        )
      );
  }, [defaultValue, csvData]);

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_DROP_COLUMN
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            default_value: defaultValue,
            select_columns: selectedColumns,
            file: csvData,
          }),
        }
      );
      let Data = await res.json();

      let fileName = activeCsvFile.name;

      if (featureData.save_as_new) {
        fileName = featureData.dataset_name;
        await CreateFile({
          data: Data,
          filename: fileName,
          foldername: activeFolder,
        });
      } else {
        await updateDataInIndexedDB(fileName, Data);
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
    } catch (error) {
      toast.error("Something went wrong. Please try again", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-4">
        <div className="w-full">
          <p>Default Value</p>
          <div>
            <Radio.Group
              orientation="horizontal"
              defaultValue="Blank"
              color="success"
              size={type === "node" ? "sm" : "md"}
              value={defaultValue}
              onChange={(e) => setDefaultValue(e)}
            >
              <Radio value="Blank">Blank</Radio>
              <Radio value="All">All</Radio>
              <Radio value="Numerical">Numerical</Radio>
              <Radio value="Categorical">Categorical</Radio>
              <Radio value="With Null">With Null</Radio>
            </Radio.Group>
          </div>
        </div>
        {type === "function" && (
          <Checkbox
            color="success"
            className="w-full"
            onChange={(e) => setAddToPipeline(e.valueOf())}
          >
            Add To Pipeline
          </Checkbox>
        )}
      </div>
      <div className="mt-4">
        <p>Select Columns</p>
        <MultipleDropDown
          columnNames={allColumns}
          setSelectedColumns={setSelectedColumns}
          defaultValue={selectedColumns}
        />
      </div>
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
                onChange={(e) => {
                  dispatch(setDatasetName(e.target.value));
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

export default DropColumn;
