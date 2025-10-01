import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiSend, FiMinimize2, FiTrash2 } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveFunction } from '../../Slices/SideBarSlice';

// Hugging Face API configuration
const HF_API_TOKEN = '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';
const HF_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

const Chatbot = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const csvData = useSelector((state) => state.featureEngineering.file);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "🤖 Hello! I'm your AI-powered assistant for Matflow. I can understand natural language and automatically navigate to functions for you! Try typing things like:\n\n• 'Show me statistics'\n• 'I want to do correlation analysis'\n• 'Open SMILES generation'\n• 'Display my data'\n• 'Create a bar plot with Species and SepalLengthCm'\n• 'Generate bar chart with horizontal orientation'\n\nJust type your command and I'll help you navigate to the right function or generate plots!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 384, height: 500 });
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 384, height: 500 });
  const [showPlotInterface, setShowPlotInterface] = useState(false);
  const [currentPlotType, setCurrentPlotType] = useState('');
  const [plotParams, setPlotParams] = useState({
    categorical: [],
    numerical: '',
    x_var: '',
    y_var: '',
    orientation: 'Vertical',
    annotate: false,
    title: '',
    hue: '',
    bins: 10,
    kde: false,
    legend: false,
    label: true,
    percentage: true,
    gap: 0
  });
  const [availableColumns, setAvailableColumns] = useState([]);
  const [plotResult, setPlotResult] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const uploadInputRef = useRef(null);

  // Prototype dataset UX inside chat
  const [showDatasetOptions, setShowDatasetOptions] = useState(false);
  const [datasetPreview, setDatasetPreview] = useState({ name: '', headers: [], rows: [] });
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [modalDataset, setModalDataset] = useState({ name: '', headers: [], rows: [] });

  // Function mapping to navigate to specific functions - using nodeIds for proper clicking
  const functionMapping = {
    // Dataset operations
    'upload': { label: 'Display', nodeId: '0-0' },
    'info': { label: 'Information', nodeId: '0-1' },
    'stats': { label: 'Statistics', nodeId: '0-2' },
    'correlation': { label: 'Corelation', nodeId: '0-3' },
    'duplicate': { label: 'Duplicate', nodeId: '0-4' },
    'group': { label: 'Group', nodeId: '0-5' },
    'feature_eng': { label: 'Feature Engineering', nodeId: '2' },
    'model_build': { label: 'Model Building', nodeId: '5' },
    
    // InvML operations - using exact nodeIds from FunctionTab
    'reverse_ml': { label: 'ReverseML', nodeId: '8-1' },
    'time_series': { label: 'Time Series Analysis', nodeId: '7' },
    'pso': { label: 'PSO', nodeId: '8-2' },
    'smiles_gen': { label: 'SMILES Generation', nodeId: '8-4' },
    'smiles_iupac': { label: 'SMILES to IUPAC', nodeId: '8-5' },
    'smiles_sas': { label: 'SMILES to SAS', nodeId: '8-6' },
    'smiles_dft': { label: 'SMILES to DFT', nodeId: '8-7' },
    'molecular_structure': { label: 'SMILES Structure', nodeId: '8-8' },
    'feature_selection': { label: 'Feature Selection', nodeId: '8-3' },
    'scaler_eval': { label: 'Best Scaler', nodeId: '8-9' },
    
    // EDA Plot operations
    'bar_plot': { label: 'Bar Plot', nodeId: 'bar_plot', isPlot: true, plotType: 'bar' },
    'barplot': { label: 'Bar Plot', nodeId: 'bar_plot', isPlot: true, plotType: 'bar' },
    'bar chart': { label: 'Bar Plot', nodeId: 'bar_plot', isPlot: true, plotType: 'bar' },
    
    'scatter_plot': { label: 'Scatter Plot', nodeId: 'scatter_plot', isPlot: true, plotType: 'scatter' },
    'scatterplot': { label: 'Scatter Plot', nodeId: 'scatter_plot', isPlot: true, plotType: 'scatter' },
    'scatter chart': { label: 'Scatter Plot', nodeId: 'scatter_plot', isPlot: true, plotType: 'scatter' },
    
    'line_plot': { label: 'Line Plot', nodeId: 'line_plot', isPlot: true, plotType: 'line' },
    'lineplot': { label: 'Line Plot', nodeId: 'line_plot', isPlot: true, plotType: 'line' },
    'line chart': { label: 'Line Plot', nodeId: 'line_plot', isPlot: true, plotType: 'line' },
    
    'histogram': { label: 'Histogram', nodeId: 'histogram', isPlot: true, plotType: 'histogram' },
    'hist': { label: 'Histogram', nodeId: 'histogram', isPlot: true, plotType: 'histogram' },
    
    'box_plot': { label: 'Box Plot', nodeId: 'box_plot', isPlot: true, plotType: 'box' },
    'boxplot': { label: 'Box Plot', nodeId: 'box_plot', isPlot: true, plotType: 'box' },
    'box chart': { label: 'Box Plot', nodeId: 'box_plot', isPlot: true, plotType: 'box' },
    
    'pie_plot': { label: 'Pie Plot', nodeId: 'pie_plot', isPlot: true, plotType: 'pie' },
    'pieplot': { label: 'Pie Plot', nodeId: 'pie_plot', isPlot: true, plotType: 'pie' },
    'pie chart': { label: 'Pie Plot', nodeId: 'pie_plot', isPlot: true, plotType: 'pie' },
    
    'count_plot': { label: 'Count Plot', nodeId: 'count_plot', isPlot: true, plotType: 'count' },
    'countplot': { label: 'Count Plot', nodeId: 'count_plot', isPlot: true, plotType: 'count' },
    
    'violin_plot': { label: 'Violin Plot', nodeId: 'violin_plot', isPlot: true, plotType: 'violin' },
    'violinplot': { label: 'Violin Plot', nodeId: 'violin_plot', isPlot: true, plotType: 'violin' },
    
    'reg_plot': { label: 'Regression Plot', nodeId: 'reg_plot', isPlot: true, plotType: 'reg' },
    'regplot': { label: 'Regression Plot', nodeId: 'reg_plot', isPlot: true, plotType: 'reg' },
    'regression plot': { label: 'Regression Plot', nodeId: 'reg_plot', isPlot: true, plotType: 'reg' },
    
    'custom_plot': { label: 'Custom Plot', nodeId: 'custom_plot', isPlot: true, plotType: 'custom' },
    'customplot': { label: 'Custom Plot', nodeId: 'custom_plot', isPlot: true, plotType: 'custom' },
    
    'venn_diagram': { label: 'Venn Diagram', nodeId: 'venn_diagram', isPlot: true, plotType: 'venn' },
    'venn': { label: 'Venn Diagram', nodeId: 'venn_diagram', isPlot: true, plotType: 'venn' }
  };

  // AI-powered function detection using natural language
  const detectFunctionFromText = (text) => {
    const lowerText = text.toLowerCase();
    
    // Create a comprehensive mapping of keywords to function keys
    const keywordMapping = {
      // Dataset operations
      'display': 'upload',
      'show data': 'upload',
      'view data': 'upload',
      'upload': 'upload',
      'dataset': 'upload',
      'data': 'upload',
      
      'information': 'info',
      'info': 'info',
      'overview': 'info',
      'details': 'info',
      'summary': 'info',
      
      'statistics': 'stats',
      'stats': 'stats',
      'statistical': 'stats',
      'describe': 'stats',
      'summary statistics': 'stats',
      
      'correlation': 'correlation',
      'correlate': 'correlation',
      'relationship': 'correlation',
      'correlation analysis': 'correlation',
      
      'duplicate': 'duplicate',
      'duplicates': 'duplicate',
      'duplicate data': 'duplicate',
      'find duplicates': 'duplicate',
      
      'group': 'group',
      'grouping': 'group',
      'group by': 'group',
      'aggregate': 'group',
      'group data': 'group',
      
      'feature engineering': 'feature_eng',
      'feature eng': 'feature_eng',
      'feature creation': 'feature_eng',
      'transform': 'feature_eng',
      'engineering': 'feature_eng',
      
      'model building': 'model_build',
      'model build': 'model_build',
      'model': 'model_build',
      'machine learning': 'model_build',
      'ml': 'model_build',
      'train': 'model_build',
      'training': 'model_build',
      
      // InvML operations
      'reverse ml': 'reverse_ml',
      'reverse machine learning': 'reverse_ml',
      'reverse_ml': 'reverse_ml',
      'inverse ml': 'reverse_ml',
      'inverse machine learning': 'reverse_ml',
      
      'time series': 'time_series',
      'time series analysis': 'time_series',
      'temporal': 'time_series',
      'time based': 'time_series',
      
      'pso': 'pso',
      'particle swarm': 'pso',
      'optimization': 'pso',
      'swarm optimization': 'pso',
      
      'smiles generation': 'smiles_gen',
      'smiles gen': 'smiles_gen',
      'generate smiles': 'smiles_gen',
      'molecular generation': 'smiles_gen',
      
      'smiles to iupac': 'smiles_iupac',
      'smiles iupac': 'smiles_iupac',
      'iupac': 'smiles_iupac',
      'convert to iupac': 'smiles_iupac',
      
      'smiles to sas': 'smiles_sas',
      'smiles sas': 'smiles_sas',
      'sas': 'smiles_sas',
      'convert to sas': 'smiles_sas',
      
      'smiles to dft': 'smiles_dft',
      'smiles dft': 'smiles_dft',
      'dft': 'smiles_dft',
      'convert to dft': 'smiles_dft',
      
      'smiles structure': 'molecular_structure',
      'molecular structure': 'molecular_structure',
      'structure': 'molecular_structure',
      'molecular': 'molecular_structure',
      
      'feature selection': 'feature_selection',
      'select features': 'feature_selection',
      'feature select': 'feature_selection',
      'variable selection': 'feature_selection',
      
      'scaler evaluation': 'scaler_eval',
      'scaler eval': 'scaler_eval',
      'best scaler': 'scaler_eval',
      'scaling': 'scaler_eval',
      'normalization': 'scaler_eval',
      
      // Additional natural language patterns
      'open': 'upload',
      'show me': 'upload',
      'let me see': 'upload',
      'i want to see': 'upload',
      'can you show': 'upload',
      'display data': 'upload',
      'view dataset': 'upload',
      
      'tell me about': 'info',
      'what is in': 'info',
      'describe the data': 'info',
      'data overview': 'info',
      
      'analyze': 'stats',
      'get stats': 'stats',
      'statistical analysis': 'stats',
      'data analysis': 'stats',
      
      'find relationships': 'correlation',
      'correlation matrix': 'correlation',
      'data relationships': 'correlation',
      
      'remove duplicates': 'duplicate',
      'clean data': 'duplicate',
      'data cleaning': 'duplicate',
      
      'group by': 'group',
      'aggregate data': 'group',
      'summarize': 'group',
      
      'create features': 'feature_eng',
      'feature creation': 'feature_eng',
      'data transformation': 'feature_eng',
      
      'build model': 'model_build',
      'train model': 'model_build',
      'machine learning model': 'model_build',
      'predictive model': 'model_build',
      
      'inverse analysis': 'reverse_ml',
      'reverse analysis': 'reverse_ml',
      'backward analysis': 'reverse_ml',
      
      'temporal analysis': 'time_series',
      'time-based analysis': 'time_series',
      'sequence analysis': 'time_series',
      
      'optimize': 'pso',
      'find best': 'pso',
      'optimization algorithm': 'pso',
      
      'generate molecules': 'smiles_gen',
      'create molecules': 'smiles_gen',
      'molecular generation': 'smiles_gen',
      
      'convert molecules': 'smiles_iupac',
      'molecule conversion': 'smiles_iupac',
      'chemical names': 'smiles_iupac',
      
      'molecular analysis': 'molecular_structure',
      'structure analysis': 'molecular_structure',
      'analyze structure': 'molecular_structure',
      
      'select best features': 'feature_selection',
      'feature ranking': 'feature_selection',
      'important features': 'feature_selection',
      
      'data scaling': 'scaler_eval',
      'normalize data': 'scaler_eval',
      'scale data': 'scaler_eval',
      
      // Bar plot operations
      'bar plot': 'bar_plot',
      'barplot': 'bar_plot',
      'bar chart': 'bar_plot',
      'create bar plot': 'bar_plot',
      'generate bar plot': 'bar_plot',
      'make bar chart': 'bar_plot',
      'plot bar': 'bar_plot',
      'bar visualization': 'bar_plot',
      'categorical plot': 'bar_plot',
      
      // Scatter plot operations
      'scatter plot': 'scatter_plot',
      'scatterplot': 'scatter_plot',
      'scatter chart': 'scatter_plot',
      'create scatter plot': 'scatter_plot',
      'generate scatter plot': 'scatter_plot',
      'make scatter chart': 'scatter_plot',
      'plot scatter': 'scatter_plot',
      'scatter visualization': 'scatter_plot',
      
      // Line plot operations
      'line plot': 'line_plot',
      'lineplot': 'line_plot',
      'line chart': 'line_plot',
      'create line plot': 'line_plot',
      'generate line plot': 'line_plot',
      'make line chart': 'line_plot',
      'plot line': 'line_plot',
      'line visualization': 'line_plot',
      
      // Histogram operations
      'histogram': 'histogram',
      'hist': 'histogram',
      'create histogram': 'histogram',
      'generate histogram': 'histogram',
      'make histogram': 'histogram',
      'plot histogram': 'histogram',
      'histogram visualization': 'histogram',
      
      // Box plot operations
      'box plot': 'box_plot',
      'boxplot': 'box_plot',
      'box chart': 'box_plot',
      'create box plot': 'box_plot',
      'generate box plot': 'box_plot',
      'make box chart': 'box_plot',
      'plot box': 'box_plot',
      'box visualization': 'box_plot',
      
      // Pie plot operations
      'pie plot': 'pie_plot',
      'pieplot': 'pie_plot',
      'pie chart': 'pie_plot',
      'create pie plot': 'pie_plot',
      'generate pie plot': 'pie_plot',
      'make pie chart': 'pie_plot',
      'plot pie': 'pie_plot',
      'pie visualization': 'pie_plot',
      
      // Count plot operations
      'count plot': 'count_plot',
      'countplot': 'count_plot',
      'create count plot': 'count_plot',
      'generate count plot': 'count_plot',
      'make count plot': 'count_plot',
      'plot count': 'count_plot',
      'count visualization': 'count_plot',
      
      // Violin plot operations
      'violin plot': 'violin_plot',
      'violinplot': 'violin_plot',
      'create violin plot': 'violin_plot',
      'generate violin plot': 'violin_plot',
      'make violin plot': 'violin_plot',
      'plot violin': 'violin_plot',
      'violin visualization': 'violin_plot',
      
      // Regression plot operations
      'regression plot': 'reg_plot',
      'reg plot': 'reg_plot',
      'regplot': 'reg_plot',
      'create regression plot': 'reg_plot',
      'generate regression plot': 'reg_plot',
      'make regression plot': 'reg_plot',
      'plot regression': 'reg_plot',
      'regression visualization': 'reg_plot',
      
      // Custom plot operations
      'custom plot': 'custom_plot',
      'customplot': 'custom_plot',
      'create custom plot': 'custom_plot',
      'generate custom plot': 'custom_plot',
      'make custom plot': 'custom_plot',
      'plot custom': 'custom_plot',
      'custom visualization': 'custom_plot',
      
      // Venn diagram operations
      'venn diagram': 'venn_diagram',
      'venn': 'venn_diagram',
      'create venn diagram': 'venn_diagram',
      'generate venn diagram': 'venn_diagram',
      'make venn diagram': 'venn_diagram',
      'plot venn': 'venn_diagram',
      'venn visualization': 'venn_diagram'
    };
    
    // Find the best match
    for (const [keyword, functionKey] of Object.entries(keywordMapping)) {
      if (lowerText.includes(keyword)) {
        return functionKey;
      }
    }
    
    return null;
  };

  // Extract available columns from CSV data
  const extractAvailableColumns = (csvData) => {
    if (!csvData || csvData.length === 0) return [];
    return Object.keys(csvData[0] || {});
  };

  // Extract plot parameters from natural language (universal for all plot types)
  const extractPlotParams = (text, plotType) => {
    const lowerText = text.toLowerCase();
    
    // Default parameters
    let params = {
      categorical: [],
      numerical: '',
      x_var: '',
      y_var: '',
      orientation: 'Vertical',
      annotate: false,
      title: '',
      hue: '',
      bins: 10,
      kde: false,
      legend: false,
      label: true,
      percentage: true,
      gap: 0,
      detected: false
    };
    
    // Extract categorical variables (common patterns)
    const categoricalPatterns = [
      /(?:categorical|category|group by|grouped by|by)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /(?:use|with|for)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(?:as|for)\s+(?:category|categorical)/gi,
      /(?:x-axis|x axis|x)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/gi
    ];
    
    // Extract numerical variables
    const numericalPatterns = [
      /(?:numerical|numeric|value|y-axis|y axis|y)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /(?:count|sum|mean|average)\s+(?:of|for)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
    ];
    
    // Extract orientation
    if (lowerText.includes('horizontal')) {
      params.orientation = 'Horizontal';
    }
    
    // Extract annotate
    if (lowerText.includes('annotate') || lowerText.includes('with labels') || lowerText.includes('show values')) {
      params.annotate = true;
    }
    
    // Extract title
    const titleMatch = lowerText.match(/(?:title|named|call it)\s*[:=]\s*["']?([^"']+)["']?/i);
    if (titleMatch) {
      params.title = titleMatch[1].trim();
    }
    
    // Enhanced column extraction - look for specific patterns based on plot type
    if (plotType === 'bar' || plotType === 'count' || plotType === 'pie') {
      // For bar, count, pie plots: categorical + numerical
      const catNumMatch = lowerText.match(/(?:categorical|cat)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[,;]\s*(?:numerical|num)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (catNumMatch) {
        params.categorical = [catNumMatch[1]];
        params.numerical = catNumMatch[2];
        params.detected = true;
        return params;
      }
      
      const andMatch = lowerText.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s+and\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (andMatch) {
        params.categorical = [andMatch[1]];
        params.numerical = andMatch[2];
        params.detected = true;
        return params;
      }
      
      const withMatch = lowerText.match(/with\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[,;]\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (withMatch) {
        params.categorical = [withMatch[1]];
        params.numerical = withMatch[2];
        params.detected = true;
        return params;
      }
    } else if (plotType === 'scatter' || plotType === 'line' || plotType === 'reg') {
      // For scatter, line, regression plots: x_var + y_var
      const xyMatch = lowerText.match(/(?:x|horizontal)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[,;]\s*(?:y|vertical)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (xyMatch) {
        params.x_var = xyMatch[1];
        params.y_var = xyMatch[2];
        params.detected = true;
        return params;
      }
      
      const andMatch = lowerText.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s+and\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (andMatch) {
        params.x_var = andMatch[1];
        params.y_var = andMatch[2];
        params.detected = true;
        return params;
      }
    } else if (plotType === 'histogram' || plotType === 'box' || plotType === 'violin') {
      // For histogram, box, violin plots: numerical variable
      const numMatch = lowerText.match(/(?:numerical|numeric|variable|column)\s*[:=]\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (numMatch) {
        params.numerical = numMatch[1];
        params.detected = true;
        return params;
      }
    }
    
    // Try to extract column names from the text
    const words = text.split(/\s+/);
    const potentialColumns = words.filter(word => 
      word.length > 2 && 
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(word) &&
      !['the', 'and', 'or', 'for', 'with', 'by', 'plot', 'chart', 'bar', 'create', 'generate', 'make', 'show', 'horizontal', 'vertical', 'categorical', 'numerical', 'cat', 'num'].includes(word.toLowerCase())
    );
    
    // If we found potential columns, use them based on plot type
    if (potentialColumns.length >= 2) {
      if (plotType === 'bar' || plotType === 'count' || plotType === 'pie') {
        params.categorical = [potentialColumns[0]];
        params.numerical = potentialColumns[1];
      } else if (plotType === 'scatter' || plotType === 'line' || plotType === 'reg') {
        params.x_var = potentialColumns[0];
        params.y_var = potentialColumns[1];
      } else if (plotType === 'histogram' || plotType === 'box' || plotType === 'violin') {
        params.numerical = potentialColumns[0];
      }
      params.detected = true;
    } else if (potentialColumns.length === 1) {
      // If only one column found, use it appropriately based on plot type
      if (plotType === 'bar' || plotType === 'count' || plotType === 'pie') {
        params.categorical = [potentialColumns[0]];
      } else if (plotType === 'scatter' || plotType === 'line' || plotType === 'reg') {
        params.x_var = potentialColumns[0];
      } else if (plotType === 'histogram' || plotType === 'box' || plotType === 'violin') {
        params.numerical = potentialColumns[0];
      }
      params.detected = false; // Don't auto-generate, need more info
    }
    
    return params;
  };

  // Generate bar plot using the API
  const generateBarPlot = async (params, csvData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${import.meta.env.VITE_APP_API_EDA_BARPLOT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cat: params.categorical.length > 0 ? params.categorical : "-",
            num: params.numerical || "-",
            hue: "-", // Not used in basic bar plot
            orient: params.orientation,
            annote: params.annotate,
            title: params.title || "",
            file: csvData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate bar plot.");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Bar plot generation error:', error);
      throw error;
    }
  };

  // Call Hugging Face API for AI-powered response
  const callHuggingFaceAPI = async (text) => {
    try {
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            max_length: 100,
            temperature: 0.7,
            do_sample: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data[0]?.generated_text || 'I understand you want to work with data. Let me help you!';
    } catch (error) {
      console.error('Hugging Face API error:', error);
      return 'I understand you want to work with data. Let me help you!';
    }
  };

  // Simple CSV parser for small previews (no quotes/escapes handling)
  const parseCsvQuick = (csvText, maxRows = 20) => {
    const lines = csvText.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
      const cols = lines[i].split(',');
      rows.push(cols);
    }
    return { headers, rows };
  };

  // Fetch preview rows from Hugging Face datasets-server (robust attempts)
  const fetchHFIrisPreview = async () => {
    const datasetIds = ['scikit-learn/iris', 'uciml/iris'];
    const splits = ['train', 'test', 'validation'];
    for (const ds of datasetIds) {
      for (const split of splits) {
        const url = `https://datasets-server.huggingface.co/first-rows?dataset=${encodeURIComponent(ds)}&config=default&split=${encodeURIComponent(split)}`;
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const json = await resp.json();
        const features = (json.features || []).map(f => f.name);
        const rows = (json.rows || []).map(r => features.map(h => r.row?.[h]));
        if (features.length && rows.length) {
          return { name: `${ds} (${split})`, headers: features, rows: rows.slice(0, 30) };
        }
      }
    }
    throw new Error('No available split found for Iris dataset');
  };

  const showIrisOptions = () => {
    setShowDatasetOptions(true);
    const botResponse = {
      id: Date.now() + 1,
      text: "I can help with Iris flower classification. Choose a dataset option below.",
      sender: 'bot',
      timestamp: new Date()
    };
    const optionsMsg = {
      id: Date.now() + 2,
      type: 'datasetOptions',
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botResponse, optionsMsg]);
  };

  const pushDatasetPreviewMessage = (name, headers, rows) => {
    const previewMsg = {
      id: Date.now() + 4,
      type: 'datasetPreview',
      sender: 'bot',
      timestamp: new Date(),
      dataset: { name, headers, rows }
    };
    setMessages(prev => [...prev, previewMsg]);
  };

  const handleUseSampleIris = async () => {
    try {
      setIsTyping(true);
      // Generate/fetch dataset preview from HF on each request
      const preview = await fetchHFIrisPreview();
      setDatasetPreview({ name: preview.name, headers: preview.headers, rows: preview.rows });
      setShowDatasetOptions(false);
      const bot = {
        id: Date.now() + 2,
        text: 'Here is a preview of the Iris dataset. You can proceed with your prototype from here.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, bot]);
      pushDatasetPreviewMessage(preview.name, preview.headers, preview.rows);
    } catch (e) {
      console.error(e);
      const bot = {
        id: Date.now() + 3,
        text: 'Failed to fetch the sample Iris dataset from Hugging Face. Please try again or upload your own CSV.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, bot]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleUploadOwnDataset = () => {
    uploadInputRef.current?.click();
  };

  const onUploadFileChosen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const parsed = parseCsvQuick(text, 30);
      setDatasetPreview({ name: file.name, headers: parsed.headers, rows: parsed.rows });
      setShowDatasetOptions(false);
      const bot = {
        id: Date.now() + 1,
        text: 'Your dataset has been loaded into chat. Preview is below.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, bot]);
      pushDatasetPreviewMessage(file.name, parsed.headers, parsed.rows);
    };
    reader.readAsText(file);
  };


  // Function to handle navigation to specific function - works exactly like mouse click
  const navigateToFunction = (functionKey) => {
    console.log('Simulating mouse click for function:', functionKey);
    const functionData = functionMapping[functionKey];
    console.log('Function Data:', functionData);
    
    if (functionData) {
      const { label: functionLabel, nodeId } = functionData;
      console.log('Function Label:', functionLabel, 'Node ID:', nodeId);
      
      console.log('Navigating to dashboard...');
      
      // Navigate to dashboard first
      navigate('/dashboard');
      
      // Wait for navigation to complete, then simulate the exact mouse click
      setTimeout(() => {
        console.log('Simulating mouse click on function tab item:', functionLabel);
        
        // First, expand the InvML section if we're clicking an InvML function
        if (nodeId.startsWith('8-') || nodeId === '7') {
          console.log('Expanding InvML section first...');
          // Find and click the InvML parent node to expand it
          const invmlParent = document.querySelector('[data-nodeid="8"]');
          if (invmlParent) {
            const expandEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            invmlParent.dispatchEvent(expandEvent);
            console.log('InvML section expanded');
          }
        }
        
        // Wait a bit for the expansion to complete, then find the target item
        setTimeout(() => {
          // Check if the function tree is rendered (i.e., if a file is uploaded)
          const functionTree = document.querySelector('[role="tree"]');
          if (!functionTree) {
            console.log('Function tree not rendered - no file uploaded. Using direct dispatch...');
            // If no file is uploaded, the function tree won't be rendered
            // So we'll use direct dispatch instead
            dispatch(setActiveFunction(functionLabel));
            localStorage.setItem('activeFunction', functionLabel);
            console.log('Direct dispatch completed for:', functionLabel);
            return;
          }
          
          // Try to directly trigger the FunctionTab's selection mechanism
          console.log('Attempting direct function selection...');
          
          // Method 1: Try to find and click the MUI TreeView item
          const targetItem = document.querySelector(`[data-nodeid="${nodeId}"]`);
          
          if (targetItem) {
            console.log('Found function tab item by nodeId, trying direct click...');
            // Try multiple click event types
            const clickEvents = [
              new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
              new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }),
              new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })
            ];
            
            clickEvents.forEach(event => {
              targetItem.dispatchEvent(event);
            });
            
            // Also try to trigger the MUI TreeView's internal selection
            const treeView = targetItem.closest('[role="tree"]');
            if (treeView) {
              // Try to trigger MUI TreeView selection
              const selectionEvent = new CustomEvent('selection-change', {
                detail: { nodeId },
                bubbles: true
              });
              treeView.dispatchEvent(selectionEvent);
            }
            
            console.log('Multiple click events dispatched!');
          } else {
            console.log('Function tab item not found by nodeId, using direct Redux dispatch...');
          }
          
          // Method 2: Direct Redux dispatch (this should always work)
          console.log('Using direct Redux dispatch for reliable selection...');
          dispatch(setActiveFunction(functionLabel));
          localStorage.setItem('activeFunction', functionLabel);
          
          // Method 3: Force a re-render by updating the selected state
          setTimeout(() => {
            // Trigger a custom event to force the FunctionTab to update
            window.dispatchEvent(new CustomEvent('forceFunctionSelection', {
              detail: { nodeId, label: functionLabel }
            }));
            console.log('Force selection event dispatched!');
          }, 50);
          
          console.log('Direct dispatch completed for:', functionLabel);
        }, 100); // Small delay for expansion to complete
        
      }, 300); // Initial delay to ensure DOM is ready
      
      // Don't close the chatbot - keep it open for user interaction
    } else {
      console.log('Function data not found for key:', functionKey);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enable drag-to-resize for chat window (top-left handle)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const deltaX = e.clientX - resizeStartRef.current.mouseX;
      const deltaY = e.clientY - resizeStartRef.current.mouseY;
      // Since the panel is anchored to bottom-right, a top-left handle should
      // increase size when dragging up/left (negative delta).
      const nextWidth = Math.min(Math.max(resizeStartRef.current.width - deltaX, 300), 700);
      const nextHeight = Math.min(Math.max(resizeStartRef.current.height - deltaY, 320), 900);
      setChatSize({ width: nextWidth, height: nextHeight });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Monitor data loading state
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      setIsDataLoading(false);
    } else if (activeCsvFile && activeCsvFile.name) {
      setIsDataLoading(true);
    } else {
      setIsDataLoading(false);
    }
  }, [csvData, activeCsvFile]);

  // Function to clear chat history
  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "🤖 Hello! I'm your AI-powered assistant for Matflow. I can understand natural language and automatically navigate to functions for you! Try typing things like:\n\n• 'Show me statistics'\n• 'I want to do correlation analysis'\n• 'Open SMILES generation'\n• 'Display my data'\n• 'Create a bar plot with Species and SepalLengthCm'\n• 'Generate bar chart with horizontal orientation'\n\nJust type your command and I'll help you navigate to the right function or generate plots!",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };


  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // Check for dataset operations
    if (input.includes('dataset') || input.includes('data')) {
      return {
        text: "I can help you with Dataset Operations. Try typing specific commands like 'show statistics', 'correlation analysis', 'find duplicates', or 'group data'."
      };
    }
    
    // Check for InvML operations
    if (input.includes('invml') || input.includes('inverse') || input.includes('ml')) {
      return {
        text: "I can help you with InvML (Inverse Machine Learning) Operations. Try typing commands like 'SMILES generation', 'reverse ML', 'time series analysis', or 'feature selection'."
      };
    }
    
    // Check for help
    if (input.includes('help') || input.includes('options') || input.includes('show')) {
      return {
        text: "I can help you with various operations in Matflow. You can ask me to:\n\n• Show statistics or analyze data\n• Perform correlation analysis\n• Generate SMILES or do molecular analysis\n• Open specific functions by typing their names\n\nJust type what you want to do!"
      };
    }
    
    // Default response
    return {
      text: "I can help you with Dataset Operations and InvML tasks. Try typing specific commands like 'show statistics', 'correlation analysis', 'SMILES generation', or 'reverse ML'."
    };
  };


  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage; // Store the input before clearing
    setInputMessage('');
    setIsTyping(true);

    // Prototype: prioritize Iris classification intent BEFORE any function detection
    const loweredEarly = currentInput.toLowerCase();
    if (
      (loweredEarly.includes('iris') && (loweredEarly.includes('classify') || loweredEarly.includes('classification') || loweredEarly.includes('flower') || loweredEarly.includes('flowers')))
    ) {
      showIrisOptions();
      setIsTyping(false);
      return;
    }

    // AI-powered function detection
    const detectedFunction = detectFunctionFromText(currentInput);
    
    if (detectedFunction) {
      // Function detected - navigate directly to it
      console.log('🤖 AI detected function:', detectedFunction);
      
      const functionData = functionMapping[detectedFunction];
      if (functionData) {
        // Check if it's a plot request
        if (functionData.isPlot) {
          // Get CSV data from Redux store
          const currentCsvData = csvData || [];
          
          // Check if data is available
          if (!currentCsvData || currentCsvData.length === 0) {
            const botResponse = {
              id: Date.now() + 1,
              text: "📊 I'd love to create a bar plot for you! However, I need you to upload a CSV file first. Please go to the Dashboard and upload your data, then come back and ask me to create the bar plot again.\n\n💡 Tip: Make sure to select a file from the File tab on the left sidebar.",
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
            return;
          }
          
          // Check if data is still loading
          if (isDataLoading) {
            const botResponse = {
              id: Date.now() + 1,
              text: "📊 I'm preparing the bar plot interface for you! Please wait a moment while your data finishes loading...",
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
            return;
          }
          
          // Extract available columns and show plot interface
          const columns = extractAvailableColumns(currentCsvData);
          setAvailableColumns(columns);
          setCurrentPlotType(functionData.plotType);
          
          // Try to extract parameters from natural language
          const extractedParams = extractPlotParams(currentInput, functionData.plotType);
          if (extractedParams.detected) {
            setPlotParams(extractedParams);
          }
          
          // Navigate to plot page first
          navigateToFunction(detectedFunction);
          
          // Show the plot interface in chat
          setShowPlotInterface(true);
          
          const botResponse = {
            id: Date.now() + 1,
            text: `📊 Perfect! I've opened the ${functionData.label} page for you and prepared the interface here in chat. I found ${columns.length} columns in your data: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}. You can now select your parameters and generate the plot - it will appear in the main page!`,
            sender: 'bot',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, botResponse]);
          setIsTyping(false);
          return;
        } else {
          // Navigate to the function immediately
          navigateToFunction(detectedFunction);
          
          const botResponse = {
            id: Date.now() + 1,
            text: `🎯 Perfect! I detected you want to use "${functionData.label}". I've opened it for you in the Dashboard. The function should now be selected and highlighted in the sidebar.`,
            sender: 'bot',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, botResponse]);
          setIsTyping(false);
          return;
        }
      }
    }

    // If no function detected, check for prototype Iris classification intent
    const lowered = currentInput.toLowerCase();
    if ((lowered.includes('iris') && (lowered.includes('classify') || lowered.includes('classification') || lowered.includes('flowers') || lowered.includes('flower'))) || lowered.includes('classify flowers from iris')) {
      showIrisOptions();
      setIsTyping(false);
      return;
    }

    // If still nothing special, use AI-powered response
    try {
      const aiResponse = await callHuggingFaceAPI(currentInput);
      
      const botResponse = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('AI response error:', error);
      
      // Fallback to basic response
      const response = generateBotResponse(currentInput);
      const botResponse = {
        id: Date.now() + 1,
        text: response.text || 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }
    
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle plot parameter changes
  const handlePlotParamChange = (param, value) => {
    setPlotParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // Handle categorical column selection
  const handleCategoricalChange = (column, checked) => {
    setPlotParams(prev => ({
      ...prev,
      categorical: checked 
        ? [...prev.categorical, column]
        : prev.categorical.filter(col => col !== column)
    }));
  };

  // Generate plot from interface
  const handleGeneratePlot = async () => {
    try {
      setIsTyping(true);
      
      // Validate parameters based on plot type
      let validationError = '';
      
      if (currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'pie') {
        if (plotParams.categorical.length === 0) {
          validationError = 'Please select at least one categorical variable (X-axis) before generating the plot.';
        } else if (!plotParams.numerical) {
          validationError = 'Please select a numerical variable (Y-axis) before generating the plot.';
        }
      } else if (currentPlotType === 'scatter' || currentPlotType === 'line' || currentPlotType === 'reg') {
        if (!plotParams.x_var) {
          validationError = 'Please select an X-axis variable before generating the plot.';
        } else if (!plotParams.y_var) {
          validationError = 'Please select a Y-axis variable before generating the plot.';
        }
      } else if (currentPlotType === 'histogram' || currentPlotType === 'box' || currentPlotType === 'violin') {
        if (!plotParams.numerical) {
          validationError = 'Please select a numerical variable before generating the plot.';
        }
      }
      
      if (validationError) {
        const botResponse = {
          id: Date.now() + 1,
          text: `❌ ${validationError}`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
        return;
      }
      
      // Send the parameters to the main plot component via custom event
      const eventName = `chatbotGenerate${currentPlotType.charAt(0).toUpperCase() + currentPlotType.slice(1)}Plot`;
      
      console.log('🤖 Sending plot parameters:', plotParams);
      console.log('🤖 Plot type:', currentPlotType);
      console.log('🤖 Event name:', eventName);
      
      // Dispatch custom event to trigger plot generation
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: plotParams
      }));
      
      const botResponse = {
        id: Date.now() + 1,
        text: `📊 Perfect! I've sent your parameters to the ${currentPlotType.charAt(0).toUpperCase() + currentPlotType.slice(1)} Plot page. The plot should now be generating in the main area!

The plot will appear in the main page area!`,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Plot generation error:', error);
      const botResponse = {
        id: Date.now() + 1,
        text: `❌ Sorry, I encountered an error while generating your plot: ${error.message}. Please check your parameters and try again.`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Close plot interface
  const closePlotInterface = () => {
    setShowPlotInterface(false);
    setPlotResult(null);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-5 right-5 bg-primary-btn hover:bg-primary-btn-hover text-white rounded-full w-10 h-10 shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${
          isOpen ? 'scale-110' : 'scale-100'
        }`}
        title="Chat with Matflow Assistant"
      >
        {isOpen ? <FiMinimize2 size={20} /> : (
          <span style={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>M</span>
        )}
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-5 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col"
          style={{ width: `${chatSize.width}px`, height: `${chatSize.height}px` }}
        >
          {/* Chat Header */}
          <div className="bg-primary-btn text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-extrabold">M</div>
              <div>
                <h3 className="font-semibold">Matflow Assistant</h3>
                <p className="text-xs text-white opacity-80">Powered by Matflow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-white hover:opacity-80 transition-opacity p-1 rounded hover:bg-white hover:bg-opacity-20"
                title="Clear chat history"
              >
                <FiTrash2 size={16} />
              </button>
              <button
                onClick={toggleChat}
                className="text-white hover:opacity-80 transition-opacity"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>
          {/* Dataset options for prototype (also shown inside messages area when triggered) */}
          {showDatasetOptions && (
            <div className="p-4 border-t border-gray-200">
              <p className="text-sm text-gray-700 mb-2">Choose how to get a dataset:</p>
              <div className="flex gap-2">
                <button
                  onClick={handleUploadOwnDataset}
                  className="flex-1 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 py-2 px-3 rounded-lg transition-colors"
                >Upload my CSV</button>
                <button
                  onClick={handleUseSampleIris}
                  className="flex-1 bg-primary-btn hover:bg-primary-btn-hover text-white py-2 px-3 rounded-lg transition-colors"
                >Use sample Iris (HF)</button>
              </div>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onUploadFileChosen}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-w-0">
            {messages.filter(message => message && message.sender).map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'datasetOptions' ? (
                    <div className="bg-white text-gray-800 rounded-lg rounded-bl-none border border-gray-200 px-3 py-2">
                      <p className="text-sm mb-2">Choose how to get a dataset:</p>
                      <div className="flex gap-2">
                        <button onClick={handleUploadOwnDataset} className="flex-1 bg-white border border-gray-300 hover:border-gray-400 text-gray-800 py-2 px-3 rounded-lg transition-colors">Upload my CSV</button>
                        <button onClick={handleUseSampleIris} className="flex-1 bg-primary-btn hover:bg-primary-btn-hover text-white py-2 px-3 rounded-lg transition-colors">Use sample Iris (HF)</button>
                      </div>
                    </div>
                  ) : message.type === 'datasetPreview' ? (
                    <div className="bg-white text-gray-800 rounded-lg rounded-bl-none border border-gray-200 px-3 py-2 w-full min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Dataset: {message.dataset?.name}</p>
                        <button
                          onClick={() => { setModalDataset(message.dataset || { name: '', headers: [], rows: [] }); setShowDatasetModal(true); }}
                          className="text-xs bg-primary-btn hover:bg-primary-btn-hover text-white px-2 py-1 rounded"
                        >View larger</button>
                      </div>
                      <div className="border border-gray-200 rounded overflow-auto" style={{ maxHeight: 240 }}>
                        <table className="w-full text-xs table-auto">
                          <thead>
                            <tr>
                              {(message.dataset?.headers || []).map((h, i) => (
                                <th key={i} className="px-2 py-1 text-left border-b border-gray-200 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(message.dataset?.rows || []).map((row, r) => (
                              <tr key={r} className={r % 2 ? 'bg-white' : 'bg-gray-100'}>
                                {(message.dataset?.headers || []).map((_, c) => (
                                  <td key={c} className="px-2 py-1 border-b border-gray-200 whitespace-nowrap">{row[c]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] min-w-0 px-3 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary-btn text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-white opacity-80' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  )}
                </div>
                
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-lg rounded-bl-none border border-gray-200 px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
            
            {/* Universal Plot Interface */}
            {showPlotInterface && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">📊 {currentPlotType.charAt(0).toUpperCase() + currentPlotType.slice(1)} Plot Generator</h4>
                  <button
                    onClick={closePlotInterface}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Categorical Variables - for bar, count, pie plots */}
                  {(currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'pie') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categorical Variables (X-axis)
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {availableColumns.map((column) => (
                          <label key={column} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={plotParams.categorical.includes(column)}
                              onChange={(e) => handleCategoricalChange(column, e.target.checked)}
                              className="rounded border-gray-300 text-primary-btn focus:ring-primary-btn"
                            />
                            <span className="text-sm text-gray-700">{column}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* X Variable - for scatter, line, reg plots */}
                  {(currentPlotType === 'scatter' || currentPlotType === 'line' || currentPlotType === 'reg') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        X-axis Variable
                      </label>
                      <select
                        value={plotParams.x_var}
                        onChange={(e) => handlePlotParamChange('x_var', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-btn"
                      >
                        <option value="">Select X-axis column</option>
                        {availableColumns.map((column) => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Y Variable - for scatter, line, reg plots */}
                  {(currentPlotType === 'scatter' || currentPlotType === 'line' || currentPlotType === 'reg') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Y-axis Variable
                      </label>
                      <select
                        value={plotParams.y_var}
                        onChange={(e) => handlePlotParamChange('y_var', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-btn"
                      >
                        <option value="">Select Y-axis column</option>
                        {availableColumns.map((column) => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Numerical Variable - for bar, count, pie, histogram, box, violin plots */}
                  {(currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'pie' || 
                    currentPlotType === 'histogram' || currentPlotType === 'box' || currentPlotType === 'violin') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'pie' 
                          ? 'Numerical Variable (Y-axis)' 
                          : 'Numerical Variable'}
                      </label>
                      <select
                        value={plotParams.numerical}
                        onChange={(e) => handlePlotParamChange('numerical', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-btn"
                      >
                        <option value="">Select a numerical column</option>
                        {availableColumns.map((column) => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Orientation - for applicable plots */}
                  {(currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'histogram' || 
                    currentPlotType === 'box' || currentPlotType === 'violin') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Orientation
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="Vertical"
                            checked={plotParams.orientation === 'Vertical'}
                            onChange={(e) => handlePlotParamChange('orientation', e.target.value)}
                            className="text-primary-btn focus:ring-primary-btn"
                          />
                          <span className="text-sm text-gray-700">Vertical</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="Horizontal"
                            checked={plotParams.orientation === 'Horizontal'}
                            onChange={(e) => handlePlotParamChange('orientation', e.target.value)}
                            className="text-primary-btn focus:ring-primary-btn"
                          />
                          <span className="text-sm text-gray-700">Horizontal</span>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Annotate - for bar, count plots */}
                  {(currentPlotType === 'bar' || currentPlotType === 'count') && (
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={plotParams.annotate}
                          onChange={(e) => handlePlotParamChange('annotate', e.target.checked)}
                          className="rounded border-gray-300 text-primary-btn focus:ring-primary-btn"
                        />
                        <span className="text-sm font-medium text-gray-700">Show values on bars</span>
                      </label>
                    </div>
                  )}
                  
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plot Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={plotParams.title}
                      onChange={(e) => handlePlotParamChange('title', e.target.value)}
                      placeholder="Enter plot title"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-btn"
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <div className="flex space-x-2">
                    <button
                      onClick={handleGeneratePlot}
                      disabled={
                        (currentPlotType === 'bar' || currentPlotType === 'count' || currentPlotType === 'pie') 
                          ? (plotParams.categorical.length === 0 || !plotParams.numerical)
                        : (currentPlotType === 'scatter' || currentPlotType === 'line' || currentPlotType === 'reg')
                          ? (!plotParams.x_var || !plotParams.y_var)
                        : (currentPlotType === 'histogram' || currentPlotType === 'box' || currentPlotType === 'violin')
                          ? !plotParams.numerical
                          : false
                      }
                      className="flex-1 bg-primary-btn hover:bg-primary-btn-hover disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <FiSend className="mr-2" size={16} />
                      Generate Plot
                    </button>
                  </div>
                  
                  {/* Plot Result */}
                  {plotResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">Generated Plot:</h5>
                      <div className="text-sm text-gray-600">
                        <p>✅ Plot generated successfully!</p>
                        {plotParams.categorical.length > 0 && <p>• Categorical: {plotParams.categorical.join(', ')}</p>}
                        {plotParams.numerical && <p>• Numerical: {plotParams.numerical}</p>}
                        {plotParams.x_var && <p>• X-axis: {plotParams.x_var}</p>}
                        {plotParams.y_var && <p>• Y-axis: {plotParams.y_var}</p>}
                        <p>• Orientation: {plotParams.orientation}</p>
                        <p>• Annotate: {plotParams.annotate ? 'Yes' : 'No'}</p>
                        {plotParams.title && <p>• Title: {plotParams.title}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                rows="1"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-primary-btn hover:bg-primary-btn-hover disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <FiSend size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
          {/* Removed secondary preview to avoid duplicate table */}
          {/* Resize handle - top-left */}
          <div
            onMouseDown={(e) => {
              isResizingRef.current = true;
              resizeStartRef.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                width: chatSize.width,
                height: chatSize.height
              };
            }}
            title="Drag to resize"
            style={{ position: 'absolute', left: 2, top: 2, width: 16, height: 16, cursor: 'nwse-resize' }}
            className="bg-transparent"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M1 1 L15 15" stroke="#cbd5e1" strokeWidth="2"/>
              <path d="M1 5 L11 15" stroke="#cbd5e1" strokeWidth="2"/>
              <path d="M1 9 L7 15" stroke="#cbd5e1" strokeWidth="2"/>
            </svg>
          </div>
        </div>
      )}
      {showDatasetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-5xl w-[90%] max-h-[80%] flex flex-col">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Dataset: {modalDataset.name}</h4>
              <button onClick={() => setShowDatasetModal(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>
            <div className="p-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {(modalDataset.headers || []).map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(modalDataset.rows || []).map((row, r) => (
                    <tr key={r} className={r % 2 ? 'bg-white' : 'bg-gray-100'}>
                      {(modalDataset.headers || []).map((_, c) => (
                        <td key={c} className="px-3 py-2 border-b border-gray-200 whitespace-nowrap">{row[c]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
