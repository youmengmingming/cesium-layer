import { ref, computed } from 'vue';
import { mapProvider } from '../map-engine/MapProvider';
import type { MeasurementType, MeasurementResult } from '../map-engine/core/types';
import { type LengthUnit, type AreaUnit, type ElevationUnit } from '../utils/unitConverter';

export function useMeasurement() {
  const currentMeasurement = ref<MeasurementResult>({});
  const isMeasuring = computed(() => mapProvider.measurement?.isActive() ?? false);
  const activeType = computed(() => mapProvider.measurement?.getActiveType() ?? null);

  const lengthUnit = ref<LengthUnit>('meter');
  const areaUnit = ref<AreaUnit>('square-meter');
  const elevationUnit = ref<ElevationUnit>('meter');

  const startMeasurement = (type: MeasurementType) => {
    if (!mapProvider.measurement) return;
    
    mapProvider.measurement.on('measure-change', (result: MeasurementResult) => {
      currentMeasurement.value = result;
    });
    
    mapProvider.measurement.start(type);
  };

  const stopMeasurement = () => {
    mapProvider.measurement?.stop();
    currentMeasurement.value = {};
  };

  const setLengthUnit = (unit: LengthUnit) => { lengthUnit.value = unit; };
  const setAreaUnit = (unit: AreaUnit) => { areaUnit.value = unit; };
  const setElevationUnit = (unit: ElevationUnit) => { elevationUnit.value = unit; };

  return {
    isMeasuring,
    activeType,
    currentMeasurement,
    lengthUnit,
    areaUnit,
    elevationUnit,
    startMeasurement,
    stopMeasurement,
    setLengthUnit,
    setAreaUnit,
    setElevationUnit,
  };
}

