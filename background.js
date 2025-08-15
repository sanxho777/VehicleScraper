// Background service worker for Vehicle Scraper extension

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Vehicle Scraper extension installed');
        
        // Set up default storage
        chrome.storage.local.set({
            vehicles: [],
            settings: {
                autoScrape: false,
                maxVehicles: 1000
            }
        });
    }
});

// Handle extension icon click - open side panel
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case 'VEHICLE_SCRAPED':
            handleVehicleScraped(request.data, sender);
            break;
        case 'SCRAPING_ERROR':
            handleScrapingError(request.error, sender);
            break;
        case 'GET_VEHICLES':
            getStoredVehicles(sendResponse);
            return true; // Keep message channel open for async response
        case 'SAVE_VEHICLE':
            saveVehicle(request.vehicle, sendResponse);
            return true;
        case 'DELETE_VEHICLE':
            deleteVehicle(request.vehicleId, sendResponse);
            return true;
    }
});

async function handleVehicleScraped(vehicleData, sender) {
    try {
        // Add metadata
        const vehicle = {
            ...vehicleData,
            id: generateVehicleId(),
            scrapedAt: Date.now(),
            tabUrl: sender.tab?.url,
            source: detectSourceFromUrl(sender.tab?.url)
        };

        // Save to storage
        const result = await chrome.storage.local.get(['vehicles']);
        const vehicles = result.vehicles || [];
        
        // Check for duplicates
        const isDuplicate = vehicles.some(v => 
            v.url === vehicle.url || 
            (v.title === vehicle.title && v.price === vehicle.price)
        );

        if (!isDuplicate) {
            vehicles.push(vehicle);
            await chrome.storage.local.set({ vehicles });
            
            // Notify side panel of new vehicle
            chrome.runtime.sendMessage({
                type: 'VEHICLE_ADDED',
                vehicle: vehicle
            });
        }
    } catch (error) {
        console.error('Error handling scraped vehicle:', error);
    }
}

async function handleScrapingError(error, sender) {
    console.error('Scraping error from tab:', sender.tab?.url, error);
    
    // Notify side panel of error
    chrome.runtime.sendMessage({
        type: 'SCRAPING_ERROR',
        error: error,
        url: sender.tab?.url
    });
}

async function getStoredVehicles(sendResponse) {
    try {
        const result = await chrome.storage.local.get(['vehicles']);
        sendResponse({ success: true, vehicles: result.vehicles || [] });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

async function saveVehicle(vehicle, sendResponse) {
    try {
        const result = await chrome.storage.local.get(['vehicles']);
        const vehicles = result.vehicles || [];
        
        // Add or update vehicle
        const existingIndex = vehicles.findIndex(v => v.id === vehicle.id);
        if (existingIndex >= 0) {
            vehicles[existingIndex] = vehicle;
        } else {
            vehicle.id = vehicle.id || generateVehicleId();
            vehicles.push(vehicle);
        }
        
        await chrome.storage.local.set({ vehicles });
        sendResponse({ success: true });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

async function deleteVehicle(vehicleId, sendResponse) {
    try {
        const result = await chrome.storage.local.get(['vehicles']);
        const vehicles = result.vehicles || [];
        
        const filteredVehicles = vehicles.filter(v => v.id !== vehicleId);
        await chrome.storage.local.set({ vehicles: filteredVehicles });
        
        sendResponse({ success: true });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

function generateVehicleId() {
    return 'vehicle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function detectSourceFromUrl(url) {
    if (!url) return 'Unknown';
    
    const domain = new URL(url).hostname.toLowerCase();
    
    if (domain.includes('autotrader')) return 'AutoTrader';
    if (domain.includes('cars.com')) return 'Cars.com';
    if (domain.includes('cargurus')) return 'CarGurus';
    if (domain.includes('carmax')) return 'CarMax';
    if (domain.includes('vroom')) return 'Vroom';
    if (domain.includes('carvana')) return 'Carvana';
    if (domain.includes('facebook')) return 'Facebook Marketplace';
    if (domain.includes('craigslist')) return 'Craigslist';
    
    return 'Other';
}

// Clean up old vehicles periodically
chrome.alarms.create('cleanup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'cleanup') {
        try {
            const result = await chrome.storage.local.get(['vehicles', 'settings']);
            const vehicles = result.vehicles || [];
            const settings = result.settings || {};
            const maxVehicles = settings.maxVehicles || 1000;
            
            if (vehicles.length > maxVehicles) {
                // Keep only the most recent vehicles
                const sortedVehicles = vehicles.sort((a, b) => b.scrapedAt - a.scrapedAt);
                const trimmedVehicles = sortedVehicles.slice(0, maxVehicles);
                
                await chrome.storage.local.set({ vehicles: trimmedVehicles });
                console.log(`Cleaned up ${vehicles.length - maxVehicles} old vehicles`);
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
});
