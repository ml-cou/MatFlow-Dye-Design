
import pandas as pd
import numpy as np
import scipy.stats as stats
from django.http import JsonResponse
import plotly.graph_objects as go
import plotly.io as pio
from ...modules import utils
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

def prediction_regression(file):
    target_var = file.get( "Target Variable")
    data = pd.DataFrame(file.get("file"))
    X, y = utils.split_xy(data, target_var)
    y_pred = file.get("y_pred")
    result_opt = file.get("Result")
    return show_result(y, y_pred, result_opt)

def show_result(y, y_pred, result_opt):
    if result_opt == "Target Value":
        graph_header =  "Actual vs. Predicted Values"
        result = pd.DataFrame({
            "Actual": y,
            "Predicted": y_pred
        })
        result=result.to_json(orient="records")
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=list(range(len(y))), y=y, mode='lines', name='Actual'))
        fig.add_trace(go.Scatter(x=list(range(len(y_pred))), y=y_pred, mode='lines', name='Predicted'))
        fig.update_layout(
            title=graph_header,
            xaxis=dict(title='Index'),
            yaxis=dict(title='Value')
        )
        graph_json = fig.to_json()
        obj= {
            "table": result,
            "graph":graph_json
        }
        return JsonResponse (obj)

    elif result_opt == "R2 Score":
        result = r2_score(y, y_pred)
        st.metric(result_opt, result)
    elif result_opt == "MAE":
        result = mean_absolute_error(y, y_pred)
        st.metric(result_opt, result)
    elif result_opt == "MSE":
        result = mean_squared_error(y, y_pred)
        st.metric(result_opt, result)
    elif result_opt == "RMSE":
        result = np.sqrt(mean_squared_error(y, y_pred))
        st.metric(result_opt, result)
    elif result_opt == "Actual vs. Predicted":
        graph_header="Actual vs. Predicted Values"
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=list(range(len(y))), y=y, mode='lines', name='Actual'))
        fig.add_trace(go.Scatter(x=list(range(len(y_pred))), y=y_pred, mode='lines', name='Predicted'))
        fig.update_layout(
            title=graph_header,
            xaxis=dict(title='Index'),
            yaxis=dict(title='Value')
        )
        graph_json = fig.to_json()
        response_data = {'graph': graph_json}
        return JsonResponse(response_data)
    elif result_opt == "Residuals vs. Predicted":
        residuals = y - y_pred
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=y_pred, y=residuals, mode='markers'))
        fig.add_shape(type="line", x0=min(y_pred), y0=0, x1=max(y_pred), y1=0, line=dict(color="red", dash="dash"))
        fig.update_layout(
            xaxis=dict(title='Predicted'),
            yaxis=dict(title='Residuals'),
            title='Residuals vs. Predicted Values'
        )
        graph_json = fig.to_json()
        response_data = {'graph': graph_json}
        return JsonResponse(response_data)

    elif result_opt == "Histogram of Residuals":
        residuals = y - y_pred
        fig = go.Figure(data=[go.Histogram(x=residuals, nbinsx=10)])
        fig.update_layout(
            title="Histogram of Residuals",
            xaxis=dict(title="Residuals"),
            yaxis=dict(title="Frequency")
        )
        graph_json = fig.to_json()
        response_data = {'graph': graph_json}
        return JsonResponse(response_data)

    elif result_opt == "QQ Plot":
        residuals = y - y_pred
        # Generate the QQ plot data
        line = stats.probplot(residuals, dist="norm")
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=line[0], y=line[1], mode='lines', name='Reference Line'))
        fig.add_trace(go.Scatter(x=residuals, y=line[0], mode='markers', name='Residuals'))
        fig.update_layout(
            xaxis_title="Theoretical Quantiles",
            yaxis_title="Sample Quantiles",
            title="Normal Q-Q Plot of Residuals"
        )
        fig_json = pio.to_json(fig)
        return JsonResponse({'graph': fig_json})

    elif result_opt == "Box Plot of Residuals":
        residuals = y - y_pred
        fig = go.Figure()
        fig.add_trace(go.Box(y=residuals))
        fig.update_layout(
            xaxis=dict(title='Residuals'),
            title='Box Plot of Residuals'
        )
        graph_json = fig.to_json()
        response_data = {'graph': graph_json}
        return JsonResponse(response_data)
    elif result_opt == "Regression Line Plot":
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=y, y=y_pred, mode='markers', name='Prediction'))
        fig.update_layout(
            title='Regression Line Plot',
            xaxis=dict(title='Actual'),
            yaxis=dict(title='Predicted')
        )
        regression_line = go.Scatter(x=y, y=y_pred, mode='lines', name='Regression Line')
        fig.add_trace(regression_line)
        graph_json = fig.to_json()
        response_data = {'graph': graph_json}
        return JsonResponse(response_data)

