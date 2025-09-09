
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder,label_binarize
from sklearn.multiclass import OneVsRestClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from ...modules import utils
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report,confusion_matrix, roc_curve, precision_recall_curve, auc, average_precision_score
import io
import seaborn as sns
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.io as pio
from django.http import HttpResponse
from django.http import JsonResponse
import base64
import json

def prediction_classification(file):
    # data_opt = file.get("Select Data")
    target_var = file.get("Target Variable")
    model_opt=file.get("regressor")
    data = pd.DataFrame(file.get("file"))
    y_pred = file.get("y_pred")
    X, y = utils.split_xy(data, target_var)
    result_opt = file.get("Result")
    if y.nunique() > 2:
        # multiclass case (denied)
        # show_multiclass(y,y_pred)
        return  show_result(y, y_pred, result_opt, None,X,model_opt)
    else:
        # binary case
        return show_result(y, y_pred, result_opt, "binary",X,model_opt)

def show_result(y, y_pred, result_opt, multi_average,X,model_name):
    # global pred_prob
    le = LabelEncoder()
    if result_opt in ["Accuracy", "Precision", "Recall", "F1-Score"]:
        metric_dict = {
            "Accuracy": accuracy_score(y, y_pred),
            "Precision": precision_score(y, y_pred, average=multi_average),
            "Recall": recall_score(y, y_pred, average=multi_average),
            "F1-Score": f1_score(y, y_pred, average=multi_average)
        }

        result = metric_dict.get(result_opt)
        new_value = result.to_dict(orient="records")
        return JsonResponse(new_value, safe=False)
    elif result_opt == "Target Value":
        result = pd.DataFrame({
            "Actual": y,
            "Predicted": y_pred
        })
        graph=actvspred(y, y_pred,"")
        result_json = result.to_json(orient="records")
        result_dict = json.loads(result_json)
        obj={
                "table":result_dict,
                "graph":graph
        }
        return JsonResponse(obj, safe=False)
    elif result_opt == "Classification Report":
        result = classification_report(y, y_pred)
        return JsonResponse(result, safe=False)
    elif result_opt == "Confusion Matrix":
        cm = confusion_matrix(y, y_pred)
        fig = go.Figure(data=go.Heatmap(
            z=cm,
            x=np.unique(y_pred),
            y=np.unique(y_pred),
            colorscale='Viridis',
            text=cm,
            hovertemplate='Actual: %{y}<br>Predicted: %{x}<br>Count: %{text}<extra></extra>'
        ))
        fig.update_layout(
            title=result_opt,
            xaxis=dict(title="Predicted Label", automargin=True),
            yaxis=dict(title="Actual Label", automargin=True)
        )
        fig.update_layout(
            autosize=False,
            width=600,
            height=600,
            margin=dict(l=50, r=50, b=50, t=50),
            template="plotly_white"
        )
        fig_json = pio.to_json(fig)
        response_data = {'graph': fig_json}
        return JsonResponse(response_data)
    elif result_opt == "Actual vs. Predicted":
        graph_header = "Actual vs. Predicted Values"
        x_range = np.arange(len(y))
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=x_range, y=y, mode='lines', name='Actual',line=dict(color='blue')))
        fig.add_trace(go.Scatter(x=x_range, y=y_pred, mode='lines', name='Predicted',line=dict(color='red')))
        fig.update_layout(
            title=graph_header,
            xaxis=dict(title='Index'),
            yaxis=dict(title='Value')
        )
        fig_json = pio.to_json(fig)
        response_data = {'graph': fig_json}
        return JsonResponse(response_data)

    elif result_opt == "Precision-Recall Curve":
        if y.nunique() > 2:
            return JsonResponse({'error': 'Precision-Recall curve is not supported for multiclass classification'})
        else:
            # Encode y and y_pred
            y_encoded = le.fit_transform(y)
            y_pred_encoded = le.transform(y_pred)

            precision, recall, _ = precision_recall_curve(y_encoded.ravel(), y_pred_encoded.ravel())

            fig = go.Figure(data=go.Scatter(x=recall, y=precision, mode='lines'))

            fig.update_layout(
                title='Precision-Recall Curve',
                xaxis=dict(title='Recall'),
                yaxis=dict(title='Precision')
            )

            fig_json = pio.to_json(fig)
            response_data = {'graph': fig_json}
            return JsonResponse(response_data)

    elif result_opt == "ROC Curve":
        if y.nunique() > 2:
            label_encoder = LabelEncoder()
            label_encoder.fit(y)
            y = label_encoder.transform(y)
            classes = label_encoder.classes_
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
            min_max_scaler = MinMaxScaler()
            X_train_norm = min_max_scaler.fit_transform(X_train)
            X_test_norm = min_max_scaler.fit_transform(X_test)
            if model_name == "Random Forest Classification":
                RF = OneVsRestClassifier(RandomForestClassifier(max_features=0.2))
                RF.fit(X_train_norm, y_train)

                y_pred = RF.predict(X_test_norm)

                pred_prob = RF.predict_proba(X_test_norm)

            elif model_name == "Multilayer Perceptron":
                mlp = MLPClassifier(hidden_layer_sizes=(100, 50))
                mlp.fit(X_train_norm, y_train)
                y_pred = mlp.predict(X_test_norm)
                pred_prob = mlp.predict_proba(X_test_norm)
            elif model_name == "K-Nearest Neighbors":
                k = 5
                knn = KNeighborsClassifier(n_neighbors=k)
                knn.fit(X_train_norm, y_train)
                y_pred = knn.predict(X_test_norm)
                pred_prob = knn.predict_proba(X_test_norm)
            elif model_name == "Support Vector Machine":
                svm = OneVsRestClassifier(SVC(kernel='linear', probability=True))
                svm.fit(X_train_norm, y_train)
                y_pred = svm.predict(X_test_norm)
                pred_prob = svm.predict_proba(X_test_norm)
            elif model_name == "Logistic Regression":
                lr = OneVsRestClassifier(LogisticRegression(solver='lbfgs'))
                lr.fit(X_train_norm, y_train)
                y_pred = lr.predict(X_test_norm)
                pred_prob = lr.predict_proba(X_test_norm)
            elif model_name == "Decision Tree Classification":
                dt = OneVsRestClassifier(DecisionTreeClassifier())
                dt.fit(X_train_norm, y_train)
                y_pred = dt.predict(X_test_norm)
                pred_prob = dt.predict_proba(X_test_norm)
            else:
               raise ValueError("Invalid model name specified.")
            y_test_binarized = label_binarize(y_test, classes=np.unique(y_test))
            fpr = {}
            tpr = {}
            roc_auc = dict()
            n_class = classes.shape[0]
            for i in range(n_class):
                fpr[i], tpr[i], _ = roc_curve(y_test_binarized[:, i], pred_prob[:, i])
                roc_auc[i] = auc(fpr[i], tpr[i])
            fig = go.Figure()
            for i in range(n_class):
                fig.add_trace(
                    go.Scatter(x=fpr[i], y=tpr[i], mode='lines', name='%s vs Rest (AUC=%0.2f)' % (classes[i], roc_auc[i])))
            fig.add_shape(
                type='line', line=dict(dash='dash'), x0=0, y0=0, x1=1, y1=1
            )
            fig.update_layout(
                title='Multiclass ROC curve',
                xaxis=dict(title='False Positive Rate'),
                yaxis=dict(title='True Positive Rate')
            )
            # Convert fig to JSON-compatible format
            fig_json = pio.to_json(fig)
            # Create a JSON response with the fig_json
            response_data = {'graph': fig_json}
            return JsonResponse(response_data)
        else:
            y_encoded = le.fit_transform(y)
            y_pred_encoded = le.transform(y_pred)
            fpr, tpr, _ = roc_curve(y_encoded.ravel(), y_pred_encoded.ravel())
            fig = go.Figure(data=go.Scatter(x=fpr, y=tpr, mode='lines'))
            fig.update_layout(
                title='ROC Curve',
                xaxis=dict(title='False Positive Rate'),
                yaxis=dict(title='True Positive Rate')
            )
            # Convert fig to JSON-compatible format
            fig_json = pio.to_json(fig)
            # Create a JSON response with the fig_json
            response_data = {'graph': fig_json}
            return JsonResponse(response_data)
