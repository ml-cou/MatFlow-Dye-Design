import React, { useState, useEffect, useRef } from "react";
import { 
  Typography, 
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  FormControlLabel as MuiFormControlLabel,
  Grid,
  Card,
  CardContent,
  Box,
  Paper
} from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ImageIcon from '@mui/icons-material/Image';
import { Progress, Modal } from "@nextui-org/react";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridAutoDataComponent from "../../../Components/AgGridComponent/AgGridAutoDataComponent";
import Docs from "../../../../Docs/Docs";

function SMILESMolecularStructure({ csvData }) {
  // Configuration state
  const [smilesColumn, setSmilesColumn] = useState("");  const [processingMode, setProcessingMode] = useState("batch"); // batch, individual
  const [imageSize, setImageSize] = useState(300);
  const [imageFormat, setImageFormat] = useState("png"); // png, svg
  const [maxImages, setMaxImages] = useState(100);
  
  // Individual SMILES input
  const [singleSMILES, setSingleSMILES] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProcessing, setCurrentProcessing] = useState("");
  const [results, setResults] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  
  // For polling
  const pollIntervalRef = useRef(null);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  // Get available columns for SMILES
  const availableColumns = csvData ? Object.keys(csvData[0]) : [];
  // Check for stored taskId on component mount
  useEffect(() => {
    const storedTaskId = sessionStorage.getItem('smiles_structure_task_id');
    if (storedTaskId && !taskId) {
      console.log("Restoring taskId from sessionStorage:", storedTaskId);
      setTaskId(storedTaskId);
    }
  }, []);

  // Progress simulation
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev + 2 < 95) return prev + 2;
          return 95;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Start polling for task status
  const startPolling = (taskId) => {
    // Immediately check the task status once
    checkTaskStatus(taskId);
    
    // Then set up polling every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      checkTaskStatus(taskId);
    }, 3000);
  };

  // Process successful response data
  const processSuccessResponse = (data) => {
    // Extract results data, handling different response formats
    let results = data.results || {};
      // Get preview images from the response
    let previewImages = [];
    
    // Get task ID from the response if available
    if (data.task_id && !taskId) {
      console.log("Setting taskId from response:", data.task_id);
      setTaskId(data.task_id);
    }
    
    // Handle different response formats - Check for preview_images array first
    if (Array.isArray(data.preview_images)) {
      console.log("Found preview_images array at top level:", data.preview_images);
      previewImages = data.preview_images;
    } else if (Array.isArray(results.preview_images)) {
      console.log("Found preview_images array in results:", results.preview_images);
      previewImages = results.preview_images;
    } else if (typeof results === 'object' && results.preview_images) {
      console.log("Found preview_images object in results:", results.preview_images);
      previewImages = results.preview_images;
    } else if (Array.isArray(results)) {
      console.log("Results is an array:", results);
      previewImages = results;
    } 
    // Handle case where results is an object with SMILES strings as keys and image paths as values
    else if (typeof results === 'object' && Object.keys(results).length > 0) {
      console.log("Results appears to be a map of SMILES to image paths");
      
      // Extract task ID from image paths if possible
      const pathPattern = /\/media\/structures\/([^\/]+)\//;
      Object.values(results).forEach(value => {
        if (typeof value === 'string') {
          const match = value.match(pathPattern);
          if (match && match[1] && !taskId) {
            console.log("Extracted task ID from image path:", match[1]);
            setTaskId(match[1]);
          }
        }
      });
      
      // Extract entries that look like file paths
      const imagePaths = [];
      Object.entries(results).forEach(([smiles, value], index) => {
        if (typeof value === 'string' && (value.includes('/media/') || value.includes('.png') || value.includes('.svg'))) {
          console.log(`Found image path for SMILES ${smiles}: ${value}`);
          imagePaths.push({
            smiles: smiles,
            path: value,
            // For direct image access we'll use index-based naming (1.png, 2.png, etc.)
            index: index + 1
          });
        }
      });
      
      if (imagePaths.length > 0) {
        console.log(`Extracted ${imagePaths.length} image paths from results`);
        previewImages = imagePaths;
        
    // Also store SMILES to path mapping for later use
        results.smilesMap = imagePaths.reduce((map, item) => {
          map[item.path] = item.smiles;
          return map;
        }, {});
        
        // Also store the inverse mapping (path to SMILES) for easier lookup
        results.pathToSmilesMap = imagePaths.reduce((map, item) => {
          map[item.path] = item.smiles;
          return map;
        }, {});
      }
    }
      // Calculate statistics - use explicit values from data when available
    const totalSmiles = data.total || results?.summary?.total || previewImages.length || 0;
    const validStructures = previewImages.length || 0;
    
    console.log(`Statistics calculation: total=${totalSmiles}, valid=${validStructures}`);
    
    // Create download links if they don't exist
    const downloadLinks = results.download_links || {};
      // Create different result structures based on processing mode
    let processedResults;
    
    if (processingMode === "batch") {
      // For batch mode, include summary statistics
      processedResults = {
        ...results,
        preview_images: previewImages,
        download_links: downloadLinks,
        summary: {
          total_smiles: totalSmiles,
          valid_structures: validStructures, 
          invalid_smiles: totalSmiles - validStructures,
          success_rate: totalSmiles ? Math.round((validStructures / totalSmiles) * 100) : 0
        }
      };
    } else {
      // For single mode, don't include summary statistics
      processedResults = {
        ...results,
        preview_images: previewImages,
        download_links: downloadLinks,
        single_mode: true
      };
    }
    
    console.log("Processed results:", processedResults);
    setResults(processedResults);
    setCurrentProcessing("");    // Set preview images if available
    if (processedResults.preview_images && processedResults.preview_images.length > 0) {
      console.log("Processing preview images:", processedResults.preview_images);
        // We'll create a simplified structure to reliably show the images
      let processedPreviewImages = [];
      
      console.log("Task ID when processing preview images:", taskId);
      
      // For batch processing with direct structure paths in API response
      if (Array.isArray(processedResults.preview_images)) {
        processedPreviewImages = processedResults.preview_images
          .filter(item => item) // Remove null/undefined items
          .map((item, index) => {
            const currentIndex = index + 1;
            
            // If it's an object with smiles and path properties (from our previous extraction)
            if (typeof item === 'object' && item !== null) {
              // Extract file number from path if available
              let pathIndex = null;
              if (item.path) {
                const match = item.path.match(/\/(\d+)\.(png|svg)$/);
                if (match) {
                  pathIndex = parseInt(match[1]);
                }
              }
              
              if (item.smiles && (item.path || item.image_url)) {
                return {
                  smiles: item.smiles,
                  path: item.path,
                  image_url: item.image_url,
                  // Use explicit index from path if available, otherwise use item.index or position in array
                  index: pathIndex || item.index || currentIndex,
                  valid: true
                };
              } else if (item.smiles) {
                return {
                  smiles: item.smiles,
                  index: pathIndex || item.index || currentIndex,
                  valid: true
                };
              }
            } 
            // If it's a string path
            else if (typeof item === 'string') {
              // Try to extract file number from path
              const match = item.match(/\/(\d+)\.(png|svg)$/);
              const pathIndex = match ? parseInt(match[1]) : null;
              
              // Try to extract SMILES from the path if possible
              const pathParts = item.split('/');
              const fileName = pathParts[pathParts.length - 1];
              const baseFileName = fileName.split('.')[0];
              
              // If processing single mode, use the input SMILES
              const smiles = processingMode === "single" ? 
                singleSMILES : 
                `Structure ${currentIndex}`;
                
              return {
                smiles: smiles,
                path: item,
                index: pathIndex || currentIndex,
                valid: true
              };
            }
            
            // Fallback for any other case
            return {
              smiles: `Structure ${currentIndex}`,
              index: currentIndex,
              valid: true
            };
          });
      }
      // Handle the case where we have an array of objects with path and smiles
      else if (processedResults.preview_images.length > 0 && 
               typeof processedResults.preview_images[0] === 'object') {
        processedPreviewImages = processedResults.preview_images.map((item, index) => ({
          smiles: item.smiles || `Structure ${index + 1}`,
          index: item.index || index + 1,
          valid: item.valid !== undefined ? item.valid : true
        }));
      }
      
      // For single mode, ensure we only show one image
      if (processingMode === "single") {
        processedPreviewImages = processedPreviewImages.slice(0, 1);
        
        // If we have a direct image_base64 value in the results, use it
        if (results.image_base64) {
          processedPreviewImages = [{
            smiles: singleSMILES,
            image_base64: results.image_base64,
            valid: true
          }];
        }
      } else {
        // For batch mode, limit to 12 images
        processedPreviewImages = processedPreviewImages.slice(0, 12);
      }
      
      console.log("Setting preview images:", processedPreviewImages);
      setPreviewImages(processedPreviewImages);
      
      console.log("Setting preview images:", processedPreviewImages);
      setPreviewImages(processedPreviewImages);
    }
    
    toast.success("Molecular structure generation completed successfully!");
    
    // Log the final data for debugging
    console.log("Final success data:", data);
  };

  // Check task status
  const checkTaskStatus = async (taskId) => {
    try {
      console.log(`Checking task status for: ${taskId}`);
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-structure/status/${taskId}/`,
        { method: "GET" }
      );
      const data = await response.json();
      console.log("Task status response:", data);
      
      if (data.status === "SUCCESS") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        
        console.log("Processing SUCCESS response:", data);
        processSuccessResponse(data);
      } else if (data.status === "FAILURE") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Structure generation failed");
      } else if (data.status === "PENDING" || data.status === "STARTED") {
        // Task is not ready yet, continue polling
        console.log(`Task is ${data.status}, continuing to poll...`);
        setCurrentProcessing(`Task is ${data.status}. Waiting for processing to begin...`);
      } else if (data.status === "PROGRESS") {
        // Update progress information
        if (data.current && data.total) {
          const progressPercent = (data.current / data.total) * 100;
          setProgress(progressPercent);
          setCurrentProcessing(`Generating ${data.current}/${data.total}: ${data.current_smiles || ''}`);
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error checking generation status");
    }
  };

  // Handle batch structure generation
  const handleBatchGeneration = async () => {
    if (!smilesColumn) {
      toast.error("Please select a SMILES column");
      return;
    }

    setLoading(true);
    setResults(null);
    setTaskId(null);
    setPreviewImages([]);
    setCurrentProcessing("Starting molecular structure generation...");

    const requestData = {
      mode: "batch",
      dataset: csvData,
      smiles_column: smilesColumn,      config: {
        image_size: imageSize,
        image_format: imageFormat,
        generate_pdf: false, // PDF generation disabled
        max_images: maxImages
      }
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-structure/generate/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();
        if (response.ok && data.task_id) {
        console.log("Received task_id:", data.task_id);
        const receivedTaskId = data.task_id;
        setTaskId(receivedTaskId);
        // Store task ID in sessionStorage for persistence across page reloads
        sessionStorage.setItem('smiles_structure_task_id', receivedTaskId);
        startPolling(receivedTaskId);
        toast.info("Molecular structure generation started. This may take several minutes...");
      } else {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Failed to start generation");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error starting generation: " + error.message);
    }  };

  // Handle single SMILES structure generation
  const handleSingleGeneration = async () => {
    if (!singleSMILES.trim()) {
      toast.error("Please enter a SMILES string");
      return;
    }

    setLoading(true);
    setResults(null);
    setTaskId(null);
    setPreviewImages([]);
    setCurrentProcessing(`Generating structure for: ${singleSMILES}`);

    const requestData = {
      mode: "single",
      smiles: singleSMILES.trim(),
      config: {
        image_size: imageSize,
        image_format: imageFormat
      }
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-structure/generate/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );
      
      // Check content type to handle direct image responses
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('image/')) {
        // Direct image response - handle it
        console.log("Received direct image response");
        
        // Get the blob directly
        const imageBlob = await response.blob();
        
        // Create an object URL for preview
        const imageUrl = URL.createObjectURL(imageBlob);
        
        // Create a dummy task ID for consistent handling
        const tempTaskId = `single-${Date.now()}`;
        setTaskId(tempTaskId);
        
        // Save the blob to sessionStorage for download
        sessionStorage.setItem('smiles_structure_single_image', imageUrl);
        sessionStorage.setItem('smiles_structure_task_id', tempTaskId);
        
        // Update state
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
          // Create a result object for single mode (without batch summary data)
        const resultObj = {
          single_mode: true
        };
        
        setResults(resultObj);
        
        // Add preview image
        setPreviewImages([{
          smiles: singleSMILES,
          direct_url: imageUrl,
          index: 1,
          valid: true
        }]);
        
        toast.success("Molecular structure generated successfully!");
      } else {
        // Regular JSON response
        const data = await response.json();
        
        if (response.ok) {
          console.log("Single generation response:", data);
          
          // Check if this is a task ID or direct result
          if (data.task_id) {
            // It's an async task - start polling
            console.log("Single generation returned task_id:", data.task_id);
            setTaskId(data.task_id);
            sessionStorage.setItem('smiles_structure_task_id', data.task_id);
            startPolling(data.task_id);
            toast.info("Structure generation started...");          } else if (data.results) {
            // Direct result without async task
            setLoading(false);
            setProgress(100);
            setCurrentProcessing("");
            
            // For single mode, create a results object without batch statistics
            setResults({
              ...data.results,
              single_mode: true
            });
            
            // Set single image preview
            if (data.results.image_base64) {
              setPreviewImages([{
                smiles: singleSMILES,
                image_base64: data.results.image_base64,
                valid: true
              }]);
            } else if (data.results.image_url) {
              setPreviewImages([{
                smiles: singleSMILES,
                image_url: data.results.image_url,
                valid: true
              }]);
            }
            
            toast.success("Molecular structure generated successfully!");
          } else {
            setLoading(false);
            setProgress(100);
            setCurrentProcessing("");
            toast.warning("No results returned");
          }
        } else {
          setLoading(false);
          setProgress(100);
          setCurrentProcessing("");
          toast.error(data.error || "Failed to generate structure");
        }
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error generating structure: " + error.message);
    }
  };// Download function for files (images, zip archives)
  const handleDownload = (url, filename) => {
    console.log(`Downloading from URL: ${url}, filename: ${filename}`);
    
    // Ensure URL is absolute
    let fullUrl;
    if (url && !url.startsWith('http') && !url.startsWith('data:')) {
      fullUrl = `${import.meta.env.VITE_APP_API_URL}${url.startsWith('/') ? url : `/${url}`}`;
      console.log(`Converted to absolute URL: ${fullUrl}`);
    } else {
      fullUrl = url;
    }
    
    // Show loading toast
    const toastId = toast.loading(`Preparing ${filename} for download...`);
    
    // Handle all file downloads
    fetch(fullUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Download failed with status: ${response.status}`);
        }
        return response.blob();
      })      .then(blob => {
        // Check if the blob is valid (not too small which would indicate an error)
        if (blob.size < 100) {  // Usually an error message would be smaller than this
          throw new Error("The downloaded file appears to be empty or invalid");
        }
        
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(link);
        }, 100);
        
        // Update toast
        toast.update(toastId, { 
          render: `${filename} downloaded successfully!`, 
          type: "success", 
          isLoading: false,
          autoClose: 3000
        });
      })
      .catch(error => {
        console.error("Download error:", error);
        toast.update(toastId, { 
          render: `Failed to download ${filename}: ${error.message}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      });
  };
    // Function to download all images as ZIP
  const handleDownloadZip = () => {
    // Get taskId from state or sessionStorage
    const currentTaskId = taskId || sessionStorage.getItem('smiles_structure_task_id');
    
    if (!currentTaskId) {
      toast.error("No generated images available for download");
      return;
    }
    
    const apiUrl = import.meta.env.VITE_APP_API_URL || '';
    const zipUrl = `${apiUrl}/api/smiles-structure/download-zip/${currentTaskId}/`;
    console.log("Requesting ZIP download from:", zipUrl);
    
    // Show loading toast
    const toastId = toast.loading("Preparing ZIP archive of all generated images...");
    
    fetch(zipUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`ZIP generation failed with status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Check if the blob is valid (not too small which would indicate an error)
        if (blob.size < 100) {  // Usually an error message would be larger than this
          throw new Error("The generated ZIP appears to be empty or invalid");
        }
        
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `molecular-structures-${currentTaskId}.zip`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(link);
        }, 100);
        
        // Update toast
        toast.update(toastId, { 
          render: "ZIP archive downloaded successfully!", 
          type: "success", 
          isLoading: false,
          autoClose: 3000
        });
      })
      .catch(error => {
        console.error("ZIP download error:", error);
        toast.update(toastId, { 
          render: `Failed to download ZIP archive: ${error.message}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      });
  };

  return (
    <div className="my-8 w-full">
      <Typography variant="h4" className="!font-medium !mb-6" gutterBottom>
        SMILES to Molecular Structure Visualizer
      </Typography>

      {/* Processing Mode Selection */}
      <div className="mb-6">
        <FormControl component="fieldset">
          <FormLabel component="legend" className="!text-lg !font-medium">
            Processing Mode
          </FormLabel>          <RadioGroup
            value={processingMode}
            onChange={(e) => {
              // Clear results and taskId when switching modes
              setResults(null);
              setTaskId(null);
              setPreviewImages([]);
              // Remove stored taskId from sessionStorage
              sessionStorage.removeItem('smiles_structure_task_id');
              sessionStorage.removeItem('smiles_structure_single_image');
              setProcessingMode(e.target.value);
            }}
          >
            <FormControlLabel
              value="batch"
              control={<Radio />}
              label="Batch Processing (from dataset)"
            />
            <FormControlLabel
              value="individual"
              control={<Radio />}
              label="Individual SMILES"
            />
          </RadioGroup>
        </FormControl>
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-6 bg-gray-50 rounded-lg">
        <Typography variant="h6" className="!font-medium col-span-full">
          Generation Configuration
        </Typography>
        
        <TextField
          label="Image Size (pixels)"
          type="number"
          size="small"
          value={imageSize}
          onChange={(e) => setImageSize(parseInt(e.target.value))}
          InputProps={{ inputProps: { step: 50, min: 100, max: 1000 } }}
          helperText="Width and height of generated images"
        />
        
        <FormControl component="fieldset">
          <FormLabel component="legend">Image Format</FormLabel>
          <RadioGroup
            value={imageFormat}
            onChange={(e) => setImageFormat(e.target.value)}
            row
          >
            <FormControlLabel value="png" control={<Radio />} label="PNG" />
            <FormControlLabel value="svg" control={<Radio />} label="SVG" />
          </RadioGroup>
        </FormControl>

        {processingMode === "batch" && (
          <>
            <TextField
              label="Maximum Images"
              type="number"
              size="small"
              value={maxImages}
              onChange={(e) => setMaxImages(parseInt(e.target.value))}
              InputProps={{ inputProps: { step: 10, min: 1, max: 1000 } }}              helperText="Limit number of images generated"
            />
          </>
        )}
      </div>

      {/* Batch Processing Configuration */}
      {processingMode === "batch" && (
        <div className="mb-6">
          <p className="mb-2 font-medium">Select SMILES Column:</p>
          <SingleDropDown
            columnNames={availableColumns}
            onValueChange={setSmilesColumn}
            initValue={smilesColumn}
          />
        </div>
      )}

      {/* Individual SMILES Input */}
      {processingMode === "individual" && (
        <div className="mb-6">
          <TextField
            label="Enter SMILES String"
            fullWidth
            value={singleSMILES}
            onChange={(e) => setSingleSMILES(e.target.value)}
            placeholder="e.g., CCO (ethanol), C1=CC=CC=C1 (benzene)"
            helperText="Enter a single SMILES string to visualize its molecular structure"
          />
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end mb-6">
        <Button
          variant="contained"
          size="large"
          onClick={processingMode === "batch" ? handleBatchGeneration : handleSingleGeneration}
          disabled={loading || (processingMode === "batch" && !smilesColumn) || (processingMode === "individual" && !singleSMILES.trim())}
          className="!bg-primary-btn !text-white !font-medium !px-8 !py-3"
        >
          {loading ? "Generating..." : "Generate Structures"}
        </Button>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="mb-6">
          <Progress
            value={progress}
            shadow
            color="success"
            status="secondary"
            striped
          />
          {currentProcessing && (
            <p className="text-center mt-2 text-gray-600">
              {currentProcessing}
            </p>
          )}
        </div>
      )}      {/* Success status indicator and preview (when available) */}
      {previewImages.length > 0 && (
        <div className="mb-6">
          {/* Only show completion status when results match the current processing mode */}
          {((processingMode === "batch" && results && !results.single_mode) || 
            (processingMode === "individual" && results && results.single_mode)) && (
            <div className="flex items-center justify-center bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <Typography variant="body1" className="text-green-800 font-medium">
                Generation complete
              </Typography>
            </div>
          )}
            {/* Display image preview for single SMILES mode - supports direct_url, image_base64, and path */}
          {processingMode === "individual" && previewImages[0] && (
            <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <Typography variant="h6" className="!font-medium !mb-3">
                Molecular Structure Preview
              </Typography>
              <div className="flex justify-center bg-white p-6">
                {previewImages[0].direct_url && (
                  <img 
                    src={previewImages[0].direct_url} 
                    alt={`Molecular structure for ${previewImages[0].smiles}`}
                    className="max-h-[300px] object-contain"
                  />
                )}
                {previewImages[0].image_base64 && (
                  <img 
                    src={`data:image/${imageFormat};base64,${previewImages[0].image_base64}`}
                    alt={`Molecular structure for ${previewImages[0].smiles}`}
                    className="max-h-[300px] object-contain"
                  />
                )}
                {previewImages[0].path && !previewImages[0].direct_url && !previewImages[0].image_base64 && (
                  <img 
                    src={`${import.meta.env.VITE_APP_API_URL}${previewImages[0].path.startsWith('/') ? '' : '/'}${previewImages[0].path}`}
                    alt={`Molecular structure for ${previewImages[0].smiles}`}
                    className="max-h-[300px] object-contain"
                  />
                )}
              </div>
              <Typography variant="caption" className="block mt-2 text-center text-gray-600">
                {previewImages[0].smiles}
              </Typography>
              
              {/* Download button for the current image */}
              <div className="flex justify-center mt-4">
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<ImageIcon />}
                  onClick={() => {
                    let downloadUrl;
                    let fileName = `molecule_${previewImages[0].smiles.replace(/[^a-zA-Z0-9]/g, '_')}.${imageFormat}`;
                    
                    if (previewImages[0].direct_url) {
                      downloadUrl = previewImages[0].direct_url;
                    } else if (previewImages[0].image_base64) {
                      downloadUrl = `data:image/${imageFormat};base64,${previewImages[0].image_base64}`;
                    } else if (previewImages[0].path) {
                      // For path-based URLs, use the API URL prefix
                      downloadUrl = `${import.meta.env.VITE_APP_API_URL}${previewImages[0].path.startsWith('/') ? '' : '/'}${previewImages[0].path}`;
                    } else {
                      toast.error("No image available for download");
                      return;
                    }
                    
                    // Create a link element and trigger download
                    const link = document.createElement("a");
                    link.href = downloadUrl;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Image downloaded successfully!");
                  }}
                  className="!bg-blue-600 !text-white"
                >
                  Download Image
                </Button>
              </div>
            </div>
          )}
        </div>
      )}      {/* Results Display - Only shown for batch mode AND when results are batch results */}
      {results && processingMode === "batch" && !results.single_mode && (
        <div className="mt-8">
          <Typography variant="h4" className="!font-medium !mb-6" gutterBottom>
            Generation Results
          </Typography>

          {/* Summary Statistics for Batch */}
          {results.summary && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <Typography variant="h6" className="!font-medium">
                  Total SMILES
                </Typography>
                <Typography variant="h4" className="!text-blue-600">
                  {results.summary.total_smiles || 0}
                </Typography>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <Typography variant="h6" className="!font-medium">
                  Valid Structures
                </Typography>
                <Typography variant="h4" className="!text-green-600">
                  {results.summary.valid_structures || 0}
                </Typography>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <Typography variant="h6" className="!font-medium">
                  Invalid SMILES
                </Typography>
                <Typography variant="h4" className="!text-red-600">
                  {results.summary.invalid_smiles || 0}
                </Typography>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <Typography variant="h6" className="!font-medium">
                  Success Rate
                </Typography>
                <Typography variant="h4" className="!text-purple-600">
                  {results.summary.success_rate || 0}%
                </Typography>
              </div>            </div>
          )}
            {/* Download Links - Only shown for batch mode AND when results are batch results */}
          {taskId && processingMode === "batch" && results && !results.single_mode && (
            <div className="mb-6 p-8 bg-gray-50 rounded-lg shadow border border-gray-200">
              <Typography variant="h6" className="!font-medium !mb-4 flex items-center">
                <CloudDownloadIcon className="mr-2" />
                Download Options
              </Typography>
              <div className="flex flex-wrap gap-6">
                {/* ZIP download button */}
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<CloudDownloadIcon />}
                  endIcon={<span>📦</span>}
                  onClick={handleDownloadZip}
                  className="!bg-purple-600 !text-white !px-8 !py-3 !text-base"
                >
                  Download All Images as ZIP                </Button>
              </div>
            </div>
          )}

          {/* Generation Log */}
          {results.generation_log && results.generation_log.length > 0 && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Generation Log
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.generation_log}
                download={true}
                height="300px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={15}
              />
            </div>
          )}

          {/* Invalid SMILES */}
          {results.invalid_smiles && results.invalid_smiles.length > 0 && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Invalid SMILES
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.invalid_smiles}
                download={true}
                height="200px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={10}
              />
            </div>
          )}

          {/* Processing Stats */}
          {results.processing_stats && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Processing Statistics
              </Typography>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm">{JSON.stringify(results.processing_stats, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}      {/* Individual download button for single mode - only when we have single mode results */}
      {taskId && processingMode === "single" && results && results.single_mode && (
        <div className="flex justify-center my-4">
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<ImageIcon />}
            endIcon={<span>🖼️</span>}
            onClick={() => {
              // Check if we have a direct image URL from sessionStorage (for direct image responses)
              const directImageUrl = sessionStorage.getItem('smiles_structure_single_image');
              
              if (directImageUrl) {
                // For direct image responses, download using the stored blob URL
                const link = document.createElement('a');
                link.href = directImageUrl;
                link.download = `molecule.${imageFormat}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Image downloaded successfully!");
              } else {
                // For async task responses, use the traditional approach
                const apiUrl = import.meta.env.VITE_APP_API_URL || '';
                const currentTaskId = taskId || sessionStorage.getItem('smiles_structure_task_id');
                if (!currentTaskId) {
                  toast.error("No image available for download");
                  return;
                }
                const imageUrl = `/media/structures/${currentTaskId}/1.${imageFormat}`;
                handleDownload(`${apiUrl}${imageUrl}`, `molecule.${imageFormat}`);
              }
            }}
            className="!bg-primary-btn !text-white !px-8 !py-3 !text-base"
          >
            Download Single Image
          </Button>
        </div>
      )}

      {/* Help Button */}
      <button
        className="fixed bottom-5 right-5 bg-primary-btn text-2xl font-black text-white rounded-full p-4 py-2 shadow-lg"
        onClick={openModal}
      >
        ?
      </button>

      {/* Help Modal */}
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
          <Docs section={"smilesStructure"} />
        </div>      </Modal>
    </div>
  );
}

export default SMILESMolecularStructure;