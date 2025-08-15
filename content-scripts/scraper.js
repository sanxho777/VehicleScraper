// Main scraping functionality for different automotive websites

class VehicleDataScraper {
    constructor() {
        this.siteDetector = new SiteDetector();
        this.vehicleParser = new VehicleParser();
    }

    scrapeVehicles() {
        const site = this.siteDetector.detectSite();
        console.log('Detected site:', site);

        switch (site) {
            case 'autotrader':
                return this.scrapeAutoTrader();
            case 'cars':
                return this.scrapeCars();
            case 'cargurus':
                return this.scrapeCarGurus();
            case 'carmax':
                return this.scrapeCarMax();
            case 'facebook':
                return this.scrapeFacebook();
            case 'craigslist':
                return this.scrapeCraigslist();
            default:
                return this.scrapeGeneric();
        }
    }

    scrapeAutoTrader() {
        const vehicles = [];
        
        // AutoTrader vehicle listings
        const listings = document.querySelectorAll('[data-cmp="inventoryListing"], .inventory-listing, .listing-interior');
        
        listings.forEach(listing => {
            try {
                const vehicle = {
                    title: this.extractText(listing, '.listing-title, h3, .inventory-listing-title'),
                    price: this.extractPrice(listing, '.first-price, .listing-price, .price-section'),
                    year: this.extractYear(listing),
                    make: this.extractMake(listing),
                    model: this.extractModel(listing),
                    mileage: this.extractMileage(listing, '.listing-mileage, .mileage'),
                    image: this.extractImage(listing, 'img'),
                    url: this.extractUrl(listing, 'a'),
                    location: this.extractText(listing, '.listing-dealer-city, .dealer-name'),
                    source: 'AutoTrader'
                };

                if (vehicle.title || vehicle.price) {
                    vehicles.push(this.vehicleParser.normalizeVehicle(vehicle));
                }
            } catch (error) {
                console.error('Error scraping AutoTrader listing:', error);
            }
        });

        return vehicles;
    }

    scrapeCars() {
        const vehicles = [];
        
        // Cars.com vehicle listings
        const listings = document.querySelectorAll('.vehicle-card, .listing-row, .shop-srp-listings__listing');
        
        listings.forEach(listing => {
            try {
                const vehicle = {
                    title: this.extractText(listing, '.vehicle-card__title, .listing-title, h3'),
                    price: this.extractPrice(listing, '.vehicle-card__price, .listing-price'),
                    year: this.extractYear(listing),
                    make: this.extractMake(listing),
                    model: this.extractModel(listing),
                    mileage: this.extractMileage(listing, '.vehicle-card__mileage, .mileage'),
                    image: this.extractImage(listing, 'img'),
                    url: this.extractUrl(listing, 'a'),
                    location: this.extractText(listing, '.dealer-name, .vehicle-card__dealer'),
                    source: 'Cars.com'
                };

                if (vehicle.title || vehicle.price) {
                    vehicles.push(this.vehicleParser.normalizeVehicle(vehicle));
                }
            } catch (error) {
                console.error('Error scraping Cars.com listing:', error);
            }
        });

        return vehicles;
    }

    scrapeCarGurus() {
        const vehicles = [];
        
        // CarGurus vehicle listings
        const listings = document.querySelectorAll('.cg-dealFinder-result, .srp-list-item, [data-cg-ft="srp-listing-card"]');
        
        listings.forEach(listing => {
            try {
                const vehicle = {
                    title: this.extractText(listing, '.cg-dealFinder-result-model, .listing-title'),
                    price: this.extractPrice(listing, '.cg-dealFinder-result-price, .price'),
                    year: this.extractYear(listing),
                    make: this.extractMake(listing),
                    model: this.extractModel(listing),
                    mileage: this.extractMileage(listing, '.cg-dealFinder-result-mileage, .mileage'),
                    image: this.extractImage(listing, 'img'),
                    url: this.extractUrl(listing, 'a'),
                    location: this.extractText(listing, '.dealer-name'),
                    source: 'CarGurus'
                };

                if (vehicle.title || vehicle.price) {
                    vehicles.push(this.vehicleParser.normalizeVehicle(vehicle));
                }
            } catch (error) {
                console.error('Error scraping CarGurus listing:', error);
            }
        });

        return vehicles;
    }

    scrapeCarMax() {
        const vehicles = [];
        
        // CarMax vehicle listings
        const listings = document.querySelectorAll('.car-tile, .vehicle-tile, [data-test="car-tile"]');
        
        listings.forEach(listing => {
            try {
                const vehicle = {
                    title: this.extractText(listing, '.car-title, .vehicle-year-make-model'),
                    price: this.extractPrice(listing, '.car-price, .price'),
                    year: this.extractYear(listing),
                    make: this.extractMake(listing),
                    model: this.extractModel(listing),
                    mileage: this.extractMileage(listing, '.car-mileage, .mileage'),
                    image: this.extractImage(listing, 'img'),
                    url: this.extractUrl(listing, 'a'),
                    location: this.extractText(listing, '.store-name'),
                    source: 'CarMax'
                };

                if (vehicle.title || vehicle.price) {
                    vehicles.push(this.vehicleParser.normalizeVehicle(vehicle));
                }
            } catch (error) {
                console.error('Error scraping CarMax listing:', error);
            }
        });

        return vehicles;
    }

