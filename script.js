// Load configuration from config.js
// Google Sheets API configuration is now loaded from config.js
// Add this at the top of your script.js file if not already present
// Global variables
let participantData = [];
let totalValidJerseys = 0;
let totalPaidJerseys = 0;

// Constants from config.js
const API_KEY = config.apiKey;
const SPREADSHEET_ID = config.spreadsheetId;
const SHEET_NAME = config.sheetName;

// Check if constants are properly loaded
console.log("API Key:", API_KEY);
console.log("Spreadsheet ID:", SPREADSHEET_ID);
console.log("Sheet Name:", SHEET_NAME);

// Function to convert size to initials
function getSizeInitials(size) {
    if (!size) return '';
    size = size.toString().toLowerCase();
    if (size.includes('extra small') || size.includes('xs')) return 'XS';
    if (size.includes('small') || size.includes('s')) return 'S';
    if (size.includes('medium') || size.includes('m')) return 'M';
    if (size.includes('large') || size.includes('l')) return 'L';
    if (size.includes('extra large') || size.includes('xl')) return 'XL';
    return size;
}

// Function to update the count badges
function updateCountBadges() {
    // Update total jerseys count badge
    const countBadge = document.getElementById('countBadge');
    if (countBadge) {
        countBadge.textContent = totalValidJerseys;
    }
    
    // Update paid jerseys count
    const paidCount = document.getElementById('paidCount');
    if (paidCount) {
        paidCount.textContent = totalPaidJerseys;
    }
}

// Function to check if a row has all required fields filled out
function isRowFilledOut(participant) {
    // Check if ALL of the main fields have content
    return (
        participant.name && participant.name.trim() !== '' &&
        participant.backName && participant.backName.trim() !== '' &&
        participant.sideName && participant.sideName.trim() !== '' &&
        participant.no && participant.no.trim() !== '' &&
        participant.size && participant.size.trim() !== ''
        // Note: Not making tshirt and saliko required fields
        // Add them here if they should be required:
        // && participant.tshirt && participant.tshirt.trim() !== '' 
        // && participant.saliko && participant.saliko.trim() !== ''
    );
}

// Helper function to format yes/no fields - improved empty handling
function formatYesNoField(value) {
    if (value && (value.toString().toLowerCase() === 'yes' || value.toString().toLowerCase() === 'true')) {
        return '<span class="check-symbol" title="Yes"></span>';
    } else if (!value || value.toString().trim() === '') {
        return '<span class="no-symbol" title="Not specified"></span>';
    } else {
        return value; // Return original value for anything else
    }
}

// Helper function to check if tshirt or saliko is "yes"
function isYes(value) {
    return value && (value.toString().toLowerCase() === 'yes' || value.toString().toLowerCase() === 'true');
}

// Function to create the cash machine counting effect
function animateValue(elementId, start, end, duration) {
    const obj = document.getElementById(elementId);
    if (!obj) return;
    
    // Format for Philippine Peso
    const formatter = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    // Save the raw value as a data attribute for future animations
    obj.dataset.rawValue = end;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        obj.textContent = formatter.format(currentValue);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            // Ensure we end with the exact final value
            obj.textContent = formatter.format(end);
        }
    };
    
    window.requestAnimationFrame(step);
}

// Add a new function to animate number values (without currency formatting)
function animateNumber(elementId, start, end, duration) {
    const obj = document.getElementById(elementId);
    if (!obj) return;
    
    // Save the raw value as a data attribute for future animations
    obj.dataset.rawValue = end;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        obj.textContent = currentValue;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            // Ensure we end with the exact final value
            obj.textContent = end;
        }
    };
    
    window.requestAnimationFrame(step);
}

// Update the updateCountBadges function to include animations
function updateCountBadges() {
    // Get the count badge elements
    const countBadge = document.getElementById('countBadge');
    const paidCount = document.getElementById('paidCount');
    
    if (countBadge) {
        // Get the previous value (or 0 if not set)
        const previousValue = parseInt(countBadge.dataset.rawValue || '0', 10);
        // Animate the total jerseys count
        animateNumber('countBadge', previousValue, totalValidJerseys, 800);
    }
    
    if (paidCount) {
        // Get the previous value (or 0 if not set)
        const previousValue = parseInt(paidCount.dataset.rawValue || '0', 10);
        // Animate the paid jerseys count
        animateNumber('paidCount', previousValue, totalPaidJerseys, 800);
    }
}

