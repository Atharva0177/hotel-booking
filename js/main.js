// Main JavaScript for Hotel Paradise

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile nav when clicking on a nav link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });

    // Testimonial Slider
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (testimonialSlides.length > 0) {
        let currentSlide = 0;
        
        // Show first slide
        testimonialSlides[currentSlide].classList.add('active');
        
        // Next button click
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                testimonialSlides[currentSlide].classList.remove('active');
                currentSlide = (currentSlide + 1) % testimonialSlides.length;
                testimonialSlides[currentSlide].classList.add('active');
            });
        }
        
        // Previous button click
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                testimonialSlides[currentSlide].classList.remove('active');
                currentSlide = (currentSlide - 1 + testimonialSlides.length) % testimonialSlides.length;
                testimonialSlides[currentSlide].classList.add('active');
            });
        }
        
        // Auto slide every 5 seconds
        setInterval(function() {
            testimonialSlides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % testimonialSlides.length;
            testimonialSlides[currentSlide].classList.add('active');
        }, 5000);
    }
    
    // Newsletter Form Submission
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            
            // Send the email to the server
            fetch('server/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'subscribe_newsletter',
                    email: email
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('Thank you for subscribing to our newsletter!');
                    newsletterForm.reset();
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
    
    // Load Featured Rooms on Homepage
    const featuredRoomsContainer = document.getElementById('featured-rooms-container');
    if (featuredRoomsContainer) {
        loadFeaturedRooms();
    }
    
    // Load All Rooms on Rooms Page
    const roomsContainer = document.getElementById('rooms-container');
    if (roomsContainer) {
        loadAllRooms();
    }

    // Room Filter Functionality
    const roomFilterForm = document.getElementById('room-filter-form');
    if (roomFilterForm) {
        roomFilterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(roomFilterForm);
            const filters = {
                type: formData.get('type'),
                capacity: formData.get('capacity'),
                price: formData.get('price')
            };
            
            loadAllRooms(filters);
        });
        
        roomFilterForm.addEventListener('reset', function() {
            setTimeout(() => {
                loadAllRooms();
            }, 10);
        });
        
        // Price Range Slider
        const priceSlider = document.getElementById('filter-price');
        const priceDisplay = document.getElementById('price-display');
        
        if (priceSlider && priceDisplay) {
            priceSlider.addEventListener('input', function() {
                priceDisplay.textContent = '$' + priceSlider.value;
            });
        }
    }
    
    // Room Modal Functionality
    const roomModal = document.getElementById('room-modal');
    const closeModal = document.querySelector('.close-modal');
    
    if (roomModal && closeModal) {
        closeModal.addEventListener('click', function() {
            roomModal.style.display = 'none';
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === roomModal) {
                roomModal.style.display = 'none';
            }
        });
    }

    // Terms Modal Functionality
    const termsModal = document.getElementById('terms-modal');
    const termsLink = document.querySelector('.terms-link');
    const closeTermsModal = document.querySelector('#terms-modal .close-modal');
    
    if (termsModal && termsLink && closeTermsModal) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            termsModal.style.display = 'block';
        });
        
        closeTermsModal.addEventListener('click', function() {
            termsModal.style.display = 'none';
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === termsModal) {
                termsModal.style.display = 'none';
            }
        });
    }
    
    // Quick Booking Form Validation and Submission
    const quickBookingForm = document.getElementById('quick-booking-form');
    if (quickBookingForm) {
        quickBookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(quickBookingForm);
            
            // Basic validation
            const checkIn = formData.get('check-in');
            const checkOut = formData.get('check-out');
            
            if (new Date(checkIn) >= new Date(checkOut)) {
                alert('Check-out date must be after check-in date.');
                return;
            }
            
            // Redirect to booking page with parameters
            window.location.href = `booking.html?check_in=${checkIn}&check_out=${checkOut}&adults=${formData.get('adults')}&children=${formData.get('children')}`;
        });
    }
});

