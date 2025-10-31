import { calculatePoDeliveryDate, getPoRuleDescription } from '../po-logic';

describe('Pre-Order Logic', () => {
  describe('calculatePoDeliveryDate', () => {
    it('should handle offset rules correctly', () => {
      const orderDate = new Date('2025-10-31T10:00:00Z'); // A Friday
      const rule = { type: 'offset', days: 3 };
      const expectedDate = new Date('2025-11-03T00:00:00Z'); // The following Monday
      expect(calculatePoDeliveryDate(rule, orderDate)).toEqual(expectedDate);
    });

    it('should handle schedule rules correctly (Mon-Wed -> Thu)', () => {
      const orderDate = new Date('2025-11-05T10:00:00Z'); // A Wednesday
      const rule = { type: 'schedule', rules: [{ orderDays: [1, 2, 3], deliveryDay: 4 }] };
      const expectedDate = new Date('2025-11-06T00:00:00Z'); // The next day (Thursday)
      expect(calculatePoDeliveryDate(rule, orderDate)).toEqual(expectedDate);
    });

    it('should handle schedule rules correctly (Thu-Sun -> Mon)', () => {
      const orderDate = new Date('2025-11-07T10:00:00Z'); // A Friday
      const rule = { type: 'schedule', rules: [{ orderDays: [4, 5, 6, 0], deliveryDay: 1 }] };
      const expectedDate = new Date('2025-11-10T00:00:00Z'); // The following Monday
      expect(calculatePoDeliveryDate(rule, orderDate)).toEqual(expectedDate);
    });

    it('should return original date for invalid rules', () => {
      const orderDate = new Date();
      expect(calculatePoDeliveryDate(null, orderDate)).toEqual(orderDate);
      // For an unknown rule type, it should also return the original date
      expect(calculatePoDeliveryDate({ type: 'invalid' }, orderDate)).toEqual(orderDate);
    });
  });

  describe('getPoRuleDescription', () => {
    it('should generate correct description for offset rules', () => {
      const rule = { type: 'offset', days: 2 };
      expect(getPoRuleDescription(rule)).toBe('Akan dikirimkan 2 hari setelah pemesanan.');
    });

    it('should generate correct description for schedule rules', () => {
      const rule = { type: 'schedule', rules: [{ orderDays: [1, 2, 3], deliveryDay: 5 }] };
      expect(getPoRuleDescription(rule)).toBe('Pesanan yang dibuat pada hari Senin, Selasa, Rabu akan dikirimkan pada hari Jumat berikutnya.');
    });

    it('should return empty string for invalid rules', () => {
      expect(getPoRuleDescription(null)).toBe('');
      expect(getPoRuleDescription({ type: 'invalid' })).toBe('');
    });
  });
});
