// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuth();
    
    // Admin Login Form
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            
            // Send login request
            fetch('../server/admin_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    username: username,
                    password: password,
                    remember: remember
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Store token in localStorage or sessionStorage
                    if (remember) {
                        localStorage.setItem('admin_token', data.token);
                    } else {
                        sessionStorage.setItem('admin_token', data.token);
                    }
                    
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again later.');
            });
        });
    }
    
    // Logout Button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Send logout request
            fetch('../server/admin_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getToken()
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            })
            .then(() => {
                // Remove token and redirect to login
                localStorage.removeItem('admin_token');
                sessionStorage.removeItem('admin_token');
                window.location.href = 'index.html';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred during logout.');
            });
        });
    }
    
    // Sidebar Toggle on Mobile
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    
    if (hamburgerMenu && sidebar) {
        hamburgerMenu.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Load Dashboard Data
    if (document.querySelector('.dashboard-content')) {
        loadDashboardStats();
        loadRecentBookings();
        loadRoomStatus();
        loadRecentActivities();
        initBookingsChart();
    }
    
    // Room Management
    if (document.querySelector('.room-management')) {
        loadRooms();
        
        // Add Room Button
        const addRoomBtn = document.getElementById('add-room-btn');
        if (addRoomBtn) {
            addRoomBtn.addEventListener('click', function() {
                openRoomModal();
            });
        }
    }
    
    // Booking Management
    if (document.querySelector('.booking-management')) {
        loadBookings();
    }
    
    // Date picker for filtering
    const dashboardDate = document.getElementById('dashboard-date');
    if (dashboardDate) {
        dashboardDate.value = new Date().toISOString().split('T')[0];
        dashboardDate.addEventListener('change', function() {
            loadDashboardStats(this.value);
            loadRecentBookings(this.value);
        });
    }
    
    // Period buttons for chart
    const periodButtons = document.querySelectorAll('.period-btn');
    if (periodButtons.length > 0) {
        periodButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                periodButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update chart
                const period = this.getAttribute('data-period');
                updateBookingsChart(period);
            });
        });
    }
});

