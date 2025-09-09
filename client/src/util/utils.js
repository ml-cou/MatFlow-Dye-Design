export const CreateFile = async ({ data, filename, foldername = "" }) => {
  try {
    // Make a POST request to the backend to create a new file with the provided data and filename
    const response = await fetch(
      `${import.meta.env.VITE_APP_API_URL}${
        import.meta.env.VITE_APP_API_DATASET_CREATE_FILE
      }`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data,
          filename: filename + ".csv",
          foldername,
        }),
      }
    );

    // Check if the request was successful
    if (!response.ok) {
      throw new Error("Failed to create file");
    }

    // Handle success (You can enable toast notifications here if needed)
    console.log("File created successfully!");
  } catch (error) {
    // Handle errors
    console.error("Error creating file:", error);
    throw new Error(
      error.message || "An error occurred while creating the file"
    );
  }
};

export const ReadFile = async ({ foldername = "", filename }) => {
  try {
    console.log(foldername, filename);
    // Construct the URL with query parameters for folder and filename
    const params = new URLSearchParams();
    if (foldername) params.append("folder", foldername);
    params.append("file", filename);

    // Make a GET request to the backend to read the file content
    const response = await fetch(
      `${import.meta.env.VITE_APP_API_URL}${
        import.meta.env.VITE_APP_API_DATASET_READ_FILE
      }?${params.toString()}`
    );

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.statusText}`);
    }

    // Parse and return the file data
    const fileData = await response.json();
    return fileData; // Return the file data received from the server
  } catch (error) {
    // Handle errors
    console.error("Error reading file:", error);
    throw new Error(
      error.message || "An error occurred while reading the file"
    );
  }
};

// Recursively extract all file paths from the nested structure
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

export const FetchFileNames = async () => {
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
    return files;
  } catch (err) {
    console.error(err);
    throw new Error(err)
  }
};