def actvspred(y, y_pred, graph_header):
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=list(range(len(y))), y=y, mode='lines', name='Actual', line=dict(color='blue')))
    fig.add_trace(go.Scatter(x=list(range(len(y_pred))), y=y_pred, mode='lines', name='Predicted', line=dict(color='red')))
    fig.update_layout(
        title=graph_header,
        xaxis=dict(title='Index'),
        yaxis=dict(title='Value'))
    graph_json = fig.to_json()
    return graph_json
# def show_multiclass(y, y_pred):
#
#     # Binarize the y and y_pred labels
#     y_binarized = label_binarize(y, classes=np.unique(y))
#     y_pred_binarized = label_binarize(y_pred, classes=np.unique(y))
#
#     # Compute the false positive rate, true positive rate, and area under the curve for each class
#     n_classes = y_binarized.shape[1]
#     fpr = dict()
#     tpr = dict()
#     roc_auc = dict()
#     for i in range(n_classes):
#         fpr[i], tpr[i], _ = roc_curve(y_binarized[:, i], y_pred_binarized[:, i])
#         roc_auc[i] = auc(fpr[i], tpr[i])
#
#     # Compute micro-average ROC curve and area under the curve
#     fpr["micro"], tpr["micro"], _ = roc_curve(y_binarized.ravel(), y_pred_binarized.ravel())
#     roc_auc["micro"] = auc(fpr["micro"], tpr["micro"])
#
#     # Plot the ROC curve for each class and micro-average ROC curve
#     fig, ax = plt.subplots()
#     for i in range(n_classes):
#         ax.plot(fpr[i], tpr[i], label='ROC curve of class {0} (area = {1:0.2f})'.format(i, roc_auc[i]))
#
#     ax.plot([0, 1], [0, 1], 'k--', label='random guess')
#     ax.plot(fpr["micro"], tpr["micro"], label='micro-average ROC curve (area = {0:0.2f})'.format(roc_auc["micro"]))
#
#     # Set the x and y limits and labels, and add a legend
#     ax.set_xlim([0.0, 1.0])
#     ax.set_ylim([0.0, 1.05])
#     ax.set_xlabel('False Positive Rate')
#     ax.set_ylabel('True Positive Rate')
#     ax.set_title('Multiclass ROC Curve')
#     ax.legend(loc="lower right")
#     plt.show()
