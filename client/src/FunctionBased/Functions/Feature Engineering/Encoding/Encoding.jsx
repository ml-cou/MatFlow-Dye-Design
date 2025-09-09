import { Checkbox, Modal } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setReRender } from "../../../../Slices/UploadedFileSlice";
import {
  fetchDataFromIndexedDB,
  updateDataInIndexedDB,
} from "../../../../util/indexDB";
import MultipleDropDown from "../../../Components/MultipleDropDown/MultipleDropDown";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import Docs from "../../../../Docs/Docs";

const Method = ["Ordinal Encoding", "One-Hot Encoding", "Target Encoding"];

function Encoding({
  csvData,
  type = "function",
  onValueChange = undefined,
  initValue = undefined,
}) {
  const allStringColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "string"
  );
  const allNumberColumn = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "number"
  );
  const [stringColumn, setStringColumn] = useState(allStringColumn[0]);
  const [method, setMethod] = useState(Method[0]);
  const [add_to_pipeline, setAddToPipeline] = useState(false);
  let temp = csvData.map((val) => val[stringColumn]);
  temp = new Set(temp);
  temp = [...temp];
  const [stringValues, setStringValues] = useState(temp);
  const [data, setData] = useState({});
  const activeCsvFile = useSelector((state) => state.uploadedFile.activeFile);
  const render = useSelector((state) => state.uploadedFile.rerender);
  const dispatch = useDispatch();

  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  useEffect(() => {
    if (type === "node" && initValue) {
      setStringColumn(initValue.select_column || allStringColumn[0]);
      setMethod(initValue.method || Method[0]);
      setData(initValue.data || {});
    }
  }, []);

  useEffect(() => {
    if (type === "node") {
      onValueChange({
        select_column: stringColumn,
        method,
        data,
      });
    }
  }, [stringColumn, method, data]);

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}${
          import.meta.env.VITE_APP_API_ENCODING
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            select_column: stringColumn,
            method,
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
    <div className="mt-8">
      <div
        className={`flex items-center gap-8 ${type === "node" && "flex-col"}`}
      >
        <div className="w-full">
          <p>Select Column</p>
          <SingleDropDown
            initValue={stringColumn}
            columnNames={allStringColumn}
            onValueChange={(e) => {
              setStringColumn(e);
              if (method === Method[0]) {
                let temp = csvData.map((val) => val[e]);
                temp = new Set(temp);
                temp = [...temp];
                setStringValues(temp);
              }
            }}
          />
        </div>
        <div className="w-full">
          <p>Select Method</p>
          <SingleDropDown
            columnNames={Method}
            initValue={method}
            onValueChange={(val) => {
              setMethod(val);
              setData({});
              if (val === Method[0]) {
                let temp = csvData.map((val) => val[stringColumn]);
                temp = new Set(temp);
                temp = [...temp];
                setStringValues(temp);
              }
            }}
          />
        </div>
        {type === "function" && (
          <Checkbox
            color="success"
            className="w-full"
            onChange={(e) => setAddToPipeline(e.valueOf())}
          >
            Add To Pipeline
          </Checkbox>
        )}
      </div>

      {method === "Ordinal Encoding" && (
        <div className="mt-8">
          <div className="flex items-center gap-12">
            <Checkbox
              size={type === "node" ? "sm" : "md"}
              color="success"
              isSelected={data.start_from_0}
              onChange={(e) => setData({ ...data, start_from_0: e.valueOf() })}
            >
              Start from 0
            </Checkbox>
            <Checkbox
              size={type === "node" ? "sm" : "md"}
              color="success"
              isSelected={data.include_nan}
              onChange={(e) => setData({ ...data, include_nan: e.valueOf() })}
            >
              Include NaN
            </Checkbox>
            <Checkbox
              size={type === "node" ? "sm" : "md"}
              color="success"
              isSelected={data.sort_values}
              onChange={(e) => setData({ ...data, sort_values: e.valueOf() })}
            >
              Sort Values
            </Checkbox>
          </div>
          {stringValues && (
            <div className="mt-4">
              <p>Set Value Order</p>
              <MultipleDropDown
                columnNames={stringValues}
                setSelectedColumns={(val) =>
                  setData({ ...data, set_value_order: val })
                }
                defaultValue={data.set_value_order || []}
              />
            </div>
          )}
        </div>
      )}

      {method === "One-Hot Encoding" && (
        <div className="mt-4">
          <Checkbox
            size={type === "node" ? "sm" : "md"}
            color="success"
            className="mt-4"
            isSelected={data.drop_first}
            onChange={(e) => setData({ ...data, drop_first: e.valueOf() })}
          >
            Drop First
          </Checkbox>
        </div>
      )}

      {method === "Target Encoding" && (
        <div className="mt-4">
          <p>Select Target</p>
          <SingleDropDown
            columnNames={allNumberColumn}
            onValueChange={(val) => setData({ ...data, select_target: val })}
            initValue={data.select_target}
          />
        </div>
      )}

      {type === "function" && (
        <button
          className="self-start border-2 px-6 tracking-wider bg-primary-btn text-white font-medium rounded-md py-2 mt-8"
          onClick={handleSave}
        >
          Submit
        </button>
      )}

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
          <Docs section={"encoding"} />
        </div>
      </Modal>
    </div>
  );
}

export default Encoding;
