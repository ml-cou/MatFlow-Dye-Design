import React, { useState, useEffect, useRef } from "react";
import { 
  Typography, 
  TextField,
  Button
} from "@mui/material";
import { Progress, Modal } from "@nextui-org/react";
import { toast } from "react-toastify";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import AgGridAutoDataComponent from "../../../Components/AgGridComponent/AgGridAutoDataComponent";
import Plot from "react-plotly.js";
import Docs from "../../../../Docs/Docs";
import { ReadFile } from "../../../../util/utils";

// Custom Slider Component
const CustomSlider = ({ label, value, onChange, min, max, step }) => (
  <div className="mb-4">
    <Typography variant="body2" className="mb-2">
      {label}: {value}
    </Typography>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e, parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);

function SMILESGeneration({ csvData }) {
  // Dataset selection state
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [trainDataset, setTrainDataset] = useState("");
  const [testDataset, setTestDataset] = useState("");
  const [trainData, setTrainData] = useState(null);
  const [testData, setTestData] = useState(null);
  
  // Configuration state
  const [smilesColumn, setSmilesColumn] = useState("");
  const [epsilonColumn, setEpsilonColumn] = useState("");
  
  // VAE Hyperparameters
  const [latentDim, setLatentDim] = useState(64);
  const [epochs, setEpochs] = useState(50);
  const [batchSize, setBatchSize] = useState(64);
  const [learningRate, setLearningRate] = useState(0.001);
  const [embeddingDim, setEmbeddingDim] = useState(128);
  const [lstmUnits, setLstmUnits] = useState(128);
  
  // Training parameters
  const [testSize, setTestSize] = useState(0.2);
  const [randomState, setRandomState] = useState(42);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [visible, setVisible] = useState(false);
  
  // For polling
  const pollIntervalRef = useRef(null);
  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  // Fetch available datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_API_URL}${
            import.meta.env.VITE_APP_API_DATASET
          }`
        );
        if (!response.ok) {
          throw new Error(`Error fetching datasets: ${response.statusText}`);
        }
        const data = await response.json();
        const files = getAllFiles(data);
        setAvailableDatasets(files);
      } catch (err) {
        console.error(err);
        toast.error(err.message);
      }
    };

    fetchDatasets();
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

  // Load train dataset
  const handleTrainDatasetChange = async (val) => {
    if (!val) {
      setTrainData(null);
      setTrainDataset("");
      setSmilesColumn("");
      setEpsilonColumn("");
      return;
    }
    
    try {
      const splittedFolder = val.split("/");
      const foldername = splittedFolder
        .slice(0, splittedFolder.length - 1)
        .join("/");

      const data = await ReadFile({
        foldername,
        filename: splittedFolder[splittedFolder.length - 1],
      });
      setTrainData(data);
      setTrainDataset(val);
      setSmilesColumn("");
      setEpsilonColumn("");
    } catch (error) {
      console.error("Error loading train dataset:", error);
      toast.error("Error loading train dataset");
    }
  };

  // Load test dataset
  const handleTestDatasetChange = async (val) => {
    if (!val || val === "None") {
      setTestData(null);
      setTestDataset("None");
      return;
    }
    
    try {
      const splittedFolder = val.split("/");
      const foldername = splittedFolder
        .slice(0, splittedFolder.length - 1)
        .join("/");

      const data = await ReadFile({
        foldername,
        filename: splittedFolder[splittedFolder.length - 1],
      });
      setTestData(data);
      setTestDataset(val);
    } catch (error) {
      console.error("Error loading test dataset:", error);
      toast.error("Error loading test dataset");
    }
  };

  // Get available columns from train dataset
  const availableColumns = trainData ? Object.keys(trainData[0]) : [];

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
    pollIntervalRef.current = setInterval(() => {
      checkTaskStatus(taskId);
    }, 3000);
  };
  // Check task status
  const checkTaskStatus = async (taskId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${import.meta.env.VITE_APP_API_SMILES_STATUS}${taskId}/`,
        { method: "GET" }
      );
      
      if (!response.ok) {
        // If we get a server error, stop polling and show error
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        toast.error(`Server error: ${response.status}. Task may have failed.`);
        return;
      }
      
      const data = await response.json();

      if (data.status === "SUCCESS") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        setResults(data.results);
        toast.success("SMILES generation completed successfully!");
      } else if (data.status === "FAILURE") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setLoading(false);
        setProgress(100);
        toast.error(data.error || "Task failed");
      }
      // Continue polling for PENDING/STARTED states
    } catch (error) {
      console.error("Error checking task status:", error);
      // Stop polling on repeated errors to prevent infinite loops
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setLoading(false);
      setProgress(100);
      toast.error("Failed to check task status. Please try again.");
    }
  };

  // Handle SMILES generation
  const handleGenerateSMILES = async () => {
    if (!trainData) {
      toast.error("Please select a train dataset");
      return;
    }

    if (!smilesColumn) {
      toast.error("Please select a SMILES column");
      return;
    }

    setLoading(true);
    setResults(null);
    setTaskId(null);

    const requestData = {
      train_dataset: trainData,
      test_dataset: testData || null,
      smiles_column: smilesColumn,
      epsilon_column: epsilonColumn || null,
      training_mode: "inference", // Required by backend
      vae_config: {
        latent_dim: latentDim,
        epochs: epochs,
        batch_size: batchSize,
        learning_rate: learningRate,
        embedding_dim: embeddingDim,
        lstm_units: lstmUnits
      },
      training_config: {
        test_size: testSize,
        random_state: randomState
      }
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${import.meta.env.VITE_APP_API_SMILES_GENERATION}?async=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();
      
      console.log("API Response:", data); // Debug log
      
      if (response.ok) {
        if (data.results) {
          // Sync mode response - direct results
          console.log("Sync mode - Results:", data.results); // Debug log
          setLoading(false);
          setProgress(100);
          
          // Check if results array is empty
          if (Array.isArray(data.results) && data.results.length === 0) {
            toast.warning("No SMILES generated. This may be due to invalid input data or filtering.");
            setResults([]);
          } else {
            setResults(data.results);
            toast.success("SMILES generation completed successfully!");
          }
        } else if (data.task_id) {
          // Async mode response - start polling
          console.log("Async mode - Task ID:", data.task_id); // Debug log
          setTaskId(data.task_id);
          startPolling(data.task_id);
          toast.info("SMILES generation started. This may take several minutes...");
        } else {
          // Unknown response format
          console.log("Unknown response format:", data); // Debug log
          setLoading(false);
          setProgress(100);
          toast.error("Unexpected server response format");
        }
      } else {
        console.log("API Error:", data); // Debug log
        setLoading(false);
        setProgress(100);
        toast.error(data.error || "Failed to start SMILES generation");
      }
    } catch (error) {
      setLoading(false);
      setProgress(100);
      toast.error("Error starting SMILES generation: " + error.message);
    }
  };

  return (
    <div className="my-8 w-full">
      <Typography variant="h4" className="!font-medium !mb-6" gutterBottom>
        SMILES Generation using AutoVAE
      </Typography>

      {/* Dataset Configuration */}
      <Typography variant="h5" className="!mt-6 !font-medium" gutterBottom>
        Dataset Configuration
      </Typography>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="mb-2">Select Train Dataset:</p>
          <SingleDropDown
            columnNames={availableDatasets}
            onValueChange={handleTrainDatasetChange}
            initValue={trainDataset}
          />
        </div>
        <div>
          <p className="mb-2">Select Test Dataset:</p>
          <SingleDropDown
            columnNames={["None", ...availableDatasets]}
            onValueChange={handleTestDatasetChange}
            initValue={testDataset || "None"}
          />
        </div>
      </div>


      {/* SMILES and Epsilon Columns */}
      <Typography variant="h5" className="!mt-6 !font-medium" gutterBottom>
        Column Configuration
      </Typography>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="mb-2">Select SMILES Column:</p>
          <SingleDropDown
            columnNames={availableColumns}
            onValueChange={setSmilesColumn}
            initValue={smilesColumn}
          />
        </div>
        <div>
          <p className="mb-2">Select Epsilon Column (Optional):</p>
          <SingleDropDown
            columnNames={["None", ...availableColumns]}
            onValueChange={(value) => setEpsilonColumn(value === "None" ? "" : value)}
            initValue={epsilonColumn || "None"}
          />
        </div>
      </div>

      {/* VAE Hyperparameters */}
      <Typography variant="h5" className="!mt-6 !font-medium" gutterBottom>
        VAE Configuration
      </Typography>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <CustomSlider
          label="Latent Dimension"
          value={latentDim}
          onChange={(e, v) => setLatentDim(v)}
          min={32}
          max={256}
          step={16}
        />
        <CustomSlider
          label="Epochs"
          value={epochs}
          onChange={(e, v) => setEpochs(v)}
          min={10}
          max={200}
          step={10}
        />
        <CustomSlider
          label="Batch Size"
          value={batchSize}
          onChange={(e, v) => setBatchSize(v)}
          min={16}
          max={256}
          step={16}
        />
        <TextField
          label="Learning Rate"
          type="number"
          size="small"
          value={learningRate}
          onChange={(e) => setLearningRate(parseFloat(e.target.value))}
          InputProps={{ inputProps: { step: 0.0001, min: 0.0001, max: 0.01 } }}
        />
        <CustomSlider
          label="Embedding Dimension"
          value={embeddingDim}
          onChange={(e, v) => setEmbeddingDim(v)}
          min={64}
          max={512}
          step={32}
        />
        <CustomSlider
          label="LSTM Units"
          value={lstmUnits}
          onChange={(e, v) => setLstmUnits(v)}
          min={64}
          max={512}
          step={32}
        />
      </div>

      {/* Training Parameters */}
      <Typography variant="h5" className="!mt-6 !font-medium" gutterBottom>
        Training Parameters
      </Typography>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <CustomSlider
          label="Test Size"
          value={testSize}
          onChange={(e, v) => setTestSize(v)}
          min={0.1}
          max={0.5}
          step={0.05}
        />
        <TextField
          label="Random State"
          type="number"
          size="small"
          value={randomState}
          onChange={(e) => setRandomState(parseInt(e.target.value))}
          InputProps={{ inputProps: { step: 1, min: 1 } }}
        />
      </div>

      {/* Generate Button */}
      <div className="flex justify-end mb-6">
        <Button
          variant="contained"
          size="large"
          onClick={handleGenerateSMILES}
          disabled={loading || !trainData || !smilesColumn}
          className="!bg-primary-btn !text-white !font-medium !px-8 !py-3"
        >
          {loading ? "Generating..." : "Generate SMILES"}
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
          <p className="text-center mt-2 text-gray-600">
            Training AutoVAE model and generating SMILES...
          </p>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-8">
          <Typography variant="h4" className="!font-medium !mb-6" gutterBottom>
            Generation Results
          </Typography>

          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Typography variant="h6" className="!font-medium">
                Total Generated
              </Typography>
              <Typography variant="h4" className="!text-blue-600">
                {results.total_generated || 0}
              </Typography>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <Typography variant="h6" className="!font-medium">
                Valid SMILES
              </Typography>
              <Typography variant="h4" className="!text-green-600">
                {results.valid_smiles || 0}
              </Typography>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <Typography variant="h6" className="!font-medium">
                Ring Structures
              </Typography>
              <Typography variant="h4" className="!text-purple-600">
                {results.ring_structures || 0}
              </Typography>
            </div>
          </div>

          {/* Generated SMILES Table */}
          {results.generated_smiles && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Generated SMILES
              </Typography>
              <AgGridAutoDataComponent
                rowData={results.generated_smiles}
                download={true}
                height="400px"
                rowHeight={40}
                headerHeight={50}
                paginationPageSize={10}
              />
            </div>
          )}

          {/* Training Metrics */}
          {results.training_metrics && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Training Metrics
              </Typography>
              <div className="flex justify-center">
                <Plot
                  data={results.training_metrics.data}
                  layout={{
                    ...results.training_metrics.layout,
                    showlegend: true,
                    width: 800,
                    height: 400,
                    font: { size: 14 },
                    legend: {
                      font: { size: 16 },
                      bgcolor: 'rgba(255,255,255,0.9)',
                      bordercolor: 'rgba(0,0,0,0.2)',
                      borderwidth: 1
                    }
                  }}
                  config={{
                    editable: true,
                    responsive: true
                  }}
                />
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {results.analysis && (
            <div className="mb-8">
              <Typography variant="h5" className="!font-medium !mb-4" gutterBottom>
                Analysis Results
              </Typography>
              
              {results.analysis.common_smiles && (
                <div className="mb-6">
                  <Typography variant="h6" className="!font-medium !mb-2">
                    Common SMILES Analysis
                  </Typography>
                  <AgGridAutoDataComponent
                    rowData={results.analysis.common_smiles}
                    download={true}
                    height="200px"
                    rowHeight={30}
                    headerHeight={40}
                    paginationPageSize={5}
                  />
                </div>
              )}

              {results.analysis.duplicate_analysis && (
                <div className="mb-6">
                  <Typography variant="h6" className="!font-medium !mb-2">
                    Duplicate Analysis
                  </Typography>
                  <AgGridAutoDataComponent
                    rowData={results.analysis.duplicate_analysis}
                    download={true}
                    height="200px"
                    rowHeight={30}
                    headerHeight={40}
                    paginationPageSize={5}
                  />
                </div>
              )}
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
          <Docs section={"smilesGeneration"} />
        </div>
      </Modal>
    </div>
  );
}

export default SMILESGeneration;
