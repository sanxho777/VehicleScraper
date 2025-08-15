// Vehicle storage utilities for Chrome extension

class VehicleStorage {
    static async getAllVehicles() {
        try {
            const result = await chrome.storage.local.get(['vehicles']);
            return result.vehicles || [];
        } catch (error) {
            console.error('Error getting vehicles from storage:', error);
            return [];
        }
    }

    static async saveVehicle(vehicle) {
        try {
            // Ensure vehicle has required fields
            if (!vehicle.id) {
                vehicle.id = this.generateId();
            }
            
            if (!vehicle.scrapedAt) {
                vehicle.scrapedAt = Date.now();
            }

            const vehicles = await this.getAllVehicles();
            
            // Check for existing vehicle
            const existingIndex = vehicles.findIndex(v => v.id === vehicle.id);
            
            if (existingIndex >= 0) {
                // Update existing vehicle
                vehicles[existingIndex] = { ...vehicles[existingIndex], ...vehicle };
            } else {
                // Add new vehicle
                vehicles.push(vehicle);
            }

            await chrome.storage.local.set({ vehicles });
            return vehicle;
        } catch (error) {
            console.error('Error saving vehicle to storage:', error);
            throw error;
        }
    }

    static async deleteVehicle(vehicleId) {
        try {
            const vehicles = await this.getAllVehicles();
            const filteredVehicles = vehicles.filter(v => v.id !== vehicleId);
            
            await chrome.storage.local.set({ vehicles: filteredVehicles });
            return true;
        } catch (error) {
            console.error('Error deleting vehicle from storage:', error);
            throw error;
        }
    }

    static async updateVehicle(vehicleId, updates) {
        try {
            const vehicles = await this.getAllVehicles();
            const index = vehicles.findIndex(v => v.id === vehicleId);
            
            if (index >= 0) {
                vehicles[index] = { ...vehicles[index], ...updates };
                await chrome.storage.local.set({ vehicles });
                return vehicles[index];
            }
            
            throw new Error('Vehicle not found');
        } catch (error) {
            console.error('Error updating vehicle in storage:', error);
            throw error;
        }
    }

    static async clearAllVehicles() {
        try {
            await chrome.storage.local.set({ vehicles: [] });
            return true;
        } catch (error) {
            console.error('Error clearing vehicles from storage:', error);
            throw error;
        }
    }

    static async getVehiclesBySource(source) {
        try {
            const vehicles = await this.getAllVehicles();
            return vehicles.filter(v => v.source === source);
        } catch (error) {
            console.error('Error getting vehicles by source:', error);
            return [];
        }
    }

    static async searchVehicles(query) {
        try {
            const vehicles = await this.getAllVehicles();
            const searchTerm = query.toLowerCase();
            
            return vehicles.filter(vehicle => 
                vehicle.title?.toLowerCase().includes(searchTerm) ||
                vehicle.make?.toLowerCase().includes(searchTerm) ||
                vehicle.model?.toLowerCase().includes(searchTerm) ||
                vehicle.location?.toLowerCase().includes(searchTerm)
            );
        } catch (error) {
            console.error('Error searching vehicles:', error);
            return [];
        }
    }

    static async getStorageStats() {
        try {
            const result = await chrome.storage.local.getBytesInUse(['vehicles']);
            const vehicles = await this.getAllVehicles();
            
            return {
                vehicleCount: vehicles.length,
                storageUsed: result,
                oldestVehicle: vehicles.length > 0 ? Math.min(...vehicles.map(v => v.scrapedAt || 0)) : null,
                newestVehicle: vehicles.length > 0 ? Math.max(...vehicles.map(v => v.scrapedAt || 0)) : null
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return {
                vehicleCount: 0,
                storageUsed: 0,
                oldestVehicle: null,
                newestVehicle: null
            };
        }
    }

    static async exportVehicles(format = 'json') {
        try {
            const vehicles = await this.getAllVehicles();
            
            switch (format) {
                case 'json':
                    return JSON.stringify(vehicles, null, 2);
                case 'csv':
                    return this.convertToCSV(vehicles);
                default:
                    throw new Error('Unsupported export format');
            }
        } catch (error) {
            console.error('Error exporting vehicles:', error);
            throw error;
        }
    }

    static async importVehicles(data, format = 'json') {
        try {
            let vehicles;
            
            switch (format) {
                case 'json':
                    vehicles = JSON.parse(data);
                    break;
                case 'csv':
                    vehicles = this.parseCSV(data);
                    break;
                default:
                    throw new Error('Unsupported import format');
            }

            if (!Array.isArray(vehicles)) {
                throw new Error('Invalid vehicle data format');
            }

            // Validate and save vehicles
            for (const vehicle of vehicles) {
                if (!vehicle.id) {
                    vehicle.id = this.generateId();
                }
                await this.saveVehicle(vehicle);
            }

            return vehicles.length;
        } catch (error) {
            console.error('Error importing vehicles:', error);
            throw error;
        }
    }

    static generateId() {
        return 'vehicle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static convertToCSV(vehicles) {
        if (vehicles.length === 0) return '';
        
        const headers = ['ID', 'Title', 'Price', 'Year', 'Make', 'Model', 'Mileage', 'Source', 'URL', 'Location', 'Scraped At'];
        const rows = vehicles.map(vehicle => [
            vehicle.id || '',
            vehicle.title || '',
            vehicle.price || '',
            vehicle.year || '',
            vehicle.make || '',
            vehicle.model || '',
            vehicle.mileage || '',
            vehicle.source || '',
            vehicle.url || '',
            vehicle.location || '',
            vehicle.scrapedAt ? new Date(vehicle.scrapedAt).toISOString() : ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        return csvContent;
    }

    static parseCSV(csvData) {
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const vehicles = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
                const vehicle = {};
                
                headers.forEach((header, index) => {
                    const value = values[index] || '';
                    switch (header.toLowerCase()) {
                        case 'price':
                        case 'year':
                        case 'mileage':
                            vehicle[header.toLowerCase()] = value ? parseInt(value) : null;
                            break;
                        case 'scraped at':
                            vehicle.scrapedAt = value ? new Date(value).getTime() : Date.now();
                            break;
                        default:
                            vehicle[header.toLowerCase().replace(' ', '')] = value;
                    }
                });
                
                vehicles.push(vehicle);
            }
        }

        return vehicles;
    }
}

// Make VehicleStorage available globally
if (typeof window !== 'undefined') {
    window.VehicleStorage = VehicleStorage;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VehicleStorage;
}