    scrapeFacebook() {
        const vehicles = [];
        
        // Facebook Marketplace vehicle listings
        const listings = document.querySelectorAll('[role="article"], .marketplace-tile, .x9f619');
        
        listings.forEach(listing => {
            try {
                const titleElement = listing.querySelector('span, .x1lliihq, .x6ikm8r');
                const priceElement = listing.querySelector('[dir="auto"]');
                
                const vehicle = {
                    title: titleElement?.textContent?.trim(),
                    price: this.extractPrice(listing, 'span'),
                    year: this.extractYear(listing),
                    make: this.extractMake(listing),
                    model: this.extractModel(listing),
                    mileage: this.extractMileage(listing),
                    image: this.extractImage(listing, 'img'),
                    url: this.extractUrl(listing, 'a'),
                    location: this.extractText(listing, '.x1i10hfl'),
                    source: 'Facebook Marketplace'
                };

                if (vehicle.title || vehicle.price) {
                    vehicles.push(this.vehicleParser.normalizeVehicle(vehicle));
                }
            } catch (error) {
                console.error('Error scraping Facebook listing:', error);
            }
        });

        return vehicles;
    }

    scrapeCraigslist() {
        const vehicles = [];
        
        // Craigslist vehicle listings
        const listings = document.querySelectorAll('.result-row, .cl-search-result');
        
        listings.forEach(listing => {
            try {
                const vehicle = {
                    title: this.extractText(listing, '.result-title, .cl-titlebox'),
                    price: this.extractPrice(listing, '.result-price, .price'),
                    year: this.extractYear(listing),
                    make: this.extractMake(listing),
                    model: this.extractModel(listing),
                    mileage: this.extractMileage(listing),
                    image: this.extractImage(listing, 'img'),
                    url: this.extractUrl(listing, '.result-title, a'),
                    location: this.extractText(listing, '.result-neighborhood'),
                    source: 'Craigslist'
                };

                if (vehicle.title || vehicle.price) {
                    vehicles.push(this.vehicleParser.normalizeVehicle(vehicle));
                }
            } catch (error) {
                console.error('Error scraping Craigslist listing:', error);
            }
        });

        return vehicles;
    }

    scrapeGeneric() {
        const vehicles = [];
        
        // Generic scraping for unknown sites
        const potentialListings = document.querySelectorAll('article, .listing, .vehicle, .car, [class*="vehicle"], [class*="listing"], [class*="car"]');
        
        potentialListings.forEach(listing => {
            try {
                const vehicle = {
                    title: this.extractText(listing, 'h1, h2, h3, .title, [class*="title"]'),
                    price: this.extractPrice(listing, '[class*="price"], .price'),
                    year: this.extractYear(listing),
                    make: this.extractMake(listing),
                    model: this.extractModel(listing),
                    mileage: this.extractMileage(listing),
                    image: this.extractImage(listing, 'img'),
                    url: this.extractUrl(listing, 'a'),
                    location: this.extractText(listing, '[class*="location"], .location'),
                    source: 'Unknown'
                };

                if (vehicle.title && (vehicle.price || vehicle.year)) {
                    vehicles.push(this.vehicleParser.normalizeVehicle(vehicle));
                }
            } catch (error) {
                console.error('Error scraping generic listing:', error);
            }
        });

        return vehicles;
    }

    extractText(container, selectors) {
        const selectorsArray = selectors.split(', ');
        
        for (const selector of selectorsArray) {
            const element = container.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return null;
    }

    extractPrice(container, selectors = '') {
        const selectorsArray = selectors ? selectors.split(', ') : [''];
        
        for (const selector of selectorsArray) {
            const elements = selector ? container.querySelectorAll(selector) : [container];
            
            for (const element of elements) {
                const text = element.textContent || '';
                const priceMatch = text.match(/\$[\d,]+/);
                if (priceMatch) {
                    return parseInt(priceMatch[0].replace(/[$,]/g, ''));
                }
            }
        }
        return null;
    }

    extractMileage(container, selectors = '') {
        const selectorsArray = selectors ? selectors.split(', ') : [''];
        
        for (const selector of selectorsArray) {
            const elements = selector ? container.querySelectorAll(selector) : [container];
            
            for (const element of elements) {
                const text = element.textContent || '';
                const mileageMatch = text.match(/([\d,]+)\s*(miles?|mi)/i);
                if (mileageMatch) {
                    return parseInt(mileageMatch[1].replace(/,/g, ''));
                }
            }
        }
        return null;
    }

    extractYear(container) {
        const text = container.textContent || '';
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? parseInt(yearMatch[0]) : null;
    }

    extractMake(container) {
        const text = container.textContent || '';
        const commonMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Subaru', 'Mazda', 'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Buick', 'GMC', 'Jeep', 'Dodge', 'Chrysler', 'Ram', 'Volvo', 'Jaguar', 'Land Rover', 'Porsche', 'Tesla', 'Mitsubishi'];
        
        for (const make of commonMakes) {
            if (text.toLowerCase().includes(make.toLowerCase())) {
                return make;
            }
        }
        return null;
    }

    extractModel(container) {
        // This is more complex and would require make-specific model lists
        // For now, try to extract from title after year and make
        const text = container.textContent || '';
        const words = text.split(' ');
        
        // Look for model after year and make
        for (let i = 0; i < words.length - 1; i++) {
            if (/^\d{4}$/.test(words[i])) {
                return words[i + 2] || null; // Assuming format: Year Make Model
            }
        }
        return null;
    }

    extractImage(container, selector) {
        const img = container.querySelector(selector);
        if (img) {
            return img.src || img.dataset.src || img.dataset.lazy;
        }
        return null;
    }

    extractUrl(container, selector) {
        const link = container.querySelector(selector);
        if (link && link.href) {
            return new URL(link.href, window.location.origin).href;
        }
        return window.location.href;
    }
}

// Make scraper available globally
window.VehicleScraper = new VehicleDataScraper();