// Function to calculate totals and update the UI
// Update the calculateTotals function to fix the Progress card animation
function calculateTotals(data) {
    const totalParticipants = data.filter(participant => isRowFilledOut(participant)).length;
    const paidParticipants = data.filter(participant => 
        isRowFilledOut(participant) && isYes(participant.payment)
    ).length;
    
    // Calculate total funds collected
    let totalFundsCollected = 0;
    let totalPotentialFunds = 0;
    
    data.forEach(participant => {
        // Skip participants without required fields
        if (!isRowFilledOut(participant)) return;
        
        // Calculate potential funds (all participants)
        // Add T-Shirt cost if selected (380 Pesos)
        if (isYes(participant.tshirt)) {
            totalPotentialFunds += 380;
            
            // Only add to collected if paid
            if (isYes(participant.payment)) {
                totalFundsCollected += 380;
            }
        }
        
        // Add Saliko cost if selected (350 Pesos)
        if (isYes(participant.saliko)) {
            totalPotentialFunds += 350;
            
            // Only add to collected if paid
            if (isYes(participant.payment)) {
                totalFundsCollected += 350;
            }
        }
    });
    
    // Update global counters for animations
    totalValidJerseys = totalParticipants;
    totalPaidJerseys = paidParticipants;
    
    // Update the count badges with animations
    updateCountBadges();
    
    // Format for Philippine Peso
    const formatter = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    // Update the funds display with the new format "₱X / ₱Y"
    const fundsElement = document.getElementById('totalFunds');
    if (fundsElement) {
        // Get the previous values (or 0 if not set)
        const previousCollected = parseInt(fundsElement.dataset.rawCollected || '0', 10);
        
        // Store raw values for future reference
        fundsElement.dataset.rawCollected = totalFundsCollected;
        fundsElement.dataset.rawPotential = totalPotentialFunds;
        
        // Create a custom animation for the funds display that maintains the "₱X / ₱Y" format
        animateProgressValue(fundsElement, previousCollected, totalFundsCollected, totalPotentialFunds, 800);
    }
}

// Add a new function to animate the progress value while maintaining the "₱X / ₱Y" format
function animateProgressValue(element, startCollected, endCollected, totalPotential, duration) {
    if (!element) return;
    
    // Format for Philippine Peso
    const formatter = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (endCollected - startCollected) + startCollected);
        
        // Format both values
        const formattedCollected = formatter.format(currentValue).replace('PHP', '₱');
        const formattedPotential = formatter.format(totalPotential).replace('PHP', '₱');
        
        // Update the text with both values
        element.textContent = `${formattedCollected} / ${formattedPotential}`;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            // Ensure we end with the exact final values
            const finalCollected = formatter.format(endCollected).replace('PHP', '₱');
            element.textContent = `${finalCollected} / ${formattedPotential}`;
        }
    };
    
    window.requestAnimationFrame(step);
}

// Function to update the progress bar
function updateProgressBar(current, total) {
    // Calculate percentage
    let percentage = 0;
    if (total > 0) {
        percentage = Math.min(100, Math.round((current / total) * 100));
    }
    
    // Get elements
    const progressFill = document.getElementById('fundsFillBar');
    const timeEstimate = document.getElementById('timeEstimate');
    const percentageDisplay = document.getElementById('progressPercentage');
    
    if (!progressFill) return;
    
    // Update time estimate based on percentage
    if (timeEstimate) {
        if (percentage < 25) {
            timeEstimate.textContent = "Just started";
        } else if (percentage < 50) {
            timeEstimate.textContent = "In progress";
        } else if (percentage < 75) {
            timeEstimate.textContent = "Almost there";
        } else if (percentage < 100) {
            timeEstimate.textContent = "Nearly complete";
        } else {
            timeEstimate.textContent = "Complete";
        }
    }
    
    // Update width for horizontal progress - ensure it's visible
    progressFill.style.width = `${percentage}%`;
    progressFill.style.opacity = '1';
    
    // Update dot position
    const progressDot = document.querySelector('.flat-progress-dot');
    if (progressDot) {
        progressDot.style.left = `${percentage}%`;
    }
    
    // Update percentage display with animation
    if (percentageDisplay) {
        animatePercentage(percentageDisplay, percentage);
    }
    
    // Update markers
    updateProgressMarkers(percentage);
    
    // Log for debugging
    console.log(`Progress updated: ${percentage}%, Current: ${current}, Total: ${total}`);
}

