import { Checkbox, Input, Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setFile } from "../../../../Slices/FeatureEngineeringSlice";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import Docs from "../../../../Docs/Docs";

function ChangeDType({ csvData }) {
  const dispatch = useDispatch();
  const featureData = useSelector((state) => state.featureEngineering);
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);

  const [numberOfColumns, setNumberOfColumns] = useState(1);
  const [columnNames, setColumnNames] = useState();
  const [data, setdata] = useState([
    {
      column_name: "",
      desired_dtype: "int",
      desired_bit_length: "8",
    },
  ]);
  const render = useSelector((state) => state.uploadedFile.rerender);

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    if (activeCsvFile && activeCsvFile.name) {
      const getData = async () => {
        setColumnNames(Object.keys(csvData[0]));
        dispatch(setFile(csvData));
      };

      getData();
    }
  }, [activeCsvFile, dispatch, csvData]);

  const handleChange = (val, index, key) => {
    const temp = data.map((d, ind) => {
      if (ind === index) return { ...d, [key]: val };
      return d;
    });
    setdata(temp);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_CHANGE_DTYPE
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number_of_columns: numberOfColumns,
            data,
            file: csvData,
          }),
        }
      );
      let Data = await res.json();

      let fileName = activeCsvFile.name;

      // const uploadedFiles = JSON.parse(localStorage.getItem("uploadedFiles"));
      // const fileExist = uploadedFiles.filter((val) => val.name === fileName);

      // if (fileExist.length === 0) {
      //   uploadedFiles.push({ name: fileName });
      // }
      // localStorage.setItem("uploadedFiles", JSON.stringify(uploadedFiles));

      const temp = await fetchDataFromIndexedDB(fileName);
      await updateDataInIndexedDB(fileName, Data);

      toast.success(`Data updated successfully!`, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      dispatch(setReRender(!render));
    } catch (error) {
      toast.error("Something went wrong. Please try again", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  return (
    <div className="my-8">
      <div className="flex gap-4 max-w-3xl items-center">
        <div className="basis-2/3">
          <Input
            label="Number of columns"
            value={numberOfColumns}
            onChange={(e) => {
              const val = e.target.value;
              setNumberOfColumns(val);
              if (val < data.length) setdata(data.slice(0, val));
              else {
                const temp = JSON.parse(JSON.stringify(data));
                while (val - temp.length > 0) {
                  temp.push({
                    column_name: "",
                    desired_dtype: "int",
                    desired_bit_length: "8",
                  });
                }
                setdata(temp);
              }
            }}
            type="number"
            step={1}
            fullWidth
          />
        </div>
        <div className="basis-1/3">
          <Checkbox color="success">Add to pipeline</Checkbox>
        </div>
      </div>
      <div className="mt-8">
        {csvData &&
          columnNames &&
          data.map((val, index) => {
            return (
              <div key={index} className="flex items-end gap-8 mt-6">
                <div className="w-full">
                  <p>Column {index + 1}</p>
                  <SingleDropDown
                    columnNames={columnNames}
                    onValueChange={(e) => handleChange(e, index, "column_name")}
                  />
                </div>

                <div className="flex w-full flex-col gap-1">
                  <label htmlFor="">Desired Dtype</label>
                  <select
                    className="p-2 py-3 rounded-xl"
                    name=""
                    id=""
                    value={val.desired_dtype}
                    onChange={(e) =>
                      handleChange(e.target.value, index, "desired_dtype")
                    }
                  >
                    <option value="int">int</option>
                    <option value="float">float</option>
                    <option value="complex">complex</option>
                    <option value="str">str</option>
                  </select>
                </div>
                <div className="flex w-full flex-col gap-1">
                  <label htmlFor="">Desired Bit Length</label>
                  <select
                    className="p-2 py-3 rounded-xl"
                    name=""
                    id=""
                    value={val.desired_bit_length}
                    onChange={(e) =>
                      handleChange(e.target.value, index, "desired_bit_length")
                    }
                  >
                    <option value="8">8</option>
                    <option value="16">16</option>
                    <option value="32">32</option>
                    <option value="64">64</option>
                    <option value="128">128</option>
                    <option value="256">256</option>
                  </select>
                </div>
              </div>
            );
          })}
      </div>
      <button
        className="self-start mt-12 border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2"
        onClick={handleSave}
      >
        Submit
      </button>

      {/* DOCS */}
      <button
        className="fixed bottom-20 right-5 bg-primary-btn text-xl font-bold text-white rounded-full w-10 h-10 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
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
          <Docs section={"changeDtype"} />
        </div>
      </Modal>
    </div>
  );
}

export default ChangeDType;
