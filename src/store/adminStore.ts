import { create } from 'zustand';

export interface AdminGroup {
  id: string;
  code: string;
  name: string;
  memberCount: number;
  leader: string;
  location: string;
  coordinates: [number, number];
  lastUpdate: number;
  status: 'active' | 'inactive' | 'emergency';
}

export interface AdminSOSAlert {
  id: string;
  name: string;
  phone: string;
  groupCode: string;
  location: string;
  coordinates: [number, number];
  issue: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  status: 'active' | 'acknowledged' | 'resolved';
  assignedVolunteer?: string;
  emergencyType: 'medical' | 'lost_person' | 'security' | 'crowd_control' | 'other';
  smsBackupSent?: boolean;
}

export interface AdminCrowdAlert {
  id: string;
  location: string;
  coordinates: [number, number];
  currentDensity: number;
  capacity: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  estimatedPeople: number;
  status: 'monitoring' | 'action_required' | 'resolved';
  recommendedAction?: string;
}

export interface AdminLostFoundReport {
  id: string;
  type: 'lost' | 'found';
  name: string;
  age?: number;
  description: string;
  lastSeen: string;
  reporterName: string;
  reporterPhone: string;
  timestamp: number;
  status: 'active' | 'resolved';
  qrCode?: string;
  photo?: string;
  groupCode?: string;
  priority: 'high' | 'medium' | 'low';
}

interface AdminState {
  // core datasets
  groups: AdminGroup[];
  sosAlerts: AdminSOSAlert[];
  crowdAlerts: AdminCrowdAlert[];
  lostFound: AdminLostFoundReport[];

  // actions
  acknowledgeSOS: (id: string, volunteer: string) => void;
  resolveSOS: (id: string) => void;
  takeCrowdAction: (id: string) => void;
  addLostFoundReport: (report: AdminLostFoundReport) => void;
  resolveLostFound: (id: string) => void;
}

const now = Date.now();

const seedGroups: AdminGroup[] = [
  {
    id: 'grp_ujj_001',
    code: 'UJJ-2028-001',
    name: 'Mahakal Mandir Group',
    memberCount: 25,
    leader: 'Priya Sharma',
    location: 'Mahakaleshwar Temple',
    coordinates: [23.1828, 75.7689],
    lastUpdate: now - 120000,
    status: 'active',
  },
  {
    id: 'grp_ujj_002',
    code: 'UJJ-2028-015',
    name: 'Ramghat Pilgrims',
    memberCount: 12,
    leader: 'Rajesh Kumar',
    location: 'Ram Ghat',
    coordinates: [23.1769, 75.7889],
    lastUpdate: now - 300000,
    status: 'emergency',
  },
  {
    id: 'grp_ujj_003',
    code: 'UJJ-2028-007',
    name: 'Kal Bhairav Sevaks',
    memberCount: 35,
    leader: 'Anita Devi',
    location: 'Kal Bhairav Temple',
    coordinates: [23.2112, 75.7826],
    lastUpdate: now - 60000,
    status: 'active',
  },
];

const seedSOS: AdminSOSAlert[] = [
  {
    id: 'sos_ujj_001',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    groupCode: 'UJJ-2028-001',
    location: 'Near Ram Ghat',
    coordinates: [23.1772, 75.7891],
    issue: 'Lost child - 8 year old boy in blue shirt',
    priority: 'high',
    timestamp: now - 300000,
    status: 'active',
    emergencyType: 'lost_person',
    smsBackupSent: true,
  },
  {
    id: 'sos_ujj_002',
    name: 'Rajesh Kumar',
    phone: '+91 87654 32109',
    groupCode: 'UJJ-2028-015',
    location: 'Mahakaleshwar Temple gate 2',
    coordinates: [23.1826, 75.7684],
    issue: 'Medical emergency - chest pain',
    priority: 'high',
    timestamp: now - 600000,
    status: 'acknowledged',
    assignedVolunteer: 'Dr. Singh',
    emergencyType: 'medical',
  },
];

const seedCrowd: AdminCrowdAlert[] = [
  {
    id: 'crowd_ujj_001',
    location: 'Ram Ghat Main Aarti Area',
    coordinates: [23.1769, 75.7889],
    currentDensity: 8.5,
    capacity: 5000,
    riskLevel: 'critical',
    timestamp: now - 180000,
    estimatedPeople: 4200,
    status: 'action_required',
    recommendedAction: 'Deploy additional volunteers, open alternate exit',
  },
  {
    id: 'crowd_ujj_002',
    location: 'Mahakal Corridor',
    coordinates: [23.1824, 75.7695],
    currentDensity: 5.6,
    capacity: 3000,
    riskLevel: 'high',
    timestamp: now - 240000,
    estimatedPeople: 2100,
    status: 'monitoring',
  },
];

const seedLostFound: AdminLostFoundReport[] = [
  {
    id: 'lf_ujj_001',
    type: 'lost',
    name: 'Arjun Kumar',
    age: 8,
    description: 'Boy wearing blue shirt and black shorts',
    lastSeen: 'Near Ram Ghat main entrance',
    reporterName: 'Priya Sharma',
    reporterPhone: '+91 98765 43210',
    timestamp: now - 1800000,
    status: 'active',
    qrCode: 'QR-LF-001',
    priority: 'high',
    groupCode: 'UJJ-2028-001',
  },
  {
    id: 'lf_ujj_002',
    type: 'found',
    name: 'Elderly Woman',
    age: 65,
    description: 'White saree, speaks Hindi, appears confused',
    lastSeen: 'Mahakal Corridor',
    reporterName: 'Volunteer Team A',
    reporterPhone: '+91 87654 32109',
    timestamp: now - 900000,
    status: 'active',
    qrCode: 'QR-LF-002',
    priority: 'high',
  },
];

export const useAdminStore = create<AdminState>((set) => ({
  groups: seedGroups,
  sosAlerts: seedSOS,
  crowdAlerts: seedCrowd,
  lostFound: seedLostFound,

  acknowledgeSOS: (id, volunteer) => set((state) => ({
    sosAlerts: state.sosAlerts.map(a => a.id === id ? { ...a, status: 'acknowledged', assignedVolunteer: volunteer } : a)
  })),
  resolveSOS: (id) => set((state) => ({
    sosAlerts: state.sosAlerts.map(a => a.id === id ? { ...a, status: 'resolved' } : a)
  })),
  takeCrowdAction: (id) => set((state) => ({
    crowdAlerts: state.crowdAlerts.map(c => c.id === id ? { ...c, status: 'resolved' } : c)
  })),
  addLostFoundReport: (report) => set((state) => ({
    lostFound: [report, ...state.lostFound]
  })),
  resolveLostFound: (id) => set((state) => ({
    lostFound: state.lostFound.map(r => r.id === id ? { ...r, status: 'resolved' } : r)
  })),
}));


