import { Input } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import { CreateFile, ReadFile } from "../../../../util/utils";

function AppendDataset({ csvData }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [loading, setLoading] = useState(false);
  const [lessThanTwo, setLessThanTwo] = useState(true);
  const [availableDatasets, setAvailableDatasets] = useState();
  const [anotherCsvData, setAnotherCsvData] = useState();
  const [new_dataset_name, setNewDatasetName] = useState("");
  const render = useSelector((state) => state.uploadedFile.rerender);
  const dispatch = useDispatch();
  const activeFolder = useSelector((state) => state.uploadedFile.activeFolder);

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
        setAvailableDatasets(files);
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

  const handleChange = async (val) => {
    if (!val) return;
    const splittedFolder = val.split("/");
    const foldername = splittedFolder
      .slice(0, splittedFolder.length - 1)
      .join("/");

    const data = await ReadFile({
      foldername,
      filename: splittedFolder[splittedFolder.length - 1],
    });
    setAnotherCsvData(data);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_APPEND
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
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

      toast.success(`Dataset appended successfully!`, {
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
    <>
      <div className="flex flex-col gap-4 mt-8">
        <div>
          <p>Select Dataset You Wanna Append With</p>
          <SingleDropDown
            columnNames={availableDatasets}
            onValueChange={(val) => handleChange(val)}
          />
        </div>
        {anotherCsvData && (
          <>
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
            <button
              className="self-start border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2 mt-8"
              onClick={handleSave}
            >
              Append
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default AppendDataset;
