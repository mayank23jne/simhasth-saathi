import React from 'react';
import { useAppStore } from '@/store/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DebugPanel: React.FC = () => {
  const state = useAppStore((s) => s);
  return (
    <div className="fixed bottom-[64px] right-4 z-50 w-[360px] max-h-[60vh] overflow-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Global State (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify({
            groupCode: state.groupCode,
            userId: state.userId,
            userLocation: state.userLocation,
            members: state.members,
            sosAlerts: state.sosAlerts,
            reports: state.reports,
            qrScans: state.qrScans,
            mapMarkers: state.mapMarkers,
          }, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugPanel;


