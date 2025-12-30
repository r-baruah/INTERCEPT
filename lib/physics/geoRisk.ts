/**
 * GEO-RISK ENGINE - Astrophysics-based Risk Assessment
 * 
 * Uses the Auroral Oval Equatorward Boundary approximation to calculate
 * the user's risk level based on magnetic latitude and current Kp Index.
 * 
 * "This is not marketing. This is physics."
 */

export type GeoRiskStatus = 'CRITICAL' | 'WARNING' | 'NOMINAL';

export interface GeoRiskResult {
    status: GeoRiskStatus;
    label: string;
    color: string;
    delta: number;
    auroralBoundary: number;
    magneticLat: number;
}

/**
 * Calculates the user's geomagnetic risk based on their latitude
 * relative to the real-time Auroral Oval boundary.
 * 
 * @param userLat - User's geographic latitude (from browser geolocation)
 * @param kpIndex - Current Kp index (0-9)
 * @returns Risk assessment with status, label, and color
 */
export function calculateGeoRisk(userLat: number, kpIndex: number): GeoRiskResult {
    // Approximation: Geographic latitude used as proxy for magnetic latitude 
    // due to localized computation constraints. Variance ~10-15°.
    const magneticLat = Math.abs(userLat);

    // NOAA Auroral Oval Approximation Formula
    // As Kp increases, the auroral oval expands equatorward
    // At Kp=0, boundary ~66.5° | At Kp=9, boundary ~41.3°
    const auroralBoundary = 66.5 - (kpIndex * 2.8);

    // Calculate delta: positive = inside oval, negative = outside
    const delta = magneticLat - auroralBoundary;

    if (delta > 0) {
        // User is NORTH of the boundary - INSIDE the Auroral Oval
        return {
            status: 'CRITICAL',
            label: 'INSIDE AURORAL OVAL',
            color: '#FF0000',
            delta,
            auroralBoundary,
            magneticLat
        };
    }

    if (delta > -5) {
        // User is within 5° of the boundary - HIGH LATITUDE FRINGE
        return {
            status: 'WARNING',
            label: 'HIGH LATITUDE FRINGE',
            color: '#FFBF00',
            delta,
            auroralBoundary,
            magneticLat
        };
    }

    // User is safely south of the boundary
    return {
        status: 'NOMINAL',
        label: 'BELOW AURORAL HORIZON',
        color: '#00FF00',
        delta,
        auroralBoundary,
        magneticLat
    };
}

/**
 * Format the delta for display (e.g., "+5.2°" or "-12.8°")
 */
export function formatDelta(delta: number): string {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}°`;
}

/**
 * Calculate economic impact estimate based on Kp Index
 * Uses exponential curve to simulate grid stress costs
 * 
 * @param kpIndex - Current Kp index (0-9)
 * @returns Estimated hourly cost in USD, or null if negligible
 */
export function calculateEconomicImpact(kpIndex: number): number | null {
    // Below Kp 4, impact is negligible
    if (kpIndex < 4) return null;

    // Exponential cost curve: Kp^6 * 86
    // Kp 5 = ~$1.3M/hr
    // Kp 7 = ~$10.1M/hr  
    // Kp 9 = ~$45.7M/hr (Scenario Target)
    const hourlyCost = Math.pow(kpIndex, 6) * 86;

    return hourlyCost;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(amount);
}
