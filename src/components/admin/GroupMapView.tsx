import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Search, Eye, MapIcon, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface Group {
  id: string;
  code: string;
  name: string;
  memberCount: number;
  leader: string;
  location: string;
  coordinates: [number, number];
  lastUpdate: number;
  status: 'active' | 'inactive' | 'emergency';
  members: Array<{
    name: string;
    phone: string;
    status: 'safe' | 'missing' | 'emergency';
  }>;
}

interface GroupMapViewProps {
  expanded?: boolean;
}

export const GroupMapView: React.FC<GroupMapViewProps> = ({ expanded = false }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    // Load dummy group data
    const dummyGroups: Group[] = [
      {
        id: 'grp_001',
        code: 'GRP-2024-001',
        name: 'Delhi Pilgrims',
        memberCount: 25,
        leader: 'Priya Sharma',
        location: 'Har Ki Pauri',
        coordinates: [29.9457, 78.1642],
        lastUpdate: Date.now() - 120000,
        status: 'active',
        members: [
          { name: 'Priya Sharma', phone: '+91 98765 43210', status: 'safe' },
          { name: 'Raj Kumar', phone: '+91 98765 43211', status: 'safe' },
          { name: 'Sunita Devi', phone: '+91 98765 43212', status: 'missing' },
        ]
      },
      {
        id: 'grp_002',
        code: 'GRP-2024-015',
        name: 'Mumbai Family Group',
        memberCount: 12,
        leader: 'Rajesh Kumar',
        location: 'Mansa Devi Temple',
        coordinates: [29.9457, 78.1642],
        lastUpdate: Date.now() - 300000,
        status: 'emergency',
        members: [
          { name: 'Rajesh Kumar', phone: '+91 87654 32109', status: 'emergency' },
          { name: 'Meera Kumar', phone: '+91 87654 32110', status: 'safe' },
        ]
      },
      {
        id: 'grp_003',
        code: 'GRP-2024-007',
        name: 'Gujrat Yatra Group',
        memberCount: 35,
        leader: 'Anita Devi',
        location: 'Ganga Aarti Ghat',
        coordinates: [29.9457, 78.1642],
        lastUpdate: Date.now() - 60000,
        status: 'active',
        members: [
          { name: 'Anita Devi', phone: '+91 76543 21098', status: 'safe' },
          { name: 'Bharat Patel', phone: '+91 76543 21099', status: 'safe' },
        ]
      }
    ];

    setGroups(dummyGroups);
  }, []);

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className={`grid ${expanded ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
      {/* Map Area */}
      <Card className={expanded ? 'h-96' : 'lg:col-span-2 h-96'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-blue-500" />
            Live Group Map
          </CardTitle>
          <CardDescription>
            Real-time locations of all registered groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Simulated Map */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-green-100/50"></div>
            
            {/* Group Pins */}
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.2 }}
                className={`absolute cursor-pointer group`}
                style={{ 
                  left: `${20 + index * 25}%`, 
                  top: `${30 + (index % 2) * 30}%` 
                }}
                onClick={() => setSelectedGroup(group)}
              >
                <div className={`w-8 h-8 rounded-full ${getStatusColor(group.status)} flex items-center justify-center text-white text-xs font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                  {group.memberCount}
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {group.name}
                </div>
              </motion.div>
            ))}

            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Interactive map with group locations</p>
              <p className="text-xs">Click on pins to view group details</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      <Card className={expanded ? 'mt-6' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Groups
          </CardTitle>
          <CardDescription>
            {filteredGroups.length} active groups
          </CardDescription>
          
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

        <CardContent className="space-y-3 overflow-y-scroll h-[15.5rem]">
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
        </CardContent>
      </Card>
    </div>
  );
};