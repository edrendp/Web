// Countdown timer for Intrams (April 7-11, 2025)
document.addEventListener('DOMContentLoaded', function() {
    // Set the target date to April 7, 2025 (Intrams start date)
    const intramStartDate = new Date('April 7, 2025 00:00:00');
    const intramEndDate = new Date('April 11, 2025 23:59:59');
    
    // Schedule data for intrams week
    const scheduleData = [
        { day: 'Monday (Apr 7)', events: 'Opening Ceremony & Day 1 Events (TBD)' },
        { day: 'Tuesday (Apr 8)', events: 'Day 2 Events (TBD)' },
        { day: 'Wednesday (Apr 9)', events: 'HOLIDAY - No Intrams Activities' },
        { day: 'Thursday (Apr 10)', events: 'Day 3 Events (TBD)' },
        { day: 'Friday (Apr 11)', events: 'Finals & Closing Ceremony (TBD)' }
    ];
    
    // View button functionality
    const viewButton = document.querySelector('.view-button');
    if (viewButton) {
        viewButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Create modal for schedule
            const modal = document.createElement('div');
            modal.className = 'schedule-modal';
            
            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.className = 'close-button';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
            
            // Create schedule title
            const scheduleTitle = document.createElement('h2');
            scheduleTitle.textContent = 'Intrams Week Schedule';
            
            // Create schedule list
            const scheduleList = document.createElement('ul');
            scheduleList.className = 'schedule-list';
            
            // Add schedule items
            scheduleData.forEach(item => {
                const scheduleItem = document.createElement('li');
                scheduleItem.className = 'schedule-item';
                scheduleItem.innerHTML = `
                    <span class="schedule-day">${item.day}</span>
                    <span class="schedule-events">${item.events}</span>
                `;
                scheduleList.appendChild(scheduleItem);
            });
            
            // Append elements to modal
            modalContent.appendChild(closeButton);
            modalContent.appendChild(scheduleTitle);
            modalContent.appendChild(scheduleList);
            modal.appendChild(modalContent);
            
            // Add modal to body
            document.body.appendChild(modal);
            
            // Add modal styles
            const style = document.createElement('style');
            style.textContent = `
                .schedule-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.9);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                
                .modal-content {
                    background-color: rgba(10, 10, 10, 0.9);
                    color: #e0e0e0;
                    padding: 40px;
                    border-radius: 4px;
                    max-width: 500px;
                    width: 100%;
                    position: relative;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    border: 1px solid #222222;
                }
                
                .close-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #888888;
                    transition: color 0.3s ease;
                }
                
                .close-button:hover {
                    color: #ffffff;
                }
                
                .schedule-list {
                    list-style: none;
                    padding: 0;
                    margin-top: 20px;
                }
                
                .schedule-item {
                    display: flex;
                    flex-direction: column;
                    padding: 15px 0;
                    border-bottom: 1px solid #222222;
                }
                
                .schedule-day {
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: #e0e0e0;
                }
                
                .schedule-events {
                    color: #888888;
                    font-size: 0.9rem;
                }
                
                h2 {
                    color: #ffffff;
                    margin-bottom: 20px;
                    font-weight: 500;
                    letter-spacing: -0.01em;
                }
            `;
            document.head.appendChild(style);
        });
    }
    
    function updateCountdown() {
        const now = new Date();
        const difference = intramStartDate - now;
        
        // Check if intrams are active
        const isIntramsActive = now >= intramStartDate && now <= intramEndDate;
        const isIntramsOver = now > intramEndDate;
        
        // Update body class for special styling
        document.body.classList.toggle('intrams-active', isIntramsActive);
        
        // Get countdown container
        const countdownContainer = document.querySelector('.countdown-container');
        const description = document.querySelector('.description');
        
        if (isIntramsActive) {
            // Hide countdown and update description during intrams
            if (countdownContainer) {
                countdownContainer.style.display = 'none';
            }
            
            if (description) {
                description.textContent = 'Intramural games are currently ongoing! Check the schedule for today\'s events.';
            }
            
            // Update button text
            if (viewButton) {
                viewButton.textContent = 'View today\'s schedule';
                viewButton.style.backgroundColor = '#ff3e3e';
                viewButton.style.color = 'white';
                viewButton.style.borderColor = '#ff3e3e';
            }
        } else if (isIntramsOver) {
            // Hide countdown after intrams
            if (countdownContainer) {
                countdownContainer.style.display = 'none';
            }
            
            if (description) {
                description.textContent = 'The intramural games have concluded. Thank you for your participation!';
            }
            
            // Update button text
            if (viewButton) {
                viewButton.textContent = 'View past schedule';
            }
        } else {
            // Show countdown before intrams
            if (countdownContainer) {
                countdownContainer.style.display = 'block';
            }
            
            // Calculate days and hours
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            // Update the HTML with leading zeros
            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        }
    }

    // Initial update
    updateCountdown();
    
    // Update every hour for efficiency
    setInterval(updateCountdown, 1000 * 60 * 60);
    
    // Also update once per minute for more accuracy when getting close
    setInterval(() => {
        const now = new Date();
        const difference = intramStartDate - now;
        
        // If we're within 24 hours of the event, update more frequently
        if (difference < 1000 * 60 * 60 * 24 && difference > 0) {
            updateCountdown();
        }
    }, 1000 * 60);
});
