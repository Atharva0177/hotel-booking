<?php
require_once 'db.php';
header('Content-Type: application/json');

// Handle room management requests (admin only)
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

if (!$data || !isset($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

// In a real application, verify admin token here
// ...

switch ($data['action']) {
    case 'add_room':
        addRoom($data);
        break;
    case 'update_room':
        updateRoom($data);
        break;
    case 'delete_room':
        deleteRoom($data);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

// Add a new room
function addRoom($data) {
    global $db;
    
    try {
        // Validate required fields
        $requiredFields = ['room_name', 'description', 'price', 'capacity', 'room_type', 'beds', 'size', 'main_image'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                throw new Exception("$field is required");
            }
        }
        
        // Prepare room data
        $roomData = [
            'room_name' => $data['room_name'],
            'description' => $data['description'],
            'price' => $data['price'],
            'capacity' => $data['capacity'],
            'room_type' => $data['room_type'],
            'beds' => $data['beds'],
            'size' => $data['size'],
            'main_image' => $data['main_image'],
            'status' => $data['status'] ?? 'available'
        ];
        
        // Insert room
        $roomId = $db->insert('rooms', $roomData);
        
        // Add room images if provided
        if (isset($data['images']) && is_array($data['images'])) {
            foreach ($data['images'] as $image) {
                $imageData = [
                    'room_id' => $roomId,
                    'image_url' => $image
                ];
                $db->insert('room_images', $imageData);
            }
        }
        
        // Add room amenities if provided
        if (isset($data['amenities']) && is_array($data['amenities'])) {
            foreach ($data['amenities'] as $amenityId) {
                $amenityData = [
                    'room_id' => $roomId,
                    'amenity_id' => $amenityId
                ];
                $db->insert('room_amenities', $amenityData);
            }
        }
        
        echo json_encode(['success' => true, 'room_id' => $roomId, 'message' => 'Room added successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Update an existing room
function updateRoom($data) {
    global $db;
    
    try {
        if (!isset($data['room_id'])) {
            throw new Exception('Room ID is required');
        }
        
        // Prepare room data
        $roomData = [];
        $updateFields = ['room_name', 'description', 'price', 'capacity', 'room_type', 'beds', 'size', 'main_image', 'status'];
        
        foreach ($updateFields as $field) {
            if (isset($data[$field])) {
                $roomData[$field] = $data[$field];
            }
        }
        
        if (empty($roomData)) {
            throw new Exception('No fields to update');
        }
        
        // Update room
        $db->update('rooms', $roomData, 'id = :id', [':id' => $data['room_id']]);
        
        // Update room images if provided
        if (isset($data['images']) && is_array($data['images'])) {
            // Delete existing images
            $db->delete('room_images', 'room_id = :room_id', [':room_id' => $data['room_id']]);
            
            // Insert new images
            foreach ($data['images'] as $image) {
                $imageData = [
                    'room_id' => $data['room_id'],
                    'image_url' => $image
                ];
                $db->insert('room_images', $imageData);
            }
        }
        
        // Update room amenities if provided
        if (isset($data['amenities']) && is_array($data['amenities'])) {
            // Delete existing amenities
                        // Delete existing amenities
            $db->delete('room_amenities', 'room_id = :room_id', [':room_id' => $data['room_id']]);
            
            // Insert new amenities
            foreach ($data['amenities'] as $amenityId) {
                $amenityData = [
                    'room_id' => $data['room_id'],
                    'amenity_id' => $amenityId
                ];
                $db->insert('room_amenities', $amenityData);
            }
        }
        
        echo json_encode(['success' => true, 'message' => 'Room updated successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Delete a room
function deleteRoom($data) {
    global $db;
    
    try {
        if (!isset($data['room_id'])) {
            throw new Exception('Room ID is required');
        }
        
        // Check if room has active bookings
        $bookingSql = "SELECT COUNT(*) as count FROM bookings 
                       WHERE room_id = :room_id 
                       AND status IN ('confirmed', 'checked_in') 
                       AND check_out >= CURRENT_DATE()";
        
        $bookings = $db->selectOne($bookingSql, [':room_id' => $data['room_id']]);
        
        if ($bookings['count'] > 0) {
            throw new Exception('Cannot delete room with active bookings');
        }
        
        // Delete room images
        $db->delete('room_images', 'room_id = :room_id', [':room_id' => $data['room_id']]);
        
        // Delete room amenities
        $db->delete('room_amenities', 'room_id = :room_id', [':room_id' => $data['room_id']]);
        
        // Delete room
        $db->delete('rooms', 'id = :id', [':id' => $data['room_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Room deleted successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>