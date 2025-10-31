"use client";

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PreOrderRuleEditorProps {
  value: string; // JSON string
  onChange: (value: string) => void;
}

const weekDays = [
  { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' }, { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' }, { id: 6, label: 'Sat' }, { id: 0, label: 'Sun' }
];

export function PreOrderRuleEditor({ value, onChange }: PreOrderRuleEditorProps) {
  const [ruleType, setRuleType] = useState<'none' | 'offset' | 'schedule'>('none');
  const [offsetDays, setOffsetDays] = useState<number>(0);
  const [orderDays, setOrderDays] = useState<number[]>([]);
  const [deliveryDay, setDeliveryDay] = useState<number>(1);

  useEffect(() => {
    try {
      if (value) {
        const parsed = JSON.parse(value);
        if (parsed.type === 'offset') {
          setRuleType('offset');
          setOffsetDays(parsed.days || 0);
        } else if (parsed.type === 'schedule' && parsed.rules && parsed.rules.length > 0) {
          setRuleType('schedule');
          setOrderDays(parsed.rules[0].orderDays || []);
          setDeliveryDay(parsed.rules[0].deliveryDay || 1);
        }
      }
    } catch {
      // Ignore parse error, use default state
    }
  }, [value]);

  const handleRuleTypeChange = (type: 'none' | 'offset' | 'schedule') => {
    setRuleType(type);
    if (type === 'none') onChange("");
  };

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = parseInt(e.target.value, 10) || 0;
    setOffsetDays(days);
    onChange(JSON.stringify({ type: 'offset', days }));
  };

  const handleOrderDayChange = (day: number) => {
    const newOrderDays = orderDays.includes(day)
      ? orderDays.filter(d => d !== day)
      : [...orderDays, day];
    setOrderDays(newOrderDays);
    onChange(JSON.stringify({ type: 'schedule', rules: [{ orderDays: newOrderDays, deliveryDay }] }));
  };

  const handleDeliveryDayChange = (dayStr: string) => {
    const day = parseInt(dayStr, 10);
    setDeliveryDay(day);
    onChange(JSON.stringify({ type: 'schedule', rules: [{ orderDays, deliveryDay: day }] }));
  };

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <Label>Rule Type</Label>
      <Select onValueChange={handleRuleTypeChange} value={ruleType}>
        <SelectTrigger>
          <SelectValue placeholder="Select a rule type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="offset">Offset (Days After Order)</SelectItem>
          <SelectItem value="schedule">Scheduled Day</SelectItem>
        </SelectContent>
      </Select>

      {ruleType === 'offset' && (
        <div className="space-y-2">
          <Label>Days to Dispatch</Label>
          <Input type="number" value={offsetDays} onChange={handleOffsetChange} />
        </div>
      )}

      {ruleType === 'schedule' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Order Days</Label>
            <div className="flex flex-wrap gap-4">
              {weekDays.map(day => (
                <div key={day.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`day-${day.id}`}
                    checked={orderDays.includes(day.id)}
                    onCheckedChange={() => handleOrderDayChange(day.id)}
                  />
                  <Label htmlFor={`day-${day.id}`}>{day.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Delivery Day</Label>
            <Select onValueChange={handleDeliveryDayChange} value={String(deliveryDay)}>
              <SelectTrigger>
                <SelectValue placeholder="Select delivery day" />
              </SelectTrigger>
              <SelectContent>
                {weekDays.map(day => <SelectItem key={day.id} value={String(day.id)}>{day.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
