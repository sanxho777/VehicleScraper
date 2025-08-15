// Site detection for different automotive websites

class SiteDetector {
    detectSite() {
        const hostname = window.location.hostname.toLowerCase();
        const url = window.location.href.toLowerCase();
        
        // Check for specific automotive sites
        if (hostname.includes('autotrader')) {
            return 'autotrader';
        }
        
        if (hostname.includes('cars.com')) {
            return 'cars';
        }
        
        if (hostname.includes('cargurus')) {
            return 'cargurus';
        }
        
        if (hostname.includes('carmax')) {
            return 'carmax';
        }
        
        if (hostname.includes('vroom')) {
            return 'vroom';
        }
        
        if (hostname.includes('carvana')) {
            return 'carvana';
        }
        
        if (hostname.includes('facebook') && (url.includes('marketplace') || url.includes('vehicles'))) {
            return 'facebook';
        }
        
        if (hostname.includes('craigslist')) {
            return 'craigslist';
        }
        
        // Check if page has vehicle-related content
        if (this.hasVehicleContent()) {
            return 'generic';
        }
        
        return 'unknown';
    }

    hasVehicleContent() {
        const pageText = document.body.textContent.toLowerCase();
        const vehicleKeywords = [
            'vehicle', 'car', 'truck', 'suv', 'sedan', 'coupe', 'hatchback',
            'honda', 'toyota', 'ford', 'chevrolet', 'bmw', 'mercedes',
            'mileage', 'mpg', 'transmission', 'engine', 'horsepower',
            'year', 'make', 'model', 'vin', 'price', 'financing'
        ];
        
        const keywordCount = vehicleKeywords.reduce((count, keyword) => {
            return count + (pageText.includes(keyword) ? 1 : 0);
        }, 0);
        
        // If we find at least 3 vehicle-related keywords, consider it a vehicle site
        return keywordCount >= 3;
    }

    getSiteSpecificSelectors() {
        const site = this.detectSite();
        
        const selectors = {
            autotrader: {
                container: '[data-cmp="inventoryListing"], .inventory-listing',
                title: '.listing-title, .inventory-listing-title',
                price: '.first-price, .listing-price',
                mileage: '.listing-mileage',
                image: 'img',
                link: 'a'
            },
            cars: {
                container: '.vehicle-card, .listing-row',
                title: '.vehicle-card__title, .listing-title',
                price: '.vehicle-card__price, .listing-price',
                mileage: '.vehicle-card__mileage',
                image: 'img',
                link: 'a'
            },
            cargurus: {
                container: '.cg-dealFinder-result, .srp-list-item',
                title: '.cg-dealFinder-result-model',
                price: '.cg-dealFinder-result-price',
                mileage: '.cg-dealFinder-result-mileage',
                image: 'img',
                link: 'a'
            },
            carmax: {
                container: '.car-tile, .vehicle-tile',
                title: '.car-title',
                price: '.car-price',
                mileage: '.car-mileage',
                image: 'img',
                link: 'a'
            },
            facebook: {
                container: '[role="article"], .marketplace-tile',
                title: 'span, .x1lliihq',
                price: '[dir="auto"]',
                mileage: 'span',
                image: 'img',
                link: 'a'
            },
            craigslist: {
                container: '.result-row',
                title: '.result-title',
                price: '.result-price',
                mileage: '.result-row',
                image: 'img',
                link: '.result-title'
            },
            generic: {
                container: 'article, .listing, .vehicle, [class*="vehicle"]',
                title: 'h1, h2, h3, .title',
                price: '.price, [class*="price"]',
                mileage: '.mileage, [class*="mileage"]',
                image: 'img',
                link: 'a'
            }
        };
        
        return selectors[site] || selectors.generic;
    }
}

// Make site detector available globally
window.SiteDetector = SiteDetector;
