<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration
require_once 'config.php';

session_start();

// Function to create a simple HTML page with message
function showPage($title, $message) {
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>' . $title . '</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
            .container { max-width: 800px; margin: 0 auto; background: #f9f9f9; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
            h1 { color: #1E88E5; }
            .success { color: green; }
            .error { color: red; }
            .info { color: #1E88E5; }
            pre { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; border-radius: 3px; overflow: auto; }
            a.button { background: #1E88E5; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer; text-decoration: none; display: inline-block; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>' . $title . '</h1>
            ' . $message . '
        </div>
    </body>
    </html>';
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    try {
        // Connect to database
        $conn = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Get user from database - using direct parameter to avoid binding issues
        $stmt = $conn->prepare("SELECT id, username, password, role FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            // Set session variables
            $_SESSION['admin_id'] = $user['id'];
            $_SESSION['admin_username'] = $user['username'];
            $_SESSION['admin_role'] = $user['role'];
            
            // Create a token for the admin panel
            $token = bin2hex(random_bytes(32));
            $_SESSION['admin_token'] = $token;
            
            // Update last login time - using direct parameter to avoid binding issues
            $updateStmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $updateStmt->execute([$user['id']]);
            
            // For client-side token storage
            $output = "<p class='success'>Login successful! Redirecting to admin dashboard...</p>";
            $output .= "<p>Please store this token if needed: <code>" . $token . "</code></p>";
            $output .= "<script>
                localStorage.setItem('admin_token', '" . $token . "');
                setTimeout(function() {
                    window.location.href = '../admin/dashboard.html';
                }, 2000);
            </script>";
            $output .= "<p><a href='../admin/dashboard.html' class='button'>Go to Dashboard Now</a></p>";
            
            showPage('Login Successful', $output);
        } else {
            $output = "<p class='error'>Invalid username or password</p>";
            $output .= "<h3>Debug Information:</h3>";
            $output .= "<p>Username entered: " . htmlspecialchars($username) . "</p>";
            $output .= "<p>User found in database: " . ($user ? "Yes" : "No") . "</p>";
            
            if ($user) {
                $output .= "<p>Password verification result: " . (password_verify($password, $user['password']) ? "Success" : "Failed") . "</p>";
                $output .= "<p>Stored password hash: " . $user['password'] . "</p>";
                $output .= "<p>Input password: " . $password . "</p>";
            }
            
            $output .= "<p><a href='fix_admin.php' class='button'>Go back and try again</a></p>";
            
            showPage('Login Failed', $output);
        }
    } catch(PDOException $e) {
        $output = "<p class='error'>Database Error: " . $e->getMessage() . "</p>";
        $output .= "<p><a href='fix_admin.php' class='button'>Go back and try again</a></p>";
        
        showPage('Login Error', $output);
    }
} else {
    // Not a POST request
    $output = "<p class='error'>Invalid request. Please use the login form.</p>";
    $output .= "<p><a href='fix_admin.php' class='button'>Go to login form</a></p>";
    
    showPage('Error', $output);
}
?>