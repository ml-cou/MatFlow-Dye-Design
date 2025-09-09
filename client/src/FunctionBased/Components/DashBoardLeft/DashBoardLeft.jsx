import React, { useEffect, useState } from "react";
import { AiOutlineDoubleLeft } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { setShowLeftSideBar } from "../../../Slices/SideBarSlice";
import FileTab from "../FileTab/FileTab";
import FunctionTab from "../FunctionTab/FunctionTab";

function DashBoardLeft() {
  const showLeftSideBar = useSelector((state) => state.sideBar.showLeftSideBar);
  const [currentTab, setCurrentTab] = useState("file");
  const dispatch = useDispatch();
  const activeFile = useSelector((state) => state.uploadedFile.activeFile);

  const handleClick = (name) => {
    if (name === "function" && (!activeFile || !activeFile.name)) {
      return;
    }
    setCurrentTab(name);
    localStorage.setItem("currentTab", name);
  };

  useEffect(() => {
    const storedCurrentTab = localStorage.getItem("currentTab");
    if (storedCurrentTab) setCurrentTab(storedCurrentTab);
  }, []);

  return (
    <div
      className={`bg-[#06603b] w-64 min-w-max h-full relative ${
        showLeftSideBar ? "flex" : "hidden"
      } flex-shrink-0`}
    >
      <div className="w-full h-full flex flex-col">
        <div
          className="absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2 bg-emerald-100 shadow-md rounded-full justify-end p-2"
          onClick={() => dispatch(setShowLeftSideBar(false))}
        >
          <AiOutlineDoubleLeft
            size={"20"}
            className=" cursor-pointer text-black"
          />
        </div>
        <div className="flex font-roboto gap-2 border-b text-gray-300 border-[rgba(255,255,255,0.5)] shadow-sm">
          <button
            className={`py-3 w-full ${
              currentTab === "file" ? "text-[whitesmoke] font-bold" : ""
            } border-b border-transparent  outline-none hover:text-white hover:border-white`}
            onClick={() => handleClick("file")}
          >
            File
          </button>
          <button
            className={`py-3 w-full ${
              currentTab === "function" ? "text-[whitesmoke] font-bold" : ""
            } border-b border-transparent  outline-none hover:text-white hover:border-white`}
            onClick={() => handleClick("function")}
          >
            Functions
          </button>
        </div>
        {currentTab === "file" ? <FileTab /> : <FunctionTab />}
      </div>
    </div>
  );
}

export default DashBoardLeft;
