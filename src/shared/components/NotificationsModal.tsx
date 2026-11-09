import React from 'react';
import { DSBottomSheet, DSButton } from '../../design-system';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  X,
} from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

export interface NotificationItem {
  id: string;
  type: 'WARNING' | 'DANGER' | 'SUCCESS' | 'INFO';
  title: string;
  message: string;
  time: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: NotificationItem[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const { preferredCurrency } = useCurrency();

  // Default intelligent notifications if none provided
  const notificationList: NotificationItem[] = items && items.length > 0 ? items : [
    {
      id: 'notif-1',
      type: 'SUCCESS',
      title: 'Sistema Conectado y Sincronizado',
      message: `Tus cuentas y transacciones están sincronizadas en tiempo real con MongoDB Atlas en ${preferredCurrency}.`,
      time: 'Hace un momento',
    },
    {
      id: 'notif-2',
      type: 'INFO',
      title: 'Moneda Predeterminada Activa',
      message: `Todos los cálculos y reportes analíticos están consolidados en ${preferredCurrency}.`,
      time: 'Hoy',
    },
  ];

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'DANGER':
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-teal-600" />;
    }
  };

  const getBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'DANGER':
        return 'bg-rose-50 border-rose-200';
      case 'WARNING':
        return 'bg-amber-50 border-amber-200';
      case 'SUCCESS':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-teal-50 border-teal-200';
    }
  };

  return (
    <DSBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-extrabold text-slate-900 block leading-tight">
              Notificaciones y Alertas
            </span>
            <span className="text-[11px] text-slate-400 font-normal block">
              Actividad financiera y alertas preventivas
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-3 pb-6">
        {notificationList.map((notif) => (
          <div
            key={notif.id}
            className={`p-3.5 rounded-2xl border ${getBg(notif.type)} flex items-start gap-3 shadow-2xs`}
          >
            <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {notif.title}
                </p>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {notif.time}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                {notif.message}
              </p>
            </div>
          </div>
        ))}

        <div className="pt-2">
          <DSButton
            type="button"
            variant="outline"
            size="md"
            className="w-full"
            onClick={onClose}
          >
            Entendido
          </DSButton>
        </div>
      </div>
    </DSBottomSheet>
  );
};
