import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio
from django.http import HttpResponse
from django.http import JsonResponse


def model_report(file):
    result_df = pd.DataFrame(file.get("file"))
    display_type = file.get("Display Type", "Graph")

    if display_type == "Table":
        include_data = file.get("Include Data", False)
        return report_table(result_df, include_data)
    else:
        return report_graph(result_df, file)


def report_table(data, include_data=False):
    # Implementation for table display can be added here
    pass


def report_graph(data, file):
    model_data = data.copy()

    try:
        model_data = model_data.drop(columns=['Train Data', 'Test Data', 'Model Name'])
    except:
        pass

    orientation = file.get("Select Orientation", "Vertical")
    display_result = file.get("Display Result", "All")

    if display_result == "All":
        column = model_data
    elif display_result == "Train":
        colms = model_data.columns[model_data.columns.str.contains("Train")].to_list()
        column = model_data[colms] if colms else model_data
    elif display_result == "Test":
        colms = model_data.columns[model_data.columns.str.contains("Test")].to_list()
        column = model_data[colms] if colms else model_data
    elif display_result == "Custom":
        selected_columns = file.get("Columns", [])
        if len(selected_columns) > 0:
            column = model_data[selected_columns]
        else:
            column = model_data
    else:
        column = model_data

    # Create a Plotly figure
    fig = go.Figure()

    # Define a colormap similar to 'Set3'
    colors = [
        '#8DD3C7', '#FFFFB3', '#BEBADA', '#FB8072', '#80B1D3',
        '#FDB462', '#B3DE69', '#FCCDE5', '#D9D9D9', '#BC80BD',
        '#CCEBC5', '#FFED6F'
    ]

    # Ensure we have the model names
    model_names = data['name'].values if 'name' in data.columns else [f"Model {i + 1}" for i in range(len(data))]

    # Add traces for each model and metric
    for i, col in enumerate(column.columns):
        for j, (idx, row) in enumerate(data.iterrows()):
            model_name = model_names[j] if j < len(model_names) else f"Model {j + 1}"

            try:
                value = row[col] if col in row else None
            except:
                value = None

            if value is not None:
                if orientation == 'Vertical':
                    fig.add_trace(
                        go.Bar(
                            x=[col],
                            y=[value],
                            name=model_name,
                            legendgroup=model_name,
                            marker_color=colors[j % len(colors)],
                            showlegend=True if i == 0 else False
                        )
                    )
                else:  # Horizontal
                    fig.add_trace(
                        go.Bar(
                            y=[col],
                            x=[value],
                            name=model_name,
                            legendgroup=model_name,
                            marker_color=colors[j % len(colors)],
                            showlegend=True if i == 0 else False,
                            orientation='h'
                        )
                    )

    # Update layout for better readability
    fig.update_layout(
        title={
            'text': 'Model Performance Comparison',
            'y': 0.95,
            'x': 0.5,
            'xanchor': 'center',
            'yanchor': 'top',
            'font': {'size': 20}
        },
        barmode='group',
        bargap=0.15,  # Gap between bars in the same group
        bargroupgap=0.1,  # Gap between bar groups
        font=dict(
            family="Arial, sans-serif",
            size=14,
            color="#444"
        ),
        plot_bgcolor='rgba(255,255,255,0.9)',
        height=1000,
        width=1000,
        margin=dict(l=80, r=40, t=100, b=80),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            font=dict(size=12)
        ),
        xaxis=dict(
            title="Metrics" if orientation == 'Vertical' else "Values",
            tickangle=-45 if orientation == 'Vertical' else 0,
            tickfont=dict(size=12),
            gridcolor='rgba(230,230,230,0.8)'
        ),
        yaxis=dict(
            title="Values" if orientation == 'Vertical' else "Metrics",
            tickfont=dict(size=12),
            gridcolor='rgba(230,230,230,0.8)',
            autorange=True,  # Auto calculate range
            tickmode='auto',  # Auto calculate ticks
            nticks=40  # Suggest a higher number of ticks
        ),
        template="plotly_white",
        hovermode="closest",
        hoverlabel=dict(
            bgcolor="white",
            font_size=12,
            font_family="Arial"
        )
    )

    # Handle x-axis tick labels for better readability
    if orientation == 'Vertical':
        fig.update_xaxes(
            tickangle=-45,
            tickmode='array',
            tickvals=list(column.columns),
            ticktext=column.columns
        )

    # Convert the graph to HTML and send as a response
    html_content = pio.to_html(
        fig,
        full_html=False,
        include_plotlyjs='cdn',
        config={
            'responsive': True,
            'displayModeBar': True,
            'displaylogo': False,
            'modeBarButtonsToRemove': ['select2d', 'lasso2d'],
            'toImageButtonOptions': {
                'format': 'png',
                'filename': 'model_performance',
                'height': 800,
                'width': 1000,
                'scale': 2
            }
        }
    )

    response = HttpResponse(content_type='text/html')
    response.write(html_content)

    graph_json = fig.to_json()
    return JsonResponse(graph_json, safe=False)