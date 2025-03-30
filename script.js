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

// Add this function to create the cash machine counting effect
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

// Modify the calculateTotals function to use the animation
function calculateTotals(data) {
    const totalParticipants = data.filter(participant => isRowFilledOut(participant)).length;
    const paidParticipants = data.filter(participant => 
        isRowFilledOut(participant) && isYes(participant.payment)
    ).length;
    
    // Calculate total funds collected
    let totalFundsCollected = 0;
    
    data.forEach(participant => {
        // Only count funds from paid participants
        if (isYes(participant.payment)) {
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
    
    // Update the display
    document.getElementById('countBadge').textContent = totalParticipants;
    document.getElementById('paidCount').textContent = `${paidParticipants} / ${totalParticipants}`;
    
    // Get the funds element
    const fundsElement = document.getElementById('totalFunds');
    
    // Get the previous value (or 0 if not set)
    const previousValue = parseInt(fundsElement.dataset.rawValue || '0', 10);
    
    // Animate the funds value change
    animateValue('totalFunds', previousValue, totalFundsCollected, 1000);
}

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
    
    // Also reapply on visibility change (when app is minimized/restored)
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            setTimeout(handleResponsiveLayout, 100);
        }
    });
    
    // Ensure layout updates after data loads
    const originalPopulateTable = window.populateTable;
    window.populateTable = function(data, isSearchResult) {
        originalPopulateTable(data, isSearchResult);
        setTimeout(handleResponsiveLayout, 100);
    };
}

