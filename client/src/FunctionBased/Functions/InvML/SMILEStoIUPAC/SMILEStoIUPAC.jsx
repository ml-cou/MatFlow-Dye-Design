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
  LinearProgress,
  Box
} from "@mui/material";
import { Progress, Modal } from "@nextui-org/react";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridAutoDataComponent from "../../../Components/AgGridComponent/AgGridAutoDataComponent";
import Docs from "../../../../Docs/Docs";

function SMILEStoIUPAC({ csvData }) {
  // Configuration state
  const [smilesColumn, setSmilesColumn] = useState("");
  const [processingMode, setProcessingMode] = useState("batch"); // batch, individual
  const [batchSize, setBatchSize] = useState(50);
  const [delayBetweenRequests, setDelayBetweenRequests] = useState(0.2);
  
  // Individual SMILES input
  const [singleSMILES, setSingleSMILES] = useState("");
    // UI state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProcessing, setCurrentProcessing] = useState("");
  const [results, setResults] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  
  // For polling
  const pollIntervalRef = useRef(null);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  // Cancel operation
  const handleCancelOperation = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setLoading(false);
    setProgress(0);
    setCurrentProcessing("");
    setCancelled(true);
    toast.info("Operation cancelled");
  };

  // Reset state when starting new operation
  const resetOperationState = () => {
    setCancelled(false);
    setResults(null);
    setTaskId(null);
    setProgress(0);
    setCurrentProcessing("");
  };

  // Get available columns for SMILES
  const availableColumns = csvData ? Object.keys(csvData[0]) : [];

  // Progress simulation
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev + 1 < 95) return prev + 1;
          return 95;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Start polling for task status
  const startPolling = (taskId) => {
    pollIntervalRef.current = setInterval(() => {
      checkTaskStatus(taskId);
    }, 3000);
  };
  // Check task status
  const checkTaskStatus = async (taskId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-iupac/status/${taskId}/`,
        { method: "GET" }
      );      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);        // Check if we actually have results - handle different response formats
        let hasResults = false;
        
        if (data.results && data.results.length > 0) {
          hasResults = true;
        } else if (data.smiles && data.iupac) {
          hasResults = true;
        } else if (Object.keys(data).length > 1) {
          hasResults = true;
        }
        
        if (!hasResults) {
          console.warn("No results found in successful response");
          toast.warning("Conversion completed but no results were found");
          setCurrentProcessing("");
          return;
        }
        
        // Handle different response formats for batch vs individual
        if (processingMode === "batch") {
          // Transform backend data to frontend format for batch
          const transformedResults = {
            summary: {
              total_smiles: data.total || 0,
              successful_conversions: data.results?.length || 0,
              failed_conversions: (data.total || 0) - (data.results?.length || 0),
              success_rate: data.total ? Math.round(((data.results?.length || 0) / data.total) * 100) : 0
            },
            converted_data: data.results || []          };
          setResults(transformedResults);
        } else {
          // Handle individual SMILES result
          
          // Handle different response formats
          let individualResult;
          if (data.results && data.results.length > 0) {
            // Array format: {results: [{smiles: "CCO", iupac: "ethanol"}]}
            individualResult = data.results[0];
          } else if (data.smiles && data.iupac) {
            // Direct format: {smiles: "CCO", iupac: "ethanol"}
            individualResult = data;
          } else if (data.status === "SUCCESS" && Object.keys(data).length > 1) {
            // Try to extract directly from top-level data
            individualResult = {
              smiles: data.smiles || singleSMILES,
              iupac: data.iupac || null,
              pubchem_cid: data.pubchem_cid || null
            };
          } else {
            individualResult = {
              smiles: singleSMILES,
              iupac: "Not found"
            };
          }
          
          // For individual mode, create a simple structure without summary
          const transformedResults = {
            mode: "individual",
            smiles: individualResult?.smiles || singleSMILES,
            // Backend returns 'iupac' but frontend expects 'iupac_name'
            iupac_name: individualResult?.iupac || individualResult?.iupac_name || "Not found",
            pubchem_cid: individualResult?.pubchem_cid || null,
            // Don't include converted_data for individual mode to avoid confusion
            raw_result: individualResult
          };
            setResults(transformedResults);
        }
        
        setCurrentProcessing("");
        toast.success("SMILES to IUPAC conversion completed successfully!");
      } else if (data.status === "FAILURE") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Conversion failed");
      } else if (data.status === "PROGRESS") {
        // Update progress information
        if (data.current && data.total) {
          const progressPercent = (data.current / data.total) * 100;
          setProgress(progressPercent);
          setCurrentProcessing(`Processing ${data.current}/${data.total}: ${data.current_smiles || ''}`);
        }
      }    } catch (error) {
      console.error("Polling error:", error);
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      
      // If this was an individual conversion, try to still show result
      if (processingMode === "individual") {
        const transformedResults = {
          mode: "individual",
          smiles: singleSMILES,
          iupac_name: "Error: Could not convert",
          error: "Network error occurred during conversion"
        };
        setResults(transformedResults);
      }
      
      toast.error("Error checking conversion status");
    }
  };
  // Handle batch SMILES conversion
  const handleBatchConversion = async () => {
    if (!smilesColumn) {
      toast.error("Please select a SMILES column");
      return;
    }

    resetOperationState();
    setLoading(true);
    setCurrentProcessing("Starting batch conversion...");

    const requestData = {
      mode: "batch",
      dataset: csvData,
      smiles_column: smilesColumn,
      config: {
        batch_size: batchSize,
        delay_between_requests: delayBetweenRequests
      }
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-iupac/convert/?async=true`,
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
        setTaskId(data.task_id);
        startPolling(data.task_id);
        toast.info("SMILES to IUPAC conversion started. This may take several minutes...");
      } else {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Failed to start conversion");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error starting conversion: " + error.message);
    }
  };
  // Handle single SMILES conversion
  const handleSingleConversion = async () => {
    if (!singleSMILES.trim()) {
      toast.error("Please enter a SMILES string");
      return;
    }

    resetOperationState();
    setLoading(true);
    setCurrentProcessing(`Converting: ${singleSMILES}`);    const requestData = {
      mode: "single",
      smiles: singleSMILES.trim(),
      config: {
        delay_between_requests: delayBetweenRequests
      }
    };    try {
      // Try without async first for direct response
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-iupac/convert/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }      );      const data = await response.json();
      
      if (response.ok) {
        if (data.task_id) {
          // Start polling for async task
          startPolling(data.task_id);
          toast.info("SMILES conversion started...");
        } else if (data.smiles && data.iupac) {
          // Backend returned result directly without async task

          
          // Handle direct result format
          setLoading(false);
          setProgress(100);
          
          // Transform direct response to expected format
          const transformedResults = {
            mode: "individual",
            smiles: data.smiles || singleSMILES,
            iupac_name: data.iupac || "Not found",
            pubchem_cid: data.pubchem_cid || null,
            raw_result: data
          };
          
          setResults(transformedResults);
          setCurrentProcessing("");
          toast.success("SMILES to IUPAC conversion completed successfully!");
        } else {
          setLoading(false);
          setProgress(100);
          setCurrentProcessing("");
          toast.error("Invalid response format");

        }
      } else {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Failed to convert SMILES");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error converting SMILES: " + error.message);
    }
  };

  return (
    <div className="my-8 w-full">
      <Typography variant="h4" className="!font-medium !mb-6" gutterBottom>
        SMILES to Molecular Name Conversion
      </Typography>

      {/* Processing Mode Selection */}
      <div className="mb-6">
        <FormControl component="fieldset">
          <FormLabel component="legend" className="!text-lg !font-medium">
            Processing Mode
          </FormLabel>
          <RadioGroup
            value={processingMode}
            onChange={(e) => setProcessingMode(e.target.value)}
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

      {/* Batch Processing Configuration */}
      {processingMode === "batch" && (
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <p className="mb-2">Select SMILES Column:</p>
            <SingleDropDown
              columnNames={availableColumns}
              onValueChange={setSmilesColumn}
              initValue={smilesColumn}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Batch Size"
              type="number"
              size="small"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value))}
              InputProps={{ inputProps: { step: 1, min: 1, max: 1000 } }}
              helperText="Number of SMILES to process at once"
            />
            <TextField
              label="Delay Between Requests (seconds)"
              type="number"
              size="small"
              value={delayBetweenRequests}
              onChange={(e) => setDelayBetweenRequests(parseFloat(e.target.value))}
              InputProps={{ inputProps: { step: 0.1, min: 0.1, max: 5.0 } }}
              helperText="Delay to avoid rate limits"
            />
          </div>
        </div>
      )}

      {/* Individual SMILES Processing */}
      {processingMode === "individual" && (
        <div className="mb-6">
          <TextField
            label="Enter SMILES String"
            fullWidth
            value={singleSMILES}
            onChange={(e) => setSingleSMILES(e.target.value)}
            placeholder="e.g., CCO (ethanol)"
            helperText="Enter a single SMILES string to convert to IUPAC name"
          />
          
          <div className="mt-4">
            <TextField
              label="Delay Between Requests (seconds)"
              type="number"
              size="small"
              value={delayBetweenRequests}
              onChange={(e) => setDelayBetweenRequests(parseFloat(e.target.value))}
              InputProps={{ inputProps: { step: 0.1, min: 0.1, max: 5.0 } }}
              helperText="Delay to avoid PubChem rate limits"
            />
          </div>
        </div>
      )}

      {/* Convert Button */}
      <div className="flex justify-end mb-6">
        <Button
          variant="contained"
          size="large"
          onClick={processingMode === "batch" ? handleBatchConversion : handleSingleConversion}
          disabled={loading || (processingMode === "batch" && !smilesColumn) || (processingMode === "individual" && !singleSMILES.trim())}
          className="!bg-primary-btn !text-white !font-medium !px-8 !py-3"
        >
          {loading ? "Converting..." : "Convert to IUPAC"}
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
      )}      {/* Results Display */}
      {results && (
        <div className="mt-8">
          <Typography variant="h4" className="!font-medium !mb-6" gutterBottom>
            Conversion Results
          </Typography>

          {/* Summary Statistics for Batch */}
          {processingMode === "batch" && results.summary && (
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
                  Successfully Converted
                </Typography>
                <Typography variant="h4" className="!text-green-600">
                  {results.summary.successful_conversions || 0}
                </Typography>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <Typography variant="h6" className="!font-medium">
                  Failed Conversions
                </Typography>
                <Typography variant="h4" className="!text-red-600">
                  {results.summary.failed_conversions || 0}
                </Typography>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <Typography variant="h6" className="!font-medium">
                  Success Rate
                </Typography>
                <Typography variant="h4" className="!text-purple-600">
                  {results.summary.success_rate || 0}%
                </Typography>
              </div>
            </div>
          )}          {/* Individual Result */}
          {processingMode === "individual" && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
              <Typography variant="h6" className="!font-medium !mb-4">
                Individual Conversion Result
              </Typography>
              
              {/* Actual Result Display */}
              {results && (
                <div className="bg-white p-4 rounded border">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex">
                      <span className="font-semibold w-32">SMILES:</span>
                      <span className="text-blue-600 font-mono">{results.smiles || "Not available"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-32">IUPAC Name:</span>
                      <span className="text-green-600 font-medium">{results.iupac_name || "Not found"}</span>
                    </div>
                    {results.pubchem_cid && (
                      <div className="flex">
                        <span className="font-semibold w-32">PubChem CID:</span>
                        <span className="text-purple-600">{results.pubchem_cid}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!results && (
                <div className="text-center text-gray-500 py-4">
                  No conversion results available
                </div>
              )}
            </div>
          )}{/* Results Table - Only show for batch mode */}
          {processingMode === "batch" && results.converted_data && results.converted_data.length > 0 && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Converted SMILES with IUPAC Names
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.converted_data}
                download={true}
                height="400px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={20}
              />
            </div>
          )}

          {/* Failed Conversions */}
          {results.failed_conversions && results.failed_conversions.length > 0 && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Failed Conversions
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.failed_conversions}
                download={true}
                height="200px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={10}
              />
            </div>
          )}

          {/* Processing Log */}
          {results.processing_log && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Processing Log
              </Typography>
              <div className="bg-gray-100 p-4 rounded-lg max-h-60 overflow-y-auto">
                <pre className="text-sm">{results.processing_log}</pre>
              </div>
            </div>
          )}
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
          <Docs section={"smilesIupac"} />
        </div>
      </Modal>
    </div>
  );
}

export default SMILEStoIUPAC;