// Make sure this function is defined
function updateProgressMarkers(percentage) {
    // Define the marker thresholds
    const markers = [
        { selector: '.marker-0', threshold: 0 },
        { selector: '.marker-25', threshold: 25 },
        { selector: '.marker-50', threshold: 50 },
        { selector: '.marker-75', threshold: 75 },
        { selector: '.marker-100', threshold: 100 }
    ];
    
    // Update each marker
    markers.forEach(marker => {
        const markerElement = document.querySelector(marker.selector);
        if (!markerElement) return;
        
        if (percentage >= marker.threshold) {
            markerElement.classList.add('active');
        } else {
            markerElement.classList.remove('active');
        }
    });
}

// Function to animate the funds value
// Remove the duplicate animateValue function (around line 170)
// Remove the duplicate calculateTotals function (around line 210)

// Add the missing populateTable function
// Add these variables at the top of your script, near other global variables
let isShowingSearchResults = false;
let currentSearchTerm = '';

// Modify the fetchDataFromGoogleSheets function to preserve search results
async function fetchDataFromGoogleSheets() {
    try {
        console.log("Starting to fetch data from Google Sheets...");
        
        // Construct the Google Sheets API URL
        const sheetRange = `${SHEET_NAME}!A:H`;
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetRange}?key=${API_KEY}`;
        
        // Fetch data
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            // Extract headers and data rows
            const rows = data.values.slice(1);
            
            // Map rows to participant objects
            participantData = rows.map(row => {
                // Handle empty checkbox values by converting FALSE to empty string
                const tshirtValue = (row[1] && row[1].toString().toLowerCase() === 'false') ? '' : (row[1] || '');
                const salikoValue = (row[2] && row[2].toString().toLowerCase() === 'false') ? '' : (row[2] || '');
                const paymentValue = (row[7] && row[7].toString().toLowerCase() === 'false') ? '' : (row[7] || '');
                
                return {
                    name: row[0] || '',
                    tshirt: tshirtValue,
                    saliko: salikoValue,
                    backName: row[3] || '',
                    sideName: row[4] || '',
                    no: row[5] || '',
                    size: row[6] || '',
                    payment: paymentValue
                };
            });
            
            // Inside the fetchDataFromGoogleSheets function, update the search results handling
            if (isShowingSearchResults && currentSearchTerm) {
                const filteredData = participantData.filter(participant => {
                    const name = participant.name ? participant.name.toLowerCase() : '';
                    const backName = participant.backName ? participant.backName.toLowerCase() : '';
                    const sideName = participant.sideName ? participant.sideName.toLowerCase() : '';
                    const number = participant.no ? participant.no.toLowerCase() : '';
                    
                    return name.includes(currentSearchTerm) || 
                           backName.includes(currentSearchTerm) || 
                           sideName.includes(currentSearchTerm) ||
                           number.includes(currentSearchTerm);
                });
                
                // Check if all filtered results are paid or pending
                const allPaid = filteredData.every(participant => isYes(participant.payment));
                const allPending = filteredData.every(participant => !isYes(participant.payment));
                
                // Update the table with filtered data and specify filter type
                populateTable(filteredData, true, allPaid ? 'paid' : (allPending ? 'pending' : 'mixed'));
                
                // Ensure the search container has the appropriate filtering class
                const searchContainer = document.querySelector('.search-container');
                if (searchContainer) {
                    searchContainer.classList.add('filtering');
                    
                    if (allPaid) {
                        searchContainer.classList.add('paid-filtering');
                        searchContainer.classList.remove('pending-filtering');
                    } else if (allPending) {
                        searchContainer.classList.add('pending-filtering');
                        searchContainer.classList.remove('paid-filtering');
                    } else {
                        searchContainer.classList.remove('paid-filtering', 'pending-filtering');
                    }
                }
            } else {
                // Update the table with all data
                populateTable(participantData);
                
                // Remove filtering classes from search container
                const searchContainer = document.querySelector('.search-container');
                if (searchContainer) {
                    searchContainer.classList.remove('filtering', 'paid-filtering', 'pending-filtering');
                }
            }
            
            // Always calculate the overall totals for the stats cards
            calculateTotals(participantData);
        } else {
            console.warn("No data found in the spreadsheet or invalid format");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
    
    // Remove the setTimeout here - we'll use the one in startPeriodicRefresh
}

// Update the populateTable function to keep overall totals when showing search results
// Update the populateTable function to handle different filter types
// Update the populateTable function to use our new minimalist styling
// Inside the populateTable function, update the payment status cell HTML
function populateTable(data, isSearchResult = false, filterType = 'mixed') {
    // Get reference to table body
    const tableBody = document.querySelector('#participantTable tbody');
    if (!tableBody) return;
    
    // Clear existing table data
    tableBody.innerHTML = '';
    
    // Filter out rows that don't have all required fields
    const filteredData = data.filter(participant => isRowFilledOut(participant));
    
    // If this is not a search result, calculate the overall totals
    if (!isSearchResult) {
        // Update global counters for all data
        totalValidJerseys = filteredData.length;
        totalPaidJerseys = filteredData.filter(participant => isYes(participant.payment)).length;
    }
    
    // Always update count badges with the global counters
    updateCountBadges();
    
    // Add each participant to the table
    filteredData.forEach(participant => {
        const row = document.createElement('tr');
        
        // Check if paid
        const isPaid = isYes(participant.payment);
        
        // Add row class based on payment status for enhanced styling
        if (isPaid) {
            row.classList.add('paid-row');
        } else {
            row.classList.add('pending-row');
        }
        
        // Add cells for each property
        row.innerHTML = `
            <td>${participant.name || ''}</td>
            <td class="center-align">${formatYesNoField(participant.tshirt)}</td>
            <td class="center-align">${formatYesNoField(participant.saliko)}</td>
            <td>${participant.backName || ''}</td>
            <td>${participant.sideName || ''}</td>
            <td>${participant.no || ''}</td>
            <td>${getSizeInitials(participant.size)}</td>
            <td class="payment-status ${isPaid ? 'paid' : 'pending'}">
                ${isPaid 
                    ? '<span class="status-pill paid">PAID</span>' 
                    : '<span class="status-pill pending">PENDING</span>'}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add visual indicator for search results with specific filter type
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
        if (isSearchResult) {
            tableContainer.classList.add('filtered-results');
            
            // Add specific filter type class
            if (filterType === 'paid') {
                tableContainer.classList.add('paid-filter');
                tableContainer.classList.remove('pending-filter');
            } else if (filterType === 'pending') {
                tableContainer.classList.add('pending-filter');
                tableContainer.classList.remove('paid-filter');
            } else {
                tableContainer.classList.remove('paid-filter', 'pending-filter');
            }
        } else {
            tableContainer.classList.remove('filtered-results', 'paid-filter', 'pending-filter');
        }
    }
}

