// Load configuration from config.js
// Google Sheets API configuration is now loaded from config.js
const SPREADSHEET_ID = config.spreadsheetId;
const API_KEY = config.apiKey;
const SHEET_NAME = config.sheetName;

// Variables to store participant data
let participantData = [];
let totalValidJerseys = 0;
let totalPaidJerseys = 0;

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

// Calculate total valid and paid jerseys
function calculateTotals(data) {
    const totalParticipants = data.filter(participant => isRowFilledOut(participant)).length;
    const paidParticipants = data.filter(participant => 
        isRowFilledOut(participant) && participant.payment === 'Paid'
    ).length;
    
    // Calculate total funds collected
    let totalFundsCollected = 0;
    
    data.forEach(participant => {
        // Only count funds from paid participants
        if (participant.payment === 'Paid') {
            // Check if they have T-Shirt (380 Pesos)
            if (participant.tshirt && participant.tshirt.toString().toLowerCase() === 'yes') {
                totalFundsCollected += 380;
            }
            
            // Check if they have Saliko (350 Pesos)
            if (participant.saliko && participant.saliko.toString().toLowerCase() === 'yes') {
                totalFundsCollected += 350;
            }
        }
    });
    
    // Update the display
    document.getElementById('countBadge').textContent = totalParticipants;
    document.getElementById('paidCount').textContent = `${paidParticipants} / ${totalParticipants}`;
    
    // Format the funds with Philippine Peso symbol and thousands separator
    const formattedFunds = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(totalFundsCollected);
    
    document.getElementById('totalFunds').textContent = formattedFunds;
}

// Helper function to format yes/no fields - improved empty handling
function formatYesNoField(value) {
    if (value && value.toString().toLowerCase() === 'yes') {
        return '<span class="check-symbol" title="Yes"></span>';
    } else if (!value || value.toString().trim() === '') {
        return '<span class="no-symbol" title="Not specified"></span>';
    } else {
        return value; // Return original value for anything else
    }
}

// Function to populate the table with data
function populateTable(data, isSearchResult = false) {
    // Get reference to table body
    const tableBody = document.querySelector('#participantTable tbody');
    if (!tableBody) return;
    
    // Clear existing table data
    tableBody.innerHTML = '';
    
    // Filter out rows that don't have all required fields
    const filteredData = data.filter(participant => isRowFilledOut(participant));
    
    // If this is not a search result, calculate the overall totals
    if (!isSearchResult) {
        calculateTotals(data);
    }
    
    // Add each participant to the table
    filteredData.forEach(participant => {
        const row = document.createElement('tr');
        
        // Add cells for each property, including the new columns
        row.innerHTML = `
            <td>${participant.name || ''}</td>
            <td class="center-align">${formatYesNoField(participant.tshirt)}</td>
            <td class="center-align">${formatYesNoField(participant.saliko)}</td>
            <td>${participant.backName || ''}</td>
            <td>${participant.sideName || ''}</td>
            <td>${participant.no || ''}</td>
            <td>${getSizeInitials(participant.size)}</td>
            <td class="payment-status ${participant.payment === 'Paid' ? 'paid' : 'not-paid'}">
                ${participant.payment || 'Not Paid'}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Make sure mobile layout updates
    setTimeout(() => {
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            // Force a reflow to ensure proper scrolling
            tableContainer.style.display = 'none';
            tableContainer.offsetHeight; // Force reflow
            tableContainer.style.display = '';
        }
    }, 100);
}

// Function to fetch data from Google Sheets
async function fetchDataFromGoogleSheets() {
    try {
        // Construct the Google Sheets API URL
        const sheetRange = `${SHEET_NAME}!A:H`;
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetRange}?key=${API_KEY}`;
        
        // Fetch data
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            // Extract headers and data rows
            const rows = data.values.slice(1);
            
            // Map rows to participant objects with the new columns
            participantData = rows.map(row => ({
                name: row[0] || '',
                tshirt: row[1] || '',
                saliko: row[2] || '',
                backName: row[3] || '',
                sideName: row[4] || '',
                no: row[5] || '',
                size: row[6] || '',
                payment: row[7] || 'Not Paid'
            }));
            
            // Calculate totals and populate the table with the fetched data
            populateTable(participantData);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load data immediately
    fetchDataFromGoogleSheets();
    
    // Set up search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (!searchTerm) {
                // If search is empty, show all data
                populateTable(participantData);
                return;
            }
            
            // Filter the data based on search term
            const filteredData = participantData.filter(participant => {
                // Only search in completely filled out rows
                if (!isRowFilledOut(participant)) return false;
                
                return Object.values(participant).some(value => 
                    value.toString().toLowerCase().includes(searchTerm)
                );
            });
            
            // Display search results but mark as search result so totals aren't updated
            populateTable(filteredData, true);
        });
    }
});