// Check if user is authenticated
function checkAuth() {
    // Skip auth check on login page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/admin/')) {
        return;
    }
    
    const token = getToken();
    
    if (!token) {
        // Redirect to login page
        window.location.href = 'index.html';
        return;
    }
    
    // Verify token
    fetch('../server/admin_handler.php?action=verify_token', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            // Token is invalid, redirect to login
            localStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin_token');
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Get token from storage
function getToken() {
    return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
}

// Load dashboard statistics
function loadDashboardStats(date = null) {
    const totalBookings = document.getElementById('total-bookings');
    const totalRevenue = document.getElementById('total-revenue');
    const occupancyRate = document.getElementById('occupancy-rate');
    const totalGuests = document.getElementById('total-guests');
    
    if (!totalBookings || !totalRevenue || !occupancyRate || !totalGuests) {
        return;
    }
    
    let url = '../server/admin_handler.php?action=get_dashboard_stats';
    if (date) {
        url += `&date=${date}`;
    }
    
    fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + getToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const stats = data.stats;
            
            totalBookings.textContent = stats.total_bookings;
            totalRevenue.textContent = '$' + stats.total_revenue;
            occupancyRate.textContent = stats.occupancy_rate + '%';
            totalGuests.textContent = stats.total_guests;
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Load recent bookings
function loadRecentBookings(date = null) {
    const recentBookingsTable = document.getElementById('recent-bookings-table');
    if (!recentBookingsTable) {
        return;
    }
    
    const tbody = recentBookingsTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="6">Loading recent bookings...</td></tr>';
    
    let url = '../server/admin_handler.php?action=get_recent_bookings';
    if (date) {
        url += `&date=${date}`;
    }
    
    fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + getToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.bookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">No bookings found.</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            data.bookings.forEach(booking => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${booking.id}</td>
                    <td>${booking.guest_name}</td>
                    <td>${booking.room_name}</td>
                    <td>${formatDate(booking.check_in)}</td>
                    <td><span class="status ${booking.status.toLowerCase()}">${booking.status}</span></td>
                    <td>$${booking.total_price}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="6">Error: ${data.message}</td></tr>`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="6">Error loading bookings.</td></tr>';
    });
}

// Load room status
function loadRoomStatus() {
    const roomStatusGrid = document.getElementById('room-status-grid');
    if (!roomStatusGrid) {
        return;
    }
    
    roomStatusGrid.innerHTML = '<div class="loading">Loading room status...</div>';
    
    fetch('../server/admin_handler.php?action=get_room_status', {
        headers: {
            'Authorization': 'Bearer ' + getToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.rooms.length === 0) {
                roomStatusGrid.innerHTML = '<p>No rooms found.</p>';
                return;
            }
            
            roomStatusGrid.innerHTML = '';
            data.rooms.forEach(room => {
                const roomElement = document.createElement('div');
                roomElement.className = `room-status-item ${room.status.toLowerCase()}`;
                
                let details = '';
                if (room.status === 'booked') {
                    details = `
                        <div class="room-status-details">
                            ${room.guest_name}<br>
                            ${formatDate(room.check_in)} - ${formatDate(room.check_out)}
                        </div>
                    `;
                }
                
                roomElement.innerHTML = `
                    <div class="room-number">${room.room_name}</div>
                    <div class="room-type">${room.room_type}</div>
                    <div class="room-status status-${room.status.toLowerCase()}">${room.status}</div>
                    ${details}
                `;
                
                roomStatusGrid.appendChild(roomElement);
            });
        } else {
            roomStatusGrid.innerHTML = `<p>Error: ${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        roomStatusGrid.innerHTML = '<p>Error loading room status.</p>';
    });
}

// Load recent activities
function loadRecentActivities() {
    const activityTimeline = document.getElementById('activity-timeline');
    if (!activityTimeline) {
        return;
    }
    
    activityTimeline.innerHTML = '<div class="loading">Loading recent activities...</div>';
    
    fetch('../server/admin_handler.php?action=get_recent_activities', {
        headers: {
            'Authorization': 'Bearer ' + getToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.activities.length === 0) {
                activityTimeline.innerHTML = '<p>No recent activities.</p>';
                return;
            }
            
            activityTimeline.innerHTML = '';
            data.activities.forEach(activity => {
                const activityElement = document.createElement('div');
                activityElement.className = 'activity-item';
                activityElement.innerHTML = `
                    <div class="activity-time">${formatDateTime(activity.timestamp)}</div>
                    <div class="activity-text">${activity.description}</div>
                    <div class="activity-user">
                        <img src="${activity.user_image}" alt="${activity.username}">
                        <span>${activity.username}</span>
                    </div>
                `;
                
                activityTimeline.appendChild(activityElement);
            });
        } else {
            activityTimeline.innerHTML = `<p>Error: ${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        activityTimeline.innerHTML = '<p>Error loading recent activities.</p>';
    });
}

// Initialize bookings chart
function initBookingsChart() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) {
        return;
    }
    
    updateBookingsChart('week');
}

// Update bookings chart
function updateBookingsChart(period) {
    const chartCanvas = document.getElementById('bookings-chart');
    if (!chartCanvas) {
        return;
    }
    
    fetch(`../server/admin_handler.php?action=get_bookings_chart&period=${period}`, {
        headers: {
            'Authorization': 'Bearer ' + getToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const chartData = data.chart_data;
            
            // Destroy existing chart if exists
            if (window.bookingsChart) {
                window.bookingsChart.destroy();
            }
            
            // Create new chart
            window.bookingsChart = new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Bookings',
                        data: chartData.bookings,
                        borderColor: '#1E88E5',
                        backgroundColor: 'rgba(30, 136, 229, 0.1)',
                        tension: 0.3,
                        fill: true
                    }, {
                        label: 'Revenue',
                        data: chartData.revenue,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.3,
                        fill: true,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Bookings'
                            }
                        },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false
                            },
                            title: {
                                display: true,
                                text: 'Revenue ($)'
                            }
                        }
                    }
                }
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Load all rooms for management
function loadRooms() {
    const roomsContainer = document.querySelector('.room-grid');
    if (!roomsContainer) {
        return;
    }
    
    roomsContainer.innerHTML = '<div class="loading">Loading rooms...</div>';
    
    fetch('../server/admin_handler.php?action=get_all_rooms', {
        headers: {
            'Authorization': 'Bearer ' + getToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.rooms.length === 0) {
                roomsContainer.innerHTML = '<p>No rooms found.</p>';
                return;
            }
            
            roomsContainer.innerHTML = '';
            data.rooms.forEach(room => {
                const roomElement = document.createElement('div');
                roomElement.className = 'room-card';
                roomElement.innerHTML = `
                    <div class="room-image">
                        <img src="../${room.main_image}" alt="${room.room_name}">
                    </div>
                    <div class="room-details">
                        <h3>${room.room_name}</h3>
                        <p>${room.room_type} - $${room.price}</p>
                        <div class="room-status status-${room.status.toLowerCase()}">${room.status}</div>
                        <div class="room-actions">
                            <button class="btn-primary edit-room-btn" data-id="${room.id}">Edit</button>
                            <button class="btn-danger delete-room-btn" data-id="${room.id}">Delete</button>
                        </div>
                    </div>
                `;
                
                roomsContainer.appendChild(roomElement);
            });
            
            // Add event listeners to edit and delete buttons
            const editButtons = document.querySelectorAll('.edit-room-btn');
            const deleteButtons = document.querySelectorAll('.delete-room-btn');
            
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const roomId = this.getAttribute('data-id');
                    openRoomModal(roomId);
                });
            });
            
            deleteButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const roomId = this.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this room?')) {
                        deleteRoom(roomId);
                    }
                });
            });
        } else {
            roomsContainer.innerHTML = `<p>Error: ${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        roomsContainer.innerHTML = '<p>Error loading rooms.</p>';
    });
}

// Load all bookings for management
function loadBookings() {
    const bookingsContainer = document.querySelector('.bookings-table tbody');
    if (!bookingsContainer) {
        return;
    }
    
    bookingsContainer.innerHTML = '<tr><td colspan="7">Loading bookings...</td></tr>';
    
    fetch('../server/admin_handler.php?action=get_all_bookings', {
        headers: {
            'Authorization': 'Bearer ' + getToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.bookings.length === 0) {
                bookingsContainer.innerHTML = '<tr><td colspan="7">No bookings found.</td></tr>';
                return;
            }
            
            bookingsContainer.innerHTML = '';
            data.bookings.forEach(booking => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${booking.id}</td>
                    <td>${booking.guest_name}</td>
                    <td>${booking.room_name}</td>
                    <td>${formatDate(booking.check_in)} - ${formatDate(booking.check_out)}</td>
                    <td><span class="status ${booking.status.toLowerCase()}">${booking.status}</span></td>
                    <td>$${booking.total_price}</td>
                    <td>
                        <button class="btn-primary view-booking-btn" data-id="${booking.id}">View</button>
                        <button class="btn-danger cancel-booking-btn" data-id="${booking.id}" ${booking.status === 'cancelled' ? 'disabled' : ''}>Cancel</button>
                    </td>
                `;
                
                bookingsContainer.appendChild(row);
            });
            
            // Add event listeners to view and cancel buttons
            const viewButtons = document.querySelectorAll('.view-booking-btn');
            const cancelButtons = document.querySelectorAll('.cancel-booking-btn');
            
            viewButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const bookingId = this.getAttribute('data-id');
                    viewBooking(bookingId);
                });
            });
            
            cancelButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const bookingId = this.getAttribute('data-id');
                    if (confirm('Are you sure you want to cancel this booking?')) {
                        cancelBooking(bookingId);
                    }
                });
            });
        } else {
            bookingsContainer.innerHTML = `<tr><td colspan="7">Error: ${data.message}</td></tr>`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        bookingsContainer.innerHTML = '<tr><td colspan="7">Error loading bookings.</td></tr>';
    });
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format date and time
function formatDateTime(dateTimeString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeString).toLocaleString('en-US', options);
}

// Open room modal for add/edit
function openRoomModal(roomId = null) {
    // Implementation will be added when creating the room management page
}

// Delete room
function deleteRoom(roomId) {
    fetch('../server/room_handler.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getToken()
        },
        body: JSON.stringify({
            action: 'delete_room',
            room_id: roomId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Room deleted successfully.');
            loadRooms();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
}

// View booking details
function viewBooking(bookingId) {
    // Implementation will be added when creating the booking management page
}

// Cancel booking
function cancelBooking(bookingId) {
    fetch('../server/booking_handler.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getToken()
        },
        body: JSON.stringify({
            action: 'cancel_booking',
            booking_id: bookingId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Booking cancelled successfully.');
            loadBookings();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
}