'use client';

import { useState, useEffect } from 'react';
import { ALGERIA_LOCATIONS, getCommunesByWilaya, type Wilaya, type Commune } from '@/data/algeria-locations';

interface LocationSelectorProps {
  selectedWilaya?: number;
  selectedCommune?: number;
  onWilayaChange: (wilayaId: number, wilayaName: string) => void;
  onCommuneChange: (communeId: number, communeName: string, postalCode: string) => void;
  required?: boolean;
  hideCommune?: boolean;
}

export default function LocationSelector({
  selectedWilaya,
  selectedCommune,
  onWilayaChange,
  onCommuneChange,
  required = false,
  hideCommune = false,
}: LocationSelectorProps) {
  const [communes, setCommunes] = useState<Commune[]>([]);

  useEffect(() => {
    if (selectedWilaya) {
      setCommunes(getCommunesByWilaya(selectedWilaya));
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

  const selectClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-white";

  return (
    <div className={`grid gap-3 ${hideCommune ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {/* Wilaya */}
      <div>
        <select
          required={required}
          value={selectedWilaya || ''}
          onChange={handleWilayaChange}
          className={selectClass}
        >
          <option value="">اختر الولاية</option>
          {ALGERIA_LOCATIONS.map((wilaya) => (
            <option key={wilaya.id} value={wilaya.id}>
              {wilaya.id.toString().padStart(2, '0')} - {wilaya.nameAr}
            </option>
          ))}
        </select>
      </div>

      {/* Commune - hidden for office delivery */}
      {!hideCommune && (
        <div>
          <select
            required={required}
            value={selectedCommune || ''}
            onChange={handleCommuneChange}
            disabled={!selectedWilaya || communes.length === 0}
            className={`${selectClass} disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400`}
          >
            <option value="">اختر البلدية</option>
            {communes.map((commune) => (
              <option key={commune.id} value={commune.id}>
                {commune.nameAr} ({commune.postalCode})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
