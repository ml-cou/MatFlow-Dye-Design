import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./FunctionBased/Components/Navbar/Navbar";

function Layout() {

  

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default Layout;
