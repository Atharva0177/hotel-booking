<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration
require_once 'config.php';

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
            button, .button { background: #1E88E5; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 10px; }
            input { padding: 8px; width: 100%; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 3px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
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

try {
    // Connect directly to MySQL
    $conn = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $output = "<p class='success'>✓ Database connection successful</p>";
    
    // Check if users table exists
    $stmt = $conn->query("SHOW TABLES LIKE 'users'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        // Create users table
        $sql = "CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            role ENUM('admin', 'staff') DEFAULT 'admin',
            last_login TIMESTAMP NULL
        )";
        $conn->exec($sql);
        $output .= "<p class='success'>✓ Users table created successfully</p>";
    } else {
        $output .= "<p class='info'>✓ Users table already exists</p>";
    }
    
    // Create new admin password hash
    $adminPassword = 'admin123';
    $passwordHash = password_hash($adminPassword, PASSWORD_DEFAULT);
    
    // Check if admin user exists
    $stmt = $conn->query("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $adminExists = (int)$stmt->fetchColumn() > 0;
    
    if ($adminExists) {
        // Update admin password - using direct parameter to avoid binding issues
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE username = 'admin'");
        $stmt->execute([$passwordHash]);
        $output .= "<p class='success'>✓ Admin user password updated successfully</p>";
    } else {
        // Insert admin user - using direct parameters to avoid binding issues
        $stmt = $conn->prepare("INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['admin', $passwordHash, 'Administrator', 'admin@hotelparadise.com', 'admin']);
        $output .= "<p class='success'>✓ Admin user created successfully</p>";
    }
    
    // Add login form
    $output .= '
    <h2>Admin Login Details</h2>
    <p>You can now log in to the admin panel with these credentials:</p>
    <p><strong>Username:</strong> admin<br>
    <strong>Password:</strong> admin123</p>
    
    <h2>Login Now</h2>
    <form action="admin_direct_login.php" method="POST">
        <div>
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" value="admin">
        </div>
        <div>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" value="admin123">
        </div>
        <button type="submit">Login to Admin Panel</button>
    </form>
    
    <p><a href="../admin/" class="button">Go to Admin Login Page</a></p>';
    
    // Show the page
    showPage('Hotel Paradise Admin Repair', $output);
    
} catch(PDOException $e) {
    $errorMessage = "<p class='error'>Database Error: " . $e->getMessage() . "</p>";
    $errorMessage .= "<p>Please check your database configuration in server/config.php:</p>";
    $errorMessage .= "<pre>DB_HOST: " . DB_HOST . "\nDB_USER: " . DB_USER . "\nDB_NAME: " . DB_NAME . "</pre>";
    showPage('Database Connection Error', $errorMessage);
}
?>