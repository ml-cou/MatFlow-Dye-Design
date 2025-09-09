import base64
import io
import json
import joblib

import pandas as pd
from django.http import JsonResponse
from ..regressor import svr
from ...modules.utils import split_xy
from ...modules.regressor import linear_regression, ridge_regression, lasso_regression, decision_tree_regression, random_forest_regression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error


def regression(file):
    dataset=pd.DataFrame(file.get("file"))
    train_data = pd.DataFrame(file.get("train"))
    test_data = pd.DataFrame(file.get("test"))
    target_var = file.get("target_var")
    X_train, y_train = split_xy(train_data, target_var)
    X_test, y_test = split_xy(test_data, target_var)

    try:
        X_train, X_test = X_train.drop(target_var, axis=1), X_test.drop(target_var, axis=1)
    except:
        pass

    regressors = {
        "Linear Regression": "LR",
        "Ridge Regression": "Ridge",
        "Lasso Regression": "Lasso",
        "Decision Tree Regression": "DT",
        "Random Forest Regression": "RF"
    }
    print(f"reg e ={X_train.columns}")
    metrics= ["R-Squared", "Mean Absolute Error", "Mean Squared Error", "Root Mean Squared Error"]
    regressor = file.get("regressor")
    if regressor == "Linear Regression":
        model = linear_regression.linear_regression(X_train, y_train,file)
    elif regressor == "Ridge Regression":
        model = ridge_regression.ridge_regression(X_train, y_train,file)
    elif regressor == "Lasso Regression":
        model = lasso_regression.lasso_regression(X_train, y_train,file)
    elif regressor == "Decision Tree Regression":
        model = decision_tree_regression.decision_tree_regressor(X_train, y_train,file)
    elif regressor == "Random Forest Regression":
        model = random_forest_regression.random_forest_regressor(X_train, y_train,file)
    elif regressor == "Support Vector Regressor":
        model=svr.support_vector_regressor(X_train, y_train,file)
    model.fit(X_train, y_train)
    X, y = split_xy(dataset, target_var)
    y_prediction = model.predict(X)

    selected_metrics = get_result(model, X_test, y_test, metrics)
    i = 0
    for X, y in zip([X_train, X_test], [y_train, y_test]):
        list2 = get_result(model, X, y, metrics)
        if (i == 0):
            list1 = get_result(model, X, y, metrics)
            i += 1
    merged_list = {
        f"Train {key}": value
        for key, value in list1.items()
    }

    merged_list.update({
        f"Test {key}": value
        for key, value in list2.items()
    })
    y_prediction=json.dumps(y_prediction.tolist())
    buffer = io.BytesIO()
    joblib.dump(model, buffer)
    buffer.seek(0)
    model_bytes = buffer.read()
    buffer.close()

    # Encode the bytes to a base64 string
    model_encoded = base64.b64encode(model_bytes).decode('utf-8')
    obj={
        "metrics": selected_metrics,   #4
        "metrics_table":merged_list,     #8
        "y_pred" : y_prediction,
        "model_deploy": model_encoded
    }
    return JsonResponse(obj)

def get_result(model, X, y, metrics):
    y_pred = model.predict(X)
    metric_dict = {
        "R-Squared": r2_score(y, y_pred),
        "Mean Absolute Error": mean_absolute_error(y, y_pred),
        "Mean Squared Error": mean_squared_error(y, y_pred),
        "Root Mean Squared Error": mean_squared_error(y, y_pred, squared=False)
    }
    result=metric_dict
    return result
