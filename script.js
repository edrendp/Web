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
    // Keep only the table header updates if needed
    updateTableHeaders();
}

// Keep updateTableHeaders function to maintain the table header counts
function updateTableHeaders() {
    const playerNameHeader = document.getElementById('playerNameHeader');
    const paymentStatusHeader = document.getElementById('paymentStatusHeader');
    
    if (playerNameHeader) {
        playerNameHeader.textContent = `(${totalValidJerseys}) Player Name`;
    }
    
    if (paymentStatusHeader) {
        const unpaidCount = totalValidJerseys - totalPaidJerseys;
        paymentStatusHeader.textContent = `(${unpaidCount}) Status`;
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

// Function to calculate totals and update the UI
// Simplify calculateTotals to only track counts needed for filtering
// Add these functions to update the progress card

// Update the progress card with collected funds and total
function updateProgressCard(data) {
    // Calculate total cost and collected funds
    let totalCost = 0;
    let collectedFunds = 0;
    
    data.filter(participant => isRowFilledOut(participant)).forEach(participant => {
        // Calculate individual cost
        let individualCost = 0;
        if (isYes(participant.tshirt)) individualCost += 380;
        if (isYes(participant.saliko)) individualCost += 350;
        
        // Add to total cost
        totalCost += individualCost;
        
        // Add to collected funds if paid or partial
        if (isYes(participant.payment)) {
            collectedFunds += individualCost;
        } else if (participant.downPayment > 0) {
            collectedFunds += participant.downPayment;
        }
    });
    
    // Calculate remaining balance without subtracting the downpayment
    const remainingBalance = Math.max(0, totalCost - collectedFunds);
    
    // Subtract 9100 from collected funds and total cost for display purposes only
    const displayCollectedFunds = Math.max(0, collectedFunds - 9100);
    const displayTotalCost = Math.max(0, totalCost - 9100);
    
    // Get elements
    const collectedElement = document.getElementById('collectedFunds');
    const totalElement = document.getElementById('totalAmount');
    const remainingElement = document.getElementById('remainingBalance');
    const progressFill = document.getElementById('progressFill');
    
    if (!collectedElement || !totalElement || !remainingElement || !progressFill) return;
    
    // Get previous values from data attributes or initialize them
    const prevCollected = parseInt(collectedElement.dataset.rawValue || '0', 10);
    const prevTotal = parseInt(totalElement.dataset.rawValue || '0', 10);
    const prevRemaining = parseInt(remainingElement.dataset.rawValue || '0', 10);
    
    // Only animate if values have changed
    const hasChanged = (prevCollected !== displayCollectedFunds || 
                        prevTotal !== displayTotalCost || 
                        prevRemaining !== remainingBalance);
    
    // Update data attributes regardless of animation
    collectedElement.dataset.rawValue = displayCollectedFunds;
    totalElement.dataset.rawValue = displayTotalCost;
    remainingElement.dataset.rawValue = remainingBalance;
    
    if (hasChanged) {
        // Animate the values with optimized animation
        animateValue('collectedFunds', prevCollected, displayCollectedFunds, 800);
        animateValue('totalAmount', prevTotal, displayTotalCost, 800);
        animateValue('remainingBalance', prevRemaining, remainingBalance, 800);
        
        // Calculate and update progress percentage - use original values for accurate percentage
        const percentage = totalCost > 0 ? Math.round((collectedFunds / totalCost) * 100) : 0;
        
        // Use CSS transitions for progress bar
        progressFill.style.width = `${percentage}%`;
        
        // Add updating class for animation
        const progressCard = document.querySelector('.progress-card');
        if (progressCard) {
            progressCard.classList.add('updating');
            setTimeout(() => {
                progressCard.classList.remove('updating');
            }, 600);
        }
    } else {
        // Just set the values without animation
        const formatter = new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        collectedElement.textContent = formatter.format(displayCollectedFunds);
        totalElement.textContent = formatter.format(displayTotalCost);
        remainingElement.textContent = formatter.format(remainingBalance);
        
        // Set progress bar without animation - use original values for accurate percentage
        const percentage = totalCost > 0 ? Math.round((collectedFunds / totalCost) * 100) : 0;
        progressFill.style.width = `${percentage}%`;
    }
}

// We can remove the updateProgressBar function since we've integrated it into updateProgressCard

// Update the progress bar
function updateProgressBar(percentage) {
    const progressFill = document.getElementById('progressFill');
    
    if (progressFill) {
        // Animate the width change
        progressFill.style.width = `${percentage}%`;
    }
    
    // No need to update percentage text since we removed it
}

// Update the calculateTotals function to also update the progress card
function calculateTotals(data) {
    const totalParticipants = data.filter(participant => isRowFilledOut(participant)).length;
    const paidParticipants = data.filter(participant => 
        isRowFilledOut(participant) && isYes(participant.payment)
    ).length;
    
    // Update global counters for filtering
    totalValidJerseys = totalParticipants;
    totalPaidJerseys = paidParticipants;
    
    // Update the table headers with the new counts
    updateTableHeaders();
    
    // Update the progress card
    updateProgressCard(data);
}

// Empty out functions that are no longer needed
function updatePaymentDetails() { /* Empty function */ }
function animateProgressValue() { /* Empty function */ }
function updateProgressBar() { /* Empty function */ }
function updateProgressMarkers() { /* Empty function */ }
function updateProgressDots() { /* Empty function */ }
function updateTimelineSteps() { /* Empty function */ }
function animatePercentage() { /* Empty function */ }

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
            // Inside the fetchDataFromGoogleSheets function, update the participant object creation
            participantData = rows.map(row => {
                // Handle empty checkbox values by converting FALSE to empty string
                const tshirtValue = (row[1] && row[1].toString().toLowerCase() === 'false') ? '' : (row[1] || '');
                const salikoValue = (row[2] && row[2].toString().toLowerCase() === 'false') ? '' : (row[2] || '');
                const paymentValue = (row[7] && row[7].toString().toLowerCase() === 'false') ? '' : (row[7] || '');
                
                // Add down payment amount (assuming it's in column I, index 8)
                const downPaymentValue = row[8] ? parseFloat(row[8]) : 0;
                
                return {
                    name: row[0] || '',
                    tshirt: tshirtValue,
                    saliko: salikoValue,
                    backName: row[3] || '',
                    sideName: row[4] || '',
                    no: row[5] || '',
                    size: row[6] || '',
                    payment: paymentValue,
                    downPayment: downPaymentValue // New field for down payment
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
        
        // Calculate total cost for this participant
        let totalCost = 0;
        if (isYes(participant.tshirt)) totalCost += 380;
        if (isYes(participant.saliko)) totalCost += 350;
        
        // Calculate remaining balance
        const downPayment = participant.downPayment || 0;
        const remainingBalance = isPaid ? 0 : Math.max(0, totalCost - downPayment);
        
        // Add row class based on payment status for enhanced styling
        if (isPaid) {
            row.classList.add('paid-row');
        } else if (downPayment > 0) {
            row.classList.add('partial-row');
        } else {
            row.classList.add('pending-row');
        }
        
        // Format payment status with down payment info
        let paymentStatusHTML = '';
        if (isPaid) {
            paymentStatusHTML = '<span class="status-pill paid">PAID</span>';
        } else if (downPayment > 0) {
            paymentStatusHTML = `
                <span class="status-pill partial">PARTIAL</span>
                <div class="payment-details">
                    <div class="down-payment">₱${downPayment}</div>
                    <div class="balance">₱${remainingBalance} bal</div>
                </div>
            `;
        } else {
            paymentStatusHTML = '<span class="status-pill pending">PENDING</span>';
        }
        
        // Add cells for each property
        row.innerHTML = `
            <td>${participant.name || ''}</td>
            <td class="center-align">${formatYesNoField(participant.tshirt)}</td>
            <td class="center-align">${formatYesNoField(participant.saliko)}</td>
            <td>${participant.backName || ''}</td>
            <td>${participant.sideName || ''}</td>
            <td>${participant.no || ''}</td>
            <td>${getSizeInitials(participant.size) || ''}</td>
            <td class="payment-status">${paymentStatusHTML}</td>
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
            const activeFilterBtn = document.querySelector('.filter-btn.active');
            const currentFilterType = activeFilterBtn ? 
                activeFilterBtn.id === 'showPaidBtn' ? 'paid' : 
                (activeFilterBtn.id === 'showUnpaidBtn' ? 'unpaid' : 'all') : 'all';
            
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

            if (!isShowingSearchResults && currentFilterType !== 'all') {
                filterTableRows(currentFilterType);
            }

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
    
    // Setup filter buttons
    setupFilterButtons();
    
    // Initialize responsive features if the function exists
    if (typeof initResponsiveFeatures === 'function') {
        initResponsiveFeatures();
    }
    
    // Start the periodic refresh
    startPeriodicRefresh();
    
    console.log("Initialization complete");
});

// Remove any duplicate event listeners or initialization code below this point

// Add event listeners for filter buttons
// Updated setupFilterButtons function to remove All Players and default to Paid
function setupFilterButtons() {
    const showPaidBtn = document.getElementById('showPaidBtn');
    const showUnpaidBtn = document.getElementById('showUnpaidBtn');
    
    // Store the current filter state - default to 'paid' instead of 'all'
    let currentFilter = 'paid';
    
    if (showPaidBtn) {
        showPaidBtn.addEventListener('click', () => {
            setActiveFilter(showPaidBtn);
            currentFilter = 'paid';
            filterTableRows('paid');
        });
    }
    
    if (showUnpaidBtn) {
        showUnpaidBtn.addEventListener('click', () => {
            setActiveFilter(showUnpaidBtn);
            currentFilter = 'unpaid';
            filterTableRows('unpaid');
        });
    }
    
    // Override the fetchAndUpdateData function to maintain filter state
    const originalFetchAndUpdateData = fetchAndUpdateData;
    fetchAndUpdateData = function() {
        return fetchDataFromGoogleSheets()
            .then(() => {
                // Re-apply the current filter after data refresh
                filterTableRows(currentFilter);
            })
            .catch(error => {
                console.error("Error in fetchAndUpdateData:", error);
            });
    };
    
    // Apply the default 'paid' filter on initial load
    filterTableRows('paid');
}

function setActiveFilter(activeButton) {
    // Remove active class from all buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    activeButton.classList.add('active');
}

function filterTableRows(filterType) {
    const rows = document.querySelectorAll('#participantTable tbody tr');
    
    rows.forEach(row => {
        if (filterType === 'all') {
            row.style.display = '';
        } else if (filterType === 'paid' && row.classList.contains('paid-row')) {
            row.style.display = '';
        } else if (filterType === 'unpaid' && !row.classList.contains('paid-row')) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
