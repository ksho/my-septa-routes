# SEPTA LIVE

A real-time web application that displays the live locations of SEPTA (Southeastern Pennsylvania Transportation Authority) buses on an interactive map of Philadelphia. Built with Next.js, TypeScript, and Leaflet.

## Features

- **Real-time vehicle tracking** - Shows live positions of buses updating every 5 seconds
- **Dynamic route selection** - Search and select from all available SEPTA bus routes
- **Route saving & sharing** - Routes are saved in URL parameters for easy sharing and bookmarking
- **Interactive map** - Full-screen map centered on Center City Philadelphia with repositioned zoom controls
- **Route visualization** - Display official SEPTA route paths for selected routes
- **Smart route management** - Add up to 10 routes with search functionality and easy removal
- **Extended route support** - Support for 50+ routes with automatic color generation
- **Vehicle details** - Click markers to see vehicle ID, direction, destination, and timing status
- **Mobile optimized** - Responsive design optimized for mobile devices
- **Color-coded routes** - Each route has a distinct color for easy identification

## Route Selection & Management

### How to Use
1. **Search for routes**: Use the search box in the legend to find routes by number or name
2. **Add routes**: Click on search results to add them to your map (maximum 10 routes)
3. **Remove routes**: Click the × button next to any route to remove it
4. **Share your setup**: Copy the URL to share your custom route selection with others
5. **Bookmark favorites**: Save URLs with your preferred route combinations

### URL Parameters
Routes are automatically saved in the URL as query parameters:
- Example: `https://your-app.com/?routes=57,47,42,9`
- Share these URLs to let others see your exact route selection
- Bookmark URLs to quickly return to your preferred route combinations

### Default Routes
When you first visit the app (or visit without URL parameters), these routes are shown:
- **Route 9** - Connects South Philadelphia to Center City
- **Route 12** - Serves West Philadelphia neighborhoods  
- **Route 21** - Major crosstown route through Center City
- **Route 29** - Connects Northeast Philadelphia to Center City
- **Route 42** - Serves North Philadelphia communities
- **Route 47** - Major north-south route through West Philadelphia
- **Route 57** - Connects various neighborhoods to Center City

### Supported Routes
The application supports all active SEPTA bus routes including:
- **City Transit routes**: 2, 3, 4, 5, 6, 7, 9, 12, 14, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 32, 33, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 63, 64, 65, 66, 67, 68, 70, 71, 75, 77, 79, 81, 82, 84, 93, 94, 96, 97, 98, 99
- **Lettered route**: K
- **Suburban routes**: Various 100, 400+ series routes (search to discover)

*Note: Available routes may change based on current SEPTA service schedules and cuts.*

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Mapping**: [Leaflet](https://leafletjs.com/) via [React Leaflet](https://react-leaflet.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Data Sources**: 
  - [SEPTA TransitView API](https://www3.septa.org/#/Real%20Time%20Data) for vehicle positions
  - SEPTA ArcGIS services for route geometry and route listings

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-septa-routes
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

- `/api/septa?route={routeNumber}` - Get real-time vehicle data for a specific route
- `/api/routes?routes={route1,route2}` - Get route geometry data for displaying paths
- `/api/all-routes` - Get list of all available SEPTA routes for search functionality

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes for SEPTA data proxy
│   │   ├── septa/     # Vehicle position data
│   │   ├── routes/    # Route geometry data
│   │   └── all-routes/ # Available routes listing
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout component
│   └── page.tsx       # Main application page
└── components/
    └── Map.tsx        # Interactive map component with route management
```

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
npm run start
```

## Deployment

The app can be deployed on [Vercel](https://vercel.com) or any platform supporting Next.js applications.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/my-septa-routes)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Credits

Created by Karl Shouler

## License

This project is open source and available under the [MIT License](LICENSE).