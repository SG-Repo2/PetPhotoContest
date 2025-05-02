<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Define your secret key (you should change this to something more secure)
$RESET_KEY = 'CHANGE_THIS_TO_A_LONG_RANDOM_STRING';

// Simple authentication via query-string
if (!isset($_GET['key']) || $_GET['key'] !== $RESET_KEY) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

// Add this near the top of the file, after the headers
date_default_timezone_set('UTC');

// Path to votes file
$votes_file = 'votes.json';

try {
    if (!file_exists($votes_file) || !is_writable($votes_file)) {
        throw new Exception('votes.json not writable or missing');
    }

    // Load, reset, and save
    $pets = json_decode(file_get_contents($votes_file), true);
    if ($pets === null) {
        throw new Exception('Invalid JSON in votes.json');
    }

    // Generate a new reset timestamp in UTC
    $resetTime = time();

    foreach ($pets as &$entry) {
        $entry['votes'] = 0;
    }

    // Add reset timestamp to the data
    $data = [
        'resetTimestamp' => $resetTime,
        'pets' => $pets
    ];

    if (file_put_contents($votes_file, json_encode($data, JSON_PRETTY_PRINT)) === false) {
        throw new Exception('Failed to save votes');
    }

    echo json_encode(['success' => true, 'resetTimestamp' => $resetTime]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
