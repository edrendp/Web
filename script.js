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
    );
}

// Calculate total valid and paid jerseys
function calculateTotals(data) {
    // Filter to get only valid rows
    const validData = data.filter(participant => isRowFilledOut(participant));
    totalValidJerseys = validData.length;
    
    // Count paid jerseys
    totalPaidJerseys = validData.filter(participant => participant.payment === 'Paid').length;
    
    // Update the UI badges
    updateCountBadges();
    
    return validData;
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
        
        // Add cells for each property
        row.innerHTML = `
            <td>${participant.name || ''}</td>
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
}

// Function to fetch data from Google Sheets
async function fetchDataFromGoogleSheets() {
    try {
        // Construct the Google Sheets API URL
        const sheetRange = `${SHEET_NAME}!A:F`;
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetRange}?key=${API_KEY}`;
        
        // Fetch data
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            // Extract headers and data rows
            const rows = data.values.slice(1);
            
            // Map rows to participant objects
            participantData = rows.map(row => ({
                name: row[0] || '',
                backName: row[1] || '',
                sideName: row[2] || '',
                no: row[3] || '',
                size: row[4] || '',
                payment: row[5] || 'Not Paid'
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