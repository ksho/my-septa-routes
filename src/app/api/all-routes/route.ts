import { NextResponse } from 'next/server';
import { REGIONAL_RAIL_LINES } from '../../../constants/routes';

export async function GET() {
  try {
    const allRoutes: { number: string; name: string; type: string }[] = [];

    // Fetch bus routes from existing ArcGIS API
    const busResponse = await fetch(
      `https://services2.arcgis.com/9U43PSoL47wawX5S/ArcGIS/rest/services/Transit_Routes_(Spring_2025)/FeatureServer/0/query?` +
      `where=1=1` +
      `&outFields=LineAbbr,LineName` +
      `&returnGeometry=false` +
      `&f=json`
    );

    if (busResponse.ok) {
      const busData = await busResponse.json();
      const busRoutes = busData.features
        .map((feature: { attributes: { LineAbbr: string; LineName: string } }) => ({
          number: feature.attributes.LineAbbr,
          name: feature.attributes.LineName,
          type: feature.attributes.LineAbbr.startsWith('T') ? 'trolley' : 'bus'
        }))
        .filter((route: { number: string; name: string }) => route.number && route.name);
      
      allRoutes.push(...busRoutes);
    }

    // Add Regional Rail lines (major lines)
    const regionalRailLines = [
      { number: REGIONAL_RAIL_LINES.AIRPORT_LINE, name: REGIONAL_RAIL_LINES.AIRPORT_LINE, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.CHESTNUT_HILL_EAST, name: REGIONAL_RAIL_LINES.CHESTNUT_HILL_EAST, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.CHESTNUT_HILL_WEST, name: REGIONAL_RAIL_LINES.CHESTNUT_HILL_WEST, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.CYNWYD, name: `${REGIONAL_RAIL_LINES.CYNWYD} Line`, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.FOX_CHASE, name: `${REGIONAL_RAIL_LINES.FOX_CHASE} Line`, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.LANSDALE_DOYLESTOWN, name: `${REGIONAL_RAIL_LINES.LANSDALE_DOYLESTOWN} Line`, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.MEDIA_WAWA, name: `${REGIONAL_RAIL_LINES.MEDIA_WAWA} Line`, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.NORRISTOWN, name: `${REGIONAL_RAIL_LINES.NORRISTOWN} Line`, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.PAOLI_THORNDALE, name: `${REGIONAL_RAIL_LINES.PAOLI_THORNDALE} Line`, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.TRENTON, name: `${REGIONAL_RAIL_LINES.TRENTON} Line`, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.WARMINSTER, name: `${REGIONAL_RAIL_LINES.WARMINSTER} Line`, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.WEST_TRENTON, name: `${REGIONAL_RAIL_LINES.WEST_TRENTON} Line`, type: 'rail' },
      { number: REGIONAL_RAIL_LINES.WILMINGTON_NEWARK, name: `${REGIONAL_RAIL_LINES.WILMINGTON_NEWARK} Line`, type: 'rail' }
    ];

    allRoutes.push(...regionalRailLines);

    // Add Trolley lines (ensure T prefix)
    const trolleyLines = [
      { number: 'T101', name: 'Media/102nd Street Line', type: 'trolley' },
      { number: 'T102', name: 'Sharon Hill/102nd Street Line', type: 'trolley' }
    ];

    allRoutes.push(...trolleyLines);

    // Sort routes: buses first (numerically), then trolleys, then rail
    const sortedRoutes = allRoutes.sort((a, b) => {
      // Group by type first
      if (a.type !== b.type) {
        const typeOrder = { 'bus': 1, 'trolley': 2, 'rail': 3 };
        return typeOrder[a.type as keyof typeof typeOrder] - typeOrder[b.type as keyof typeof typeOrder];
      }

      // Within same type, sort appropriately
      if (a.type === 'bus') {
        const aNum = parseInt(a.number);
        const bNum = parseInt(b.number);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
      }
      
      return a.number.localeCompare(b.number);
    });

    // Remove duplicates based on route number
    const uniqueRoutes = sortedRoutes.filter((route, index, self) => 
      index === self.findIndex(r => r.number === route.number)
    );
    
    return NextResponse.json({ routes: uniqueRoutes }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching all SEPTA routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route list' },
      { status: 500 }
    );
  }
}