import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Query for all routes to get available route numbers
    const response = await fetch(
      `https://services2.arcgis.com/9U43PSoL47wawX5S/ArcGIS/rest/services/Transit_Routes_(Spring_2025)/FeatureServer/0/query?` +
      `where=1=1` +
      `&outFields=LineAbbr,LineName` +
      `&returnGeometry=false` +
      `&f=json`
    );

    if (!response.ok) {
      throw new Error(`SEPTA ArcGIS API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract unique route numbers and names
    const routes = data.features
      .map((feature: { attributes: { LineAbbr: string; LineName: string } }) => ({
        number: feature.attributes.LineAbbr,
        name: feature.attributes.LineName
      }))
      .filter((route: { number: string; name: string }) => route.number && route.name)
      .sort((a: { number: string }, b: { number: string }) => {
        // Sort numerically for numbers, alphabetically for letters
        const aNum = parseInt(a.number);
        const bNum = parseInt(b.number);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.number.localeCompare(b.number);
      });

    // Remove duplicates based on route number
    const uniqueRoutes = routes.filter((route: { number: string; name: string }, index: number, self: { number: string; name: string }[]) => 
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