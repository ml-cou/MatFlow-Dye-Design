import React, { useEffect, useState } from 'react';
import { AiOutlineLineChart } from 'react-icons/ai';
import { HiOutlineDocumentReport, HiOutlinePuzzle } from 'react-icons/hi';
import { MdOutlineDataset } from 'react-icons/md';
import { RiFlowChart } from 'react-icons/ri';
import { RxGear, RxRocket } from 'react-icons/rx';
import { SlMagnifier } from 'react-icons/sl';
import { TbBrain } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveFunction } from '../../../Slices/SideBarSlice';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { styled } from '@mui/material';
import { PiGraph } from 'react-icons/pi';

const StyledTreeItem = styled(TreeItem)(({ theme }) => ({
  color: '#FFFFFF',
  '& .MuiTreeItem-content': {
    // backgroundColor: '#097045',
    '&.Mui-expanded': {
      borderLeft: '4px solid #FFFFFF',
    },
    '&.Mui-selected': {
      backgroundColor: '#0A864B',
      color: '#FFFFFF',
      '&:hover': {
        backgroundColor: '#0A864B',
      },
    },
    '&.Mui-focused': {
      backgroundColor: '#0A864B',
      color: '#FFFFFF',
    },
    '&:hover': {
      backgroundColor: '#097045',
    },
  },
  '& .MuiTreeItem-label': {
    color: 'inherit',
    margin: '5px 0',
  },
}));

// Updated tree data structure with 'id' instead of 'key' for MUI X Tree View
const functionTreeData = [
  {
    id: '0',
    label: 'Dataset',
    icon: <MdOutlineDataset size={'20'} />,
    children: [
      {
        id: '0-0',
        label: 'Display',
      },
      {
        id: '0-1',
        label: 'Information',
      },
      {
        id: '0-2',
        label: 'Statistics',
      },
      {
        id: '0-3',
        label: 'Corelation',
      },
      {
        id: '0-4',
        label: 'Duplicate',
      },
      {
        id: '0-5',
        label: 'Group',
      },
    ],
  },
  {
    id: '1',
    label: 'EDA',
    icon: <SlMagnifier size={'20'} />,
    children: [
      {
        id: '1-0',
        label: 'Bar Plot',
      },
      {
        id: '1-1',
        label: 'Pie Plot',
      },
      {
        id: '1-3',
        label: 'Histogram',
      },
      {
        id: '1-4',
        label: 'Box Plot',
      },
      {
        id: '1-5',
        label: 'Violin Plot',
      },
      {
        id: '1-6',
        label: 'Scatter Plot',
      },
      {
        id: '1-7',
        label: 'Reg Plot',
      },
      {
        id: '1-8',
        label: 'Line Plot',
      },
      {
        id: '1-9',
        label: 'Venn Diagram',
      },
    ],
  },
  {
    id: '2',
    label: 'Feature Engineering',
    icon: <RxGear size={'20'} />,
    children: [
      {
        id: '2-0',
        label: 'Add/Modify',
      },
      {
        id: '2-1',
        label: 'Change Dtype',
      },
      {
        id: '2-2',
        label: 'Alter Field Name',
      },
      {
        id: '2-3',
        label: 'Imputation',
      },
      {
        id: '2-4',
        label: 'Encoding',
      },
      {
        id: '2-5',
        label: 'Scaling',
      },
      {
        id: '2-6',
        label: 'Drop Column',
      },
      {
        id: '2-7',
        label: 'Drop Rows',
      },
      {
        id: '2-8',
        label: 'Merge Dataset',
      },
      {
        id: '2-9',
        label: 'Append Dataset',
      },
      {
        id: '2-10',
        label: 'Cluster',
      },
    ],
  },
  {
    id: '3',
    label: 'Final Dataset',
    icon: <HiOutlineDocumentReport size={'20'} />,
    children: [],
  },
  {
    id: '4',
    label: 'Pipeline',
    icon: <RiFlowChart size={'20'} />,
    children: [],
  },
  {
    id: '5',
    label: 'Model Building',
    icon: <TbBrain size={'20'} />,
    children: [
      {
        id: '5-0',
        label: 'Split Dataset',
      },
      {
        id: '5-1',
        label: 'Build Model',
      },
      {
        id: '5-2',
        label: 'Model Evaluation',
      },
      {
        id: '5-3',
        label: 'Model Prediction',
      },
      {
        id: '5-4',
        label: 'Models',
      },
    ],
  },
  {
    id: '6',
    label: 'Model Deployment',
    icon: <RxRocket size={'20'} />,
    children: [],
  },
  {
    id: '7',
    label: 'Time Series Analysis',
    icon: <AiOutlineLineChart size={'20'} />,
    children: [],
  },
  {
    id: '8',
    label: 'InvML',
    icon: <HiOutlinePuzzle size={'20'} />,
    children: [
      {
        id: '8-1',
        label: 'ReverseML',
      },
      {
        id: '8-2',
        label: 'PSO',
      },
      {
        id: '8-3',
        label: 'Feature Selection',
      },
      {
        id: '8-4',
        label: 'SMILES Generation',
      },
      {
        id: '8-5',
        label: 'SMILES to IUPAC',
      },
      {
        id: '8-6',
        label: 'SMILES to Synthetic Score',
      },
      {
        id: '8-7',
        label: 'SMILES to DFT',
      },
      {
        id: '8-8',
        label: 'SMILES Structure',
      },
      {
        id: '8-9',
        label: 'Best Scaler',
      },
    ],
  },
];

