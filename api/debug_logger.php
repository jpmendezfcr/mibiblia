<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Log file path
$logFile = __DIR__ . '/logs/app_debug.log';

// Get the POST data
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

// Validate input
if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON data']);
    exit;
}

// Required fields
$requiredFields = ['type', 'message', 'timestamp', 'deviceInfo'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Format the log entry
$logEntry = sprintf(
    "[%s] [%s] %s\nDevice Info: %s\n",
    $data['timestamp'],
    strtoupper($data['type']),
    $data['message'],
    json_encode($data['deviceInfo'])
);

// Append to log file
if (file_put_contents($logFile, $logEntry . "\n", FILE_APPEND)) {
    echo json_encode(['status' => 'success', 'message' => 'Log entry saved']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to write log entry']);
}
