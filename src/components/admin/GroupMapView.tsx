import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Search, Eye, MapIcon, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAdminStore } from '@/store/adminStore';

// CORE FEATURE: Group-based live location tracking for religious gatherings
// Essential for coordinated safety management in large events like Simhastha 2028
interface Group {
  id: string;
  code: string; // Unique group codes for easy identification as per project requirements
  name: string;
  memberCount: number;
  leader: string; // Group leader for coordination
  location: string;
  coordinates: [number, number];
  lastUpdate: number;
  status: 'active' | 'inactive' | 'emergency';
  members: Array<{
    name: string;
    phone: string;
    status: 'safe' | 'missing' | 'emergency';
    lastSeen?: number; // For lost person tracking
  }>;
  qrCode?: string; // Group QR code for quick identification
  emergencyContact?: string; // Backup contact for offline scenarios
}

interface GroupMapViewProps {
  expanded?: boolean;
}

export const GroupMapView: React.FC<GroupMapViewProps> = ({ expanded = false }) => {
  const groupsFromStore = useAdminStore(s => s.groups);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Fix default marker icons in bundlers
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  useEffect(() => {
    // Adapt store shape to local Group interface (adds members list for UI if needed)
    const adapted: Group[] = groupsFromStore.map(g => ({
      id: g.id,
      code: g.code,
      name: g.name,
      memberCount: g.memberCount,
      leader: g.leader,
      location: g.location,
      coordinates: g.coordinates,
      lastUpdate: g.lastUpdate,
      status: g.status,
      members: [],
      qrCode: g.code,
      emergencyContact: ''
    }));
    setGroups(adapted);
  }, [groupsFromStore]);

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allBounds = useMemo(() => {
    if (filteredGroups.length === 0) return null as L.LatLngBounds | null;
    const b = L.latLngBounds(filteredGroups.map(g => L.latLng(g.coordinates[0], g.coordinates[1])));
    return b;
  }, [filteredGroups]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'emergency': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-500';
      case 'missing': return 'text-yellow-500';
      case 'emergency': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  // Helper component to fit bounds when groups change or when a group is selected
  const FitBoundsOnData: React.FC = () => {
    const map = useMap();
    useEffect(() => {
      if (selectedGroup) {
        map.flyTo(
          L.latLng(selectedGroup.coordinates[0], selectedGroup.coordinates[1]),
          Math.max(map.getZoom(), 15),
        );
        return;
      }
      if (allBounds) {
        map.fitBounds(allBounds.pad(0.2));
      }
    }, [map, allBounds, selectedGroup]);
    return null;
  };

  // Build a simple div icon with member count and status color
  const buildGroupIcon = (group: Group) => {
    const color = group.status === 'active' ? '#10b981' : group.status === 'emergency' ? '#ef4444' : '#6b7280';
    const html = `
      <div style="position:relative;">
        <div style="width:34px;height:34px;border-radius:9999px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,0.25),0 1px 3px rgba(0,0,0,0.2);border:2px solid white;">${group.memberCount}</div>
      </div>`;
    return L.divIcon({ html, className: 'group-count-icon', iconSize: [34, 34], iconAnchor: [17, 17] });
  };

  return (
    <div className={`grid ${expanded ? 'grid-cols-1 gap-6' : 'lg:grid-cols-3 gap-6'}`}>
      {/* Map Area (Leaflet) */}
      <Card className={`${expanded ? '' : 'lg:col-span-2'} border-2 border-blue-100 shadow-medium hover:shadow-lg transition-shadow`}>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">Live Group Map</div>
              <div className="text-sm text-muted-foreground">
                {groups.length} groups · {groups.reduce((sum, g) => sum + g.memberCount, 0)} pilgrims
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-56 sm:h-64 md:h-72 lg:h-80 rounded-lg overflow-hidden relative">
            <MapContainer
              center={[23.1765, 75.7884]}
              zoom={13}
              className="h-full w-full"
              preferCanvas
              wheelDebounceTime={35}
              wheelPxPerZoomLevel={80}
              zoomAnimation
              markerZoomAnimation
              touchZoom
              tapTolerance={15}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitBoundsOnData />
              {filteredGroups.map((group) => (
                <Marker
                key={group.id}
                  position={[group.coordinates[0], group.coordinates[1]]}
                  icon={buildGroupIcon(group)}
                  eventHandlers={{ click: () => setSelectedGroup(group) }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div className="font-semibold">{group.name}</div>
                      <div className="text-xs text-muted-foreground">{group.code}</div>
                      <div className="text-xs">Members: {group.memberCount}</div>
                      <div className="text-xs">Leader: {group.leader}</div>
                      <div className="text-xs">Updated: {formatTimeAgo(group.lastUpdate)}</div>
                </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Groups List */}
      <Card className={`${expanded ? 'mt-6' : ''} border-2 border-green-100 shadow-success hover:shadow-lg transition-shadow`}>
        <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">Active Groups</div>
              <div className="text-sm text-muted-foreground">
                {filteredGroups.length} groups monitored
              </div>
            </div>
          </CardTitle>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-3 overflow-y-scroll h-56 sm:h-64 md:h-[15.5rem]">
          {filteredGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                selectedGroup?.id === group.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setSelectedGroup(group)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${getStatusColor(group.status)} text-white text-xs`}>
                      {group.status}
                    </Badge>
                    <span className="text-sm font-medium">{group.code}</span>
                  </div>
                  <h4 className="font-semibold">{group.name}</h4>
                  <p className="text-sm text-muted-foreground">Leader: {group.leader}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="font-bold text-lg">{group.memberCount}</div>
                  <div>members</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {group.location}
                </div>
                <div>
                  Updated {formatTimeAgo(group.lastUpdate)}
                </div>
              </div>

              {selectedGroup?.id === group.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t space-y-2"
                >
                  <h5 className="font-medium text-sm">Members Status:</h5>
                  {group.members.slice(0, 3).map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span>{member.name}</span>
                      <span className={`font-medium ${getMemberStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </div>
                  ))}
                  {group.members.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{group.members.length - 3} more members
                    </p>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View All
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Navigation className="h-3 w-3 mr-1" />
                      Track
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No groups match your search</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};