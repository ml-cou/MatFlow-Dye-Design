import numpy as np
import pandas as pd
import plotly.graph_objects as go
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from sklearn.ensemble import ExtraTreesRegressor, ExtraTreesClassifier
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, KFold
from sklearn.model_selection import cross_validate
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor, XGBClassifier

from .serializer import FeatureSelectionSerializer


class FeatureSelectionAPIView(APIView):
    parser_classes = (JSONParser,)  # Use JSONParser since data is in JSON format

    def post(self, request, format=None):
        serializer = FeatureSelectionSerializer(data=request.data)
        if serializer.is_valid():
            dataset_records = serializer.validated_data['dataset']
            target_var = serializer.validated_data['target_var']
            problem_type = serializer.validated_data['problem_type']
            estimator_name = serializer.validated_data['estimator_name']
            kfold = serializer.validated_data['kfold']
            display_opt = serializer.validated_data['display_opt']
            features_to_display = serializer.validated_data.get('features_to_display', None)

            # Convert dataset records to DataFrame
            try:
                dataset = pd.DataFrame(dataset_records)
            except Exception as e:
                return Response({'error': f"Error converting dataset to DataFrame: {str(e)}"},
                                status=status.HTTP_400_BAD_REQUEST)

            # Now call the feature_selection function
            result = feature_selection(
                dataset=dataset,
                target_var=target_var,
                problem_type=problem_type,
                estimator_name=estimator_name,
                kfold=kfold,
                display_opt=display_opt,
                features_to_display=features_to_display
            )

            if 'error' in result:
                return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def feature_selection(dataset, target_var, problem_type, estimator_name, kfold=2, display_opt='None',
                      features_to_display=None):
    # Validate and prepare data
    try:
        if target_var not in dataset.columns:
            return {'error': f"Target variable '{target_var}' not found in dataset."}
        if dataset.isnull().values.any():
            return {'error': "Dataset contains null values. Please handle them before proceeding."}

        X_n = dataset.drop(columns=[target_var])
        Y_n = dataset[target_var]

        # Encode labels if classification
        if problem_type == 'classification':
            label_encoder = LabelEncoder()
            Y_n_encoded = label_encoder.fit_transform(Y_n)
        else:
            Y_n_encoded = Y_n  # For regression, no encoding needed
    except Exception as e:
        return {'error': f"Error while getting input and output data: {str(e)}"}

    # Define scoring and estimator based on problem type
    if problem_type == 'regression':
        scoring = ['neg_mean_absolute_error', 'neg_mean_absolute_percentage_error',
                   'neg_mean_squared_error', 'neg_root_mean_squared_error']
        df_columns = ['MAE', 'MAPE', 'MSE', 'RMSE']
        estimator_dict = {
            'ExtraTreesRegressor': ExtraTreesRegressor(),
            'RandomForestRegressor': RandomForestRegressor(),
            'GradientBoostingRegressor': GradientBoostingRegressor(),
            'XGBRegressor': XGBRegressor(),
        }
    else:
        scoring = ['accuracy', 'precision_macro', 'recall_macro', 'f1_macro']
        df_columns = ['Accuracy', 'Precision', 'Recall', 'F1']
        estimator_dict = {
            'ExtraTreesClassifier': ExtraTreesClassifier(),
            'RandomForestClassifier': RandomForestClassifier(),
            'GradientBoostingClassifier': GradientBoostingClassifier(),
            'XGBClassifier': XGBClassifier(),
        }

    try:
        estimator = estimator_dict[estimator_name]
        list_X = list(X_n.columns)
        df_result = pd.DataFrame(columns=df_columns)
    except Exception as e:
        return {'error': f"Error while initializing variables: {str(e)}"}

    if display_opt == 'None':
        return {'error': "No features selected for display."}

    if display_opt == "Custom":
        if features_to_display is None or len(features_to_display) == 0:
            return {'error': "No features selected for display in Custom mode."}
        list_X = features_to_display

    to_sort_df = df_result.copy()

    # Define cross-validation strategy
    if problem_type == 'classification':
        cv = StratifiedKFold(n_splits=kfold, shuffle=True, random_state=42)
    else:
        cv = KFold(n_splits=kfold, shuffle=True, random_state=42)

    # Stage 1: Calculating scores for each feature
    for feature in list_X:
        try:
            scores = cross_validate(estimator, X_n[[feature]], Y_n_encoded, cv=cv, scoring=scoring, n_jobs=-1)
            to_sort_df.loc[feature] = [
                round(scores['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4) for score in
                scoring]
        except Exception as e:
            return {'error': f"Error during cross-validation: {str(e)}"}

    # Sort features based on primary metric
    primary_metric = 'F1' if problem_type == 'classification' else 'RMSE'
    to_sort_df = to_sort_df.sort_values(primary_metric, ascending=(problem_type == 'regression'))

    # Stage 2: Feature Selection
    list_X = to_sort_df.index.tolist()
    selected = [list_X[0]]
    selected_feature_scores = df_result.copy()

    try:
        scores = cross_validate(estimator, X_n[selected], Y_n_encoded, cv=cv, scoring=scoring, n_jobs=-1)
    except Exception as e:
        return {'error': f"Error during cross-validation: {str(e)}"}
    selected_feature_scores.loc[list_X[0]] = [
        round(scores['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4) for score in scoring]
    list_X.remove(list_X[0])

    all_features_scores = df_result.copy()
    dropped_columns = df_result.copy()

    while list_X:
        var = df_result.copy()
        for feature in list_X:
            try:
                scores = cross_validate(estimator, X_n[selected + [feature]], Y_n_encoded, cv=cv, scoring=scoring,
                                        n_jobs=-1)
                var.loc[feature] = [
                    round(scores['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4) for
                    score in scoring]
            except Exception as e:
                return {'error': f"Error during cross-validation: {str(e)}"}

        var = var.sort_values(primary_metric, ascending=(problem_type == 'regression'))
        best_feature = var.index[0]
        list_X.remove(best_feature)

        metric_improved = (
            var.iloc[0][primary_metric] > selected_feature_scores[primary_metric].iloc[-1]
            if problem_type == 'classification'
            else var.iloc[0][primary_metric] < selected_feature_scores[primary_metric].iloc[-1]
        )

        if metric_improved:
            selected_feature_scores.loc[best_feature] = var.iloc[0]
            all_features_scores.loc[best_feature] = var.iloc[0]
            selected.append(best_feature)
        else:
            for feature in var.index:
                all_features_scores.loc[feature] = var.loc[feature]
                dropped_columns.loc[feature] = var.loc[feature]
            break

    # Prepare results
    selected_features = selected_feature_scores.index.to_list()
    dropped_features = dropped_columns.index.to_list()

    # Generate plot data
    plot_data = feature_graph(selected_feature_scores, all_features_scores, problem_type, dropped_columns)

    # Prepare modified dataset
    modified_dataset = dataset.drop(columns=dropped_features)
    modified_dataset_json = modified_dataset.to_dict(orient='records')

    # Return results
    result = {
        'selected_features': selected_features,
        'dropped_features': dropped_features,
        'selected_feature_scores': selected_feature_scores.reset_index().to_dict(orient='records'),
        'dropped_feature_scores': dropped_columns.reset_index().to_dict(orient='records'),
        'plot_data': plot_data,
        'modified_dataset_csv': modified_dataset_json,
    }
    return result


def feature_graph(df_result, df_all_result, problem_type, dropped_columns):
    try:
        df_result = df_result.reset_index()
        df_all_result = df_all_result.reset_index()
        dropped_columns = dropped_columns.reset_index()
    except:
        return {'error': 'Error processing dataframes in feature_graph'}

    if problem_type == "regression":
        matrices_to_display = ['RMSE']
    else:
        matrices_to_display = ['F1']

    df_result = df_result.rename(columns={'index': 'Features'})
    df_all_result = df_all_result.rename(columns={'index': 'Features'})
    dropped_columns = dropped_columns.rename(columns={'index': 'Features'})

    merged_df = pd.merge(df_all_result, df_result, on='Features', how='outer', suffixes=('_Baseline', '_Improved'))

    primary_metric = 'F1' if problem_type == 'classification' else 'RMSE'

    try:
        merged_df = merged_df.sort_values(f'{primary_metric}_Improved', ascending=(problem_type == 'regression'))
        dropped_columns = dropped_columns.sort_values(primary_metric, ascending=(problem_type == 'regression'))
        merged_df = merged_df.reset_index()
    except:
        return {'error': 'Error sorting dataframes in feature_graph'}

    data = pd.concat([df_result[['Features']], df_result[matrices_to_display]], axis=1)
    dropped_columns = pd.concat([dropped_columns[['Features']], dropped_columns[matrices_to_display]], axis=1)

    fig = go.Figure()

    for matrix_name in matrices_to_display:
        # Mask the missing values
        mask = np.isfinite(merged_df[f'{matrix_name}_Improved'])

        # Add a line plot trace for the baseline
        fig.add_trace(go.Scatter(x=merged_df['Features'], y=merged_df[f'{matrix_name}_Baseline'],
                                 name='Baseline',
                                 mode='lines+markers',
                                 line=dict(color='#FF4949', dash='dot'),
                                 marker=dict(symbol='circle', size=4, color='#FF4949')
                                 ))

        # Add a line plot trace for the improved
        fig.add_trace(go.Scatter(x=merged_df['Features'][mask], y=merged_df[f'{matrix_name}_Improved'][mask],
                                 name='Improved', mode='lines+markers', line=dict(color='#19A7CE'),
                                 marker=dict(symbol='circle', size=5, color='#19A7CE')
                                 ))

    fig.update_layout(
        title='Comparison of Baseline and Improved',
        xaxis=dict(title='<b>Features</b>', tickangle=45),
        yaxis=dict(title=f'<b>{primary_metric}</b>'),
        autosize=True,
        hovermode='closest',
        dragmode='zoom',
        width=800,
        height=600,
    )

    # Return the figure as JSON
    fig_json = fig.to_json()
    return fig_json
