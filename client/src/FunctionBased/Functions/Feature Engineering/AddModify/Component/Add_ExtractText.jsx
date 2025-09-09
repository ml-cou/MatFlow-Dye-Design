import { Textarea } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setData } from "../../../../../Slices/FeatureEngineeringSlice";
import SingleDropDown from "../../../../Components/SingleDropDown/SingleDropDown";

function Add_ExtractText({
  csvData,
  type = "function",
  nodeId,
  rflow = undefined,
}) {
  const data = useSelector((state) => state.featureEngineering.data);
  const stringColumns = Object.keys(csvData[0]).filter(
    (val) => typeof csvData[0][val] === "string"
  );
  const [regex, setRegex] = useState("");
  const [extract_from, setExtract_from] = useState("");
  const dispatch = useDispatch();
  let nodeDetails = {};
  if (rflow) {
    nodeDetails = rflow.getNode(nodeId);
  }

  useEffect(() => {
    if (nodeDetails && type === 'node') {
      let data = nodeDetails.data;
      if (data && data.addModify && data.addModify.method === "Extract Text") {
        data = data.addModify.data;
        setRegex(data.regex || "");
        setExtract_from(data.extract_from || "");
      }
    }
  }, [nodeDetails]);

  useEffect(() => {
    dispatch(setData({ ...data, regex, extract_from }));
  }, [regex, extract_from, dispatch]);

  return (
    <div className={`flex gap-8 mb-10 ${type === "node" && "flex-col"}`}>
      <div className="basis-3/4">
        <Textarea
          label="Regex Pattern"
          helperText="Example: ([A-Za-z]+)\."
          fullWidth
          value={regex}
          onChange={(e) => {
            setRegex(e.target.value);
          }}
          minRows={6}
        />
      </div>
      <div className="basis-1/4">
        <p>Extract From</p>
        <SingleDropDown
          columnNames={stringColumns}
          onValueChange={setExtract_from}
          initValue={extract_from}
        />
      </div>
    </div>
  );
}

export default Add_ExtractText;
