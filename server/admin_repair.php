<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration
require_once 'config.php';

// Connect to database directly using PDO
try {
    $conn = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p>Database connection successful!</p>";
    
    // Check if users table exists
    $stmt = $conn->prepare("SHOW TABLES LIKE 'users'");
    $stmt->execute();
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        // Create users table if it doesn't exist
        $sql = "CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            role ENUM('admin', 'staff') DEFAULT 'staff',
            last_login TIMESTAMP NULL
        )";
        $conn->exec($sql);
        echo "<p>Users table created successfully!</p>";
    } else {
        echo "<p>Users table already exists.</p>";
    }
    
    // Check if admin user exists
    $stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    $adminExists = (int)$stmt->fetchColumn() > 0;
    
    // Create or update admin user
    if ($adminExists) {
        $stmt = $conn->prepare("UPDATE users SET password = :password WHERE username = 'admin'");
        $stmt->bindValue(':password', password_hash('admin123', PASSWORD_DEFAULT));
        $stmt->execute();
        echo "<p>Admin user password updated successfully!</p>";
    } else {
        $stmt = $conn->prepare("INSERT INTO users (username, password, name, email, role) VALUES 
                              ('admin', :password, 'Administrator', 'admin@hotelparadise.com', 'admin')");
        $stmt->bindValue(':password', password_hash('admin123', PASSWORD_DEFAULT));
        $stmt->execute();
        echo "<p>Admin user created successfully!</p>";
    }
    
    // Create a simple login form
    echo <<<HTML
    <h2>Direct Admin Login</h2>
    <form action="admin_direct_login.php" method="POST">
        <div>
            <label>Username: </label>
            <input type="text" name="username" value="admin" readonly>
        </div>
        <div style="margin-top: 10px;">
            <label>Password: </label>
            <input type="password" name="password" value="admin123">
        </div>
        <div style="margin-top: 15px;">
            <button type="submit">Login Directly</button>
        </div>
    </form>
    <p>Use username <strong>admin</strong> and password <strong>admin123</strong></p>
    HTML;
    
} catch(PDOException $e) {
    echo "<p>Connection failed: " . $e->getMessage() . "</p>";
}
?>