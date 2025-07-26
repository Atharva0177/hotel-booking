<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'db.php';
header('Content-Type: application/json');

// Get action from request
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Handle different API actions
switch ($action) {
    case 'get_featured_rooms':
        getFeaturedRooms();
        break;
    case 'get_all_rooms':
        getAllRooms();
        break;
    case 'get_room_details':
        getRoomDetails();
        break;
    case 'get_available_rooms':
        getAvailableRooms();
        break;
    case 'get_booking_summary':
        getBookingSummary();
        break;
    case 'get_booking_details':
        getBookingDetails();
        break;
    case 'get_amenities':
        getAmenities();
        break;
    case 'get_amenity':
        getAmenity();
        break;
    case 'subscribe_newsletter':
        subscribeNewsletter();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

// Get featured rooms
function getFeaturedRooms() {
    global $db;
    
    try {
        if (!$db || !$db->getConnection()) {
            throw new Exception('Database connection failed');
        }
        
        $sql = "SELECT id, room_name, description, price, capacity, room_type, beds, size, main_image, status 
                FROM rooms 
                WHERE status = 'available' 
                ORDER BY price DESC 
                LIMIT 3";
        $rooms = $db->select($sql);
        
        echo json_encode(['success' => true, 'rooms' => $rooms]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => $e->getMessage(),
            'error_details' => 'Error in getFeaturedRooms function'
        ]);
    }
}

// Get all rooms with optional filters
function getAllRooms() {
    global $db;
    
    try {
        if (!$db || !$db->getConnection()) {
            throw new Exception('Database connection failed');
        }
        
        $sql = "SELECT id, room_name, description, price, capacity, room_type, beds, size, main_image, status 
                FROM rooms 
                WHERE status = 'available'";
        $params = [];
        
        // Apply filters
        if (isset($_GET['type']) && $_GET['type'] !== '') {
            $sql .= " AND room_type = :type";
            $params[':type'] = $_GET['type'];
        }
        
        if (isset($_GET['capacity']) && $_GET['capacity'] !== '') {
            $sql .= " AND capacity >= :capacity";
            $params[':capacity'] = $_GET['capacity'];
        }
        
        if (isset($_GET['max_price']) && $_GET['max_price'] !== '') {
            $sql .= " AND price <= :max_price";
            $params[':max_price'] = $_GET['max_price'];
        }
        
        $sql .= " ORDER BY price ASC";
        
        $rooms = $db->select($sql, $params);
        
        // Debug - check if any rooms were found
        if (empty($rooms)) {
            echo json_encode([
                'success' => true,
                'rooms' => [],
                'message' => 'No rooms found in database',
                'debug_sql' => $sql,
                'debug_params' => $params
            ]);
            return;
        }
        
        echo json_encode(['success' => true, 'rooms' => $rooms]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => $e->getMessage(),
            'error_details' => 'Error in getAllRooms function'
        ]);
    }
}

// Get detailed room information
function getRoomDetails() {
    global $db;
    
    try {
        if (!$db || !$db->getConnection()) {
            throw new Exception('Database connection failed');
        }
        
        if (!isset($_GET['id'])) {
            throw new Exception('Room ID is required');
        }
        
        $roomId = $_GET['id'];
        
        // Get room details
        $roomSql = "SELECT id, room_name, description, price, capacity, room_type, beds, size, main_image, status 
                    FROM rooms 
                    WHERE id = :id";
        $room = $db->selectOne($roomSql, [':id' => $roomId]);
        
        if (!$room) {
            throw new Exception('Room not found');
        }
        
        // Get room images
        $imagesSql = "SELECT image_url FROM room_images WHERE room_id = :room_id";
        $images = $db->select($imagesSql, [':room_id' => $roomId]);
        
        // Get room amenities
        $amenitiesSql = "SELECT a.id, a.name, a.icon 
                         FROM amenities a 
                         JOIN room_amenities ra ON a.id = ra.amenity_id 
                         WHERE ra.room_id = :room_id";
        $amenities = $db->select($amenitiesSql, [':room_id' => $roomId]);
        
        // Add images and amenities to room data
        $room['images'] = $images;
        $room['amenities'] = $amenities;
        
        echo json_encode(['success' => true, 'room' => $room]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => $e->getMessage(),
            'error_details' => 'Error in getRoomDetails function'
        ]);
    }
}

