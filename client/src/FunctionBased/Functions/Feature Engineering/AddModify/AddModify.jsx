import { Checkbox, Input, Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  setAddToPipeline,
  setColumnName,
  setDatasetName,
  setMethod,
  setOption,
  setSaveAsNew,
  setSelectColumn,
} from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import Add_ExtractText from "./Component/Add_ExtractText";
import Add_GroupCategorical from "./Component/Add_GroupCategorical";
import Add_GroupNumerical from "./Component/Add_GroupNumerical";
import Add_MathOperation from "./Component/Add_MathOperation";
import Add_NewColumn from "./Component/Add_NewColumn";
import Modify_ProgressApply from "./Component/Modify_ProgressApply";
import Modify_ReplaceValue from "./Component/Modify_ReplaceValue";
import { CreateFile } from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";

function AddModify({ csvData }) {
  const [currentOption, setCurrentOption] = useState("Add");
  const [currentMethod, setCurrentMethod] = useState("New Column");
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);
  const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
  const dispatch = useDispatch();
  const featureData = useSelector((state) => state.featureEngineering);
  const [selectedColumn, setSelectedColumn] = useState("");
  const render = useSelector((state) => state.uploadedFile.rerender);

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    dispatch(setSelectColumn(selectedColumn));
  }, [selectedColumn, dispatch]);

  const handleOptionClicked = (e) => {
    setCurrentOption(e.target.value);
    let meth;
    if (e.target.value === "Add") {
      setCurrentMethod("New Column");
      meth = "New Column";
    } else {
      setCurrentMethod("Math Operation");
      meth = "Math Operation";
    }
    dispatch(setOption(e.target.value));
    dispatch(setMethod(meth));
  };

  const handleInputChange = (e) => {
    dispatch(setColumnName(e.target.value));
  };

  const handleSave = async () => {
    console.log(featureData);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_FEATURE_CREATION
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(featureData),
        }
      );
      let data = await res.json();
      let fileName = activeCsvFile.name;

      if (featureData.save_as_new) {
        fileName = featureData.dataset_name;
        await CreateFile({
          data,
          filename: fileName,
          foldername: activeFolder,
        });
      } else {
        await updateDataInIndexedDB(fileName, data);
      }

      toast.success(
        `Data ${currentOption === "Add" ? "added" : "modified"} successfully!`,
        {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        }
      );
      dispatch(setReRender(!render));
    } catch (error) {
      console.log(error);
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
    <div>
      <div className="flex justify-between items-end gap-8 mt-8">
        <div className="w-full flex flex-col">
          <label
            className="mb-1 text-lg tracking-wide font-medium"
            htmlFor="option"
          >
            Option
          </label>
          <select
            name=""
            id="option"
            className="py-[0.6rem] rounded-xl px-3"
            value={currentOption}
            onChange={handleOptionClicked}
          >
            <option value="Add">Add</option>
            <option value="Modify">Modify</option>
          </select>
        </div>
        <div className="w-full flex flex-col">
          <label className=" text-lg tracking-wide font-medium" htmlFor="">
            {currentOption === "Add" ? "New column name" : "Select Column"}
          </label>
          {currentOption === "Add" ? (
            <Input
              bordered
              color="success"
              className="mt-1"
              onChange={handleInputChange}
            />
          ) : (
            <SingleDropDown
              columnNames={Object.keys(csvData[0])}
              onValueChange={setSelectedColumn}
            />
          )}
        </div>
        <div className="w-full flex flex-col">
          <label
            className="mb-1 text-lg tracking-wide font-medium"
            htmlFor="method"
          >
            Method
          </label>
          <select
            name=""
            id="method"
            className="py-[0.6rem] rounded-xl px-3"
            value={currentMethod}
            onChange={(e) => {
              setCurrentMethod(e.target.value);
              dispatch(setMethod(e.target.value));
            }}
          >
            {currentOption === "Add" && (
              <option value="New Column">New Column</option>
            )}
            <option value="Math Operation">Math Operation</option>
            <option value="Extract Text">Extract Text</option>
            <option value="Group Categorical">Group Categorical</option>
            <option value="Group Numerical">Group Numerical</option>
            {currentOption === "Modify" && (
              <>
                <option value="Replace Values">Replace Values</option>
                <option value="Progress Apply">Progress Apply</option>
              </>
            )}
          </select>
        </div>
        <div className="w-full flex flex-col">
          <Checkbox
            defaultSelected
            color="success"
            onChange={(e) => {
              dispatch(setAddToPipeline(e.valueOf()));
            }}
          >
            Add To Pipeline
          </Checkbox>
          <button className="border-2 tracking-wider w-max bg-transparent border-primary-btn py-1 text-sm px-5 hover:bg-primary-btn hover:text-white mt-2 rounded">
            Show Sample
          </button>
        </div>
      </div>
      <div className="mt-8">
        {csvData && currentMethod === "New Column" && (
          <Add_NewColumn csvData={csvData} />
        )}
        {csvData && currentMethod === "Math Operation" && (
          <Add_MathOperation csvData={csvData} />
        )}
        {csvData && currentMethod === "Extract Text" && (
          <Add_ExtractText csvData={csvData} />
        )}
        {csvData && currentMethod === "Group Categorical" && (
          <Add_GroupCategorical csvData={csvData} />
        )}
        {csvData && currentMethod === "Group Numerical" && (
          <Add_GroupNumerical csvData={csvData} />
        )}
        {csvData && currentMethod === "Replace Values" && (
          <Modify_ReplaceValue csvData={csvData} />
        )}
        {csvData && currentMethod === "Progress Apply" && (
          <Modify_ProgressApply csvData={csvData} />
        )}
      </div>
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
          <Docs section={"addModify"} />
        </div>
      </Modal>
    </div>
  );
}

export default AddModify;
