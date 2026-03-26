'use client';

import { useState, useEffect } from 'react';
import { ALGERIA_LOCATIONS, getCommunesByWilaya, type Wilaya, type Commune } from '@/data/algeria-locations';

interface LocationSelectorProps {
  selectedWilaya?: number;
  selectedCommune?: number;
  onWilayaChange: (wilayaId: number, wilayaName: string) => void;
  onCommuneChange: (communeId: number, communeName: string, postalCode: string) => void;
  required?: boolean;
}

export default function LocationSelector({
  selectedWilaya,
  selectedCommune,
  onWilayaChange,
  onCommuneChange,
  required = false
}: LocationSelectorProps) {
  const [communes, setCommunes] = useState<Commune[]>([]);

  useEffect(() => {
    if (selectedWilaya) {
      const wilayaCommunes = getCommunesByWilaya(selectedWilaya);
      setCommunes(wilayaCommunes);
    } else {
      setCommunes([]);
    }
  }, [selectedWilaya]);

  const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wilayaId = parseInt(e.target.value);
    if (wilayaId) {
      const wilaya = ALGERIA_LOCATIONS.find(w => w.id === wilayaId);
      if (wilaya) {
        onWilayaChange(wilayaId, wilaya.nameAr);
        // Reset commune selection
        onCommuneChange(0, '', '');
      }
    } else {
      onWilayaChange(0, '');
      onCommuneChange(0, '', '');
    }
  };

  const handleCommuneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const communeId = parseInt(e.target.value);
    if (communeId) {
      const commune = communes.find(c => c.id === communeId);
      if (commune) {
        onCommuneChange(communeId, commune.nameAr, commune.postalCode);
      }
    } else {
      onCommuneChange(0, '', '');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold mb-2">
          الولاية {required && '*'}
        </label>
        <select
          required={required}
          value={selectedWilaya || ''}
          onChange={handleWilayaChange}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">اختر الولاية</option>
          {ALGERIA_LOCATIONS.map((wilaya) => (
            <option key={wilaya.id} value={wilaya.id}>
              {wilaya.id.toString().padStart(2, '0')} - {wilaya.nameAr}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          البلدية {required && '*'}
        </label>
        <select
          required={required}
          value={selectedCommune || ''}
          onChange={handleCommuneChange}
          disabled={!selectedWilaya || communes.length === 0}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">اختر البلدية</option>
          {communes.map((commune) => (
            <option key={commune.id} value={commune.id}>
              {commune.nameAr} ({commune.postalCode})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
