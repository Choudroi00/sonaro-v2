import { createMockClassificationResult } from './mock';

describe('createMockClassificationResult', () => {
  it('biases braking results from the uploaded file name', () => {
    const result = createMockClassificationResult('braking', 'customer-car_worn_out_sample.wav');

    expect(result.model).toBe('braking');
    expect(result.label).toBe('worn_out');
    expect(result.score).toBeGreaterThan(0.8);
    expect(result.probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 3);
  });

  it('biases startup results from the uploaded file name', () => {
    const result = createMockClassificationResult('startup', 'fleet_dead_battery_take_01.wav');

    expect(result.label).toBe('dead_battery');
    expect(result.score).toBeGreaterThan(0.8);
  });

  it('biases idle results from the uploaded file name', () => {
    const result = createMockClassificationResult('idle', 'service-bay_serpentine_belt_idle.wav');

    expect(result.label).toBe('serpentine_belt');
    expect(result.score).toBeGreaterThan(0.8);
  });
});
