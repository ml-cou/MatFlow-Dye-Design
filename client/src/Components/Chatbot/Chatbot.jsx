import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiMinimize2, FiDatabase, FiCpu, FiBarChart, FiSettings, FiUpload, FiFileText, FiTrash2 } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveFunction } from '../../Slices/SideBarSlice';

const Chatbot = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant for Matflow. I can help you with dataset operations and InvML (Inverse Machine Learning) tasks. What would you like to do today?",
      sender: 'bot',
      timestamp: new Date(),
      options: [
        { type: 'dataset', label: 'Dataset Operations', icon: 'FiDatabase', description: 'Upload, analyze, and process datasets' },
        { type: 'invml', label: 'InvML Operations', icon: 'FiCpu', description: 'Inverse ML and molecular analysis' },
        { type: 'help', label: 'Show All Options', icon: 'FiSettings', description: 'View all available features' }
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
    'scaler_eval': { label: 'Best Scaler', nodeId: '8-9' }
  };

  // Feature definitions
  const datasetFeatures = [
    { key: 'upload', label: 'Display Dataset', icon: 'FiUpload', description: 'View and manage uploaded datasets' },
    { key: 'info', label: 'Dataset Information', icon: 'FiFileText', description: 'View dataset overview and structure' },
    { key: 'stats', label: 'Statistics', icon: 'FiBarChart', description: 'Generate statistical summary of your data' },
    { key: 'correlation', label: 'Correlation Analysis', icon: 'FiBarChart', description: 'Analyze relationships between variables' },
    { key: 'duplicate', label: 'Find Duplicates', icon: 'FiFileText', description: 'Identify and handle duplicate records' },
    { key: 'group', label: 'Group Operations', icon: 'FiDatabase', description: 'Group and aggregate data' },
    { key: 'feature_eng', label: 'Feature Engineering', icon: 'FiSettings', description: 'Transform and create new features' },
    { key: 'model_build', label: 'Model Building', icon: 'FiCpu', description: 'Build and train machine learning models' }
  ];

  const invmlFeatures = [
    { key: 'reverse_ml', label: 'ReverseML', icon: 'FiCpu', description: 'Inverse machine learning operations' },
    { key: 'time_series', label: 'Time Series Analysis', icon: 'FiBarChart', description: 'Analyze time-based data patterns' },
    { key: 'pso', label: 'PSO', icon: 'FiSettings', description: 'Particle Swarm Optimization' },
    { key: 'smiles_gen', label: 'SMILES Generation', icon: 'FiCpu', description: 'Generate molecular SMILES strings' },
    { key: 'smiles_iupac', label: 'SMILES to IUPAC', icon: 'FiFileText', description: 'Convert SMILES to IUPAC names' },
    { key: 'smiles_sas', label: 'SMILES to SAS', icon: 'FiFileText', description: 'Convert SMILES to SAS format' },
    { key: 'smiles_dft', label: 'SMILES to DFT', icon: 'FiCpu', description: 'Convert SMILES to DFT calculations' },
    { key: 'molecular_structure', label: 'SMILES Structure', icon: 'FiDatabase', description: 'Analyze molecular structures' },
    { key: 'feature_selection', label: 'Feature Selection', icon: 'FiSettings', description: 'Select optimal features for models' },
    { key: 'scaler_eval', label: 'Best Scaler', icon: 'FiBarChart', description: 'Evaluate different scaling methods' }
  ];

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
      
      // Close the chatbot
      setIsOpen(false);
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

  // Function to clear chat history
  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI assistant for Matflow. I can help you with dataset operations and InvML (Inverse Machine Learning) tasks. What would you like to do today?",
        sender: 'bot',
        timestamp: new Date(),
        options: [
          { type: 'dataset', label: 'Dataset Operations', icon: 'FiDatabase', description: 'Upload, analyze, and process datasets' },
          { type: 'invml', label: 'InvML Operations', icon: 'FiCpu', description: 'Inverse ML and molecular analysis' },
          { type: 'help', label: 'Show All Options', icon: 'FiSettings', description: 'View all available features' }
        ]
      }
    ]);
  };

  const getIconComponent = (iconName) => {
    const icons = {
      FiDatabase, FiCpu, FiBarChart, FiSettings, FiUpload, FiFileText
    };
    return icons[iconName] || FiFileText;
  };

  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // Check for dataset operations
    if (input.includes('dataset') || input.includes('data')) {
      return {
        text: "Here are the available Dataset Operations. Click on any option to get started:",
        options: datasetFeatures.map(feature => ({
          type: 'feature',
          featureType: 'dataset',
          key: feature.key,
          label: feature.label,
          icon: feature.icon,
          description: feature.description
        }))
      };
    }
    
    // Check for InvML operations
    if (input.includes('invml') || input.includes('inverse') || input.includes('ml')) {
      return {
        text: "Here are the available InvML (Inverse Machine Learning) Operations. Click on any option to get started:",
        options: invmlFeatures.map(feature => ({
          type: 'feature',
          featureType: 'invml',
          key: feature.key,
          label: feature.label,
          icon: feature.icon,
          description: feature.description
        }))
      };
    }
    
    // Check for help
    if (input.includes('help') || input.includes('options') || input.includes('show')) {
      return {
        text: "I can help you with various operations in Matflow. Here are the main categories:",
        options: [
          { type: 'dataset', label: 'Dataset Operations', icon: 'FiDatabase', description: 'Upload, analyze, and process datasets' },
          { type: 'invml', label: 'InvML Operations', icon: 'FiCpu', description: 'Inverse ML and molecular analysis' }
        ]
      };
    }
    
    // Default response
    return {
      text: "I can help you with Dataset Operations and InvML tasks. Try asking about 'dataset operations' or 'invml operations', or click the options below:",
      options: [
        { type: 'dataset', label: 'Dataset Operations', icon: 'FiDatabase' },
        { type: 'invml', label: 'InvML Operations', icon: 'FiCpu' }
      ]
    };
  };

  const handleOptionClick = (option) => {
    console.log('Option clicked:', option);
    if (!option || !option.label) {
      console.log('Invalid option:', option);
      return;
    }
    
    const userMessage = {
      id: Date.now(),
      text: `I want to use: ${option.label}`,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      let botResponse;
      
      if (option.type === 'dataset') {
        botResponse = {
          id: Date.now() + 1,
          text: "Here are the available Dataset Operations. Click on any option to get started:",
          sender: 'bot',
          timestamp: new Date(),
          options: datasetFeatures.map(feature => ({
            type: 'feature',
            featureType: 'dataset',
            key: feature.key,
            label: feature.label,
            icon: feature.icon,
            description: feature.description
          }))
        };
      } else if (option.type === 'invml') {
        botResponse = {
          id: Date.now() + 1,
          text: "Here are the available InvML (Inverse Machine Learning) Operations. Click on any option to get started:",
          sender: 'bot',
          timestamp: new Date(),
          options: invmlFeatures.map(feature => ({
            type: 'feature',
            featureType: 'invml',
            key: feature.key,
            label: feature.label,
            icon: feature.icon,
            description: feature.description
          }))
        };
      } else if (option.type === 'feature') {
        console.log('Feature option clicked:', option);
        // Navigate to the specific function
        navigateToFunction(option.key);
        
        botResponse = {
          id: Date.now() + 1,
          text: `✅ Success! I've opened "${option.label}" in the Dashboard. The function should now be selected and highlighted in the left sidebar. Note: For InvML functions to work properly, you may need to upload a dataset first.`,
          sender: 'bot',
          timestamp: new Date(),
          options: [
            { type: 'dataset', label: 'More Dataset Operations', icon: 'FiDatabase' },
            { type: 'invml', label: 'More InvML Operations', icon: 'FiCpu' },
            { type: 'help', label: 'Show All Options', icon: 'FiSettings' }
          ]
        };
      } else {
        // Default response for unknown option types
        botResponse = {
          id: Date.now() + 1,
          text: "I'm not sure how to handle that option. Please try selecting from the available options.",
          sender: 'bot',
          timestamp: new Date(),
          options: [
            { type: 'dataset', label: 'Dataset Operations', icon: 'FiDatabase' },
            { type: 'invml', label: 'InvML Operations', icon: 'FiCpu' }
          ]
        };
      }
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
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

    // Generate intelligent response
    setTimeout(() => {
      const response = generateBotResponse(currentInput);
      const botResponse = {
        id: Date.now() + 1,
        text: response.text || 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        options: response.options || []
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
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

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-5 right-5 bg-primary-btn hover:bg-primary-btn-hover text-white rounded-full w-10 h-10 shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${
          isOpen ? 'scale-110' : 'scale-100'
        }`}
        title="Chat with AI Assistant"
      >
        {isOpen ? <FiMinimize2 size={20} /> : <FiMessageCircle size={20} />}
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Chat Header */}
          <div className="bg-primary-btn text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiMessageCircle size={16} />
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
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

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.filter(message => message && message.sender).map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
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
                </div>
                
                {/* Options for bot messages */}
                {message.sender === 'bot' && message.options && (
                  <div className="mt-2 space-y-2">
                    {message.options.map((option, index) => {
                      const IconComponent = getIconComponent(option.icon);
                      return (
                        <button
                          key={index}
                          onClick={() => handleOptionClick(option)}
                          className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent size={16} className="text-blue-600 group-hover:text-blue-700" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 group-hover:text-blue-800">{option.label}</p>
                              {option.description && (
                                <p className="text-xs text-gray-600 mt-1 group-hover:text-blue-600">{option.description}</p>
                              )}
                              {option.type === 'feature' && (
                                <p className="text-xs text-green-600 mt-1 font-medium">→ Click to open in Dashboard</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
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
        </div>
      )}
    </>
  );
};

export default Chatbot;
