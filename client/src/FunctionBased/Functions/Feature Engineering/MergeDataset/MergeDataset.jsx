import { Input, Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import { CreateFile, ReadFile } from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";

const HOW = ["left", "right", "outer", "inner", "cross"];

function MergeDataset({ csvData }) {
  const leftDataframe = Object.keys(csvData[0]);
  const [rightDataframe, setRightDataframe] = useState([]);
  const [anotherCsvData, setAnotherCsvData] = useState();
  const [new_dataset_name, setNewDatasetName] = useState("");
  const [how, setHow] = useState();
  const [leftDataframeValue, setLeftDataframeValue] = useState();
  const [rightDataframeValue, setRightDataframeValue] = useState();
  const [secondDatasetName, setSecondDatasetName] = useState("");
  const dispatch = useDispatch();
  const render = useSelector((state) => state.uploadedFile.rerender);
  const [fileNames, setFileNames] = useState([]);
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    // Fetch the list of files from the backend when the component mounts
    const fetchFileNames = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_API_URL}${
            import.meta.env.VITE_APP_API_DATASET
          }`
        );
        if (!response.ok) {
          throw new Error(`Error fetching file names: ${response.statusText}`);
        }
        const data = await response.json();
        const files = getAllFiles(data);
        setFileNames(files);
      } catch (err) {
        console.error(err);
        toast.error(err.message);
        // setError(err.message);
      }
    };

    fetchFileNames();
  }, []);

  const getAllFiles = (structure, parentPath = "") => {
    let files = [];
    for (const key in structure) {
      if (key === "files") {
        files = files.concat(
          structure[key].map((file) =>
            parentPath ? `${parentPath}/${file}` : file
          )
        );
      } else {
        const subFiles = getAllFiles(
          structure[key],
          parentPath ? `${parentPath}/${key}` : key
        );
        files = files.concat(subFiles);
      }
    }
    return files;
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_MERGE_DATASET
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            how,
            left_dataframe: leftDataframeValue,
            right_dataframe: rightDataframeValue,
            file: csvData,
            file2: anotherCsvData,
          }),
        }
      );
      let Data = await res.json();
      Data = JSON.parse(Data);

      let fileName = new_dataset_name;

      await CreateFile({
        data: Data,
        filename: fileName,
        foldername: activeFolder,
      });

      toast.success(`Dataset merged successfully!`, {
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

      setAnotherCsvData();
      setRightDataframe([]);
      setRightDataframeValue();
      setSecondDatasetName("");
    } catch (error) {
      toast.error(error.message, {
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

  const handleDatasetMerge = async (val) => {
    if (!val) return;
    const splittedFolder = val.split("/");
    const foldername = splittedFolder
      .slice(0, splittedFolder.length - 1)
      .join("/");

    const data = await ReadFile({
      foldername,
      filename: splittedFolder[splittedFolder.length - 1],
    });

    setRightDataframe(Object.keys(data[0]));
    setAnotherCsvData(data);
    setSecondDatasetName(val);
  };

  return (
    <div>
      <div className="mt-8 flex flex-col gap-4">
        <div>
          <p>Select Dataset You Wanna Merge With</p>
          <SingleDropDown
            columnNames={fileNames}
            onValueChange={(e) => handleDatasetMerge(e)}
          />
        </div>
        {secondDatasetName && (
          <div className="space-y-4">
            <div>
              <p>How</p>
              <SingleDropDown columnNames={HOW} onValueChange={setHow} />
            </div>
            <div>
              <Input
                bordered
                color="success"
                fullWidth
                label="New Dataset Name"
                value={new_dataset_name}
                onChange={(e) => setNewDatasetName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>Select column name for left dataframe:</p>
                <SingleDropDown
                  columnNames={leftDataframe}
                  onValueChange={setLeftDataframeValue}
                />
              </div>
              <div>
                <p>Select column name for right dataframe:</p>
                <SingleDropDown
                  columnNames={rightDataframe}
                  onValueChange={setRightDataframeValue}
                />
              </div>
            </div>
            <button
              className="self-start border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2 mt-8"
              onClick={handleSave}
            >
              Merge
            </button>
          </div>
        )}
      </div>

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
          <Docs section={"mergeDataset"} />
        </div>
      </Modal>
    </div>
  );
}

export default MergeDataset;
