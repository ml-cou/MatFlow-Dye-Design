import { Loading } from '@nextui-org/react';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import LayoutSelector from '../../Components/LayoutSelector/LayoutSelector';

function VennDiagram({ csvData }) {
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const [columnOptions, setColumnOptions] = useState([]);

  // State for feature groups with editable short names and display names
  const [featureGroups, setFeatureGroups] = useState([
    {
      pattern: 'Bond Chain-',
      method: 'starts_with',
      shortName: 'C',
      displayName: 'Bond Chain Related Features',
    },
    {
      pattern: 'Rdkit Descriptor',
      method: 'starts_with',
      shortName: 'G',
      displayName: 'RDKit Global Descriptors',
    },
    {
      pattern: 'Rdkit Descriptor Fr',
      method: 'starts_with',
      shortName: 'F',
      displayName: 'RDKit Functional Group Descriptors',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plotlyData, setPlotlyData] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    if (activeCsvFile && csvData.length > 0) {
      const firstRow = csvData[0];
      const cols = Object.keys(firstRow);
      setColumnOptions(cols);
      console.log('Columns detected:', cols);
    }
  }, [csvData, activeCsvFile]);

  const updateFeatureGroup = (index, field, value) => {
    const newGroups = [...featureGroups];
    newGroups[index][field] = value;
    setFeatureGroups(newGroups);
  };

  const handleGenerate = async () => {
    // Validate that we have proper configuration
    const hasEmptyFields = featureGroups.some(
      (group) => !group.pattern || !group.shortName || !group.displayName
    );

    if (hasEmptyFields) {
      setError(
        'Please fill in all pattern, short name, and display name fields.'
      );
      return;
    }

    setLoading(true);
    setError('');
    setPlotlyData([]);
    setStatistics(null);

    try {
      const apiUrl =
        import.meta.env.VITE_APP_API_URL || 'http://127.0.0.1:8000';
      const endpoint =
        import.meta.env.VITE_APP_API_EDA_VENNDIAGRAM ||
        '/api/eda/venn-diagram/';
      const fullUrl = `${apiUrl}${endpoint}`;

      const payload = {
        file: csvData,
        feature_groups: featureGroups.map((group) => ({
          pattern: group.pattern,
          method: group.method,
          short_name: group.shortName,
          display_name: group.displayName,
        })),
      };

      console.log('Making request to:', fullUrl);
      console.log('Request payload:', payload);

      const resp = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        console.error('API Error:', errorData);
        throw new Error(
          errorData.error || `HTTP ${resp.status}: ${resp.statusText}`
        );
      }

      const data = await resp.json();
      console.log('API Response:', data);
      setPlotlyData(data.plotly || []);
      setStatistics(data.statistics || null);
    } catch (err) {
      console.error('Request failed:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-center gap-8 mt-8">
        {/* Feature Groups Configuration */}
        <div className="w-full col-span-full">
          <p className="text-lg font-medium tracking-wide mb-4">
            Feature Groups Configuration
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featureGroups.map((group, index) => (
              <div
                key={index}
                className="space-y-4 p-4 bg-gray-50 rounded-lg border"
              >
                <h3 className="text-md font-semibold text-gray-700">
                  Group {index + 1}
                </h3>

                {/* Pattern */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Column Pattern
                  </label>
                  <input
                    type="text"
                    value={group.pattern}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'pattern', e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Bond Chain"
                  />
                </div>

                {/* Method */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Matching Method
                  </label>
                  <select
                    value={group.method}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'method', e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="starts_with">Starts with</option>
                    <option value="ends_with">Ends with</option>
                    <option value="contains">Contains</option>
                    <option value="exact_match">Exact match</option>
                  </select>
                </div>

                {/* Short Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Short Name (for diagram)
                  </label>
                  <input
                    type="text"
                    value={group.shortName}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'shortName', e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., C"
                    maxLength={3}
                  />
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Display Name (for legend)
                  </label>
                  <input
                    type="text"
                    value={group.displayName}
                    onChange={(e) =>
                      updateFeatureGroup(index, 'displayName', e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Bond Chain Related Features"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="flex justify-end mt-4 my-12">
        <button
          className="border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2"
          onClick={handleGenerate}
          disabled={loading}
        >
          Generate
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Feature Analysis Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">
                Total Features in Dataset: {statistics.total_features}
              </h4>
              <ul className="space-y-1">
                {Object.entries(statistics.feature_counts).map(
                  ([key, value]) => (
                    <li key={key} className="text-sm">
                      <strong>{key}:</strong> {value} features
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Overlaps:</h4>
              <ul className="space-y-1">
                {Object.entries(statistics.overlaps).map(([key, value]) => (
                  <li key={key} className="text-sm">
                    <strong>{key}:</strong> {value} features
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      {plotlyData.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="w-full max-w-4xl">
            <LayoutSelector plotlyData={plotlyData} />
          </div>
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="grid place-content-center mt-12 w-full h-full">
          <Loading color="success" size="xl">
            Generating Venn Diagram...
          </Loading>
        </div>
      )}

      {/* Error */}
      {error && <div className="mt-4 text-red-500 text-center">{error}</div>}
    </div>
  );
}

export default VennDiagram;
