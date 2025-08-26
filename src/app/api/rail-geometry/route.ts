import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const routes = searchParams.get('routes');

  if (!routes) {
    return NextResponse.json({ error: 'Routes parameter is required' }, { status: 400 });
  }

  const railLines = routes.split(',').map(r => r.trim());

  try {
    // Use SEPTA's actual Regional Rail geometry service
    const lineQueries = railLines.map(line => {
      // Map line names to match SEPTA's naming convention
      const mappedLineName = mapToSeptaLineName(line);
      return `Route_Name='${mappedLineName}'`;
    });
    
    const whereClause = lineQueries.join(' OR ');
    
    const response = await fetch(
      `https://services2.arcgis.com/9U43PSoL47wawX5S/ArcGIS/rest/services/Regional_Rail_Lines/FeatureServer/0/query?` +
      `where=${encodeURIComponent(whereClause)}` +
      `&outFields=Route_Name,Miles` +
      `&returnGeometry=true` +
      `&f=geojson`
    );

    if (!response.ok) {
      throw new Error(`SEPTA Regional Rail API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to match our expected format
    const transformedFeatures = data.features?.map((feature: {
      properties: { Route_Name: string; Miles: number };
      geometry: { type: string; coordinates: number[][] };
    }) => ({
      type: 'Feature',
      properties: {
        LineAbbr: feature.properties.Route_Name,
        LineName: feature.properties.Route_Name,
        Miles: feature.properties.Miles
      },
      geometry: feature.geometry
    })) || [];

    const geoJsonResponse = {
      type: 'FeatureCollection',
      features: transformedFeatures
    };
    
    return NextResponse.json(geoJsonResponse, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching Regional Rail geometry data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rail geometry data' },
      { status: 500 }
    );
  }
}

// Map our route names to SEPTA's official naming convention
function mapToSeptaLineName(lineName: string): string {
  const lineMapping: { [key: string]: string } = {
    'Airport Line': 'Airport',
    'Chestnut Hill East': 'Chestnut Hill East',
    'Chestnut Hill West': 'Chestnut Hill West', 
    'Cynwyd': 'Cynwyd',
    'Fox Chase': 'Fox Chase',
    'Lansdale/Doylestown': 'Lansdale/Doylestown',
    'Media/Wawa': 'Media/Wawa',
    'Norristown': 'Manayunk/Norristown',
    'Paoli/Thorndale': 'Paoli/Thorndale',
    'Trenton': 'Trenton',
    'Warminster': 'Warminster',
    'West Trenton': 'West Trenton',
    'Wilmington/Newark': 'Wilmington/Newark'
  };
  
  return lineMapping[lineName] || lineName;
}