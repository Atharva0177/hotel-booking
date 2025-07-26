<?php
require_once 'db.php';
header('Content-Type: application/json');

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Handle POST request (create booking)
    createBooking();
} else {
    // Invalid request method
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

// Create a new booking
function createBooking() {
    global $db;
    
    try {
        // Get JSON data from request body
        $jsonData = file_get_contents('php://input');
        $data = json_decode($jsonData, true);
        
        // Validate required fields
        $requiredFields = ['room_id', 'check_in', 'check_out', 'first_name', 'last_name', 'email', 'phone'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                throw new Exception("$field is required");
            }
        }
        
        // Validate dates
        $checkInDate = new DateTime($data['check_in']);
        $checkOutDate = new DateTime($data['check_out']);
        $today = new DateTime();
        
        if ($checkInDate < $today) {
            throw new Exception('Check-in date cannot be in the past');
        }
        
        if ($checkOutDate <= $checkInDate) {
            throw new Exception('Check-out date must be after check-in date');
        }
        
        // Check if room is available for the selected dates
        $availabilityCheck = checkRoomAvailability($data['room_id'], $data['check_in'], $data['check_out']);
        if (!$availabilityCheck['available']) {
            throw new Exception('The selected room is not available for the specified dates');
        }
        
        // Get room details for price calculation
        $roomSql = "SELECT price FROM rooms WHERE id = :id";
        $room = $db->selectOne($roomSql, [':id' => $data['room_id']]);
        
        if (!$room) {
            throw new Exception('Room not found');
        }
        
        // Calculate number of nights and total price
        $interval = $checkInDate->diff($checkOutDate);
        $nights = $interval->days;
        $roomPrice = $room['price'];
        $subtotal = $roomPrice * $nights;
        $taxesAndFees = $subtotal * TAX_RATE;
        $totalPrice = $subtotal + $taxesAndFees;
        
        // Combine first and last name for guest_name
        $guestName = $data['first_name'] . ' ' . $data['last_name'];
        
        // Prepare booking data
        $bookingData = [
            'room_id' => $data['room_id'],
            'guest_name' => $guestName,
            'guest_email' => $data['email'],
            'guest_phone' => $data['phone'],
            'check_in' => $data['check_in'],
            'check_out' => $data['check_out'],
            'adults' => $data['adults'] ?? 1,
            'children' => $data['children'] ?? 0,
            'special_requests' => $data['special_requests'] ?? null,
            'total_price' => $totalPrice,
            'status' => 'confirmed'
        ];
        
        // Insert booking
        $bookingId = $db->insert('bookings', $bookingData);
        
        // In a real application, you would send confirmation emails here
        
        echo json_encode(['success' => true, 'booking_id' => $bookingId, 'message' => 'Booking created successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Check if room is available for the selected dates
function checkRoomAvailability($roomId, $checkIn, $checkOut) {
    global $db;
    
    try {
        // Check if room exists and is available
        $roomSql = "SELECT status FROM rooms WHERE id = :id";
        $room = $db->selectOne($roomSql, [':id' => $roomId]);
        
        if (!$room) {
            return ['available' => false, 'message' => 'Room not found'];
        }
        
        if ($room['status'] !== 'available') {
            return ['available' => false, 'message' => 'Room is not available'];
        }
        
        // Check for overlapping bookings
        $bookingSql = "SELECT id FROM bookings 
                       WHERE room_id = :room_id 
                       AND check_in < :check_out 
                       AND check_out > :check_in
                       AND status != 'cancelled'";
        
        $params = [
            ':room_id' => $roomId,
            ':check_in' => $checkIn,
            ':check_out' => $checkOut
        ];
        
        $overlappingBookings = $db->select($bookingSql, $params);
        
        if (count($overlappingBookings) > 0) {
            return ['available' => false, 'message' => 'Room is already booked for the selected dates'];
        }
        
        return ['available' => true];
    } catch (Exception $e) {
        return ['available' => false, 'message' => $e->getMessage()];
    }
}

// For admin actions like canceling a booking
if (isset($_POST['action']) && $_POST['action'] === 'cancel_booking') {
    cancelBooking();
}

// Cancel a booking
function cancelBooking() {
    global $db;
    
    try {
        // Get JSON data from request body
        $jsonData = file_get_contents('php://input');
        $data = json_decode($jsonData, true);
        
        if (!isset($data['booking_id'])) {
            throw new Exception('Booking ID is required');
        }
        
        // Verify admin token (should be done in a real application)
        // ...
        
        // Update booking status
        $updateData = ['status' => 'cancelled'];
        $db->update('bookings', $updateData, 'id = :id', [':id' => $data['booking_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Booking cancelled successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>