<?php
header('Content-Type: application/json');

// Path to the JSON file where votes will be stored
$votes_file = 'votes.json';

// Check if the file exists, if not, create an empty file
if (!file_exists($votes_file)) {
    file_put_contents($votes_file, json_encode([]));
}

// Get the current votes from the JSON file
$votes = json_decode(file_get_contents($votes_file), true);

// Get the submitted photo IDs
$data = json_decode(file_get_contents('php://input'), true);
$photo_ids = $data['photo_ids'];

// Increment the vote count for each selected photo
foreach ($photo_ids as $photo_id) {
    if (isset($votes[$photo_id])) {
        $votes[$photo_id]++;
    } else {
        $votes[$photo_id] = 1;
    }
}

// Save the updated votes back to the JSON file
file_put_contents($votes_file, json_encode($votes));

// Return a success response
echo json_encode(['success' => true]);
