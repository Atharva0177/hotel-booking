// Booking Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const checkInParam = urlParams.get('check_in');
    const checkOutParam = urlParams.get('check_out');
    const adultsParam = urlParams.get('adults');
    const childrenParam = urlParams.get('children');
    const roomIdParam = urlParams.get('room_id');
    
    // Set form values if provided in URL
    const checkInInput = document.getElementById('check-in-date');
    const checkOutInput = document.getElementById('check-out-date');
    const adultsSelect = document.getElementById('adults');
    const childrenSelect = document.getElementById('children');
    
    if (checkInParam && checkInInput) checkInInput.value = checkInParam;
    if (checkOutParam && checkOutInput) checkOutInput.value = checkOutParam;
    if (adultsParam && adultsSelect) adultsSelect.value = adultsParam;
    if (childrenParam && childrenSelect) childrenSelect.value = childrenParam;
    
    // Set minimum dates for check-in and check-out
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (checkInInput) {
        const formattedToday = today.toISOString().split('T')[0];
        checkInInput.min = formattedToday;
        
        // If no check-in date is set, set it to today
        if (!checkInInput.value) {
            checkInInput.value = formattedToday;
        }
    }
    
    if (checkOutInput) {
        // Set minimum check-out date to the day after check-in
        const updateCheckOutMin = () => {
            if (checkInInput && checkInInput.value) {
                const checkInDate = new Date(checkInInput.value);
                const nextDay = new Date(checkInDate);
                nextDay.setDate(checkInDate.getDate() + 1);
                const formattedNextDay = nextDay.toISOString().split('T')[0];
                checkOutInput.min = formattedNextDay;
                
                // If check-out date is before the new minimum, update it
                if (checkOutInput.value && new Date(checkOutInput.value) <= checkInDate) {
                    checkOutInput.value = formattedNextDay;
                }
            }
        };
        
        // Set initial min date for check-out
        updateCheckOutMin();
        
        // If no check-out date is set, set it to the day after check-in
        if (!checkOutInput.value) {
            const checkInDate = new Date(checkInInput.value);
            const nextDay = new Date(checkInDate);
            nextDay.setDate(checkInDate.getDate() + 1);
            checkOutInput.value = nextDay.toISOString().split('T')[0];
        }
        
        // Update check-out min date when check-in changes
        if (checkInInput) {
            checkInInput.addEventListener('change', updateCheckOutMin);
        }
    }
    
    // Load available rooms when dates change
    const loadAvailableRooms = () => {
        if (checkInInput && checkOutInput && checkInInput.value && checkOutInput.value) {
            const availableRoomsContainer = document.getElementById('available-rooms');
            if (!availableRoomsContainer) return;
            
            availableRoomsContainer.innerHTML = '<div class="loading">Loading available rooms...</div>';
            
            const checkIn = checkInInput.value;
            const checkOut = checkOutInput.value;
            const adults = adultsSelect ? adultsSelect.value : 1;
            const children = childrenSelect ? childrenSelect.value : 0;
            
            fetch(`server/api.php?action=get_available_rooms&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${children}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        if (data.rooms.length === 0) {
                            availableRoomsContainer.innerHTML = '<p>No rooms available for the selected dates. Please try different dates.</p>';
                            updateBookingSummary(null);
                            return;
                        }
                        
                        let html = '';
                        data.rooms.forEach(room => {
                            const isSelected = roomIdParam && roomIdParam == room.id;
                            html += `
                                                                <div class="room-option ${isSelected ? 'selected' : ''}" data-room-id="${room.id}">
                                    <div class="room-option-image">
                                        <img src="${room.main_image}" alt="${room.room_name}">
                                    </div>
                                    <div class="room-option-details">
                                        <h3>${room.room_name}</h3>
                                        <p class="room-type">${room.room_type}</p>
                                        <div class="room-features">
                                            <div class="room-feature">
                                                <i class="fas fa-user"></i>
                                                <span>${room.capacity} Guests</span>
                                            </div>
                                            <div class="room-feature">
                                                <i class="fas fa-bed"></i>
                                                <span>${room.beds} Beds</span>
                                            </div>
                                            <div class="room-feature">
                                                <i class="fas fa-ruler-combined"></i>
                                                <span>${room.size}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="room-option-price">
                                        <h3>$${room.price}</h3>
                                        <p>per night</p>
                                    </div>
                                </div>
                            `;
                        });
                        
                        availableRoomsContainer.innerHTML = html;
                        
                        // Add event listeners to room options
                        const roomOptions = availableRoomsContainer.querySelectorAll('.room-option');
                        roomOptions.forEach(option => {
                            option.addEventListener('click', function() {
                                // Remove selected class from all options
                                roomOptions.forEach(opt => opt.classList.remove('selected'));
                                
                                // Add selected class to clicked option
                                this.classList.add('selected');
                                
                                // Update booking summary
                                const roomId = this.getAttribute('data-room-id');
                                updateBookingSummary(roomId);
                                
                                // Add hidden input to form
                                let roomIdInput = document.getElementById('room_id');
                                if (!roomIdInput) {
                                    roomIdInput = document.createElement('input');
                                    roomIdInput.type = 'hidden';
                                    roomIdInput.id = 'room_id';
                                    roomIdInput.name = 'room_id';
                                    document.getElementById('booking-form').appendChild(roomIdInput);
                                }
                                roomIdInput.value = roomId;
                            });
                        });
                        
                        // If a room ID was provided in URL, select it
                        if (roomIdParam) {
                            const selectedOption = availableRoomsContainer.querySelector(`.room-option[data-room-id="${roomIdParam}"]`);
                            if (selectedOption) {
                                selectedOption.click();
                            } else {
                                // If specified room is not available, select first room
                                if (roomOptions.length > 0) {
                                    roomOptions[0].click();
                                }
                            }
                        } else if (roomOptions.length > 0) {
                            // Select first room by default
                            roomOptions[0].click();
                        }
                    } else {
                        availableRoomsContainer.innerHTML = `<p>Error: ${data.message}</p>`;
                        updateBookingSummary(null);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    availableRoomsContainer.innerHTML = '<p>Error loading available rooms. Please try again later.</p>';
                    updateBookingSummary(null);
                });
        }
    };
    
    // Update booking summary
    function updateBookingSummary(roomId) {
        const summaryContainer = document.getElementById('booking-summary-details');
        if (!summaryContainer) return;
        
        if (!roomId) {
            summaryContainer.innerHTML = `
                <div class="summary-placeholder">
                    <p>Select dates and room to see booking details</p>
                </div>
            `;
            return;
        }
        
        if (checkInInput && checkOutInput && checkInInput.value && checkOutInput.value) {
            const checkIn = checkInInput.value;
            const checkOut = checkOutInput.value;
            
            fetch(`server/api.php?action=get_booking_summary&room_id=${roomId}&check_in=${checkIn}&check_out=${checkOut}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const summary = data.summary;
                        
                        let html = `
                            <div class="summary-item">
                                <div class="summary-label">Room</div>
                                <div class="summary-value">${summary.room_name}</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-label">Check-in</div>
                                <div class="summary-value">${formatDate(checkIn)}</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-label">Check-out</div>
                                <div class="summary-value">${formatDate(checkOut)}</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-label">Nights</div>
                                <div class="summary-value">${summary.nights}</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-label">Rate</div>
                                <div class="summary-value">$${summary.price} per night</div>
                            </div>
                        `;
                        
                        // Add taxes and fees
                        if (summary.taxes_and_fees > 0) {
                            html += `
                                <div class="summary-item">
                                    <div class="summary-label">Taxes & Fees</div>
                                    <div class="summary-value">$${summary.taxes_and_fees}</div>
                                </div>
                            `;
                        }
                        
                        // Add total
                        html += `
                            <div class="summary-divider"></div>
                            <div class="summary-item total">
                                <div class="summary-label">Total</div>
                                <div class="summary-value">$${summary.total}</div>
                            </div>
                        `;
                        
                        summaryContainer.innerHTML = html;
                    } else {
                        summaryContainer.innerHTML = `<p>Error: ${data.message}</p>`;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    summaryContainer.innerHTML = '<p>Error loading booking summary. Please try again later.</p>';
                });
        }
    }
    
    // Format date for display
    function formatDate(dateString) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    // Add event listeners to date inputs
    if (checkInInput) {
        checkInInput.addEventListener('change', loadAvailableRooms);
    }
    
    if (checkOutInput) {
        checkOutInput.addEventListener('change', loadAvailableRooms);
    }
    
    if (adultsSelect) {
        adultsSelect.addEventListener('change', loadAvailableRooms);
    }
    
    if (childrenSelect) {
        childrenSelect.addEventListener('change', loadAvailableRooms);
    }
    
    // Load available rooms on page load
    if (checkInInput && checkOutInput && checkInInput.value && checkOutInput.value) {
        loadAvailableRooms();
    }
    
    // Booking form submission
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            if (!document.querySelector('.room-option.selected')) {
                alert('Please select a room to continue.');
                return;
            }
            
            const formData = new FormData(bookingForm);
            
            // Convert FormData to object
            const bookingData = {};
            for (const [key, value] of formData.entries()) {
                bookingData[key] = value;
            }
            
            // Add check-in and check-out dates
            bookingData.check_in = checkInInput.value;
            bookingData.check_out = checkOutInput.value;
            
            // Send booking data to server
            fetch('server/booking_handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Redirect to confirmation page with booking ID
                    window.location.href = `confirmation.html?booking_id=${data.booking_id}`;
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
});