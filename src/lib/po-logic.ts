/**
 * @fileoverview Dynamic Pre-Order (PO) delivery date calculation logic.
 *
 * This module supports two types of pre-order rules defined in a JSON object:
 * 1. 'offset': Delivers a fixed number of days after the order date.
 *    - Example JSON: { "type": "offset", "days": 1 }
 *
 * 2. 'schedule': Delivers on a specific day of the week, based on the order day.
 *    - Example JSON: { "type": "schedule", "rules": [{ "orderDays": [1, 2, 3], "deliveryDay": 5 }] }
 *      (orderDays: Monday-Wednesday, deliveryDay: Friday)
 */

interface PoRuleOffset {
  type: 'offset';
  days: number;
}

interface PoRuleScheduleItem {
  orderDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  deliveryDay: number;
}

interface PoRuleSchedule {
  type: 'schedule';
  rules: PoRuleScheduleItem[];
}

/**
 * Calculates the delivery date for a pre-order product based on dynamic rules.
 *
 * @param preOrderRule - The pre-order rule object from the database.
 * @param orderDate - The date the order was placed.
 * @returns The calculated delivery date. Returns the original order date if the rule is invalid or doesn't apply.
 */
export const calculatePoDeliveryDate = (preOrderRule: any, orderDate: Date): Date => {
  if (!preOrderRule || typeof preOrderRule !== 'object' || !preOrderRule.type) {
    return orderDate;
  }

  const deliveryDate = new Date(orderDate);
  const orderDay = orderDate.getDay();

  // --- Rule Type: offset ---
  if (preOrderRule.type === 'offset') {
    const rule = preOrderRule as PoRuleOffset;
    if (typeof rule.days === 'number' && rule.days > 0) {
      deliveryDate.setDate(orderDate.getDate() + rule.days);
    }
  }

  // --- Rule Type: schedule ---
  if (preOrderRule.type === 'schedule') {
    const rule = preOrderRule as PoRuleSchedule;
    if (rule.rules && Array.isArray(rule.rules)) {
      for (const scheduleItem of rule.rules) {
        if (scheduleItem.orderDays.includes(orderDay)) {
          const daysUntilDelivery = (scheduleItem.deliveryDay - orderDay + 7) % 7;
          deliveryDate.setDate(orderDate.getDate() + (daysUntilDelivery === 0 ? 7 : daysUntilDelivery));
          break; // Stop after finding the first matching rule
        }
      }
    }
  }
  // Only standardize time if a rule was successfully applied.
  if (deliveryDate.getTime() !== orderDate.getTime()) {
    deliveryDate.setHours(0, 0, 0, 0);
  }

  return deliveryDate;
};

/**
 * Generates a human-readable description of a pre-order rule.
 *
 * @param preOrderRule - The pre-order rule object.
 * @returns A string describing the rule, or an empty string if the rule is invalid.
 */
export const getPoRuleDescription = (preOrderRule: any): string => {
  if (!preOrderRule || typeof preOrderRule !== 'object' || !preOrderRule.type) {
    return "";
  }

  if (preOrderRule.type === 'offset') {
    const days = preOrderRule.days || 0;
    if (days <= 0) return "";
    return `Akan dikirimkan ${days} hari setelah pemesanan.`;
  }

  if (preOrderRule.type === 'schedule' && preOrderRule.rules && preOrderRule.rules.length > 0) {
    const weekDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const rule = preOrderRule.rules[0];
    const orderDays = rule.orderDays.map((d: number) => weekDays[d]).join(', ');
    const deliveryDay = weekDays[rule.deliveryDay];
    return `Pesanan yang dibuat pada hari ${orderDays} akan dikirimkan pada hari ${deliveryDay} berikutnya.`;
  }

  return "";
};