// Function to update progress dots based on percentage
function updateProgressDots(percentage) {
    // Define the dot thresholds
    const dots = [
        { selector: '.dot-25', threshold: 25 },
        { selector: '.dot-50', threshold: 50 },
        { selector: '.dot-75', threshold: 75 },
        { selector: '.dot-100', threshold: 100 }
    ];
    
    // Update each dot
    dots.forEach(dot => {
        const dotElement = document.querySelector(dot.selector);
        if (!dotElement) return;
        
        if (percentage >= dot.threshold) {
            dotElement.classList.add('active');
        } else {
            dotElement.classList.remove('active');
        }
    });
}

// Function to update progress markers based on percentage
function updateProgressMarkers(percentage) {
    // Define the marker thresholds
    const markers = [
        { selector: '.marker-25', threshold: 25 },
        { selector: '.marker-50', threshold: 50 },
        { selector: '.marker-75', threshold: 75 },
        { selector: '.marker-100', threshold: 100 }
    ];
    
    // Update each marker
    markers.forEach(marker => {
        const markerElement = document.querySelector(marker.selector);
        if (!markerElement) return;
        
        if (percentage >= marker.threshold) {
            markerElement.classList.add('active');
        } else {
            markerElement.classList.remove('active');
        }
    });
}

// Function to update timeline steps based on percentage
// Fix the updateTimelineSteps function that's causing errors
function updateTimelineSteps(percentage) {
    // Define the step thresholds
    const steps = [
        { selector: '.step-1', threshold: 25 },
        { selector: '.step-2', threshold: 50 },
        { selector: '.step-3', threshold: 75 },
        { selector: '.step-4', threshold: 100 }
    ];
    
    // Update each step
    steps.forEach((step, index) => {
        const stepElement = document.querySelector(step.selector);
        if (!stepElement) return;
        
        // Check if current percentage is between this step and the previous step
        if (percentage >= step.threshold) {
            stepElement.classList.add('active');
        } else {
            stepElement.classList.remove('active');
        }
    });
}

