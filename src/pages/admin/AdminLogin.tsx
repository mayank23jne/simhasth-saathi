import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/context/TranslationContext';
import { toast } from 'sonner';

interface AdminLoginProps {}

export const AdminLogin: React.FC<AdminLoginProps> = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const roles = [
    { value: 'admin', label: 'Administrator', icon: Shield, color: 'text-red-500' },
    { value: 'volunteer', label: 'Volunteer Coordinator', icon: Users, color: 'text-blue-500' },
    { value: 'police', label: 'Security Officer', icon: Eye, color: 'text-green-500' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !role) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store admin session
    localStorage.setItem('adminAuth', JSON.stringify({
      username,
      role,
      loginTime: Date.now(),
      isAuthenticated: true
    }));

    toast.success(`Logged in as ${role}`);
    navigate('/admin/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-blue/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-3/4 w-48 h-48 bg-saffron/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-elegant backdrop-blur-xl bg-white/95 border-white/20">
          <CardHeader className="text-center space-y-4 pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mb-4 shadow-glow"
            >
              <Shield className="h-10 w-10 text-white drop-shadow-lg" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Admin Dashboard
              </CardTitle>
              <CardDescription className="text-lg mt-2 text-foreground/70">
                Simhastha Saathi Control Center
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="username" className="font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 bg-white/50 border-white/20 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white/50 border-white/20 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <Label htmlFor="role" className="font-medium">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-12 bg-white/50 border-white/20 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-xl bg-white/95 border-white/20">
                    {roles.map((roleOption) => {
                      const IconComponent = roleOption.icon;
                      return (
                        <SelectItem key={roleOption.value} value={roleOption.value} className="hover:bg-primary/10">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${
                              roleOption.value === 'admin' ? 'from-red-500/20 to-red-600/20' :
                              roleOption.value === 'volunteer' ? 'from-blue-500/20 to-blue-600/20' :
                              'from-green-500/20 to-green-600/20'
                            }`}>
                              <IconComponent className={`h-4 w-4 ${roleOption.color}`} />
                            </div>
                            <span className="font-medium">{roleOption.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-primary hover:shadow-glow transition-all duration-300 font-semibold text-lg" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </motion.div>
            </form>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-4 border border-emerald-200/50">
                <p className="text-sm font-medium text-emerald-700 mb-2">Demo Credentials</p>
                <div className="space-y-1 text-xs text-emerald-600">
                  <p><span className="font-medium">Username:</span> admin</p>
                  <p><span className="font-medium">Password:</span> admin123</p>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};