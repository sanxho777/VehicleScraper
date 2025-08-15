# Vehicle Scraper Browser Extension

## Overview

This project is a Chrome browser extension designed to scrape and manage vehicle listings from various automotive websites. The extension provides automated data collection from popular car listing sites like AutoTrader, Cars.com, CarGurus, CarMax, Facebook Marketplace, and Craigslist. It features a side panel interface for viewing, filtering, and exporting scraped vehicle data, with local storage capabilities for managing collected listings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Browser Extension Architecture
The project follows the Chrome Extension Manifest V3 architecture with a service worker-based background script and content script injection model. The extension uses a side panel UI pattern for the main interface, providing persistent access to scraped data while browsing automotive websites.

### Component Structure
- **Background Service Worker** (`background.js`): Manages extension lifecycle, handles inter-component communication, and coordinates data storage operations
- **Content Scripts**: Automatically injected into supported automotive websites to perform vehicle data extraction
- **Side Panel Interface** (`sidepanel.html`/`sidepanel.js`): Provides the main user interface for viewing, filtering, and managing scraped vehicles
- **Utility Modules**: Modular utilities for storage operations, vehicle data parsing, and site detection

### Data Flow Architecture
The extension implements a message-passing architecture where content scripts detect vehicle listings on web pages and send structured data to the background service worker. The background worker processes and stores this data locally, while the side panel interface provides real-time access to the collected information.

### Storage Strategy
Uses Chrome's local storage API for persistent data storage, maintaining vehicle collections and user settings locally without requiring external databases or user accounts. The storage system supports CRUD operations for vehicle data with automatic ID generation and metadata tracking.

### Content Script Injection
Implements a selective content script injection strategy targeting specific automotive website patterns. The system uses site detection logic to identify supported platforms and apply appropriate scraping strategies for each site's unique DOM structure.

### UI Framework
The side panel interface uses Tailwind CSS for styling with a responsive design approach. The interface provides filtering, searching, and export capabilities with real-time updates reflecting the current state of scraped data.

## External Dependencies

### Chrome Extension APIs
- **chrome.storage.local**: Vehicle data persistence and settings storage
- **chrome.runtime**: Inter-component messaging and lifecycle management
- **chrome.sidePanel**: Side panel UI functionality
- **chrome.scripting**: Dynamic content script execution
- **chrome.tabs**: Active tab detection and interaction

### Third-party Libraries
- **Tailwind CSS**: UI styling framework delivered via CDN
- **Google Fonts (Inter)**: Typography enhancement

### Target Website Integrations
- **AutoTrader**: Primary automotive listing platform
- **Cars.com**: Secondary automotive marketplace
- **CarGurus**: Vehicle research and listing platform
- **CarMax**: Used car retailer platform
- **Facebook Marketplace**: Social commerce vehicle listings
- **Craigslist**: Classified advertisements platform
- **Vroom**: Online vehicle marketplace
- **Carvana**: Online used car platform

### Browser Compatibility
Designed specifically for Chromium-based browsers supporting Manifest V3 extensions, including Chrome, Edge, and other compatible browsers.