// Comprehensive responsive handling function
function initResponsiveFeatures() {
    // Handle responsive behavior based on device
    function handleResponsiveLayout() {
        const tableContainer = document.querySelector('.table-container');
        const table = document.getElementById('participantTable');
        const scrollHint = document.querySelector('.table-scroll-hint');
        
        if (tableContainer && table && scrollHint) {
            // Only show hint if table width exceeds container width
            if (table.offsetWidth > tableContainer.offsetWidth) {
                scrollHint.style.display = 'block';
            } else {
                scrollHint.style.display = 'none';
            }
        }
        
        // Adjust layout based on device orientation
        const isLandscape = window.matchMedia('(orientation: landscape)').matches;
        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        
        if (isMobile && isLandscape) {
            // Optimize for landscape mobile view
            document.body.classList.add('landscape-mobile');
        } else {
            document.body.classList.remove('landscape-mobile');
        }
    }
    
    // Handle device pixel ratio for high-DPI screens
    function handleHighDpiScreens() {
        const pixelRatio = window.devicePixelRatio || 1;
        if (pixelRatio >= 2) {
            document.body.classList.add('high-dpi');
        }
    }
    
    // Apply touch-friendly adjustments for touch devices
    function handleTouchDevices() {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            document.body.classList.add('touch-device');
            
            // Increase tap target sizes for touch devices
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .touch-device #searchInput,
                .touch-device #participantTable th,
                .touch-device #participantTable td {
                    min-height: 44px; /* Recommended minimum touch target size */
                }
            `;
            document.head.appendChild(styleElement);
        }
    }
    
    // Initialize all responsive features
    handleResponsiveLayout();
    handleHighDpiScreens();
    handleTouchDevices();
    
    // Update on resize and orientation change
    window.addEventListener('resize', handleResponsiveLayout);
    window.addEventListener('orientationchange', handleResponsiveLayout);
    
    // Ensure layout updates after data loads
    const originalPopulateTable = window.populateTable;
    window.populateTable = function(data, isSearchResult) {
        originalPopulateTable(data, isSearchResult);
        setTimeout(handleResponsiveLayout, 100);
    };
}

// Add this to your document ready function
document.addEventListener('DOMContentLoaded', function() {
    initResponsiveFeatures();
    
    // Make sure iOS devices properly handle fixed elements
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'auto';
    document.body.style.webkitOverflowScrolling = 'touch';
});

// Function to handle scroll indicators
function setupScrollIndicators() {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;
    
    function updateScrollIndicators() {
        // Check if scrolling is possible
        const canScrollLeft = tableContainer.scrollLeft > 0;
        const canScrollRight = tableContainer.scrollLeft < (tableContainer.scrollWidth - tableContainer.clientWidth);
        
        // Add/remove classes based on scroll position
        tableContainer.classList.toggle('can-scroll-left', canScrollLeft);
        tableContainer.classList.toggle('can-scroll-right', canScrollRight);
    }
    
    // Initial update
    updateScrollIndicators();
    
    // Update on scroll
    tableContainer.addEventListener('scroll', updateScrollIndicators);
    
    // Update on window resize
    window.addEventListener('resize', updateScrollIndicators);
    
    // Add subtle indicator of scrollability for touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        tableContainer.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});
        
        tableContainer.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            
            // If user attempted to scroll but table is at edge, add highlight effect
            if (Math.abs(diff) > 5) {
                if (diff > 0 && !canScrollRight) {
                    // Tried to scroll right but reached end
                    tableContainer.classList.add('scroll-end-right');
                    setTimeout(() => tableContainer.classList.remove('scroll-end-right'), 500);
                } else if (diff < 0 && !canScrollLeft) {
                    // Tried to scroll left but reached start
                    tableContainer.classList.add('scroll-end-left');
                    setTimeout(() => tableContainer.classList.remove('scroll-end-left'), 500);
                }
            }
        }, {passive: true});
    }
}

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', function() {
    // Other initialization code...
    setupScrollIndicators();
});

// Make sure to call this after populating the table too
const originalPopulateTable = window.populateTable || function(){};
window.populateTable = function(data, isSearchResult) {
    originalPopulateTable.call(this, data, isSearchResult);
    
    // Update scroll indicators after table population
    setTimeout(setupScrollIndicators, 100);
};

// Helper function to check if tshirt or saliko is "yes"
function isYes(value) {
    return value && value.toString().toLowerCase() === 'yes';
}

// If you need to call this function directly somewhere else too
function updateFundsStats(participantData) {
    let paidParticipants = 0;
    let totalFundsCollected = 0;
    
    participantData.forEach(participant => {
        if (participant.payment === 'Paid') {
            paidParticipants++;
            
            // Add T-Shirt cost if selected (380 Pesos)
            if (isYes(participant.tshirt)) {
                totalFundsCollected += 380;
            }
            
            // Add Saliko cost if selected (350 Pesos)
            if (isYes(participant.saliko)) {
                totalFundsCollected += 350;
            }
        }
    });
    
    // Format and display the funds
    const formattedFunds = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(totalFundsCollected);
    
    document.getElementById('totalFunds').textContent = formattedFunds;
}
