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
  Box,
  Chip
} from "@mui/material";
import { Progress, Modal } from "@nextui-org/react";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridAutoDataComponent from "../../../Components/AgGridComponent/AgGridAutoDataComponent";
import Docs from "../../../../Docs/Docs";

function SMILESToSCS({ csvData }) {
  // Configuration state
  const [smilesColumn, setSmilesColumn] = useState("");
  const [processingMode, setProcessingMode] = useState("individual"); // individual, batch
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
      return () => clearInterval(pollIntervalRef.current);
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
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-scs/status/${taskId}/`,
        { method: "GET" }
      );
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        
        // Check if we actually have results
        let hasResults = false;
        
        if (data.results && data.results.length > 0) {
          hasResults = true;
        } else if (data.smiles && data.scs_score !== undefined) {
          hasResults = true;
        } else if (Object.keys(data).length > 1) {
          hasResults = true;
        }
        
        if (!hasResults) {
          console.warn("No results found in successful response");
          toast.warning("SCS calculation completed but no results were found");
          setCurrentProcessing("");
          return;
        }
        
        // Handle different response formats for batch vs individual
        if (processingMode === "batch") {
          // Transform backend data to frontend format for batch
          const transformedResults = {
            summary: {
              total_smiles: data.total || 0,
              successful_calculations: data.results?.length || 0,
              failed_calculations: (data.total || 0) - (data.results?.length || 0),
              success_rate: data.total ? Math.round(((data.results?.length || 0) / data.total) * 100) : 0,
              average_scs: data.results ? (data.results.reduce((sum, item) => sum + (item.scs_score || 0), 0) / data.results.length).toFixed(2) : 0
            },
            converted_data: data.results || []
          };
          setResults(transformedResults);
        } else {
          // Handle individual SMILES result
          let individualResult;
          if (data.results && data.results.length > 0) {
            individualResult = data.results[0];
          } else if (data.smiles && data.scs_score !== undefined) {
            individualResult = data;
          } else if (data.status === "SUCCESS" && Object.keys(data).length > 1) {
            individualResult = {
              smiles: data.smiles || singleSMILES,
              scs_score: data.scs_score || null,
              iupac_name: data.iupac_name || null
            };
          } else {
            individualResult = {
              smiles: singleSMILES,
              scs_score: "Not calculated"
            };
          }
          
          const transformedResults = {
            mode: "individual",
            smiles: individualResult?.smiles || singleSMILES,
            scs_score: individualResult?.scs_score || "Not calculated",
            iupac_name: individualResult?.iupac_name || null,
            raw_result: individualResult
          };
          setResults(transformedResults);
        }
        
        setCurrentProcessing("");
        toast.success("SCS calculation completed successfully!");
      } else if (data.status === "FAILURE") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "SCS calculation failed");
      } else if (data.status === "PROGRESS") {
        // Update progress information
        if (data.current && data.total) {
          const progressPercent = (data.current / data.total) * 100;
          setProgress(progressPercent);
          setCurrentProcessing(`Processing ${data.current}/${data.total}: ${data.current_smiles || ''}`);
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      
      // If this was an individual calculation, try to still show result
      if (processingMode === "individual") {
        const transformedResults = {
          mode: "individual",
          smiles: singleSMILES,
          scs_score: "Error: Could not calculate",
          error: "Network error occurred during calculation"
        };
        setResults(transformedResults);
      }
      
      toast.error("Error checking calculation status");
    }
  };

    // Handle batch SMILES conversion
  const handleBatchCalculation = async () => {
    if (!smilesColumn) {
      toast.error("Please select a SMILES column");
      return;
    }

    resetOperationState();
    setLoading(true);
    setCurrentProcessing("Starting batch SCS calculation...");

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
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-scs/calculate/?async=true`,
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
        toast.info("SCS calculation started. This may take several minutes...");
      } else {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.error || "Failed to start calculation");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error starting calculation: " + error.message);
    }
  };

  // Handle single SMILES calculation
  const handleSingleCalculation = async () => {
    if (!singleSMILES.trim()) {
      toast.error("Please enter a SMILES string");
      return;
    }

    resetOperationState();
    setLoading(true);
    setCurrentProcessing(`Calculating SCS for: ${singleSMILES}`);

    const requestData = {
      mode: "single",
      smiles: singleSMILES.trim(),
      config: {
        delay_between_requests: delayBetweenRequests
      }
    };

    try {
      // Try without async first for direct response
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-scs/calculate/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );
      const data = await response.json();
      
      if (response.ok) {
        if (data.task_id) {
          // Start polling for async task
          startPolling(data.task_id);
          toast.info("SCS calculation started...");
        } else if (data.smiles && data.scs_score !== undefined) {
          // Backend returned result directly without async task
          setLoading(false);
          setProgress(100);
          
          const transformedResults = {
            mode: "individual",
            smiles: data.smiles || singleSMILES,
            scs_score: data.scs_score || "Not calculated",
            iupac_name: data.iupac_name || null,
            raw_result: data
          };
          
          setResults(transformedResults);
          setCurrentProcessing("");
          toast.success("SCS calculation completed successfully!");
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
        toast.error(data.error || "Failed to calculate SCS");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error calculating SCS: " + error.message);
    }
  };

  // Helper function to get complexity level and color
  const getComplexityLevel = (scsScore) => {
    if (typeof scsScore !== 'number') return { level: 'Unknown', color: 'default' };
    
    if (scsScore >= 0 && scsScore < 3) {
      return { level: 'Low', color: 'success' };
    } else if (scsScore >= 3 && scsScore < 6) {
      return { level: 'Medium', color: 'warning' };
    } else if (scsScore >= 6 && scsScore <= 10) {
      return { level: 'High', color: 'error' };
    } else {
      return { level: 'Invalid', color: 'default' };
    }
  };



  return (
    <div className="my-6 w-full max-w-7xl mx-auto">
      <Typography variant="h5" className="!font-semibold !mb-4 text-gray-800" gutterBottom>
        SMILES to Synthetic Complexity Score (SCS) Calculator
      </Typography>
      
      {/* Processing Mode Selection */}
      <div className="mb-4">
        <FormControl component="fieldset">
          <FormLabel component="legend" className="!text-base !font-medium !text-gray-700">
            Processing Mode
          </FormLabel>
          <RadioGroup
            value={processingMode}
            onChange={(e) => setProcessingMode(e.target.value)}
            className="mt-2"
          >
            <FormControlLabel
              value="individual"
              control={<Radio size="small" />}
              label="Individual SMILES"
              className="!text-sm"
            />
            <FormControlLabel
              value="batch"
              control={<Radio size="small" />}
              label="Batch Processing (from dataset)"
              className="!text-sm"
            />
          </RadioGroup>
        </FormControl>
      </div>

      {/* Batch Processing Configuration */}
      {processingMode === "batch" && (
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <Typography variant="body2" className="!text-gray-700 !font-medium mb-2">
              Select SMILES Column:
            </Typography>
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
              InputProps={{ inputProps: { step: 1, min: 1, max: 100 } }}
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
        <div className="mb-4">
          <TextField
            label="Enter SMILES String"
            fullWidth
            size="small"
            value={singleSMILES}
            onChange={(e) => setSingleSMILES(e.target.value)}
            placeholder="e.g., CCO (ethanol)"
            helperText="Enter a single SMILES string to calculate synthetic complexity score"
            className="!mb-3"
          />
          
          {/* Sample SMILES for testing */}
          <div className="mt-2">
            <Typography variant="body2" className="!text-gray-600 mb-2 !text-sm">
              Sample SMILES for testing:
            </Typography>
            <div className="flex flex-wrap gap-2">
              {['CCO', 'CC(C)O', 'c1ccccc1', 'CC(=O)O', 'CCN(CC)CC'].map((sample) => (
                <button
                  key={sample}
                  onClick={() => setSingleSMILES(sample)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors border border-blue-200"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calculate Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="contained"
          size="medium"
          onClick={processingMode === "batch" ? handleBatchCalculation : handleSingleCalculation}
          disabled={loading || (processingMode === "batch" && !smilesColumn) || (processingMode === "individual" && !singleSMILES.trim())}
          className="!bg-primary-btn !text-white !font-medium !px-6 !py-2 !text-sm"
        >
          {loading ? "Calculating..." : "CALCULATE SCS SCORE"}
        </Button>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="mb-4">
          <Progress
            value={progress}
            shadow
            color="success"
            status="secondary"
            striped
          />
          {currentProcessing && (
            <p className="text-center mt-2 text-gray-600 text-sm">
              {currentProcessing}
            </p>
          )}
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-6">
          <Typography variant="h6" className="!font-semibold !mb-4 !text-gray-800" gutterBottom>
            SCS Calculation Results
          </Typography>

          {/* Summary Statistics for Batch */}
          {processingMode === "batch" && results.summary && (
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <Typography variant="body2" className="!font-medium !text-gray-700 !mb-1">
                  Total SMILES
                </Typography>
                <Typography variant="h6" className="!text-blue-600 !font-bold">
                  {results.summary.total_smiles || 0}
                </Typography>
              </div>
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <Typography variant="body2" className="!font-medium !text-gray-700 !mb-1">
                  Successfully Calculated
                </Typography>
                <Typography variant="h6" className="!text-green-600 !font-bold">
                  {results.summary.successful_calculations || 0}
                </Typography>
              </div>
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <Typography variant="body2" className="!font-medium !text-gray-700 !mb-1">
                  Failed Calculations
                </Typography>
                <Typography variant="h6" className="!text-red-600 !font-bold">
                  {results.summary.failed_calculations || 0}
                </Typography>
              </div>
              <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
                <Typography variant="body2" className="!font-medium !text-gray-700 !mb-1">
                  Success Rate
                </Typography>
                <Typography variant="h6" className="!text-purple-600 !font-bold">
                  {results.summary.success_rate || 0}%
                </Typography>
              </div>
              <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                <Typography variant="body2" className="!font-medium !text-gray-700 !mb-1">
                  Avg SCS Score
                </Typography>
                <Typography variant="h6" className="!text-orange-600 !font-bold">
                  {results.summary.average_scs || 0}
                </Typography>
              </div>
            </div>
          )}

          {/* Individual Result */}
          {processingMode === "individual" && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <Typography variant="subtitle1" className="!font-medium !mb-3 !text-gray-800">
                Individual SCS Calculation Result
              </Typography>
              
              {results && (
                <div className="bg-white p-4 rounded border">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex">
                      <span className="font-semibold w-32">SMILES:</span>
                      <span className="text-blue-600 font-mono">{results.smiles || "Not available"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-32">SCS Score:</span>
                      <span className="text-green-600 font-medium text-xl">
                        {typeof results.scs_score === 'number' ? results.scs_score.toFixed(2) : results.scs_score}
                      </span>
                    </div>
                    {typeof results.scs_score === 'number' && (
                      <div className="flex items-center">
                        <span className="font-semibold w-32">Complexity Level:</span>
                        <Chip
                          label={getComplexityLevel(results.scs_score).level}
                          color={getComplexityLevel(results.scs_score).color}
                          size="medium"
                        />
                      </div>
                    )}
                    {results.iupac_name && (
                      <div className="flex">
                        <span className="font-semibold w-32">IUPAC Name:</span>
                        <span className="text-purple-600 font-medium">{results.iupac_name}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* SCS Score Progress Bar */}
                  {typeof results.scs_score === 'number' && (
                    <div className="mt-4">
                      <Typography variant="body2" className="!font-medium !text-gray-700 !mb-2">
                        Complexity Scale (0 = Simple, 5 = Complex):
                      </Typography>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(results.scs_score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>0</span>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Results Table - Only show for batch mode */}
          {processingMode === "batch" && results.converted_data && results.converted_data.length > 0 && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Calculated SCS Scores
              </Typography>
              
                             <AgGridAutoDataComponent
                 rowData={results.converted_data.map(item => ({
                   ...item,
                   complexity_level: getComplexityLevel(item.scs_score).level
                 }))}
                download={true}
                height="400px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={20}
              />
            </div>
          )}

          {/* Failed Calculations */}
          {results.failed_calculations && results.failed_calculations.length > 0 && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Failed Calculations
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.failed_calculations}
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
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
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
          <Docs section={"smilesScs"} />
        </div>
      </Modal>
    </div>
  );
}

export default SMILESToSCS;
