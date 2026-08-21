/**
 * NivaranAI - Hazard Zones Leaflet Layer
 * 
 * Renders affected radius circles and center severity badges for active hazard zones.
 * Strictly uses data-provided radius and severity without client-side risk calculations.
 */

import L from 'leaflet';
import { HazardZone, SEVERITY_COLORS, HazardType, SeverityLevel } from '../../../types';

export interface HazardLayerFilterOptions {
  showHazardZones: boolean;
  selectedHazardFilter: HazardType | 'ALL';
  selectedSeverityFilter: SeverityLevel | 'ALL';
}

export function renderHazardZonesLayer(
  layerGroup: L.LayerGroup,
  hazardZones: HazardZone[],
  filters: HazardLayerFilterOptions,
  onZoneSelect: (zone: HazardZone) => void
): void {
  layerGroup.clearLayers();

  if (!filters.showHazardZones || !Array.isArray(hazardZones)) return;

  // Filter hazard zones based on active UI filters
  const filteredZones = hazardZones.filter(zone => {
    // Validate coordinates
    const lat = Number(zone.latitude);
    const lng = Number(zone.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }

    if (filters.selectedHazardFilter === 'ALL') {
      // When ALL is selected, show dominant/worst hazard per ward to prevent 5x overlapping markers per ward
      if (zone.is_worst_hazard === false) return false;
    } else if (zone.hazard_type !== filters.selectedHazardFilter) {
      return false;
    }

    if (filters.selectedSeverityFilter !== 'ALL' && zone.severity !== filters.selectedSeverityFilter) {
      return false;
    }

    return true;
  });

  filteredZones.forEach(zone => {
    const lat = Number(zone.latitude);
    const lng = Number(zone.longitude);
    const radKm = typeof zone.affected_radius_km === 'number' && !isNaN(zone.affected_radius_km) ? zone.affected_radius_km : 1.5;

    // Visually scale down radius to reduce map clutter while preserving relative size
    const visualScaleFactor = 0.5;
    const radiusMeters = radKm * 1000 * visualScaleFactor;
    const color = zone.color || SEVERITY_COLORS[zone.severity] || '#22C55E';

    const isEmergency = zone.severity === 'EMERGENCY';
    const isHigh = zone.severity === 'HIGH';
    const isModerate = zone.severity === 'MODERATE';
    const scoreDisplay = Math.round(Number(zone.risk_score) || 0);

    // 1. Affected Radius Circle Geometry
    const circle = L.circle([lat, lng], {
      radius: radiusMeters,
      color: color,
      fillColor: color,
      fillOpacity: isEmergency ? 0.22 : isHigh ? 0.16 : isModerate ? 0.10 : 0.08,
      weight: isEmergency ? 3 : isHigh ? 2.5 : 2,
      dashArray: isEmergency ? '6, 6' : undefined,
      className: isEmergency ? 'hazard-glow-emergency' : isHigh ? 'hazard-glow-high' : undefined
    });

    // 2. Central Severity & Score Badge
    const centerIcon = L.divIcon({
      className: 'custom-hazard-marker',
      html: `
        <div style="
          background: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          border: 2.5px solid #ffffff;
          box-shadow: 0 0 16px ${color};
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          ${scoreDisplay}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const centerMarker = L.marker([lat, lng], { icon: centerIcon });

    // Click triggers zone selection and opens preview card
    const handleClick = () => {
      onZoneSelect(zone);
    };

    circle.on('click', handleClick);
    centerMarker.on('click', handleClick);

    circle.addTo(layerGroup);
    centerMarker.addTo(layerGroup);
  });
}
