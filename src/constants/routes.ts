// SEPTA Subway lines
export const SUBWAY_LINES = {
  BSL: 'BSL', // Broad Street Line
  MFL: 'MFL', // Market-Frankford Line
} as const;

// Array of all subway lines for easy iteration
export const ALL_SUBWAY_LINES = Object.values(SUBWAY_LINES);

// Helper function to check if a route is a subway line
export const isSubwayRoute = (route: string): boolean => {
  return ALL_SUBWAY_LINES.includes(route as typeof ALL_SUBWAY_LINES[number]);
};

// SEPTA Regional Rail line names
export const REGIONAL_RAIL_LINES = {
  AIRPORT_LINE: 'Airport Line',
  CHESTNUT_HILL_EAST: 'Chestnut Hill East',
  CHESTNUT_HILL_WEST: 'Chestnut Hill West',
  CYNWYD: 'Cynwyd',
  FOX_CHASE: 'Fox Chase',
  LANSDALE_DOYLESTOWN: 'Lansdale/Doylestown',
  MEDIA_WAWA: 'Media/Wawa',
  NORRISTOWN: 'Norristown',
  PAOLI_THORNDALE: 'Paoli/Thorndale',
  TRENTON: 'Trenton',
  WARMINSTER: 'Warminster',
  WEST_TRENTON: 'West Trenton',
  WILMINGTON_NEWARK: 'Wilmington/Newark'
} as const;

// Array of all Regional Rail lines for easy iteration
export const ALL_REGIONAL_RAIL_LINES = Object.values(REGIONAL_RAIL_LINES);

// Helper function to check if a route is Regional Rail
export const isRegionalRailRoute = (route: string): boolean => {
  return ALL_REGIONAL_RAIL_LINES.includes(route as typeof ALL_REGIONAL_RAIL_LINES[number]);
};

// Mapping from our route names to SEPTA's official API naming convention
export const SEPTA_LINE_NAME_MAPPING: { [key: string]: string } = {
  [REGIONAL_RAIL_LINES.AIRPORT_LINE]: 'Airport',
  [REGIONAL_RAIL_LINES.CHESTNUT_HILL_EAST]: 'Chestnut Hill East',
  [REGIONAL_RAIL_LINES.CHESTNUT_HILL_WEST]: 'Chestnut Hill West',
  [REGIONAL_RAIL_LINES.CYNWYD]: 'Cynwyd',
  [REGIONAL_RAIL_LINES.FOX_CHASE]: 'Fox Chase',
  [REGIONAL_RAIL_LINES.LANSDALE_DOYLESTOWN]: 'Lansdale/Doylestown',
  [REGIONAL_RAIL_LINES.MEDIA_WAWA]: 'Media/Wawa',
  [REGIONAL_RAIL_LINES.NORRISTOWN]: 'Manayunk/Norristown',
  [REGIONAL_RAIL_LINES.PAOLI_THORNDALE]: 'Paoli/Thorndale',
  [REGIONAL_RAIL_LINES.TRENTON]: 'Trenton',
  [REGIONAL_RAIL_LINES.WARMINSTER]: 'Warminster',
  [REGIONAL_RAIL_LINES.WEST_TRENTON]: 'West Trenton',
  [REGIONAL_RAIL_LINES.WILMINGTON_NEWARK]: 'Wilmington/Newark'
};

// Reverse mapping from SEPTA's API names back to our route names
export const SEPTA_TO_OUR_LINE_NAME_MAPPING: { [key: string]: string } = {
  'Airport': REGIONAL_RAIL_LINES.AIRPORT_LINE,
  'Chestnut Hill East': REGIONAL_RAIL_LINES.CHESTNUT_HILL_EAST,
  'Chestnut Hill West': REGIONAL_RAIL_LINES.CHESTNUT_HILL_WEST,
  'Cynwyd': REGIONAL_RAIL_LINES.CYNWYD,
  'Fox Chase': REGIONAL_RAIL_LINES.FOX_CHASE,
  'Lansdale/Doylestown': REGIONAL_RAIL_LINES.LANSDALE_DOYLESTOWN,
  'Media/Wawa': REGIONAL_RAIL_LINES.MEDIA_WAWA,
  'Manayunk/Norristown': REGIONAL_RAIL_LINES.NORRISTOWN,
  'Paoli/Thorndale': REGIONAL_RAIL_LINES.PAOLI_THORNDALE,
  'Trenton': REGIONAL_RAIL_LINES.TRENTON,
  'Warminster': REGIONAL_RAIL_LINES.WARMINSTER,
  'West Trenton': REGIONAL_RAIL_LINES.WEST_TRENTON,
  'Wilmington/Newark': REGIONAL_RAIL_LINES.WILMINGTON_NEWARK
};

// Default Regional Rail line for demos/testing
export const DEFAULT_REGIONAL_RAIL_LINE = REGIONAL_RAIL_LINES.NORRISTOWN;