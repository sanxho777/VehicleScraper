class VehicleScraper {
    constructor() {
        this.vehicles = [];
        this.filteredVehicles = [];
        this.init();
    }

    async init() {
        await this.loadVehicles();
        this.setupEventListeners();
        this.renderVehicles();
        this.updateFilters();
    }

    setupEventListeners() {
        // Scrape button
        document.getElementById('scrapeBtn').addEventListener('click', () => this.scrapeCurrentPage());
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => this.exportVehicles());
        
        // Search and filters
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('siteFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('yearFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('makeFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
    }

    async loadVehicles() {
        try {
            this.vehicles = await VehicleStorage.getAllVehicles();
            this.filteredVehicles = [...this.vehicles];
        } catch (error) {
            console.error('Error loading vehicles:', error);
            this.showStatus('Error loading vehicles', 'error');
        }
    }

    async scrapeCurrentPage() {
        try {
            this.showLoading(true);
            this.showStatus('Scraping page...', 'info');
            
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Execute scraping script
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: this.performScraping
            });

            const scrapedVehicles = results[0].result;
            
            if (scrapedVehicles && scrapedVehicles.length > 0) {
                // Save vehicles
                for (const vehicle of scrapedVehicles) {
                    await VehicleStorage.saveVehicle(vehicle);
                }
                
                await this.loadVehicles();
                this.renderVehicles();
                this.updateFilters();
                
                this.showStatus(`Scraped ${scrapedVehicles.length} vehicles`, 'success');
            } else {
                this.showStatus('No vehicles found on this page', 'warning');
            }
        } catch (error) {
            console.error('Scraping error:', error);
            this.showStatus('Error scraping page', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    performScraping() {
        // This function runs in the content script context
        if (typeof window.VehicleScraper !== 'undefined') {
            return window.VehicleScraper.scrapeVehicles();
        }
        return [];
    }

    renderVehicles() {
        const container = document.getElementById('vehicleList');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredVehicles.length === 0) {
            emptyState.style.display = 'block';
            container.innerHTML = '';
            container.appendChild(emptyState);
        } else {
            emptyState.style.display = 'none';
            container.innerHTML = this.filteredVehicles.map(vehicle => this.createVehicleCard(vehicle)).join('');
        }
        
        this.updateVehicleCount();
    }

    createVehicleCard(vehicle) {
        const priceDisplay = vehicle.price ? `$${vehicle.price.toLocaleString()}` : 'Price not available';
        const imageDisplay = vehicle.image ? 
            `<img src="${vehicle.image}" alt="${vehicle.title}" class="w-full h-32 object-cover rounded-md mb-3">` :
            '<div class="w-full h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center text-gray-500">No Image</div>';

        return `
            <div class="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
                ${imageDisplay}
                <div class="space-y-2">
                    <h3 class="font-semibold text-gray-800 truncate">${vehicle.title || 'Unknown Vehicle'}</h3>
                    <p class="text-lg font-bold text-blue-600">${priceDisplay}</p>
                    <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <span>Year: ${vehicle.year || 'N/A'}</span>
                        <span>Make: ${vehicle.make || 'N/A'}</span>
                        <span>Model: ${vehicle.model || 'N/A'}</span>
                        <span>Mileage: ${vehicle.mileage ? vehicle.mileage.toLocaleString() : 'N/A'}</span>
                    </div>
                    <div class="flex justify-between items-center mt-3">
                        <span class="text-xs bg-gray-100 px-2 py-1 rounded">${vehicle.source || 'Unknown'}</span>
                        <div class="flex gap-2">
                            <button onclick="window.open('${vehicle.url}', '_blank')" 
                                    class="text-blue-600 hover:text-blue-800 text-sm">View</button>
                            <button onclick="vehicleApp.deleteVehicle('${vehicle.id}')" 
                                    class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async deleteVehicle(vehicleId) {
        if (confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await VehicleStorage.deleteVehicle(vehicleId);
                await this.loadVehicles();
                this.renderVehicles();
                this.updateFilters();
                this.showStatus('Vehicle deleted', 'success');
            } catch (error) {
                console.error('Error deleting vehicle:', error);
                this.showStatus('Error deleting vehicle', 'error');
            }
        }
    }

    applyFilters() {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const site = document.getElementById('siteFilter').value;
        const year = document.getElementById('yearFilter').value;
        const make = document.getElementById('makeFilter').value;

        this.filteredVehicles = this.vehicles.filter(vehicle => {
            const matchesSearch = !search || 
                vehicle.title?.toLowerCase().includes(search) ||
                vehicle.make?.toLowerCase().includes(search) ||
                vehicle.model?.toLowerCase().includes(search);
            
            const matchesSite = !site || vehicle.source?.toLowerCase().includes(site);
            const matchesYear = !year || vehicle.year?.toString() === year;
            const matchesMake = !make || vehicle.make?.toLowerCase() === make.toLowerCase();

            return matchesSearch && matchesSite && matchesYear && matchesMake;
        });

        this.renderVehicles();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('siteFilter').value = '';
        document.getElementById('yearFilter').value = '';
        document.getElementById('makeFilter').value = '';
        this.applyFilters();
    }

    updateFilters() {
        // Update year filter
        const years = [...new Set(this.vehicles.map(v => v.year).filter(Boolean))].sort((a, b) => b - a);
        const yearFilter = document.getElementById('yearFilter');
        yearFilter.innerHTML = '<option value="">All Years</option>' + 
            years.map(year => `<option value="${year}">${year}</option>`).join('');

        // Update make filter
        const makes = [...new Set(this.vehicles.map(v => v.make).filter(Boolean))].sort();
        const makeFilter = document.getElementById('makeFilter');
        makeFilter.innerHTML = '<option value="">All Makes</option>' + 
            makes.map(make => `<option value="${make}">${make}</option>`).join('');
    }

    updateVehicleCount() {
        document.getElementById('vehicleCount').textContent = 
            `${this.filteredVehicles.length} vehicle${this.filteredVehicles.length !== 1 ? 's' : ''}`;
    }

    async exportVehicles() {
        try {
            const dataStr = JSON.stringify(this.filteredVehicles, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `vehicles_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showStatus('Vehicles exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showStatus('Error exporting vehicles', 'error');
        }
    }

    showStatus(message, type = 'info') {
        const statusBar = document.getElementById('statusBar');
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');
        
        statusText.textContent = message;
        statusBar.classList.remove('hidden');
        
        // Set indicator color based on type
        statusIndicator.className = `w-3 h-3 rounded-full ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
        }`;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            statusBar.classList.add('hidden');
        }, 3000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.toggle('hidden', !show);
    }
}

// Initialize the app
const vehicleApp = new VehicleScraper();

// Make deleteVehicle available globally for the onclick handlers
window.vehicleApp = vehicleApp;
