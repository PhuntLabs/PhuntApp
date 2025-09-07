<?php
// --- START: CORS Headers ---
// This is the most critical line. It tells the browser that any origin ('*') is allowed to make requests.
header('Access-Control-Allow-Origin: *');

// Allow the necessary HTTP methods. The browser will use OPTIONS for a "pre-flight" request.
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

// Allow the necessary headers that the browser might send.
header('Access-control-allow-headers: content-type, authorization, x-requested-with');

// Handle the browser's pre-flight OPTIONS request.
// This is crucial. When the browser sees a cross-origin request, it first sends an OPTIONS request to check permissions.
// Your server MUST respond to this with the headers above and then stop execution.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // Use 204 No Content for pre-flight.
    die(); // Stop script execution after sending headers for the pre-flight request.
}
// --- END: CORS Headers ---


// Specify the directory where uploaded files will be stored.
// Ensure this directory exists and is writable by the web server.
$upload_directory = 'uploads/';

// Check if a file was uploaded and there were no errors.
if (isset($_FILES['fileToUpload']) && $_FILES['fileToUpload']['error'] === UPLOAD_ERR_OK) {
    // Get the temporary filename of the uploaded file.
    $temp_filename = $_FILES['fileToUpload']['tmp_name'];

    // Get the original name of the uploaded file.
    $original_filename = basename($_FILES['fileToUpload']['name']);

    // Generate a unique filename to prevent overwriting existing files and for security.
    $unique_filename = uniqid() . '_' . $original_filename;
    
    // Construct the full path where the file will be saved.
    $destination_path = $upload_directory . $unique_filename;

    // Move the uploaded file to the destination directory.
    if (move_uploaded_file($temp_filename, $destination_path)) {
        // If the file was moved successfully, construct the full URL of the saved file.
        // Assuming the 'uploads' directory is accessible from the web.
        $file_url = 'https://www.yeahchat.online/' . $destination_path;

        // Return the URL as a JSON response.
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'url' => $file_url]);
    } else {
        // Handle the case where the file could not be moved.
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to move the uploaded file.']);
    }
} else {
    // Handle the case where no file was uploaded or there was an upload error.
    header('Content-Type: application/json');
    http_response_code(400);
    $error_message = 'No file uploaded or an upload error occurred.';
    if (isset($_FILES['fileToUpload'])) {
        $error_message .= ' Error code: ' . $_FILES['fileToUpload']['error'];
    }
    echo json_encode(['success' => false, 'message' => $error_message]);
}

?>