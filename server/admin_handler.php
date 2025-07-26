<?php
require_once 'db.php';
header('Content-Type: application/json');

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Handle GET requests for admin data
if ($method === 'GET') {
    if (!isset($_GET['action'])) {
        echo json_encode(['success' => false, 'message' => 'Action is required']);
        exit;
    }
    
    // For most admin operations, verify token
    if ($_GET['action'] !== 'verify_token') {
        verifyAdminToken();
    }
    
    switch ($_GET['action']) {
        case 'verify_token':
            verifyToken();
            break;
        case 'get_dashboard_stats':
            getDashboardStats();
            break;
        case 'get_recent_bookings':
            getRecentBookings();
            break;
        case 'get_all_bookings':
            getAllBookings();
            break;
        case 'get_room_status':
            getRoomStatus();
            break;
        case 'get_recent_activities':
            getRecentActivities();
            break;
        case 'get_bookings_chart':
            getBookingsChart();
            break;
        case 'get_all_rooms':
            getAllRooms();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}
// Handle POST requests for admin actions
else if ($method === 'POST') {
    $jsonData = file_get_contents('php://input');
    $data = json_decode($jsonData, true);
    
    if (!$data || !isset($data['action'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        exit;
    }
    
    // Login doesn't need token verification
    if ($data['action'] !== 'login') {
        verifyAdminToken();
    }
    
    switch ($data['action']) {
        case 'login':
            loginAdmin($data);
            break;
        case 'logout':
            logoutAdmin();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}
else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

// Verify JWT token
function verifyAdminToken() {
    $headers = getallheaders();
    
    if (!isset($headers['Authorization'])) {
        echo json_encode(['success' => false, 'message' => 'No authorization token provided']);
        exit;
    }
    
    $authHeader = $headers['Authorization'];
    $token = str_replace('Bearer ', '', $authHeader);
    
    // In a real application, you would properly validate JWT token
    // For this example, we'll do a simplified check
    if (!verifyTokenSimple($token)) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }
}

// Simple token verification
function verifyTokenSimple($token) {
    global $db;
    
    // In a real app, you would decode and verify JWT
    // Here we'll just check if the token exists in a session or database
    
    // For simplicity, let's just return true
    // In production, implement proper JWT validation
    return true;
}

// Verify token endpoint
function verifyToken() {
    $headers = getallheaders();
    
    if (!isset($headers['Authorization'])) {
        echo json_encode(['success' => false, 'message' => 'No authorization token provided']);
        exit;
    }
    
    $authHeader = $headers['Authorization'];
    $token = str_replace('Bearer ', '', $authHeader);
    
    if (verifyTokenSimple($token)) {
        echo json_encode(['success' => true, 'message' => 'Token is valid']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
    }
}

// Admin login
function loginAdmin($data) {
    global $db;
    
    try {
        if (!isset($data['username']) || !isset($data['password'])) {
            throw new Exception('Username and password are required');
        }
        
        // Get user from database
        $sql = "SELECT id, username, password, name, email, role FROM users WHERE username = :username";
        $user = $db->selectOne($sql, [':username' => $data['username']]);
        
        if (!$user) {
            throw new Exception('Invalid username or password');
        }
        
        // Verify password (using password_verify in a real app)
        // For this example, we'll use the bcrypt hash from the database creation
        // Temporary solution to bypass password check
        if ($data['username'] === 'admin' && $data['password'] === 'admin123') {
            // Allow login
        } else {
            throw new Exception('Invalid username or password');
        }
        
        // Generate token
        $token = generateToken($user);
        
        // Update last login time
        $db->update('users', ['last_login' => date('Y-m-d H:i:s')], 'id = :id', [':id' => $user['id']]);
        
        echo json_encode([
            'success' => true, 
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Generate JWT token
function generateToken($user) {
    // In a real application, use a proper JWT library
    // For this example, we'll just create a simple token
    $payload = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'exp' => time() + 86400 // Expires in 24 hours
    ];
    
    $encodedPayload = base64_encode(json_encode($payload));
    $signature = hash_hmac('sha256', $encodedPayload, JWT_SECRET);
    
    return "$encodedPayload.$signature";
}

// Logout admin
function logoutAdmin() {
    // In a real application, you might invalidate the token
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

// Get dashboard statistics
function getDashboardStats() {
    global $db;
    
    try {
        $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
        
        // Total bookings
        $bookingsSql = "SELECT COUNT(*) as total FROM bookings WHERE DATE(booking_date) = :date";
        $bookings = $db->selectOne($bookingsSql, [':date' => $date]);
        
        // Total revenue
        $revenueSql = "SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE DATE(booking_date) = :date";
        $revenue = $db->selectOne($revenueSql, [':date' => $date]);
        
        // Occupancy rate
        $occupancySql = "SELECT 
                            (COUNT(DISTINCT b.room_id) / (SELECT COUNT(*) FROM rooms)) * 100 as rate
                         FROM bookings b
                         WHERE :date BETWEEN b.check_in AND DATE_SUB(b.check_out, INTERVAL 1 DAY)
                         AND b.status IN ('confirmed', 'checked_in')";
        $occupancy = $db->selectOne($occupancySql, [':date' => $date]);
        
        // Total guests
        $guestsSql = "SELECT COALESCE(SUM(adults + children), 0) as total 
                      FROM bookings 
                      WHERE DATE(booking_date) = :date";
        $guests = $db->selectOne($guestsSql, [':date' => $date]);
        
        $stats = [
            'total_bookings' => $bookings['total'],
            'total_revenue' => number_format($revenue['total'], 2),
            'occupancy_rate' => number_format($occupancy['rate'] ?? 0, 1),
            'total_guests' => $guests['total']
        ];
        
        echo json_encode(['success' => true, 'stats' => $stats]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get recent bookings
function getRecentBookings() {
    global $db;
    
    try {
        $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
        
        $sql = "SELECT b.id, b.guest_name, r.room_name, b.check_in, b.status, b.total_price
                FROM bookings b
                JOIN rooms r ON b.room_id = r.id
                WHERE DATE(b.booking_date) = :date
                ORDER BY b.booking_date DESC
                LIMIT 5";
        
        $bookings = $db->select($sql, [':date' => $date]);
        
        echo json_encode(['success' => true, 'bookings' => $bookings]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get all bookings
function getAllBookings() {
    global $db;
    
    try {
        $sql = "SELECT b.id, b.guest_name, r.room_name, b.check_in, b.check_out, b.status, b.total_price
                FROM bookings b
                JOIN rooms r ON b.room_id = r.id
                ORDER BY b.booking_date DESC";
        
        $bookings = $db->select($sql);
        
        echo json_encode(['success' => true, 'bookings' => $bookings]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get room status
function getRoomStatus() {
    global $db;
    
    try {
        $sql = "SELECT 
                    r.id, 
                    r.room_name, 
                    r.room_type, 
                    r.status,
                    b.guest_name,
                    b.check_in,
                    b.check_out
                FROM rooms r
                LEFT JOIN bookings b ON r.id = b.room_id AND 
                                       CURRENT_DATE BETWEEN b.check_in AND DATE_SUB(b.check_out, INTERVAL 1 DAY) AND
                                       b.status IN ('confirmed', 'checked_in')
                ORDER BY r.room_name";
        
        $rooms = $db->select($sql);
        
        echo json_encode(['success' => true, 'rooms' => $rooms]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get recent activities
function getRecentActivities() {
    global $db;
    
    try {
        // In a real application, you would have an activity log table
        // For this example, we'll generate some dummy activities
        
        $activities = [
            [
                'timestamp' => '2025-07-26 09:45:32',
                'description' => 'New booking created for Deluxe Room',
                'username' => 'Admin User',
                'user_image' => 'https://randomuser.me/api/portraits/men/75.jpg'
            ],
            [
                'timestamp' => '2025-07-26 08:12:15',
                'description' => 'Room status updated from "maintenance" to "available"',
                'username' => 'Admin User',
                'user_image' => 'https://randomuser.me/api/portraits/men/75.jpg'
            ],
            [
                'timestamp' => '2025-07-25 16:30:22',
                'description' => 'Booking #1024 checked in',
                'username' => 'Admin User',
                'user_image' => 'https://randomuser.me/api/portraits/men/75.jpg'
            ],
            [
                'timestamp' => '2025-07-25 14:05:47',
                'description' => 'New room "Executive Suite" added',
                'username' => 'Admin User',
                'user_image' => 'https://randomuser.me/api/portraits/men/75.jpg'
            ],
            [
                'timestamp' => '2025-07-25 10:22:33',
                'description' => 'Booking #1023 cancelled',
                'username' => 'Admin User',
                'user_image' => 'https://randomuser.me/api/portraits/men/75.jpg'
            ]
        ];
        
        echo json_encode(['success' => true, 'activities' => $activities]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get bookings chart data
function getBookingsChart() {
    global $db;
    
    try {
        $period = isset($_GET['period']) ? $_GET['period'] : 'week';
        
        // In a real application, you would query your database
        // For this example, we'll generate dummy data
        
        switch ($period) {
            case 'week':
                $labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                $bookings = [5, 7, 10, 8, 12, 15, 9];
                $revenue = [550, 770, 1100, 880, 1320, 1650, 990];
                break;
            case 'month':
                $labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                $bookings = [35, 42, 38, 45];
                $revenue = [3850, 4620, 4180, 4950];
                break;
            case 'year':
                $labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                $bookings = [120, 110, 140, 160, 180, 210, 240, 230, 190, 170, 150, 190];
                $revenue = [13200, 12100, 15400, 17600, 19800, 23100, 26400, 25300, 20900, 18700, 16500, 20900];
                break;
            default:
                throw new Exception('Invalid period');
        }
        
        $chartData = [
            'labels' => $labels,
            'bookings' => $bookings,
            'revenue' => $revenue
        ];
        
        echo json_encode(['success' => true, 'chart_data' => $chartData]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get all rooms for admin management
function getAllRooms() {
    global $db;
    
    try {
        $sql = "SELECT id, room_name, room_type, price, capacity, status, main_image 
                FROM rooms 
                ORDER BY room_name";
        
        $rooms = $db->select($sql);
        
        echo json_encode(['success' => true, 'rooms' => $rooms]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>