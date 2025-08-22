import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const route = searchParams.get('route');

  if (!route) {
    return NextResponse.json({ error: 'Route parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://www3.septa.org/api/TransitView/index.php?route=${route}`,
      {
        headers: {
          'User-Agent': 'SEPTA-Transit-App/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`SEPTA API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Add CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching SEPTA data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transit data' },
      { status: 500 }
    );
  }
}