import { Input, Modal } from "@nextui-org/react";
import React, { useState } from "react";
import AgGridComponent from "../../Components/AgGridComponent/AgGridComponent";
import MultipleDropDown from "../../Components/MultipleDropDown/MultipleDropDown";
import Docs from "../../../Docs/Docs";

function ReverseML({ csvData }) {
  const allColumnName = Object.keys(csvData[0]);
  const [allTargetColumn, setAllTargetColumn] = useState(
    Object.keys(csvData[0])
  );
  const [selectFeature, setSelectFeature] = useState();
  const [targetVariable, setTargetVariable] = useState();
  const [enterValues, setEnterValues] = useState("");
  const [mlData, setMlData] = useState();
  const [columnDef, setColumnDef] = useState();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  const handleSelectFeature = (e) => {
    setSelectFeature(e);
    const ache = new Set(e);
    const temp = [];
    allColumnName.forEach((val) => {
      if (!ache.has(val)) temp.push(val);
    });
    setAllTargetColumn(temp);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_REVERSEML
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: csvData,
            "Select Feature": selectFeature,
            "Select Target Variable": targetVariable,
            "Enter Values": enterValues,
          }),
        }
      );
      const data = await res.json();
      setMlData(data);
      const temp = Object.keys(data[0]).map((val) => ({
        headerName: val,
        key: val,
        valueGetter: (params) => {
          return params.data[val];
        },
      }));
      setColumnDef(temp);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="my-8">
      <div>
        <p>Select Features</p>
        <MultipleDropDown
          columnNames={allColumnName}
          setSelectedColumns={(e) => handleSelectFeature(e)}
        />
      </div>
      <div className="mt-4">
        <p>Select Target Variables</p>
        <MultipleDropDown
          columnNames={allTargetColumn}
          setSelectedColumns={setTargetVariable}
        />
      </div>

      <div className="mt-8">
        <h1 className="font-medium text-3xl mb-4">
          Prediction for All Target Variables
        </h1>
        <Input
          label={`Enter values for ${
            targetVariable && targetVariable.length > 0
              ? JSON.stringify(targetVariable)
              : ""
          }`}
          fullWidth
          size="lg"
          value={enterValues}
          onChange={(e) => setEnterValues(e.target.value)}
        />
        <button
          className="self-start border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2 mt-4"
          onClick={handleSave}
        >
          Predict
        </button>

        {columnDef && (
          <div className="mt-4">
            <div
              className="ag-theme-alpine"
              style={{ height: "200px", width: "100%" }}
            >
              <AgGridComponent
                rowData={mlData}
                columnDefs={columnDef}
                rowHeight={30}
                headerHeight={30}
                paginationPageSize={4}
              />
            </div>
          </div>
        )}
      </div>

      {/* DOCS */}
      <button
        className="fixed bottom-5 right-5 bg-primary-btn text-2xl font-black text-white rounded-full p-4 py-2 shadow-lg"
        onClick={openModal}
      >
        ?
      </button>
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
          <Docs section={"reverseML"} />
        </div>
      </Modal>
    </div>
  );
}

export default ReverseML;
