import os
import pandas as pd
from django.http import JsonResponse, HttpResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import json
from Matflow.debug_utilities import *

# Path to the dataset directory (one level up from the current file directory)
DATASET_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dataset')
SUPPORTED_EXTENSIONS = {
    '.csv': 'CSV',
    '.xlsx': 'Excel',
    '.xls': 'Excel'
}

@csrf_exempt
def rename_item(request):
    """
    API endpoint to rename a file or folder.
    Expects 'currentName', 'newName', and 'parentFolder' in the request body.
    """
    if request.method == 'POST':
        try:
            # Parse request body
            body = json.loads(request.body)
            current_name = body.get('currentName')
            new_name = body.get('newName')
            parent_folder = body.get('parentFolder', '')

            # Construct paths
            current_path = os.path.join(DATASET_DIR, parent_folder, current_name)
            new_path = os.path.join(DATASET_DIR, parent_folder, new_name)

            # Check if the current item exists
            if not os.path.exists(current_path):
                return JsonResponse({"error": "Item to rename not found."}, status=404)

            # Rename the file or folder
            os.rename(current_path, new_path)
            return JsonResponse({"message": f"Renamed '{current_name}' to '{new_name}' successfully!"}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return HttpResponse(status=405)  # Method not allowed


def get_nested_directory_structure(root_path):
    """
    Recursively traverse the directory to create a nested JSON structure.
    """
    structure = {}
    for item in os.listdir(root_path):
        item_path = os.path.join(root_path, item)
        if os.path.isdir(item_path):
            structure[item] = get_nested_directory_structure(item_path)  # Recursive call for subfolders
        else:
            # For files, append the file names to the structure
            if 'files' not in structure:
                structure['files'] = []
            structure['files'].append(item)
    return structure

def get_dataset_structure(request):
    """
    View that returns the nested folder and file structure within the dataset directory.
    Optional file content can be read by providing 'folder' and 'file' query parameters.
    """
    # Get folder and file from the query parameters
    folder = request.GET.get('folder')
    if folder == '/':
        folder = ""
    print(folder)
    file = request.GET.get('file')

    # If folder and file are provided, read the file content
    if folder or file:
        # Construct the file path based on the folder and file names
        file_path = os.path.join(DATASET_DIR, folder, file)
        # print(file_path)

        # Check if the file exists at the constructed path
        if os.path.isfile(file_path):
            try:
                # Read the file based on the extension
                file_extension = os.path.splitext(file_path)[1].lower()
                if file_extension == '.csv':
                    df = pd.read_csv(file_path)  # Read CSV file
                elif file_extension in ['.xlsx', '.xls']:
                    df = pd.read_excel(file_path)  # Read Excel file
                else:
                    return HttpResponse("Unsupported file type", status=400)

                # Return the content as a JSON response
                return JsonResponse(df.to_dict(orient='records'), safe=False)
            except Exception as e:
                # Return error message if there was an issue reading the file
                return HttpResponse(f"Error reading file: {e}", status=500)
        else:
            # Return 404 if the file is not found
            return HttpResponse("File not found", status=404)

    # If no specific file is requested, return the nested directory structure
    nested_structure = get_nested_directory_structure(DATASET_DIR)

    # Return the directory structure as a JSON response
    return JsonResponse(nested_structure, safe=False)


@csrf_exempt
def create_folder(request):
    import json
    data = json.loads(request.body)
    folder_name = data.get('folderName')
    parent = data.get('parent')

    # Create the folder inside the dataset directory
    if folder_name:
        folder_path = os.path.join(DATASET_DIR, parent, folder_name)
        os.makedirs(folder_path, exist_ok=True)
        return JsonResponse({"message": "Folder created successfully!"}, status=201)

    return JsonResponse({"error": "Folder name is required"}, status=400)


@csrf_exempt
def upload_file(request):
    """
    Securely upload a file to a specific folder, bypassing default_storage restrictions.
    """
    folder = request.POST.get('folder', '').strip('/')  # Remove leading/trailing slashes
    file = request.FILES.get('file')

    if file:
        try:
            # Ensure the folder exists inside DATASET_DIR
            target_folder = os.path.join(DATASET_DIR, folder)
            os.makedirs(target_folder, exist_ok=True)  # Create directory if it doesn't exist

            # Construct the safe file path
            file_path = os.path.join(target_folder, file.name)

            # Write the file to the target location
            with open(file_path, 'wb') as destination:
                for chunk in file.chunks():  # Handle large files efficiently
                    destination.write(chunk)

            return JsonResponse({"message": "File uploaded successfully!", "file_path": file_path}, status=201)
        except Exception as e:
            return JsonResponse({"error": f"Error uploading file: {str(e)}"}, status=500)

    return JsonResponse({"error": "No file uploaded"}, status=400)
import shutil
@csrf_exempt
def delete_item(request):
    """
    View to handle deletion of files and folders.
    Accepts 'folder' and optional 'file' as query parameters.
    """
    if request.method == 'DELETE':
        # Extract the folder and file parameters from the URL
        folder = request.GET.get('folder', '')
        file = request.GET.get('file')

        try:
            # Construct the path based on whether it's a file or folder
            if file:
                path = os.path.join(DATASET_DIR, folder, file)
                if os.path.isfile(path):
                    os.remove(path)  # Delete the file
                    return JsonResponse({"message": "File deleted successfully!"}, status=200)
                else:
                    return JsonResponse({"error": "File not found"}, status=404)
            else:
                path = os.path.join(DATASET_DIR, folder)
                if os.path.isdir(path):
                    # Use shutil.rmtree() to delete the folder and all its contents recursively
                    shutil.rmtree(path)
                    return JsonResponse({"message": "Folder and its contents deleted successfully!"}, status=200)
                else:
                    return JsonResponse({"error": "Folder not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return HttpResponse(status=405)  # Method not allowed

@csrf_exempt
def create_file(request):
    """
    API endpoint to create a new file with provided data and save it in the backend.
    Expects 'data', 'filename', and 'foldername' in the request body.
    Assumes 'data' is always an array of objects (list of dictionaries).
    Supports saving data only in CSV or Excel format.
    """
    if request.method == 'POST':
        try:
            print("s")
            # Parse the JSON request body
            body = json.loads(request.body)
            data = body.get('data')
            filename = body.get('filename')
            foldername = body.get('foldername', '')  # Default to root dataset directory if foldername is empty
            print(filename, foldername)

            # Validate the input
            if not filename:
                return JsonResponse({"error": "Filename is required."}, status=400)

            # Determine the extension and validate data type accordingly
            file_extension = os.path.splitext(filename)[1]  # Get file extension from filename
            if file_extension.lower() not in ['.csv', '.xlsx']:  # Support only CSV and Excel
                return JsonResponse({"error": f"Unsupported file extension: {file_extension}. Use .csv or .xlsx only."}, status=400)

            # Convert the provided data (assumed to be list of dictionaries) to a DataFrame
            try:
                df = pd.DataFrame(data)
            except ValueError as e:
                return JsonResponse({"error": f"Data is not compatible with CSV/Excel format: {str(e)}"}, status=400)

            # Determine the path to save the file
            folder_path = os.path.join(DATASET_DIR, foldername)
            if not os.path.exists(folder_path):
                os.makedirs(folder_path, exist_ok=True)  # Create the folder if it does not exist

            # Create the full file path and save data according to the file type
            file_path = os.path.join(folder_path, filename)
            if file_extension.lower() == '.csv':
                df.to_csv(file_path, index=False)  # Save DataFrame as CSV
            elif file_extension.lower() == '.xlsx':
                df.to_excel(file_path, index=False)  # Save DataFrame as Excel

            return JsonResponse({"message": f"File '{filename}' created successfully in '{foldername}'!"}, status=201)
        except Exception as e:
            print(e)
            return JsonResponse({"error": str(e)}, status=500)

    return HttpResponse(status=405)  # Method not allowed


def validate_request_parameters(request):
    """Validate the request parameters and return folder, file, and any error."""
    debug("Validating request parameters")

    folder = request.GET.get('folder', '')
    debug(f"Folder parameter: '{folder}'")

    file = request.GET.get('file')
    debug(f"File parameter: '{file}'")

    # Check if file parameter is provided
    if not file:
        error_msg = "File name is required."
        error(error_msg)
        return None, None, JsonResponse({"error": error_msg}, status=400)

    # Check for potential directory traversal attacks
    if '..' in folder or '..' in file:
        error_msg = "Invalid folder or file path."
        error(error_msg)
        return None, None, JsonResponse({"error": error_msg}, status=400)

    debug("Request parameters are valid")
    return folder, file, None


def get_validated_file_path(folder, file):
    """Construct and validate the full file path."""
    debug(f"Constructing file path for folder: '{folder}', file: '{file}'")

    # Construct the full path to the file
    file_path = os.path.join(DATASET_DIR, folder, file)
    debug(f"Full file path: '{file_path}'")

    # Check if the file exists
    if not os.path.isfile(file_path):
        error_msg = f"File '{file}' not found in folder '{folder}'."
        error(error_msg)
        return None, JsonResponse({"error": error_msg}, status=404)

    # Check if file is within the DATASET_DIR (security check)
    if not os.path.abspath(file_path).startswith(os.path.abspath(DATASET_DIR)):
        error_msg = "Access to file is forbidden."
        error(error_msg)
        return None, JsonResponse({"error": error_msg}, status=403)

    debug(f"File path is valid: '{file_path}'")
    return file_path, None


@csrf_exempt
@debug_function
def read_file(request):
    """
    View to read the content of a specific file.
    Accepts 'folder' and 'file' query parameters to identify the file.
    Returns the file content as a JSON response.
    """
    info("read_file function called")
    debug_obj(request, "Request")

    # Get and validate parameters
    folder, file, validation_error = validate_request_parameters(request)
    if validation_error:
        return validation_error

    # Construct and validate file path
    file_path, path_error = get_validated_file_path(folder, file)
    if path_error:
        return path_error

    # Read and process the file
    response = read_and_process_file(file_path)

    info(f"File '{file}' in folder '{folder}' processed successfully")
    return response


def read_and_process_file(file_path):
    """Read and process the file based on its extension."""
    try:
        # Determine file type based on extension
        file_extension = os.path.splitext(file_path)[1].lower()
        debug(f"File extension: '{file_extension}'")

        # Check if file type is supported
        if file_extension not in SUPPORTED_EXTENSIONS:
            error_msg = f"Unsupported file type '{file_extension}'. Supported types are: {', '.join(SUPPORTED_EXTENSIONS.keys())}"
            error(error_msg)
            return JsonResponse({"error": error_msg}, status=400)

        # Read file based on extension
        debug(f"Reading file as {SUPPORTED_EXTENSIONS[file_extension]} format")
        df = read_file_as_dataframe(file_path, file_extension)

        # Log dataframe information
        debug(f"DataFrame shape: {df.shape}")
        debug(f"DataFrame columns: {df.columns.tolist()}")
        debug(f"DataFrame memory usage: {df.memory_usage(deep=True).sum() / (1024 * 1024):.2f} MB")

        # Convert to dictionary for JSON response
        debug("Converting DataFrame to dictionary")
        result = df.to_dict(orient='records')
        debug(f"Result has {len(result)} records")

        return JsonResponse(result, safe=False)

    except Exception as e:
        error_msg = f"Error reading file: {str(e)}"
        error(error_msg)
        debug_obj(e, "Exception")
        import traceback
        error(traceback.format_exc())
        return JsonResponse({"error": error_msg}, status=500)


def read_file_as_dataframe(file_path, extension):
    """Read a file as a pandas DataFrame based on its extension."""
    debug(f"Reading file '{file_path}' with extension '{extension}'")

    try:
        if extension == '.csv':
            # Additional CSV parameters can be added as needed
            debug("Attempting to read CSV file")
            return pd.read_csv(file_path)
        elif extension in ['.xlsx', '.xls']:
            debug("Attempting to read Excel file")
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {extension}")
    except pd.errors.EmptyDataError:
        debug("File is empty")
        return pd.DataFrame()  # Return an empty dataframe instead of failing
    except pd.errors.ParserError as e:
        debug(f"Parser error: {str(e)}")
        raise  # Re-raise the exception for the caller to handle
    except Exception as e:
        debug(f"Unexpected error reading file: {str(e)}")
        raise  # Re-raise the exception for the caller to handle



@csrf_exempt
def fetch_file_as_attachment(request):
    """
    API endpoint to fetch a file as an attachment.
    Accepts 'file_path' as a query parameter.
    """
    print("Endpoint accessed")  # Add debugging here

    file_path = request.GET.get('file_path')  # Expect a full path like /folder1/folder2/file.csv

    if not file_path:
        return JsonResponse({"error": "File path is required."}, status=400)

    # Construct the full path to the file
    full_file_path = os.path.join(DATASET_DIR, file_path.strip('/'))
    # print(full_file_path)

    if not os.path.isfile(full_file_path):
        return JsonResponse({"error": f"File '{file_path}' not found."}, status=404)

    try:
        # Return the file as a response
        return FileResponse(open(full_file_path, 'rb'), as_attachment=True, filename=os.path.basename(full_file_path))
    except Exception as e:
        return JsonResponse({"error": f"Error fetching file: {str(e)}"}, status=500)
