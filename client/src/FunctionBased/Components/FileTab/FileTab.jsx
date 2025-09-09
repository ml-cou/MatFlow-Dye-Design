import React, { useEffect, useState, useRef } from "react";
import { AiFillFileText, AiFillFileExcel } from "react-icons/ai"; // Icons for file types
import { BsPencilSquare, BsTrash2Fill } from "react-icons/bs"; // Trash icon
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io"; // Arrow icons
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveFile,
  setActiveFolderAction,
} from "../../../Slices/UploadedFileSlice";
import { toast } from "react-toastify";
import { deleteIndexedDB, storeDataInIndexedDB } from "../../../util/indexDB";
import { setActiveFunction } from "../../../Slices/SideBarSlice";

function FileTab() {
  const [directoryStructure, setDirectoryStructure] = useState({}); // Fetched directory structure
  const [fileActiveId, setFileActiveId] = useState(
    localStorage.getItem("activeFileId") || ""
  ); // Active file ID
  const [activeFolder, setActiveFolder] = useState(
    localStorage.getItem("activeFolder") || ""
  ); // Active folder ID
  const [uploadedFile, setUploadedFile] = useState(""); // Uploaded file
  const [newFolderName, setNewFolderName] = useState(""); // New folder creation
  const [expandedFolders, setExpandedFolders] = useState(
    JSON.parse(localStorage.getItem("expandedFolders")) || []
  ); // Track expanded folders

  const dispatch = useDispatch();
  const render = useSelector((state) => state.uploadedFile.rerender);
  const inputRef = useRef();

  // Fetch directory structure on component mount and when render state changes
  useEffect(() => {
    fetchDirectoryStructure();
  }, [dispatch, render]);

  // Fetch directory structure from backend
  const fetchDirectoryStructure = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_DATASET
        }`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch directory structure");
      }
      const data = await response.json();
      setDirectoryStructure(data);
    } catch (error) {
      toast.error("Error fetching directory structure!");
    }
  };

  // Utility function to expand all parent folders of a given folder path
  const expandParentFolders = (folderPath) => {
    const pathSegments = folderPath.split("/");
    const parentFolders = new Set(expandedFolders);
    let currentPath = "";

    pathSegments.forEach((segment) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      parentFolders.add(currentPath);
    });

    return [...parentFolders];
  };

  // Save expandedFolders to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("expandedFolders", JSON.stringify(expandedFolders));
  }, [expandedFolders]);

  // Save activeFolder to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeFolder", activeFolder);
    dispatch(setActiveFolderAction(activeFolder));
  }, [activeFolder]);

  // Save activeFileId to localStorage whenever it changes
  useEffect(() => {
    dispatch(setActiveFile({ name: fileActiveId }));
    localStorage.setItem("activeFileId", fileActiveId);
    let folder = fileActiveId.split("/");
    folder = folder.slice(0, folder.length - 1).join("/");
    dispatch(setActiveFolderAction(folder));
  }, [fileActiveId, dispatch]);

  const setActiveFolderWithoutToggling = (folder) => {
    setActiveFolder(folder);

    setExpandedFolders((prevExpandedFolders) => {
      if (prevExpandedFolders.includes(folder)) {
        return prevExpandedFolders.filter(
          (expandedFolder) => expandedFolder !== folder
        );
      } else {
        const updatedFolders = new Set([
          ...prevExpandedFolders,
          ...expandParentFolders(folder),
        ]);
        updatedFolders.add(folder);
        return Array.from(updatedFolders);
      }
    });
  };

  const toggleFolderExpansion = (folder) => {
    setExpandedFolders((prev) => {
      const isExpanded = prev.includes(folder);
      if (isExpanded) {
        const activeParentFolders = expandParentFolders(fileActiveId);
        if (activeParentFolders.includes(folder)) {
          return prev;
        }
        return prev.filter((f) => f !== folder);
      }
      return [...prev, folder];
    });
  };

  const getFileIcon = (fileName) => {
    const fileExtension = fileName.split(".").pop().toLowerCase();
    if (fileExtension === "csv") {
      return <AiFillFileText className="text-green-500" />;
    } else if (["xls", "xlsx"].includes(fileExtension)) {
      return <AiFillFileExcel className="text-blue-500" />;
    }
    return <AiFillFileText />;
  };

  const handleFileSelect = async (folder, name) => {
    try {
      const url = `${import.meta.env.VITE_APP_API_URL}${
        import.meta.env.VITE_APP_API_DATASET
      }?folder=${folder}&file=${name}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch file data");
      }
      const fileData = await response.json();

      setFileActiveId(`${folder}/${name}`);
      localStorage.setItem("activeFunction", "");
      dispatch(setActiveFunction(""));
      localStorage.setItem("activeFile", JSON.stringify(`${folder}/${name}`));
      await storeDataInIndexedDB(fileData, `${folder}/${name}`);
    } catch (error) {
      console.log(error);
      toast.error("Error fetching file data!");
    }
  };

  const handleDelete = async (folder, file = null) => {
    try {
      const deleteUrl = file
        ? `${import.meta.env.VITE_APP_API_URL}${
            import.meta.env.VITE_APP_API_DATASET_DELETE
          }?folder=${folder}&file=${file}`
        : `${import.meta.env.VITE_APP_API_URL}${
            import.meta.env.VITE_APP_API_DATASET_DELETE
          }?folder=${folder}`;
      const response = await fetch(deleteUrl, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      toast.success(`${file ? "File" : "Folder"} deleted successfully!`);
      await deleteIndexedDB(`${folder}/${file}`);
      // console.log(folder, file);
      fetchDirectoryStructure(); // Refresh directory structure
    } catch (error) {
      toast.error(`Error deleting ${file ? "file" : "folder"}`);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (uploadedFile) {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("folder", activeFolder || ""); // Upload to root if no folder selected

      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_API_URL}${
            import.meta.env.VITE_APP_API_UPLOAD
          }`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        toast.success("File uploaded successfully!");
        setUploadedFile("");
        fetchDirectoryStructure();
      } catch (error) {
        toast.error("Error uploading file!");
      }
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_API_URL}${
            import.meta.env.VITE_APP_API_DATASET_CREATE_FOLDER
          }`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folderName: newFolderName,
              parent: activeFolder || "", // Use empty string for root folder
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to create folder");
        }

        toast.success("Folder created successfully!");
        setNewFolderName("");
        fetchDirectoryStructure();
      } catch (error) {
        toast.error("Error creating folder!");
      }
    }
  };

  // Function to clear active folder
  const clearActiveFolder = () => {
    setActiveFolder("");
  };

  const handleRename = async (currentName, newName, parentFolder = "") => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty!");
      return;
    }
  
    try {
      const renameUrl = `${import.meta.env.VITE_APP_API_URL}${import.meta.env.VITE_APP_API_RENAME}`;
      const response = await fetch(renameUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentName,
          newName,
          parentFolder,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to rename");
      }
  
      toast.success("Renamed successfully!");
      fetchDirectoryStructure(); // Refresh the directory structure
    } catch (error) {
      toast.error("Error renaming item!");
    }
  };
  

  const renderFolderStructure = (structure, parentFolder = "") => {
    return Object.keys(structure).map((key) => {
      if (key === "files") {
        return structure[key].map((file) => (
          <div
            key={`${parentFolder}/${file}`}
            className={`flex cursor-pointer items-center group justify-between mt-1 px-2 py-2 rounded ${
              fileActiveId === `${parentFolder}/${file}`
                ? "bg-green-700 text-white"
                : "text-gray-200 hover:bg-green-800 hover:text-white"
            }`}
            style={{ borderLeft: "2px solid #4CAF50", marginLeft: "20px" }}
          >
            <p
              className={`flex w-full tracking-wide group gap-2 items-center ${
                fileActiveId === `${parentFolder}/${file}` ? "font-bold" : ""
              }`}
              onClick={() => handleFileSelect(parentFolder, file)}
            >
              {getFileIcon(file)}
              <span>{file}</span>
            </p>
            <div className="flex gap-2">
              {/* Rename button */}
              <BsPencilSquare
                className="text-blue-500 hidden group-hover:block cursor-pointer"
                onClick={() => {
                  const newName = prompt("Enter new name:", file);
                  if (newName && newName !== file) {
                    handleRename(file, newName, parentFolder);
                  }
                }}
              />
              {/* Delete button */}
              <BsTrash2Fill
                className="text-red-500 hidden group-hover:block cursor-pointer"
                onClick={() => handleDelete(parentFolder, file)}
              />
            </div>
          </div>
        ));
      } else {
        const newParentFolder = parentFolder ? `${parentFolder}/${key}` : key;
        const isExpanded = expandedFolders.includes(newParentFolder);
        const isActive = activeFolder === newParentFolder;

        return (
          <div
            key={newParentFolder}
            style={{
              marginLeft: "20px",
              borderLeft: "2px solid #4CAF50",
              paddingLeft: "10px",
            }}
          >
            <div className="flex items-center justify-between cursor-pointer group p-2">
              <div
                className={`flex items-center gap-2 ${
                  isExpanded ? "text-white" : "text-gray-300"
                } ${isActive ? "font-bold text-white" : ""} hover:text-white`}
                onClick={() => setActiveFolderWithoutToggling(newParentFolder)}
              >
                {isExpanded ? (
                  <IoIosArrowDown
                    onClick={() => toggleFolderExpansion(newParentFolder)}
                  />
                ) : (
                  <IoIosArrowForward
                    onClick={() => toggleFolderExpansion(newParentFolder)}
                  />
                )}
                <span>📁 {key}</span>
              </div>
              <div className="flex gap-2">
                {/* Rename button */}
                <BsPencilSquare
                  className="text-blue-500 hidden group-hover:block cursor-pointer"
                  onClick={() => {
                    const newName = prompt("Enter new folder name:", key);
                    if (newName && newName !== key) {
                      handleRename(key, newName, parentFolder);
                    }
                  }}
                />
                {/* Delete button */}
                <BsTrash2Fill
                  className="text-red-500 hidden group-hover:block cursor-pointer"
                  onClick={() => handleDelete(newParentFolder)}
                />
              </div>
            </div>
            {isExpanded && (
              <div>
                {renderFolderStructure(structure[key], newParentFolder)}
              </div>
            )}
          </div>
        );
      }
    });
  };

  return (
    <div className="flex flex-col h-full justify-between bg-gray-900 text-gray-200">
      <div className="p-4 pl-0 pr-2 w-full h-full overflow-y-auto">
        {directoryStructure && Object.keys(directoryStructure).length > 0 ? (
          renderFolderStructure(directoryStructure)
        ) : (
          <p className="text-center mt-4 font-bold tracking-wide">
            Loading directory structure...
          </p>
        )}
      </div>

      {/* Create Folder Section */}
      <div className="p-4 bg-gray-800 flex items-center gap-2">
        <input
          type="text"
          placeholder="New Folder Name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="bg-gray-700 basis-2/3 text-gray-300 rounded p-1.5 w-full outline-none focus:border focus:border-green-500"
        />
        <button
          onClick={handleCreateFolder}
          className="bg-green-600 basis-1/3 text-sm text-white p-2 rounded hover:bg-green-700"
        >
          Create Folder
        </button>
      </div>

      {/* Upload section */}
      <div className="p-4 pt-4 bg-gray-800 text-end border-t border-gray-700">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="bg-emerald-600 rounded py-3 text-center shadow"
        >
          <label
            htmlFor="input-file-upload"
            className="cursor-pointer text-gray-300"
          >
            <p className="text-sm">Drag and drop your file or</p>
            <p className="hover:underline text-sm cursor-pointer">
              Upload a File
            </p>
            {uploadedFile && (
              <p className="font-bold text-gray-100 tracking-wide text-md">
                {uploadedFile.name}
              </p>
            )}
          </label>
          <input
            ref={inputRef}
            type="file"
            id="input-file-upload"
            hidden
            onChange={handleFileChange}
          />
        </form>
        <button
          className="mt-2 bg-primary-btn text-white text-sm font-medium px-4 py-2 rounded"
          onClick={handleFileUpload}
        >
          Upload
        </button>
      </div>

      {/* Clear folder selection */}
      {activeFolder && (
        <div className="p-2 bg-gray-800 text-center">
          <button
            onClick={clearActiveFolder}
            className="bg-red-500 text-xs text-white px-2 py-1 rounded hover:bg-red-700"
          >
            Clear Folder Selection (Upload to Root)
          </button>
        </div>
      )}
    </div>
  );
}

export default FileTab;
