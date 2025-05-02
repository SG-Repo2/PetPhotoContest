<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$votes_file = 'votes.json';

try {
    // Read POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json);
    
    if (!$data || !isset($data->photo_ids) || !is_array($data->photo_ids)) {
        throw new Exception('Invalid input data');
    }

    // Read current votes
    if (!file_exists($votes_file)) {
        throw new Exception('Votes file not found');
    }

    $current_data = json_decode(file_get_contents($votes_file), true);
    if (!$current_data) {
        throw new Exception('Invalid votes data');
    }

    // Get the reset timestamp and pets data
    $resetTimestamp = isset($current_data['resetTimestamp']) ? $current_data['resetTimestamp'] : time();
    $pets = isset($current_data['pets']) ? $current_data['pets'] : $current_data;

    // Update votes
    foreach ($data->photo_ids as $id) {
        if (isset($pets[$id])) {
            $pets[$id]['votes']++;
        }
    }

    // Save updated data with timestamp
    $save_data = [
        'resetTimestamp' => $resetTimestamp,
        'pets' => $pets
    ];

    if (file_put_contents($votes_file, json_encode($save_data, JSON_PRETTY_PRINT)) === false) {
        throw new Exception('Failed to save votes');
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