// Fix the animatePercentage function
function animatePercentage(element, targetPercentage) {
    if (!element) return;
    
    const duration = 800;
    const startValue = parseInt(element.textContent) || 0;
    const startTime = performance.now();
    
    function updatePercentage(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Simple linear animation
        const currentPercentage = Math.floor(startValue + (targetPercentage - startValue) * progress);
        element.textContent = `${currentPercentage}%`;
        
        if (progress < 1) {
            requestAnimationFrame(updatePercentage);
        }
    }
    
    requestAnimationFrame(updatePercentage);
}

// Improved fetchDataFromGoogleSheets function with proper error handling
async function fetchDataFromGoogleSheets() {
    try {
        console.log("Starting to fetch data from Google Sheets...");
        
        // Construct the Google Sheets API URL
        const sheetRange = `${SHEET_NAME}!A:H`;
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetRange}?key=${API_KEY}`;
        
        // Fetch data
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            // Extract headers and data rows
            const rows = data.values.slice(1);
            
            // Map rows to participant objects
            participantData = rows.map(row => {
                // Handle empty checkbox values by converting FALSE to empty string
                const tshirtValue = (row[1] && row[1].toString().toLowerCase() === 'false') ? '' : (row[1] || '');
                const salikoValue = (row[2] && row[2].toString().toLowerCase() === 'false') ? '' : (row[2] || '');
                const paymentValue = (row[7] && row[7].toString().toLowerCase() === 'false') ? '' : (row[7] || '');
                
                return {
                    name: row[0] || '',
                    tshirt: tshirtValue,
                    saliko: salikoValue,
                    backName: row[3] || '',
                    sideName: row[4] || '',
                    no: row[5] || '',
                    size: row[6] || '',
                    payment: paymentValue
                };
            });
            
            // Handle search results if applicable
            if (isShowingSearchResults && currentSearchTerm) {
                const filteredData = participantData.filter(participant => {
                    const name = participant.name ? participant.name.toLowerCase() : '';
                    const backName = participant.backName ? participant.backName.toLowerCase() : '';
                    const sideName = participant.sideName ? participant.sideName.toLowerCase() : '';
                    const number = participant.no ? participant.no.toLowerCase() : '';
                    
                    return name.includes(currentSearchTerm) || 
                           backName.includes(currentSearchTerm) || 
                           sideName.includes(currentSearchTerm) ||
                           number.includes(currentSearchTerm);
                });
                
                // Check if all filtered results are paid or pending
                const allPaid = filteredData.every(participant => isYes(participant.payment));
                const allPending = filteredData.every(participant => !isYes(participant.payment));
                
                // Update the table with filtered data and specify filter type
                populateTable(filteredData, true, allPaid ? 'paid' : (allPending ? 'pending' : 'mixed'));
                
                // Ensure the search container has the appropriate filtering class
                const searchContainer = document.querySelector('.search-container');
                if (searchContainer) {
                    searchContainer.classList.add('filtering');
                    
                    if (allPaid) {
                        searchContainer.classList.add('paid-filtering');
                        searchContainer.classList.remove('pending-filtering');
                    } else if (allPending) {
                        searchContainer.classList.add('pending-filtering');
                        searchContainer.classList.remove('paid-filtering');
                    } else {
                        searchContainer.classList.remove('paid-filtering', 'pending-filtering');
                    }
                }
            } else {
                // Update the table with all data
                populateTable(participantData);
                
                // Remove filtering classes from search container
                const searchContainer = document.querySelector('.search-container');
                if (searchContainer) {
                    searchContainer.classList.remove('filtering', 'paid-filtering', 'pending-filtering');
                }
            }
            
            // Always calculate the overall totals for the stats cards
            calculateTotals(participantData);
            console.log("Data loaded successfully:", participantData.length, "records");
        } else {
            console.warn("No data found in the spreadsheet or invalid format");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Improved fetchAndUpdateData function
function fetchAndUpdateData() {
    return fetchDataFromGoogleSheets()
        .catch(error => {
            console.error("Error in fetchAndUpdateData:", error);
        });
}

// Simplified periodic refresh function
function startPeriodicRefresh() {
    console.log("Starting periodic refresh...");
    
    // Initial fetch
    fetchAndUpdateData();
    
    // Set up periodic refresh every 5 seconds
    setInterval(fetchAndUpdateData, 5000);
}

// REMOVE ALL EXISTING DOMContentLoaded EVENT LISTENERS
// And replace with this single one:

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    // Set up search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Handle input changes to show all players when empty
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (!searchTerm) {
                // If search is empty, show all data
                isShowingSearchResults = false;
                currentSearchTerm = '';
                
                // Remove filtering class from search container
                const searchContainer = document.querySelector('.search-container');
                if (searchContainer) {
                    searchContainer.classList.remove('filtering', 'paid-filtering', 'pending-filtering');
                }
                
                populateTable(participantData);
            }
        });
    
        // Only perform search when Enter key is pressed
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent form submission
                
                const searchTerm = this.value.toLowerCase().trim();
                const searchContainer = document.querySelector('.search-container');
                
                if (!searchTerm) {
                    // If search is empty, show all data
                    isShowingSearchResults = false;
                    currentSearchTerm = '';
                    
                    // Remove filtering class from search container
                    if (searchContainer) {
                        searchContainer.classList.remove('filtering', 'paid-filtering', 'pending-filtering');
                    }
                    
                    populateTable(participantData);
                    return;
                }
                
                // Set search tracking variables
                isShowingSearchResults = true;
                currentSearchTerm = searchTerm;
                
                // Filter the data based on search term
                const filteredData = participantData.filter(participant => {
                    const name = participant.name ? participant.name.toLowerCase() : '';
                    const backName = participant.backName ? participant.backName.toLowerCase() : '';
                    const sideName = participant.sideName ? participant.sideName.toLowerCase() : '';
                    const number = participant.no ? participant.no.toLowerCase() : '';
                    
                    return name.includes(searchTerm) || 
                           backName.includes(searchTerm) || 
                           sideName.includes(searchTerm) ||
                           number.includes(searchTerm);
                });
                
                // Check if all filtered results are paid or pending
                const allPaid = filteredData.every(participant => isYes(participant.payment));
                const allPending = filteredData.every(participant => !isYes(participant.payment));
                
                // Add filtering class to search container with specific type
                if (searchContainer) {
                    searchContainer.classList.add('filtering');
                    
                    if (allPaid) {
                        searchContainer.classList.add('paid-filtering');
                        searchContainer.classList.remove('pending-filtering');
                    } else if (allPending) {
                        searchContainer.classList.add('pending-filtering');
                        searchContainer.classList.remove('paid-filtering');
                    } else {
                        searchContainer.classList.remove('paid-filtering', 'pending-filtering');
                    }
                }
                
                // Populate table with filtered data and specify filter type
                populateTable(filteredData, true, allPaid ? 'paid' : (allPending ? 'pending' : 'mixed'));
                
                // On mobile, blur the input to hide the keyboard
                searchInput.blur();
            }
        });
    }
    
    // Initialize responsive features if the function exists
    if (typeof initResponsiveFeatures === 'function') {
        initResponsiveFeatures();
    }
    
    // Start the periodic refresh
    startPeriodicRefresh();
    
    console.log("Initialization complete");
});

// Remove any duplicate event listeners or initialization code below this point
