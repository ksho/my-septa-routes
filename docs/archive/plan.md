## Overview
I'm building an application that shows the real-time locations of specific Septa bus and subway lines in Philadelphia overlayed on a map.

## Details

### Routes to display
- I want to display routes: 57, 47, 42, 9, 12, 21
- I also want to display both subways: MFL and BSL

## Technical choices
- Build the application in NextJS with typescript
- Displaying the map should be powered by [OpenFreeMap](https://openfreemap.org)
    - Their github is located here https://github.com/hyperknot/openfreemap
- Locations of all routes should be updated/refreshed every 5 seconds
- Everything should be optimized for mobile use (screen taps, viewport size, etc)
- Starting viewport should always be center city philadelphia



## Documentation and References
- SEPTA API documentation https://www3.septa.org/#/Real%20Time%20Data
    - We're going to be particularly interested in the /TransitView/ endpoint
