import { NextUIProvider, createTheme } from "@nextui-org/react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import App from "./App.jsx";
import "./index.css";
import store from "./store.js";
import 'react-toastify/dist/ReactToastify.css';
const theme = createTheme({
  type: "light",
  theme: {
    colors: {
      success: "#208059",
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <NextUIProvider theme={theme}>
        <App />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </NextUIProvider>
    </BrowserRouter>
  </Provider>
  // </React.StrictMode>
);
