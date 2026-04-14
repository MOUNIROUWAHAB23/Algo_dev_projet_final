import { buildHebergementFilter, validatePagination } from '../services/filter.service.js';

describe('Filter Service', () => {
  describe('buildHebergementFilter', () => {
    it('should return empty filter when no query params', () => {
      const filter = buildHebergementFilter({});
      expect(filter).toEqual({});
    });

    it('should build text search filter with q param', () => {
      const filter = buildHebergementFilter({ q: 'paris' });
      expect(filter).toHaveProperty('$or');
      expect(filter.$or).toEqual([
        { nom: { $regex: 'paris', $options: 'i' } },
        { 'localisation.commune': { $regex: 'paris', $options: 'i' } },
        { 'localisation.region': { $regex: 'paris', $options: 'i' } }
      ]);
    });

    it('should build type filter with valid type', () => {
      const filter = buildHebergementFilter({ type: 'hotel' });
      expect(filter.type).toBe('HOTEL');
    });

    it('should normalize type to uppercase', () => {
      const filter = buildHebergementFilter({ type: 'camping' });
      expect(filter.type).toBe('CAMPING');
    });

    it('should throw error for invalid type', () => {
      expect(() => buildHebergementFilter({ type: 'invalid' }))
        .toThrow('Invalid type');
    });

    it('should build region filter', () => {
      const filter = buildHebergementFilter({ region: 'ile-de-france' });
      expect(filter['localisation.region']).toEqual({
        $regex: 'ile-de-france',
        $options: 'i'
      });
    });

    it('should build classification filter', () => {
      const filter = buildHebergementFilter({ classification: '4' });
      expect(filter.classification).toBe('4');
    });

    it('should build geolocation filter with lat, long, radius', () => {
      const filter = buildHebergementFilter({
        lat: '48.85',
        long: '2.35',
        radius: '10'
      });
      expect(filter['localisation.coordinates']).toHaveProperty('$near');
      expect(filter['localisation.coordinates'].$near.$geometry.type).toBe('Point');
      expect(filter['localisation.coordinates'].$near.$geometry.coordinates).toEqual([2.35, 48.85]);
      expect(filter['localisation.coordinates'].$near.$maxDistance).toBe(10000);
    });

    it('should combine multiple filters', () => {
      const filter = buildHebergementFilter({
        q: 'paris',
        type: 'hotel',
        region: 'ile',
        classification: '3'
      });
      expect(filter).toHaveProperty('$or');
      expect(filter.type).toBe('HOTEL');
      expect(filter['localisation.region']).toBeDefined();
      expect(filter.classification).toBe('3');
    });
  });

  describe('validatePagination', () => {
    it('should return default values when no params', () => {
      const result = validatePagination(undefined, undefined);
      expect(result).toEqual({ limit: 20, offset: 0 });
    });

    it('should parse limit and page correctly', () => {
      const result = validatePagination('50', '3');
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(100); // (3-1) * 50
    });

    it('should throw error if limit > 100', () => {
      expect(() => validatePagination('150', '1'))
        .toThrow('Limit cannot exceed 100');
    });

    it('should use default when limit is 0', () => {
      // parseInt('0') || 20 returns 20 due to || operator
      const result = validatePagination('0', '1');
      expect(result.limit).toBe(20);
    });

    it('should use default when page is 0', () => {
      // parseInt('0') || 1 returns 1 due to || operator
      const result = validatePagination('10', '0');
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0); // page 1 = offset 0
    });

    it('should use default limit when invalid value provided', () => {
      const result = validatePagination('invalid', '1');
      expect(result.limit).toBe(20);
    });

    it('should use default page when invalid value provided', () => {
      const result = validatePagination('10', 'invalid');
      expect(result.offset).toBe(0); // page 1 = offset 0
    });
  });
});
