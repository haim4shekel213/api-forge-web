import React from 'react';
import { KeyValuePair } from '@/types/postman';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  placeholder?: {
    key?: string;
    value?: string;
  };
}

export function KeyValueEditor({ pairs, onChange, placeholder }: KeyValueEditorProps) {
  const addPair = () => {
    onChange([...pairs, { key: '', value: '', enabled: true }]);
  };

  const updatePair = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    onChange(newPairs);
  };

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-2">
        <div className="col-span-1"></div>
        <div className="col-span-5">{placeholder?.key || 'Key'}</div>
        <div className="col-span-5">{placeholder?.value || 'Value'}</div>
        <div className="col-span-1"></div>
      </div>

      {pairs.map((pair, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-1 flex justify-center">
            <Checkbox
              checked={pair.enabled}
              onCheckedChange={(checked) => updatePair(index, 'enabled', !!checked)}
            />
          </div>
          <div className="col-span-5">
            <Input
              value={pair.key}
              onChange={(e) => updatePair(index, 'key', e.target.value)}
              placeholder={placeholder?.key || 'Key'}
              className="h-8"
            />
          </div>
          <div className="col-span-5">
            <Input
              value={pair.value}
              onChange={(e) => updatePair(index, 'value', e.target.value)}
              placeholder={placeholder?.value || 'Value'}
              className="h-8"
            />
          </div>
          <div className="col-span-1 flex justify-center">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => removePair(index)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addPair}
        className="w-full h-8 mt-2"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add {placeholder?.key || 'Parameter'}
      </Button>
    </div>
  );
}