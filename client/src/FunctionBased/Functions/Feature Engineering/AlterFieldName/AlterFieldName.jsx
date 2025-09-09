import { Checkbox, Input, Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import {
  setDatasetName,
  setFile,
  setSaveAsNew,
} from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import { CreateFile } from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";

function AlterFieldName({ csvData }) {
  const dispatch = useDispatch();
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [data, setData] = useState([{ column_name: "", new_field_name: "" }]);
  const [numberOfColumns, setNumberOfColumns] = useState(1);
  const [columnNames, setColumnNames] = useState();
  const [savedAsNewDataset, setSavedAsNewDataset] = useState(false);
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);

  const featureData = useSelector((state) => state.featureEngineering);
  const render = useSelector((state) => state.uploadedFile.rerender);

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name) {
      const getData = async () => {
        setColumnNames(Object.keys(csvData[0]));
        dispatch(setFile(csvData));
      };

      getData();
    }
  }, [activeCsvFile, dispatch, csvData]);

  const handleChange = (val, index, key) => {
    const temp = data.map((d, ind) => {
      if (ind === index) return { ...d, [key]: val };
      return d;
    });
    setData(temp);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_ALTER_FIELD_NAME
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number_of_columns: numberOfColumns,
            data,
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
    <div className="my-8">
      <div className="flex gap-4 max-w-3xl items-center">
        <div className="basis-2/3">
          <Input
            label="Number of columns"
            value={numberOfColumns}
            onChange={(e) => {
              const val = e.target.value;
              setNumberOfColumns(val);
              if (val < data.length) setData(data.slice(0, val));
              else {
                const temp = JSON.parse(JSON.stringify(data));
                while (val - temp.length > 0) {
                  temp.push({
                    column_name: "",
                    new_field_name: "",
                  });
                }
                setData(temp);
              }
            }}
            type="number"
            step={1}
            fullWidth
          />
        </div>
        <div className="basis-1/3">
          <Checkbox color="success">Add to pipeline</Checkbox>
        </div>
      </div>
      <div className="mt-8">
        {csvData &&
          columnNames &&
          data.map((val, index) => {
            return (
              <div key={index} className="flex items-end gap-8 mt-6">
                <div className="w-full">
                  <p>Column {index + 1}</p>
                  <SingleDropDown
                    columnNames={columnNames}
                    onValueChange={(e) => handleChange(e, index, "column_name")}
                  />
                </div>
                <Input
                  fullWidth
                  label="New Field Name"
                  placeholder="New name."
                  value={val.new_field_name}
                  onChange={(e) =>
                    handleChange(e.target.value, index, "new_field_name")
                  }
                />
              </div>
            );
          })}
      </div>
      <div className="mt-8 flex flex-col gap-4">
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
          <Docs section={"alterFieldName"} />
        </div>
      </Modal>
    </div>
  );
}

export default AlterFieldName;
