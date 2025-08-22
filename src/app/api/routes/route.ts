import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const routes = searchParams.get('routes');

  if (!routes) {
    return NextResponse.json({ error: 'Routes parameter is required' }, { status: 400 });
  }

  const routeNumbers = routes.split(',').map(r => r.trim());

  try {
    // Build query for specific routes using LineAbbr field
    const whereClause = routeNumbers.map(route => `LineAbbr='${route}'`).join(' OR ');
    
    const response = await fetch(
      `https://services2.arcgis.com/9U43PSoL47wawX5S/ArcGIS/rest/services/Transit_Routes_(Spring_2025)/FeatureServer/0/query?` +
      `where=${encodeURIComponent(whereClause)}` +
      `&outFields=LineAbbr,LineName,tpField020,tpField021` +
      `&returnGeometry=true` +
      `&f=geojson`
    );

    if (!response.ok) {
      throw new Error(`SEPTA ArcGIS API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching SEPTA route data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route geometry data' },
      { status: 500 }
    );
  }
}