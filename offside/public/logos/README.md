# Club Logos - API-Based Implementation

**Note**: As of the latest update, this application now fetches club logos automatically from TheSportsDB API, so manual logo file placement is no longer required.

## How It Works
The application uses TheSportsDB API (https://www.thesportsdb.com/) to fetch official club logos in real-time:
- Logos are fetched dynamically when matches are displayed
- A caching mechanism prevents repeated API calls for the same club
- Fallback logos are provided for teams that might not be found in the API
- Error handling ensures the UI remains functional even if API requests fail

## Benefits
- ✅ No manual logo file management required
- ✅ Always up-to-date logos from official sources
- ✅ Comprehensive coverage of thousands of football clubs worldwide
- ✅ Automatic handling of new clubs as they appear in match data

## Technical Implementation
See `lib/clubs.ts` for the complete implementation:
- `fetchClubLogo()` - Asynchronously fetches logos from TheSportsDB API
- `getClubLogo()` - Synchronous version that returns cached/fallback logos for immediate display
- `getClubLogoAsync()` - Async version for when you need the freshest logo data
- Built-in caching to minimize API calls
- Fallback logos for immediate display while API requests are in progress

## Customization
If you wish to use a different logo source or customize the logo retrieval:
1. Modify the `THE_SPORTS_DB_API` constant in `lib/clubs.ts`
2. Update the `fetchClubLogo()` function to use your preferred API
3. Adjust the fallback logos in `FALLBACK_LOGOS` as needed

## Legacy Support
The `public/logos/` directory is maintained for backward compatibility. If you place logo files here with the exact club name as the filename (e.g., `real-madrid.png`), they will take precedence over API-fetched logos.