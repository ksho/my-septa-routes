# SEPTA Real-Time Transit Tracker

A real-time web application that displays the live locations of SEPTA (Southeastern Pennsylvania Transportation Authority) buses and trains on an interactive map of Philadelphia.

## Features

- **Real-time vehicle tracking** - Shows live positions of buses updating every 5 seconds
- **Multiple route support** - Tracks routes 57, 47, 42, 9, 12, 21, and 29
- **Interactive map** - Full-screen map centered on Center City Philadelphia
- **Route visualization** - Display official SEPTA route paths with toggle option
- **Vehicle details** - Click markers to see vehicle ID, direction, destination, and timing status
- **Mobile optimized** - Responsive design optimized for mobile devices
- **Color-coded routes** - Each route has a unique color for easy identification

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Mapping**: [Leaflet](https://leafletjs.com/) via [React Leaflet](https://react-leaflet.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Data Sources**: 
  - [SEPTA TransitView API](https://www3.septa.org/#/Real%20Time%20Data) for vehicle positions
  - SEPTA ArcGIS services for route geometry

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

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes for SEPTA data proxy
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout component
│   └── page.tsx       # Main application page
└── components/
    └── Map.tsx        # Interactive map component
```

## Tracked Routes

The application currently tracks these SEPTA bus routes:
- **Route 9** - Connecting various Philadelphia neighborhoods
- **Route 12** - Serving key transit corridors  
- **Route 21** - Major cross-town route
- **Route 29** - Local service route
- **Route 42** - Connecting to suburbs
- **Route 47** - University City connector
- **Route 57** - Popular cross-city route

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

## License

This project is open source and available under the [MIT License](LICENSE).
