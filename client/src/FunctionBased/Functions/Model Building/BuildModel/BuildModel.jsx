import {Input, Modal} from "@nextui-org/react";
import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {ToastContainer, toast} from "react-toastify";
import {
    setHyperparameterData,
    setModelSetting,
    setReg,
    setTargetVariable,
    setType,
} from "../../../../Slices/ModelBuilding";
import {
    fetchDataFromIndexedDB,
    updateDataInIndexedDB,
} from "../../../../util/indexDB";
import SingleDropDown from "../../../Components/SingleDropDown/SingleDropDown";
import DecisionTreeClassification from "./components/Categorical/DecisionTreeClassification";
import KNearestNeighbour from "./components/Categorical/KNearestNeighbour";
import LogisticRegression from "./components/Categorical/LogisticRegression";
import MultilayerPerceptron from "./components/Categorical/MultilayerPerceptron";
import RandomForestClassification from "./components/Categorical/RandomForestClassification";
import SupportVectorMachine from "./components/Categorical/SupportVectorMachine";
import DecisionTreeRegression from "./components/Continuous/DecisionTreeRegression";
import LassoRegression from "./components/Continuous/LassoRegression";
import LinearRegression from "./components/Continuous/LinearRegression";
import RandomForestRegression from "./components/Continuous/RandomForestRegression";
import RidgeRegression from "./components/Continuous/RidgeRegression";
import SupportVectorRegressor from "./components/Continuous/SupportVectorRegressor";
import {ReadFile} from "../../../../util/utils";
import Docs from "../../../../Docs/Docs";

const REGRESSOR = [
    "Linear Regression",
    "Ridge Regression",
    "Lasso Regression",
    "Decision Tree Regression",
    "Random Forest Regression",
    "Support Vector Regressor",
];

const CLASSIFIER = [
    "K-Nearest Neighbors",
    "Support Vector Machine",
    "Logistic Regression",
    "Decision Tree Classification",
    "Random Forest Classification",
    "Multilayer Perceptron",
];