// Add this to your document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS to show only specific columns on mobile
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Make table more compact with columns closer together */
        #participantTable {
            width: 100%;
            margin: 0 auto;
            border-spacing: 0;
            border-collapse: collapse;
        }
        
        /* Status pill styling - improved */
        .status-pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 500;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            transition: all 0.2s ease;
        }
        
        .status-pill.paid {
            background-color: #4CAF50;
            color: white;
            box-shadow: 0 1px 3px rgba(76, 175, 80, 0.3);
        }
        
        .status-pill.pending {
            background-color: transparent;
            color: #FF9800;
            border: 1px solid #FF9800;
            position: relative;
            overflow: hidden;
        }
        
        .status-pill.pending::before {
            content: '';
            position: absolute;
            left: 0;
            bottom: 0;
            height: 1px;
            width: 100%;
            background: linear-gradient(90deg, transparent, #FF9800, transparent);
            animation: pendingPulse 2s infinite;
        }
        
        @keyframes pendingPulse {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
        }
        
        /* Ensure all columns display properly */
        #participantTable th,
        #participantTable td {
            display: table-cell;
            visibility: visible;
            padding: 8px 10px;
        }
        
        /* Mobile-specific optimizations */
        @media screen and (max-width: 767px) {
            /* Make status pill more compact on mobile */
            .status-pill {
                padding: 2px 6px !important;
                font-size: 0.8em !important;
            }
            
            /* Specific mobile adjustments for pending pill */
            .status-pill.pending {
                border-width: 1px !important;
            }
            
            /* Hide specific columns on mobile */
            #participantTable th:nth-child(4),
            #participantTable td:nth-child(4),
            #participantTable th:nth-child(5),
            #participantTable td:nth-child(5),
            #participantTable th:nth-child(6),
            #participantTable td:nth-child(6),
            #participantTable th:nth-child(7),
            #participantTable td:nth-child(7) {
                display: none !important;
                width: 0 !important;
                max-width: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                visibility: hidden !important;
            }
            
            /* Force table to fit in viewport without horizontal scroll */
            #participantTable {
                width: 100% !important;
                table-layout: fixed !important;
                min-width: auto !important;
            }
            
            /* Adjust column widths for mobile */
            #participantTable th:nth-child(1),
            #participantTable td:nth-child(1) {
                width: 40% !important;
                text-align: left;
            }
            
            #participantTable th:nth-child(2),
            #participantTable td:nth-child(2),
            #participantTable th:nth-child(3),
            #participantTable td:nth-child(3) {
                width: 15% !important;
                text-align: center;
            }
            
            /* Ensure payment status column is visible */
            #participantTable th:nth-child(8),
            #participantTable td:nth-child(8) {
                width: 30% !important;
                text-align: center;
                display: table-cell !important;
                visibility: visible !important;
            }
            
            /* Hide scroll hint on mobile since we're preventing scrolling */
            .table-scroll-hint {
                display: none !important;
            }
            
            /* Ensure container doesn't allow horizontal scroll */
            .table-container {
                overflow-x: hidden !important;
                width: 100%;
                padding: 0;
                margin: 0;
            }
        }
    `;
    document.head.appendChild(styleElement);
    
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
    
    // Initialize responsive features
    initResponsiveFeatures();
});

// Function to populate the table with data
function populateTable(data, isSearchResult = false) {
    // Get reference to table body
    const tableBody = document.querySelector('#participantTable tbody');
    if (!tableBody) return;
    
    // Save current scroll position
    const tableContainer = document.querySelector('.table-container');
    const scrollTop = tableContainer ? tableContainer.scrollTop : 0;
    
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
        
        // Check if paid
        const isPaid = isYes(participant.payment);
        
        // Add cells for each property, including the new columns
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
    
    // Restore scroll position after a short delay
    if (tableContainer) {
        setTimeout(() => {
            tableContainer.scrollTop = scrollTop;
        }, 10);
    }
}

// Modify the fetchDataFromGoogleSheets function to handle scroll position
async function fetchDataFromGoogleSheets() {
    // Save current scroll position
    const tableContainer = document.querySelector('.table-container');
    const scrollTop = tableContainer ? tableContainer.scrollTop : 0;
    
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
            
            // Calculate totals and populate the table with the fetched data
            populateTable(participantData);
            
            // Restore scroll position after table is populated
            if (tableContainer) {
                setTimeout(() => {
                    tableContainer.scrollTop = scrollTop;
                }, 100);
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
    
    // Set up periodic refresh (every 5 seconds)
    setTimeout(fetchDataFromGoogleSheets, 5000);
}

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

// Also update the updateFundsStats function to use the animation
function updateFundsStats(participantData) {
    let paidParticipants = 0;
    let totalFundsCollected = 0;
    
    participantData.forEach(participant => {
        if (isYes(participant.payment)) {
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
    
    // Get the funds element
    const fundsElement = document.getElementById('totalFunds');
    
    // Get the previous value (or 0 if not set)
    const previousValue = parseInt(fundsElement.dataset.rawValue || '0', 10);
    
    // Animate the funds value change
    animateValue('totalFunds', previousValue, totalFundsCollected, 1000);
}

// Add device detection for better layout control
function detectDeviceType() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Add specific device classes to body
    if (/android/i.test(userAgent)) {
        document.body.classList.add('android-device');
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        document.body.classList.add('ios-device');
    }
    
    // Add screen size classes
    const width = window.innerWidth;
    if (width < 480) {
        document.body.classList.add('xs-screen');
    } else if (width < 768) {
        document.body.classList.add('sm-screen');
    }
    
    // Force table layout update based on device detection
    updateTableLayoutForDevice();
}

// Update table layout specifically for the detected device
function updateTableLayoutForDevice() {
    const tableStyleElement = document.createElement('style');
    const isIOS = document.body.classList.contains('ios-device');
    const isAndroid = document.body.classList.contains('android-device');
    const isXS = document.body.classList.contains('xs-screen');
    
    // Apply specific fixes based on device type
    tableStyleElement.textContent = `
        /* Force payment column to be visible on all devices */
        #participantTable th:nth-child(8),
        #participantTable td:nth-child(8) {
            display: table-cell !important;
            visibility: visible !important;
            position: static !important;
            width: auto !important;
            min-width: 70px !important;
        }
        
        /* Extra fixes for iOS */
        ${isIOS ? `
            #participantTable {
                width: 100% !important;
                table-layout: fixed !important;
            }
            
            .table-container {
                width: 100% !important;
                overflow-x: visible !important;
            }
        ` : ''}
        
        /* Extra fixes for very small screens */
        ${isXS ? `
            #participantTable th,
            #participantTable td {
                padding: 4px 1px !important;
                font-size: 0.85em !important;
            }
            
            .status-pill {
                padding: 1px 3px !important;
                font-size: 0.75em !important;
            }
        ` : ''}
    `;
    
    document.head.appendChild(tableStyleElement);
}

// Run device detection
detectDeviceType();

// Update on resize and orientation change
window.addEventListener('resize', function() {
    handleResponsiveLayout();
    detectDeviceType();
});
