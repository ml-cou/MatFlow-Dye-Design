import React, { useState, useMemo } from "react";
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
  Chip,
  Card,
  CardContent,
  Grid
} from "@mui/material";
import { Progress, Modal } from "@nextui-org/react";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridAutoDataComponent from "../../../Components/AgGridComponent/AgGridAutoDataComponent";
import Docs from "../../../../Docs/Docs";

function SMILESToSAS({ csvData }) {
  // Configuration state
  const [smilesColumn, setSmilesColumn] = useState("");
  const [processingMode, setProcessingMode] = useState("individual"); // individual, batch

  
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


  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  // Cancel operation
  const handleCancelOperation = () => {

    setLoading(false);
    setProgress(0);
    setCurrentProcessing("");
    setCancelled(true);
    toast.info("Operation cancelled");
  };

  // Reset state when starting new operation
  const resetOperationState = () => {
    setResults(null);
    setTaskId(null);
    setCancelled(false);
    setProgress(0);
    setCurrentProcessing("");
  };

  // Get available columns for SMILES
  const availableColumns = csvData ? Object.keys(csvData[0]) : [];

  // Helper function to get complexity level and color
  const getComplexityLevel = (sasScore) => {
    if (typeof sasScore !== 'number') return { level: 'Unknown', color: 'default' };
    
    if (sasScore <= 3) {
      return { level: 'Low Complexity', color: 'success' };
    } else if (sasScore <= 6) {
      return { level: 'Medium Complexity', color: 'warning' };
    } else {
      return { level: 'High Complexity', color: 'error' };
    }
  };

  // Visualization data preparation
  const visualizationData = useMemo(() => {
    if (!results || !results.results) return null;
    
    const validResults = results.results.filter(r => r.sa_score !== null && r.sa_score !== undefined);
    
    // SAS Score Distribution (histogram)
    const scoreDistribution = {
      '1-2': validResults.filter(r => r.sa_score >= 1 && r.sa_score < 2).length,
      '2-3': validResults.filter(r => r.sa_score >= 2 && r.sa_score < 3).length,
      '3-4': validResults.filter(r => r.sa_score >= 3 && r.sa_score < 4).length,
      '4-5': validResults.filter(r => r.sa_score >= 4 && r.sa_score < 5).length,
      '5-6': validResults.filter(r => r.sa_score >= 5 && r.sa_score < 6).length,
      '6-7': validResults.filter(r => r.sa_score >= 6 && r.sa_score < 7).length,
      '7-8': validResults.filter(r => r.sa_score >= 7 && r.sa_score < 8).length,
      '8-9': validResults.filter(r => r.sa_score >= 8 && r.sa_score < 9).length,
      '9-10': validResults.filter(r => r.sa_score >= 9 && r.sa_score <= 10).length
    };
    
    // Complexity Level Distribution
    const complexityDistribution = {
      'Low': validResults.filter(r => getComplexityLevel(r.sa_score).level === 'Low Complexity').length,
      'Medium': validResults.filter(r => getComplexityLevel(r.sa_score).level === 'Medium Complexity').length,
      'High': validResults.filter(r => getComplexityLevel(r.sa_score).level === 'High Complexity').length
    };
    
    // SMILES Length vs SAS Score correlation data
    const correlationData = validResults.map(r => ({
      smilesLength: r.smiles ? r.smiles.length : 0,
      sasScore: r.sa_score
    }));

    return {
      scoreDistribution,
      complexityDistribution,
      correlationData,
      totalValid: validResults.length
    };
  }, [results]);




  // Handle individual SAS calculation
  const handleSingleCalculation = async () => {
    if (!singleSMILES.trim()) {
      toast.error("Please enter a SMILES string");
      return;
    }

    resetOperationState();
    setLoading(true);
    setCurrentProcessing(`Calculating SAS for: ${singleSMILES}`);

    // Prepare data for the new SAS score API
    const requestData = {
      dataset: [{ id: 1, smiles: singleSMILES.trim() }],
      smiles_column: "smiles",
      score_key: "sa_score",
      round_to: 3,
      drop_invalid: false
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-sa-score/`,
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
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          
          if (result.sa_score !== null && result.sa_score !== undefined) {
          const transformedResults = {
            mode: "individual",
              smiles: singleSMILES,
              sas_score: result.sa_score,
              summary: {
                total_smiles: 1,
                successful_calculations: 1,
                failed_calculations: 0,
                success_rate: 100,
                average_sas: result.sa_score
              }
          };
          
          setResults(transformedResults);
            setLoading(false);
            setProgress(100);
          setCurrentProcessing("");
          toast.success("SAS calculation completed successfully!");
          } else {
            setLoading(false);
            setProgress(100);
            setCurrentProcessing("");
            toast.error(result.error || "Failed to calculate SAS score");
          }
        } else {
          setLoading(false);
          setProgress(100);
          setCurrentProcessing("");
          toast.error("No results returned from API");
        }
      } else {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.detail || "Failed to calculate SAS");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error calculating SAS: " + error.message);
    }
  };

  // Handle batch SAS calculation
  const handleBatchCalculation = async () => {
    if (!smilesColumn) {
      toast.error("Please select a SMILES column");
      return;
    }

    if (!csvData || csvData.length === 0) {
      toast.error("Please upload a CSV file first");
      return;
    }

    setLoading(true);
    setProgress(0);
    setCurrentProcessing("Processing batch data...");

    // Prepare data for the new SAS score API
    const requestData = {
      dataset: csvData.map((row, index) => ({
        id: index + 1,
        ...row
      })),
      smiles_column: smilesColumn,
      score_key: "sa_score",
      round_to: 3,
      drop_invalid: false
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/smiles-sa-score/`,
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
            if (data.results && data.results.length > 0) {
              // Calculate UI metrics from backend data
              const validResults = data.results.filter(r => r.sa_score !== null && r.sa_score !== undefined);
              const invalidResults = data.results.filter(r => r.sa_score === null || r.sa_score === undefined);
              

              
              const transformedResults = {
                mode: "batch",
                summary: {
                  total_smiles: csvData && csvData.length ? csvData.length : (data.summary.total || 0), // Use CSV data or backend total
                  processed: data.summary.processed,
                  invalid: data.summary.invalid,
                  successful_calculations: validResults.length,
                  failed_calculations: invalidResults.length,
                  success_rate: csvData && csvData.length > 0 ? Math.round((validResults.length / csvData.length) * 100) : 0,
                  average_sas: validResults.length > 0 ? 
                    parseFloat((validResults.reduce((sum, r) => sum + r.sa_score, 0) / validResults.length).toFixed(5)) : 0
                },
                results: data.results
              };
          
          setResults(transformedResults);
          setLoading(false);
          setProgress(100);
          setCurrentProcessing("");
          toast.success("Batch SAS calculation completed successfully!");
        } else {
        setLoading(false);
        setProgress(100);
          setCurrentProcessing("");
          toast.error("No results returned from API");
        }
      } else {
        setLoading(false);
        setProgress(100);
        setCurrentProcessing("");
        toast.error(data.detail || "Failed to calculate batch SAS");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      setCurrentProcessing("");
      toast.error("Error calculating batch SAS: " + error.message);
    }
  };

  return (
    <div className="my-6 w-full max-w-7xl mx-auto">
      <Typography variant="h5" className="!font-semibold !mb-4 text-gray-800" gutterBottom>
        SMILES to Synthetic Accessibility Score (SAS) Calculator
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
            helperText="Enter a single SMILES string to calculate SAS score"
            className="!mb-3"
          />
          

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
          {loading ? "Calculating..." : "CALCULATE SAS SCORE"}
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
          <Typography variant="h6" className="!font-semibold !mb-4 !text-gray-800 text-center" gutterBottom>
            SAS Calculation Results
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
                  Avg SAS Score
                </Typography>
                <Typography variant="h6" className="!text-orange-600 !font-bold">
                  {results.summary.average_sas || 0}
                </Typography>
              </div>
            </div>
          )}

          {/* Individual Result */}
          {processingMode === "individual" && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <Typography variant="subtitle1" className="!font-medium !mb-3 !text-gray-800">
                Individual SAS Calculation Result
              </Typography>
              
              {results && (
                <div className="bg-white p-4 rounded border">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex">
                      <span className="font-semibold w-32">SMILES:</span>
                      <span className="text-blue-600 font-mono">{results.smiles || "Not available"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-32">SAS Score:</span>
                      <span className="text-green-600 font-medium text-xl">
                        {results.sas_score}
                      </span>
                    </div>
                    {typeof results.sas_score === 'number' && (
                      <div className="flex items-center">
                        <span className="font-semibold w-32">Complexity Level:</span>
                        <Chip
                          label={getComplexityLevel(results.sas_score).level}
                          color={getComplexityLevel(results.sas_score).color}
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
                  
                  {/* Complexity Level Legend */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Typography variant="body2" className="!font-medium !text-gray-800 !mb-2">
                      Complexity Level Legend:
                      </Typography>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-green-500 mr-3"></div>
                        <span className="text-sm text-gray-700">
                          <strong>Low Complexity (1-3):</strong> Low Complexity
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-yellow-500 mr-3"></div>
                        <span className="text-sm text-gray-700">
                          <strong>Medium Complexity (4-6):</strong> Medium Complexity
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-red-500 mr-3"></div>
                        <span className="text-sm text-gray-700">
                          <strong>High Complexity (7-10):</strong> High Complexity
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results Table - Only show for batch mode */}
          {processingMode === "batch" && results.results && results.results.length > 0 && (
            <div className="mb-8">
              <Typography variant="h6" className="!font-semibold !mb-4 !text-gray-800 text-center" gutterBottom>
                Batch SAS Results
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.results}
                download={true}
                height="400px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={10}
                customColumnOrder={['id', 'smiles', 'sa_score']}
                downloadOptions={{
                  minimalColumns: ['id', 'smiles', 'sa_score']
                }}
              />
            </div>
          )}

          {/* Visualizations - Only show for batch mode with results */}
          {processingMode === "batch" && visualizationData && results.results && results.results.length > 0 && (
            <div className="mb-8 text-center">
              <Typography variant="h6" className="!font-medium !mb-4" gutterBottom>
                Data Visualizations
              </Typography>
              
              <Grid container spacing={4} justifyContent="center">
                {/* SAS Score Distribution */}
                <Grid item xs={12} lg={4}>
                  <Card className="shadow-lg min-h-fit">
                    <CardContent className="p-6">
                      <Typography variant="h6" className="!font-semibold !mb-4 text-gray-800" gutterBottom>
                        SAS Score Distribution
                      </Typography>
                      <div className="space-y-3">
                        {Object.entries(visualizationData.scoreDistribution).map(([range, count]) => {
                          const percentage = visualizationData.totalValid > 0 ? Math.round((count / visualizationData.totalValid) * 100) : 0;
                          const maxCount = Math.max(...Object.values(visualizationData.scoreDistribution));
                          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          
                          return (
                            <div key={range} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-800">{range}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-bold text-blue-600">{count}</span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{percentage}%</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${barWidth}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Complexity Level Distribution */}
                <Grid item xs={12} lg={4}>
                  <Card className="shadow-lg min-h-fit">
                    <CardContent className="p-6">
                      <Typography variant="h6" className="!font-semibold !mb-4 text-gray-800" gutterBottom>
                        Complexity Level Distribution
                      </Typography>
                      <div className="space-y-4">
                        {Object.entries(visualizationData.complexityDistribution).map(([level, count]) => {
                          const color = level === 'Low' ? 'bg-green-500' : level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500';
                          const percentage = visualizationData.totalValid > 0 ? Math.round((count / visualizationData.totalValid) * 100) : 0;
                          return (
                            <div key={level} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center">
                                <div className={`w-5 h-5 rounded-full ${color} mr-4 shadow-sm`}></div>
                                <span className="text-sm font-medium text-gray-700">{level} Complexity</span>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-800">{count}</div>
                                <div className="text-sm text-gray-500">{percentage}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </Grid>

                {/* SAS Score Range Analysis */}
                <Grid item xs={12} lg={4}>
                  <Card className="shadow-lg min-h-fit">
                    <CardContent className="p-6">
                      <Typography variant="h6" className="!font-semibold !mb-4 text-gray-800" gutterBottom>
                        SAS Score Range Analysis
                      </Typography>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-xs text-green-600 font-medium mb-1">Min Score</div>
                            <div className="text-xl font-bold text-green-700">
                              {Math.min(...visualizationData.correlationData.map(d => d.sasScore))}
                            </div>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-xs text-red-600 font-medium mb-1">Max Score</div>
                            <div className="text-xl font-bold text-red-700">
                              {Math.max(...visualizationData.correlationData.map(d => d.sasScore))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <Typography variant="body2" className="!text-gray-700 !text-sm leading-relaxed">
                            <strong className="text-gray-800">Score Interpretation:</strong><br/>
                            <span className="text-green-600">• 1-3:</span> Low Complexity<br/>
                            <span className="text-yellow-600">• 4-6:</span> Medium Complexity<br/>
                            <span className="text-red-600">• 7-10:</span> High Complexity
                          </Typography>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
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
          <Docs section={"smilesSAS"} />
        </div>
      </Modal>
    </div>
  );
}

export default SMILESToSAS;