function BuildModel({
                        csvData,
                        nodeData = undefined,
                        type = "function",
                        initValue = undefined,
                        onValueChange = undefined,
                    }) {
    // const [regressor, setRegressor] = useState(Regressor[0]);
    const [allRegressor, setAllRegressor] = useState();
    const [regressor, setRegressor] = useState();
    const [allDatasetName, setAllDatasetName] = useState([]);
    const [loading, setLoading] = useState(false);
    const [whatKind, setWhatKind] = useState();
    const dispatch = useDispatch();
    const [train, setTrain] = useState();
    const [test, setTest] = useState();
    const [model_name, setModelName] = useState("");
    const [current_dataset, setCurrentDataset] = useState();
    const model_setting = useSelector(
        (state) => state.modelBuilding.model_setting
    );
    const Type = useSelector((state) => state.modelBuilding.type);
    const target_variable = useSelector(
        (state) => state.modelBuilding.target_variable
    );
    const reg = useSelector((state) => state.modelBuilding.regressor);
    const [nicherData, setNicherData] = useState();

    const [visible, setVisible] = useState(false);

    const openModal = () => setVisible(true);
    const closeModal = () => setVisible(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            let tempDatasets = await fetchDataFromIndexedDB("splitted_dataset");
            tempDatasets = tempDatasets.map((val) => Object.keys(val)[0]);
            setAllDatasetName(tempDatasets);
            setLoading(false);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (type === "node" && nodeData) {
            setWhatKind(nodeData.whatKind);
            if (nodeData.whatKind === "Continuous") {
                setAllRegressor(REGRESSOR);
                setRegressor(nodeData.regressor || REGRESSOR[0]);
                dispatch(setReg(nodeData.regressor || REGRESSOR[0]));
                dispatch(setType("regressor"));
                setModelName(nodeData.model_name || "LR_Regression");
            } else {
                setAllRegressor(CLASSIFIER);
                setRegressor(nodeData.regressor || CLASSIFIER[0]);
                dispatch(setReg(nodeData.regressor || CLASSIFIER[0]));
                dispatch(setType("classifier"));
                setModelName(nodeData.model_name || "KNN_Classification");
            }
            dispatch(setTargetVariable(nodeData.target_variable));
            dispatch(setHyperparameterData({}));
            dispatch(setModelSetting({}));
            setNicherData("");
            setTrain(nodeData.train);
            setTest(nodeData.test);
        }
    }, [nodeData]);

    const handleDatasetChange = async (e) => {
        try {
            setTrain(null);
            setTest(null);
            setAllRegressor(null);
            setCurrentDataset(null);

            let tempDatasets = await fetchDataFromIndexedDB("splitted_dataset");
            for (const val of tempDatasets) {
                if (e === Object.keys(val)[0]) {
                    setCurrentDataset(e);
                    setWhatKind(val[e][0]);

                    // Show loading message
                    const loadingToast = toast.info("Loading dataset, please wait...", {
                        position: "bottom-right",
                        autoClose: false,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: false,
                        progress: undefined,
                        theme: "colored",
                    });

                    try {
                        // Attempt to read files
                        const trainData = await ReadFile({
                            foldername: val[e][5],
                            filename: val[e][1] + ".csv",
                        });
                        const testData = await ReadFile({
                            foldername: val[e][5],
                            filename: val[e][2] + ".csv",
                        });

                        // Dismiss loading toast
                        toast.dismiss(loadingToast);

                        // Check if data was loaded successfully
                        if (!testData || !trainData || !testData.length || !trainData.length) {
                            toast.warn("Failed to load train/test data. Please split your dataset properly.", {
                                position: "bottom-right",
                                autoClose: false,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: "colored",
                            });
                            return; // Exit early
                        }

                        // If we get here, both datasets loaded successfully
                        // Set the model type based on whatKind
                        if (val[e][0] === "Continuous") {
                            setAllRegressor(REGRESSOR);
                            setRegressor(REGRESSOR[0]);
                            dispatch(setReg(REGRESSOR[0]));
                            dispatch(setType("regressor"));
                            setModelName("LR_Regression");
                        } else {
                            setAllRegressor(CLASSIFIER);
                            setRegressor(CLASSIFIER[0]);
                            dispatch(setReg(CLASSIFIER[0]));
                            dispatch(setType("classifier"));
                            setModelName("KNN_Classification");
                        }
                        dispatch(setTargetVariable(val[e][3]));
                        dispatch(setHyperparameterData({}));
                        dispatch(setModelSetting({}));
                        setNicherData("");

                        // Finally set the data
                        setTrain(trainData);
                        setTest(testData);

                        // Verify the target variable exists in the data
                        const targetExists = trainData.length > 0 && val[e][3] in trainData[0];
                        if (!targetExists) {
                            toast.warn(`Target variable '${val[e][3]}' not found in train data. Please check your dataset.`, {
                                position: "bottom-right",
                                autoClose: false,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: "colored",
                            });
                        }
                    } catch (fileErr) {
                        // Dismiss loading toast
                        toast.dismiss(loadingToast);

                        toast.error(`Error loading datasets: ${fileErr.message}`, {
                            position: "bottom-right",
                            autoClose: false,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: "colored",
                        });
                    }

                    // We found the matching dataset, so we can break the loop
                    break;
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(`Error: ${error.message}`, {
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
    const handleSave = async () => {
        try {
            // Validate that train and test data are available
            if (!train || !test || train.length === 0 || test.length === 0) {
                throw new Error("Train or test data is missing. Please select a properly split dataset first.");
            }

            // Check if target variable exists in the data
            if (!target_variable || !csvData.some(row => target_variable in row)) {
                throw new Error(`Target variable '${target_variable}' not found in dataset. Please choose a valid target.`);
            }

            // Model name validation
            let tempModel = await fetchDataFromIndexedDB("models");
            tempModel.forEach((val) => {
                if (current_dataset === Object.keys(val)[0]) {
                    if (val[current_dataset] && val[current_dataset][model_name]) {
                        throw new Error("Model name already exists! Please choose a different name.");
                    }
                }
            });

            // Show loading state
            const loadingToast = toast.info("Building model, please wait...", {
                position: "bottom-right",
                autoClose: false,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
                theme: "colored",
            });

            const res = await fetch(
                `${import.meta.env.VITE_APP_API_URL}${
                    import.meta.env.VITE_APP_API_BUILD_MODEL
                }`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        test,
                        train,
                        target_var: target_variable,
                        type: Type,
                        [Type === "regressor" ? "regressor" : "classifier"]: reg,
                        ...model_setting,
                        file: csvData,
                    }),
                }
            );

            // Close the loading toast
            toast.dismiss(loadingToast);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to build model. Server returned an error.");
            }

            const data = await res.json();

            setNicherData(data.metrics);

            let allModels = await fetchDataFromIndexedDB("models");
            const ind = allModels.findIndex((obj) => current_dataset in obj);

            if (ind !== -1) {
                allModels[ind][current_dataset] = {
                    ...allModels[ind][current_dataset],
                    [model_name]: {
                        metrics: data.metrics,
                        metrics_table: data.metrics_table,
                        y_pred: JSON.parse(data.y_pred),
                        type: Type,
                        regressor,
                        model_deploy: data.model_deploy,
                    },
                };
            } else {
                allModels.push({
                    [current_dataset]: {
                        [model_name]: {
                            metrics: data.metrics,
                            metrics_table: data.metrics_table,
                            y_pred: JSON.parse(data.y_pred),
                            type: Type,
                            regressor,
                            model_deploy: data.model_deploy,
                        },
                    },
                });
            }
            await updateDataInIndexedDB("models", allModels);

            toast.success("Model Built Successfully!", {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });
        } catch (error) {
            // Display a more user-friendly error message
            const errorMessage = error.message || "An unknown error occurred";
            toast.error(errorMessage, {
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
    useEffect(() => {
        if (whatKind === "Continuous") {
            if (regressor === REGRESSOR[0]) setModelName("LR_Regression");
            if (regressor === REGRESSOR[1]) setModelName("Ridge_Regression");
            if (regressor === REGRESSOR[2]) setModelName("Lasso_Regression");
            if (regressor === REGRESSOR[3]) setModelName("DT_Regression");
            if (regressor === REGRESSOR[4]) setModelName("RF_Classification");
            if (regressor === REGRESSOR[5]) setModelName("svr_Regression");
        } else {
            if (regressor === CLASSIFIER[0]) setModelName("KNN_Classification");
            if (regressor === CLASSIFIER[1]) setModelName("SVM_Classification");
            if (regressor === CLASSIFIER[2]) setModelName("LR_Classification");
            if (regressor === CLASSIFIER[3]) setModelName("DT_Classification");
            if (regressor === CLASSIFIER[4]) setModelName("RF_Classification");
            if (regressor === CLASSIFIER[5]) setModelName("MLP_Classification");
        }
    }, [whatKind, regressor]);

    if (loading) return <div>Loading...</div>;
    if (allDatasetName.length === 0 && type === "function")
        return (
            <div className="my-8">
                <h1 className="text-2xl font-medium">Split a dataset to continue</h1>
            </div>
        );

    return (
        <div className="my-2">
            <ToastContainer
                position="top-right"
                autoClose={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                theme="light"
            />
            {type === "function" && (
                <div>
                    <p>Select Train Test Dataset</p>
                    <SingleDropDown
                        columnNames={allDatasetName}
                        onValueChange={(e) => handleDatasetChange(e)}
                    />
                </div>
            )}
            {allRegressor && (
                <>
                    {type === "function" && (
                        <div
                            className={`flex flex-col sm:flex-row items-center gap-4 mt-4 ${
                                type === "node" && "flex-col !gap-2"
                            }`}
                        >
                            <div className="w-full">
                                <p className="text-sm font-medium mb-1">{whatKind === "Continuous" ? "Regressor" : "Classifier"}</p>
                                <SingleDropDown
                                    columnNames={allRegressor}
                                    onValueChange={(e) => {
                                        setRegressor(e);
                                        dispatch(setReg(e));
                                        dispatch(setHyperparameterData({}));
                                        dispatch(setModelSetting({}));
                                        setNicherData("");
                                    }}
                                    initValue={allRegressor[0]}
                                />
                            </div>
                            <div className="w-full">
                                <Input
                                    fullWidth
                                    label="Model Name"
                                    size="md"
                                    value={model_name}
                                    onChange={(e) => setModelName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Regressor (for Numerical Column) */}

                    {whatKind && whatKind === "Continuous" ? (
                        <div className={`${type === "function" && "mt-6"}`}>
                            {regressor === REGRESSOR[0] && (
                                <LinearRegression
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                            {regressor === REGRESSOR[1] && (
                                <RidgeRegression
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                            {regressor === REGRESSOR[2] && (
                                <LassoRegression
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                            {regressor === REGRESSOR[3] && (
                                <DecisionTreeRegression
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                            {regressor === REGRESSOR[4] && (
                                <RandomForestRegression
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                            {regressor === REGRESSOR[5] && (
                                <SupportVectorRegressor
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                        </div>
                    ) : (
                        <div className={`${type === "function" && "mt-6"}`}>
                            {regressor === CLASSIFIER[0] && (
                                <KNearestNeighbour
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                            {regressor === CLASSIFIER[1] && (
                                <SupportVectorMachine
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                            {regressor === CLASSIFIER[2] && (
                                <LogisticRegression
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                            {regressor === CLASSIFIER[3] && (
                                <DecisionTreeClassification
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                            {regressor === CLASSIFIER[4] && (
                                <RandomForestClassification
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                            {regressor === CLASSIFIER[5] && (
                                <MultilayerPerceptron
                                    train={train}
                                    test={test}
                                    Type={type}
                                    initValue={initValue}
                                    onValueChange={onValueChange}
                                />
                            )}
                        </div>
                    )}

                    {type === "function" && (
                        <>
                            <button
                                className={`self-start border-2 px-4 tracking-wider ${
                                    !train || !test || train.length === 0 || test.length === 0
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-primary-btn cursor-pointer"
                                } text-white font-medium rounded-md py-1.5 mt-4`}
                                onClick={handleSave}
                                disabled={!train || !test || train.length === 0 || test.length === 0}
                            >
                                Submit
                            </button>
                            {nicherData && (
                                <div className="mt-3">
                                    <h2 className="text-lg font-semibold mb-2">
                                        Model Performance Metrics
                                    </h2>
                                    <table className="min-w-full bg-white text-sm">
                                        <thead>
                                        <tr>
                                            <th className="py-1 px-3 border-b-2 border-gray-200 text-left leading-tight">
                                                Metric
                                            </th>
                                            <th className="py-1 px-3 border-b-2 border-gray-200 text-left leading-tight">
                                                Value
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {Object.entries(nicherData).map(([key, value]) => (
                                            <tr key={key}>
                                                <td className="py-1 px-3 border-b border-gray-200">
                                                    {key}
                                                </td>
                                                <td className="py-1 px-3 border-b border-gray-200">
                                                    {typeof value === "number"
                                                        ? value.toFixed(4)
                                                        : value}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

                  {/* DOCS */}
      <button
        className="fixed bottom-16 right-4 bg-primary-btn text-lg font-bold text-white rounded-full w-8 h-8 shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center"
        onClick={openModal}
      >
        ?
      </button>
            <Modal
                open={visible}
                onClose={closeModal}
                aria-labelledby="help-modal"
                aria-describedby="help-modal-description"
                width="600px"
                scroll
                closeButton
            >
                <div className="bg-white text-left rounded-lg shadow-lg px-4 py-2 overflow-auto max-h-[80vh]">
                    <Docs section={"buildModel"}/>
                </div>
            </Modal>
        </div>
    );
}

export default BuildModel;
