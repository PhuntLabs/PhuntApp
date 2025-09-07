<?php
// --- START: CORS Headers ---
// Allow requests from any origin. For better security, you could replace '*'
// with your app's actual domain, e.g., 'https://your-app-name.web.app'.
header('Access-Control-Allow-Origin: *');

// Allow the necessary HTTP methods.
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Allow the necessary headers.
header('Access-Control-Allow-Headers: Content-Type');

// Handle pre-flight OPTIONS request (sent by browsers to check CORS).
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
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
        echo json_encode(['success' => false, 'message' => 'Failed to move the uploaded file.']);
    }
} else {
    // Handle the case where no file was uploaded or there was an error.
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'No file uploaded or an upload error occurred.']);
}

?>