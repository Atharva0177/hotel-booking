-- Create database
-- CREATE DATABASE hotel_paradise;
USE hotel_paradise;

-- Rooms table
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    capacity INT NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    beds INT NOT NULL,
    size VARCHAR(20) NOT NULL,
    main_image VARCHAR(255) NOT NULL,
    status ENUM('available', 'booked', 'maintenance') DEFAULT 'available'
);

-- Room images table
CREATE TABLE room_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Amenities table
CREATE TABLE amenities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(100) NOT NULL
);

-- Room amenities relationship table
CREATE TABLE room_amenities (
    room_id INT NOT NULL,
    amenity_id INT NOT NULL,
    PRIMARY KEY (room_id, amenity_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    guest_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(100) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    adults INT NOT NULL,
    children INT DEFAULT 0,
    special_requests TEXT,
    total_price DECIMAL(10, 2) NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Users table (for admin access)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff',
    last_login TIMESTAMP NULL
);

-- Insert initial data for amenities
INSERT INTO amenities (name, icon) VALUES 
('Wi-Fi', 'fa-wifi'),
('Air Conditioning', 'fa-snowflake'),
('TV', 'fa-tv'),
('Mini Bar', 'fa-glass-martini-alt'),
('Room Service', 'fa-concierge-bell'),
('Swimming Pool', 'fa-swimming-pool'),
('Gym', 'fa-dumbbell'),
('Parking', 'fa-parking'),
('Restaurant', 'fa-utensils'),
('Spa', 'fa-spa');

-- Insert admin user
INSERT INTO users (username, password, name, email, role) VALUES
('admin', '$2y$10$8K1p/a7OZWg64QYJv.0zGeuSh5EhKv1Jn9QVYqFpLKzOjqM64GuNi', 'Admin User', 'admin@hotelparadise.com', 'admin');
-- Password is 'admin123' (hashed with bcrypt)