function FunctionTab() {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    const storedActiveLeaf = localStorage.getItem('activeFunction');
    if (storedActiveLeaf) {
      setSelected(storedActiveLeaf);
      dispatch(setActiveFunction(storedActiveLeaf));
    }
    const storedExpanded =
      JSON.parse(localStorage.getItem('expandedNodes')) || [];
    // Ensure storedExpanded is always an array
    const safeExpanded = Array.isArray(storedExpanded) ? storedExpanded : [];
    setExpanded(safeExpanded);
  }, [dispatch]);

  // Listen for custom events from chatbot
  useEffect(() => {
    const handleFunctionSelected = (event) => {
      const { functionId, expandedNodes } = event.detail;
      console.log('FunctionTab received function selection:', functionId);
      setSelected(functionId);
      dispatch(setActiveFunction(functionId));
      setExpanded(expandedNodes);
    };

    const handleForceFunctionSelection = (event) => {
      const { nodeId, label } = event.detail;
      console.log('FunctionTab received force selection:', nodeId, label);
      setSelected(nodeId);
      dispatch(setActiveFunction(label));
      localStorage.setItem('activeFunction', label);
    };

    window.addEventListener('functionSelected', handleFunctionSelected);
    window.addEventListener('forceFunctionSelection', handleForceFunctionSelection);
    return () => {
      window.removeEventListener('functionSelected', handleFunctionSelected);
      window.removeEventListener('forceFunctionSelection', handleForceFunctionSelection);
    };
  }, [dispatch]);

  // Fixed event handlers with correct MUI X Tree View API
  const handleToggle = (event, nodeIds) => {
    // Ensure nodeIds is always an array
    const normalizedNodeIds = Array.isArray(nodeIds)
      ? nodeIds
      : nodeIds
      ? [nodeIds]
      : [];
    setExpanded(normalizedNodeIds);
    localStorage.setItem('expandedNodes', JSON.stringify(normalizedNodeIds));
  };

  const handleSelect = (event, nodeIds) => {
    // nodeIds is an array in the new API
    if (!nodeIds || nodeIds.length === 0) return;
    const nodeId = nodeIds[0]; // Take the first selected item
    setSelected(nodeId);
    dispatch(setActiveFunction(nodeId));
    localStorage.setItem('activeFunction', nodeId);
  };

  // Function to get the label from nodeId for dispatching
  const getLabelFromNodeId = (nodeId) => {
    const findNode = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) return node.label;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    return findNode(functionTreeData, nodeId);
  };

  const handleItemClick = (event, nodeId) => {
    const label = getLabelFromNodeId(nodeId);
    if (label) {
      setSelected(nodeId);
      dispatch(setActiveFunction(label));
      localStorage.setItem('activeFunction', label);
    }
  };

  const renderTree = (nodes) => (
    <StyledTreeItem
      key={nodes.id}
      nodeId={nodes.id}
      label={
        <div className="flex items-center">
          {nodes.icon && <span className="mr-2">{nodes.icon}</span>}
          <span className="tracking-wider capitalize">{nodes.label}</span>
        </div>
      }
      onClick={(event) => handleItemClick(event, nodes.id)}
      sx={{
        backgroundColor: selected === nodes.id ? '#0A864B' : 'transparent',
      }}
    >
      {Array.isArray(nodes.children)
        ? nodes.children.map((node) => renderTree(node))
        : null}
    </StyledTreeItem>
  );

  return (
    <div className="overflow-y-auto mt-4">
      {activeCsvFile ? (
        <SimpleTreeView
          className="text-gray-200"
          expanded={expanded}
          onExpansionChange={handleToggle}
          slots={{
            collapseIcon: ChevronRightIcon,
            expandIcon: ExpandMoreIcon,
          }}
        >
          {functionTreeData.map((node) => renderTree(node))}
        </SimpleTreeView>
      ) : (
        <p className="mt-4 p-2 text-center text-white tracking-wide font-bold text-lg">
          Please select a file to <br /> view the functions.
        </p>
      )}
    </div>
  );
}

export default FunctionTab;
