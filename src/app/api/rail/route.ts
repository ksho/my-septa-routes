import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const route = searchParams.get('route');

  if (!route) {
    return NextResponse.json({ error: 'Route parameter is required' }, { status: 400 });
  }

  try {
    // For Regional Rail, use the TrainView API
    const response = await fetch('https://www3.septa.org/api/TrainView/index.php');
    
    if (!response.ok) {
      throw new Error(`SEPTA TrainView API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter for specific line if route is provided
    const trains = data.filter((train: { line?: string }) => {
      // Match by line name (e.g., "Airport Line", "Chestnut Hill East", etc.)
      return train.line && train.line.toLowerCase().includes(route.trim().toLowerCase());
    }).map((train: { 
      lat?: string; 
      lon?: string; 
      line?: string; 
      trainno?: string; 
      consist?: string; 
      direction?: string; 
      heading?: string; 
      dest?: string; 
      nextstop?: string; 
      late?: string; 
      service?: string; 
      track?: string; 
    }) => ({
      lat: parseFloat(train.lat || '0') || 0,
      lng: parseFloat(train.lon || '0') || 0,
      label: train.line || 'Unknown',
      VehicleID: train.trainno || train.consist || 'Unknown',
      Direction: train.direction || train.heading || 'Unknown',
      destination: train.dest || train.nextstop || 'Unknown',
      late: parseInt(train.late || '0') || 0,
      service: train.service || 'Regional Rail',
      track: train.track || null
    }));

    return NextResponse.json({
      bus: trains // Keep the same structure as bus API for compatibility
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching Regional Rail data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Regional Rail data' },
      { status: 500 }
    );
  }
}