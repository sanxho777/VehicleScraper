// Vehicle data parsing and normalization utilities

class VehicleParser {
    constructor() {
        this.carMakes = [
            'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
            'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford',
            'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep',
            'Kia', 'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Maserati',
            'Mazda', 'McLaren', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan',
            'Porsche', 'Ram', 'Rolls-Royce', 'Subaru', 'Tesla', 'Toyota',
            'Volkswagen', 'Volvo'
        ];
    }

    normalizeVehicle(rawVehicle) {
        const normalized = {
            id: rawVehicle.id || this.generateId(),
            title: this.cleanTitle(rawVehicle.title),
            price: this.parsePrice(rawVehicle.price),
            year: this.parseYear(rawVehicle.year || rawVehicle.title),
            make: this.parseMake(rawVehicle.make || rawVehicle.title),
            model: this.parseModel(rawVehicle.model || rawVehicle.title),
            mileage: this.parseMileage(rawVehicle.mileage),
            image: this.cleanUrl(rawVehicle.image),
            url: this.cleanUrl(rawVehicle.url),
            location: this.cleanText(rawVehicle.location),
            source: rawVehicle.source || 'Unknown',
            scrapedAt: rawVehicle.scrapedAt || Date.now(),
            description: this.cleanText(rawVehicle.description),
            vin: this.parseVIN(rawVehicle.vin || rawVehicle.description),
            transmission: this.parseTransmission(rawVehicle.transmission || rawVehicle.description),
            fuelType: this.parseFuelType(rawVehicle.fuelType || rawVehicle.description),
            condition: this.parseCondition(rawVehicle.condition || rawVehicle.description)
        };

        // If make/model/year not found in specific fields, try to extract from title
        if (!normalized.year || !normalized.make || !normalized.model) {
            const titleInfo = this.parseVehicleTitle(normalized.title);
            normalized.year = normalized.year || titleInfo.year;
            normalized.make = normalized.make || titleInfo.make;
            normalized.model = normalized.model || titleInfo.model;
        }

        return normalized;
    }

    cleanTitle(title) {
        if (!title) return null;
        
        return title
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\-]/g, '')
            .trim();
    }

    parsePrice(price) {
        if (typeof price === 'number') return price;
        if (!price) return null;
        
        const priceStr = String(price).replace(/[^\d]/g, '');
        const parsed = parseInt(priceStr);
        
        // Validate price range (reasonable for vehicles)
        if (parsed && parsed >= 500 && parsed <= 500000) {
            return parsed;
        }
        
        return null;
    }

    parseYear(yearInput) {
        if (typeof yearInput === 'number') return yearInput;
        if (!yearInput) return null;
        
        const yearMatch = String(yearInput).match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            const year = parseInt(yearMatch[0]);
            const currentYear = new Date().getFullYear();
            
            // Validate year range
            if (year >= 1900 && year <= currentYear + 1) {
                return year;
            }
        }
        
        return null;
    }

    parseMake(makeInput) {
        if (!makeInput) return null;
        
        const makeStr = String(makeInput).toLowerCase();
        
        for (const make of this.carMakes) {
            if (makeStr.includes(make.toLowerCase())) {
                return make;
            }
        }
        
        return null;
    }

    parseModel(modelInput) {
        if (!modelInput) return null;
        
        // This is simplified - in reality, you'd want a comprehensive model database
        const modelStr = String(modelInput)
            .replace(/\b(19|20)\d{2}\b/g, '') // Remove years
            .replace(/\b(sedan|coupe|suv|truck|hatchback)\b/gi, '') // Remove body types
            .trim();
        
        const words = modelStr.split(' ');
        
        // Try to find model name (usually after make)
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (word && word.length > 1 && !/^\d+$/.test(word)) {
                return word;
            }
        }
        
        return null;
    }

    parseMileage(mileageInput) {
        if (typeof mileageInput === 'number') return mileageInput;
        if (!mileageInput) return null;
        
        const mileageStr = String(mileageInput).replace(/[^\d]/g, '');
        const parsed = parseInt(mileageStr);
        
        // Validate mileage range
        if (parsed && parsed >= 0 && parsed <= 500000) {
            return parsed;
        }
        
        return null;
    }

    parseVehicleTitle(title) {
        if (!title) return { year: null, make: null, model: null };
        
        const result = {
            year: this.parseYear(title),
            make: this.parseMake(title),
            model: null
        };
        
        // Try to extract model from title
        const titleWords = title.split(' ');
        const makeIndex = result.make ? titleWords.findIndex(word => 
            word.toLowerCase() === result.make.toLowerCase()
        ) : -1;
        
        if (makeIndex >= 0 && makeIndex < titleWords.length - 1) {
            result.model = titleWords[makeIndex + 1];
        }
        
        return result;
    }

    parseVIN(vinInput) {
        if (!vinInput) return null;
        
        const vinMatch = String(vinInput).match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
        return vinMatch ? vinMatch[0] : null;
    }

    parseTransmission(transmissionInput) {
        if (!transmissionInput) return null;
        
        const transStr = String(transmissionInput).toLowerCase();
        
        if (transStr.includes('manual') || transStr.includes('stick')) {
            return 'Manual';
        } else if (transStr.includes('automatic') || transStr.includes('auto')) {
            return 'Automatic';
        } else if (transStr.includes('cvt')) {
            return 'CVT';
        }
        
        return null;
    }

    parseFuelType(fuelInput) {
        if (!fuelInput) return null;
        
        const fuelStr = String(fuelInput).toLowerCase();
        
        if (fuelStr.includes('electric') || fuelStr.includes('ev')) {
            return 'Electric';
        } else if (fuelStr.includes('hybrid')) {
            return 'Hybrid';
        } else if (fuelStr.includes('diesel')) {
            return 'Diesel';
        } else if (fuelStr.includes('gas') || fuelStr.includes('gasoline')) {
            return 'Gasoline';
        }
        
        return null;
    }

    parseCondition(conditionInput) {
        if (!conditionInput) return null;
        
        const condStr = String(conditionInput).toLowerCase();
        
        if (condStr.includes('new')) {
            return 'New';
        } else if (condStr.includes('used') || condStr.includes('pre-owned')) {
            return 'Used';
        } else if (condStr.includes('certified')) {
            return 'Certified Pre-Owned';
        }
        
        return null;
    }

    cleanText(text) {
        if (!text) return null;
        
        return String(text)
            .replace(/\s+/g, ' ')
            .trim();
    }

    cleanUrl(url) {
        if (!url) return null;
        
        try {
            // Ensure URL is valid
            const urlObj = new URL(url, window.location.origin);
            return urlObj.href;
        } catch (error) {
            return null;
        }
    }

    generateId() {
        return 'vehicle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    validateVehicle(vehicle) {
        const errors = [];
        
        if (!vehicle.title && !vehicle.make && !vehicle.model) {
            errors.push('Vehicle must have a title or make/model');
        }
        
        if (vehicle.year && (vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1)) {
            errors.push('Invalid year');
        }
        
        if (vehicle.price && (vehicle.price < 0 || vehicle.price > 1000000)) {
            errors.push('Invalid price range');
        }
        
        if (vehicle.mileage && (vehicle.mileage < 0 || vehicle.mileage > 1000000)) {
            errors.push('Invalid mileage');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Make VehicleParser available globally
if (typeof window !== 'undefined') {
    window.VehicleParser = VehicleParser;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VehicleParser;
}