// Get available rooms for booking
function getAvailableRooms() {
    global $db;
    
    try {
        if (!$db || !$db->getConnection()) {
            throw new Exception('Database connection failed');
        }
        
        if (!isset($_GET['check_in']) || !isset($_GET['check_out'])) {
            throw new Exception('Check-in and check-out dates are required');
        }
        
        $checkIn = $_GET['check_in'];
        $checkOut = $_GET['check_out'];
        $adults = isset($_GET['adults']) ? $_GET['adults'] : 1;
        $children = isset($_GET['children']) ? $_GET['children'] : 0;
        
        // Validate dates
        $checkInDate = new DateTime($checkIn);
        $checkOutDate = new DateTime($checkOut);
        $today = new DateTime();
        
        if ($checkInDate < $today) {
            throw new Exception('Check-in date cannot be in the past');
        }
        
        if ($checkOutDate <= $checkInDate) {
            throw new Exception('Check-out date must be after check-in date');
        }
        
        // Calculate total capacity needed
        $totalGuests = $adults + $children;
        
        // Get available rooms
        $sql = "SELECT r.id, r.room_name, r.description, r.price, r.capacity, r.room_type, r.beds, r.size, r.main_image
                FROM rooms r
                WHERE r.status = 'available'
                AND r.capacity >= :capacity
                AND r.id NOT IN (
                    SELECT b.room_id
                    FROM bookings b
                    WHERE (b.check_in <= :check_out AND b.check_out >= :check_in)
                    AND b.status != 'cancelled'
                )
                ORDER BY r.price ASC";
        
        $params = [
            ':capacity' => $totalGuests,
            ':check_in' => $checkIn,
            ':check_out' => $checkOut
        ];
        
        $rooms = $db->select($sql, $params);
        
        echo json_encode(['success' => true, 'rooms' => $rooms]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => $e->getMessage(),
            'error_details' => 'Error in getAvailableRooms function'
        ]);
    }
}

// Get booking summary with price calculation
function getBookingSummary() {
    global $db;
    
    try {
        if (!$db || !$db->getConnection()) {
            throw new Exception('Database connection failed');
        }
        
        if (!isset($_GET['room_id']) || !isset($_GET['check_in']) || !isset($_GET['check_out'])) {
            throw new Exception('Room ID, check-in, and check-out dates are required');
        }
        
        $roomId = $_GET['room_id'];
        $checkIn = $_GET['check_in'];
        $checkOut = $_GET['check_out'];
        
        // Get room details
        $roomSql = "SELECT room_name, price FROM rooms WHERE id = :id";
        $room = $db->selectOne($roomSql, [':id' => $roomId]);
        
        if (!$room) {
            throw new Exception('Room not found');
        }
        
        // Calculate number of nights
        $checkInDate = new DateTime($checkIn);
        $checkOutDate = new DateTime($checkOut);
        $interval = $checkInDate->diff($checkOutDate);
        $nights = $interval->days;
        
        // Calculate prices
        $roomPrice = $room['price'];
        $subtotal = $roomPrice * $nights;
        $taxesAndFees = $subtotal * TAX_RATE;
        $total = $subtotal + $taxesAndFees;
        
        $summary = [
            'room_name' => $room['room_name'],
            'price' => $roomPrice,
            'nights' => $nights,
            'subtotal' => $subtotal,
            'taxes_and_fees' => $taxesAndFees,
            'total' => $total
        ];
        
        echo json_encode(['success' => true, 'summary' => $summary]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => $e->getMessage(),
            'error_details' => 'Error in getBookingSummary function'
        ]);
    }
}

// Get booking details by ID
function getBookingDetails() {
    global $db;
    
    try {
        if (!$db || !$db->getConnection()) {
            throw new Exception('Database connection failed');
        }
        
        if (!isset($_GET['booking_id'])) {
            throw new Exception('Booking ID is required');
        }
        
        $bookingId = $_GET['booking_id'];
        
        $sql = "SELECT b.*, r.room_name, r.room_type 
                FROM bookings b
                JOIN rooms r ON b.room_id = r.id
                WHERE b.id = :booking_id";
        
        $booking = $db->selectOne($sql, [':booking_id' => $bookingId]);
        
        if (!$booking) {
            throw new Exception('Booking not found');
        }
        
        echo json_encode(['success' => true, 'booking' => $booking]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => $e->getMessage(),
            'error_details' => 'Error in getBookingDetails function'
        ]);
    }
}

// Get all amenities
function getAmenities() {
    global $db;
    
    try {
        if (!$db || !$db->getConnection()) {
            throw new Exception('Database connection failed');
        }
        
        $sql = "SELECT id, name, icon FROM amenities ORDER BY name";
        $amenities = $db->select($sql);
        
        echo json_encode(['success' => true, 'amenities' => $amenities]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => $e->getMessage(),
            'error_details' => 'Error in getAmenities function'
        ]);
    }
}

// Get single amenity by ID
function getAmenity() {
    global $db;
    
    try {
        if (!$db || !$db->getConnection()) {
            throw new Exception('Database connection failed');
        }
        
        if (!isset($_GET['id'])) {
            throw new Exception('Amenity ID is required');
        }
        
        $amenityId = $_GET['id'];
        
        $sql = "SELECT id, name, icon FROM amenities WHERE id = :id";
        $amenity = $db->selectOne($sql, [':id' => $amenityId]);
        
        if (!$amenity) {
            throw new Exception('Amenity not found');
        }
        
        echo json_encode(['success' => true, 'amenity' => $amenity]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => $e->getMessage(),
            'error_details' => 'Error in getAmenity function'
        ]);
    }
}

// Subscribe to newsletter
function subscribeNewsletter() {
    // Get JSON data from request body
    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);
    
    if (!$data || !isset($data['email'])) {
        echo json_encode(['success' => false, 'message' => 'Email is required']);
        return;
    }
    
    $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
    if (!$email) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }
    
    // In a real application, you would add this to a subscribers database table
    // For now, we'll just simulate a successful subscription
    echo json_encode(['success' => true, 'message' => 'Successfully subscribed to newsletter']);
}
?>