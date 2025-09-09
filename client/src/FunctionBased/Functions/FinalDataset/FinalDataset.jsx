import { Collapse } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import AgGridAutoDataComponent from "../../Components/AgGridComponent/AgGridAutoDataComponent";
import { FetchFileNames } from "../../../util/utils";
import { handleApiError } from "../../../util/util";

function FinalDataset() {
  const [fileNames, setFileNames] = useState([]);
  const [fileData, setFileData] = useState({}); // Stores data for each file
  const [error, setError] = useState(null); // Stores any fetch errors

  useEffect(() => {
    // Fetch the list of files from the backend when the component mounts
    const fetchFileNames = async () => {
      try {
        const files = await FetchFileNames();
        setFileNames(files);
      } catch (err) {
        console.error(err);
        handleApiError(err, 'fetching file names');
        setError(err.message);
      }
    };
    fetchFileNames();
  }, []);

  const handleCollapseChange = async (key) => {
    const fileIndex = parseInt(key, 10);
    const filePath = fileNames[fileIndex - 1];

    // if (!filePath || fileData[fileIndex]) return;

    try {
      // Split the filePath to get folder and file names
      const pathParts = filePath.split("/");
      const file = pathParts.pop();
      let folder;

      if (pathParts.length) folder = pathParts.join("/");
      else folder = "/";

      // Construct the query parameters
      const params = new URLSearchParams();
      if (folder) params.append("folder", folder);
      params.append("file", file);

      // Fetch the file data from the backend
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/dataset?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error(
          `Error fetching data for file ${filePath}: ${response.statusText}`
        );
      }
      const data = await response.json();

      // Update fileData state with the fetched data
      setFileData((prevData) => ({
        ...prevData,
        [fileIndex - 1]: data,
      }));
    } catch (err) {
      console.error(err);
      handleApiError(err, `fetching file data for ${filePath}`);
      setError(err.message);
    }
  };

  return (
    <div className="my-8 border shadow p-1 px-4">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      {fileNames && fileNames.length && (
        <Collapse.Group accordion={true} onChange={handleCollapseChange}>
          {fileNames.map((filePath, index) => (
            <Collapse
              key={index} // Use the index as the key
              title={
                <h1 className="font-medium tracking-wider text-lg">
                  {filePath}
                </h1>
              }
            >
              <div className="min-h-[600px]">
                {fileData[index] ? (
                  <AgGridAutoDataComponent
                    download={true}
                    rowData={fileData[index]}
                    height="500px"
                  />
                ) : (
                  <p>Loading data...</p>
                )}
              </div>
            </Collapse>
          ))}
        </Collapse.Group>
      )}
    </div>
  );
}

export default FinalDataset;
