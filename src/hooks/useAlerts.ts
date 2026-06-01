import { useMemo } from 'react';
import { useStore } from '../store';
import { getDeadlineStatus } from '../utils/deadline';
import { differenceInDays, parseISO } from 'date-fns';

interface Alert {
  id: string;
  type: 'overdue' | 'warning' | 'stale';
  vehicleId: string;
  message: string;
  read: boolean;
}

export function useAlerts(): Alert[] {
  const { vehicles, areas, history } = useStore();

  return useMemo(() => {
    const alerts: Alert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeVehicles = vehicles.filter(v => v.status === 'active');

    for (const vehicle of activeVehicles) {
      const status = getDeadlineStatus(vehicle);
      const areaName = areas.find(a => a.id === vehicle.currentAreaId)?.name || 'Desconhecido';

      if (status === 'overdue' && vehicle.promisedDate) {
        const promised = parseISO(vehicle.promisedDate);
        const daysLate = differenceInDays(today, promised);
        alerts.push({
          id: `overdue-${vehicle.id}`,
          type: 'overdue',
          vehicleId: vehicle.id,
          message: `🔴 ${vehicle.model} (${vehicle.plate}) está atrasado ${daysLate} dia(s). Setor: ${areaName}`,
          read: false,
        });
      } else if (status === 'warning' && vehicle.promisedDate) {
        const promised = parseISO(vehicle.promisedDate);
        const daysLeft = differenceInDays(promised, today);
        alerts.push({
          id: `warning-${vehicle.id}`,
          type: 'warning',
          vehicleId: vehicle.id,
          message: `🟡 ${vehicle.model} (${vehicle.plate}) vence em ${daysLeft} dia(s). Setor: ${areaName}`,
          read: false,
        });
      }

      // Stale: vehicle in same sector for more than 3 days
      const lastMove = history
        .filter(h => h.vehicleId === vehicle.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      if (lastMove) {
        const lastMoveDate = new Date(lastMove.timestamp);
        const daysSinceMove = differenceInDays(today, lastMoveDate);
        if (daysSinceMove >= 3) {
          alerts.push({
            id: `stale-${vehicle.id}`,
            type: 'stale',
            vehicleId: vehicle.id,
            message: `⏰ ${vehicle.model} (${vehicle.plate}) está parado em "${areaName}" há ${daysSinceMove} dias`,
            read: false,
          });
        }
      }
    }

    return alerts;
  }, [vehicles, areas, history]);
}