// Function to load featured rooms from the database
function loadFeaturedRooms() {
    const featuredRoomsContainer = document.getElementById('featured-rooms-container');
    if (!featuredRoomsContainer) return;
    
    featuredRoomsContainer.innerHTML = '<div class="loading">Loading featured rooms...</div>';
    
    fetch('server/api.php?action=get_featured_rooms')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                if (data.rooms.length === 0) {
                    featuredRoomsContainer.innerHTML = '<p>No featured rooms available.</p>';
                    return;
                }
                
                let html = '';
                data.rooms.forEach(room => {
                    html += `
                        <div class="room-card">
                            <div class="room-image">
                                <img src="${room.main_image}" alt="${room.room_name}">
                            </div>
                            <div class="room-details">
                                <h3 class="room-name">${room.room_name}</h3>
                                <p class="room-type">${room.room_type}</p>
                                <p class="room-price">$${room.price} <span>per night</span></p>
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
                                <div class="room-actions">
                                    <a href="booking.html?room_id=${room.id}" class="btn-primary">Book Now</a>
                                    <a href="#" class="view-details-btn" data-room-id="${room.id}">View Details <i class="fas fa-arrow-right"></i></a>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                featuredRoomsContainer.innerHTML = html;
                
                // Add event listeners to view details buttons
                const viewDetailsButtons = featuredRoomsContainer.querySelectorAll('.view-details-btn');
                viewDetailsButtons.forEach(button => {
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        const roomId = this.getAttribute('data-room-id');
                        openRoomModal(roomId);
                    });
                });
            } else {
                featuredRoomsContainer.innerHTML = `<p>Error: ${data.message}</p>`;
                console.error('API Error:', data.message);
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            featuredRoomsContainer.innerHTML = '<p>Error loading rooms. Please try again later.</p>';
        });
}

// Function to load all rooms from the database
function loadAllRooms(filters = {}) {
    const roomsContainer = document.getElementById('rooms-container');
    if (!roomsContainer) return;
    
    roomsContainer.innerHTML = '<div class="loading">Loading rooms...</div>';
    
    // Construct URL with filters
    let url = 'server/api.php?action=get_all_rooms';
    if (filters.type) url += `&type=${encodeURIComponent(filters.type)}`;
    if (filters.capacity) url += `&capacity=${encodeURIComponent(filters.capacity)}`;
    if (filters.price) url += `&max_price=${encodeURIComponent(filters.price)}`;
    
    console.log("Fetching rooms from:", url);
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("API Response:", data);
            
            if (data.success) {
                if (data.rooms.length === 0) {
                    roomsContainer.innerHTML = '<p>No rooms match your criteria. Please try different filters.</p>';
                    return;
                }
                
                let html = '';
                data.rooms.forEach(room => {
                    html += `
                        <div class="room-card">
                            <div class="room-image">
                                <img src="${room.main_image}" alt="${room.room_name}">
                            </div>
                            <div class="room-details">
                                <h3 class="room-name">${room.room_name}</h3>
                                <p class="room-type">${room.room_type}</p>
                                <p class="room-price">$${room.price} <span>per night</span></p>
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
                                <div class="room-actions">
                                    <a href="booking.html?room_id=${room.id}" class="btn-primary">Book Now</a>
                                    <a href="#" class="view-details-btn" data-room-id="${room.id}">View Details <i class="fas fa-arrow-right"></i></a>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                roomsContainer.innerHTML = html;
                
                // Add event listeners to view details buttons
                const viewDetailsButtons = roomsContainer.querySelectorAll('.view-details-btn');
                viewDetailsButtons.forEach(button => {
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        const roomId = this.getAttribute('data-room-id');
                        openRoomModal(roomId);
                    });
                });
            } else {
                roomsContainer.innerHTML = `<p>Error: ${data.message}</p>`;
                console.error('API Error:', data.message);
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            roomsContainer.innerHTML = '<p>Error loading rooms. Please try again later. Please check your database connection.</p>';
        });
}

// Function to open room modal with details
function openRoomModal(roomId) {
    const roomModal = document.getElementById('room-modal');
    const modalRoomSlider = document.getElementById('modal-room-slider');
    const modalRoomDetails = document.getElementById('modal-room-details');
    const modalBookNow = document.getElementById('modal-book-now');
    
    if (!roomModal || !modalRoomSlider || !modalRoomDetails || !modalBookNow) return;
    
    modalRoomSlider.innerHTML = '<div class="loading">Loading room details...</div>';
    modalRoomDetails.innerHTML = '';
    
    fetch(`server/api.php?action=get_room_details&id=${roomId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const room = data.room;
                
                // Build image slider
                let sliderHtml = `
                    <div class="room-image-slider">
                        <div class="main-image">
                            <img src="${room.main_image}" alt="${room.room_name}">
                        </div>
                        <div class="thumbnail-images">
                `;
                
                if (room.images && room.images.length > 0) {
                    room.images.forEach(image => {
                        sliderHtml += `<img src="${image.image_url}" alt="${room.room_name}">`;
                    });
                } else {
                    // If no additional images, use main image
                    sliderHtml += `<img src="${room.main_image}" alt="${room.room_name}">`;
                }
                
                sliderHtml += `
                        </div>
                    </div>
                `;
                
                modalRoomSlider.innerHTML = sliderHtml;
                
                // Build room details
                let amenitiesHtml = '';
                if (room.amenities && room.amenities.length > 0) {
                    room.amenities.forEach(amenity => {
                        amenitiesHtml += `
                            <div class="amenity">
                                <i class="fas ${amenity.icon}"></i>
                                <span>${amenity.name}</span>
                            </div>
                        `;
                    });
                } else {
                    amenitiesHtml = '<p>No specific amenities listed for this room.</p>';
                }
                
                let detailsHtml = `
                    <h2>${room.room_name}</h2>
                    <p class="room-type">${room.room_type}</p>
                    <p class="room-price">$${room.price} <span>per night</span></p>
                    <div class="room-description">
                        ${room.description}
                    </div>
                    <div class="room-meta">
                        <div class="meta-item">
                            <i class="fas fa-user"></i>
                            <span><strong>Capacity:</strong> ${room.capacity} Guests</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-bed"></i>
                            <span><strong>Beds:</strong> ${room.beds}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-ruler-combined"></i>
                            <span><strong>Size:</strong> ${room.size}</span>
                        </div>
                    </div>
                    <div class="room-amenities">
                        <h3>Room Amenities</h3>
                        <div class="amenities-grid">
                            ${amenitiesHtml}
                        </div>
                    </div>
                `;
                
                modalRoomDetails.innerHTML = detailsHtml;
                
                // Update book now button with room ID
                modalBookNow.href = `booking.html?room_id=${room.id}`;
                
                // Show modal
                roomModal.style.display = 'block';
                
                // Add image slider functionality
                const thumbnails = modalRoomSlider.querySelectorAll('.thumbnail-images img');
                const mainImage = modalRoomSlider.querySelector('.main-image img');
                
                thumbnails.forEach(thumbnail => {
                    thumbnail.addEventListener('click', function() {
                        mainImage.src = this.src;
                    });
                });
            } else {
                alert('Error loading room details: ' + data.message);
                console.error('API Error:', data.message);
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            alert('An error occurred while loading room details. Please try again later.');
        });
}