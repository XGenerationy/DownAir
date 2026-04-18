import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Database, User, Settings, CheckCircle, ArrowRight, ArrowLeft,
  Shield, Server, Zap, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

type Step = 'welcome' | 'database' | 'admin' | 'app' | 'complete';

export default function SetupWizard() {
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbTested, setDbTested] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  const [dbConfig, setDbConfig] = useState({
    dbHost: 'localhost',
    dbPort: 5432,
    dbName: 'downair',
    dbUser: 'postgres',
    dbPassword: '',
  });

  const [adminConfig, setAdminConfig] = useState({
    adminEmail: 'admin@downair.net',
    adminPassword: '',
    adminName: 'Admin',
  });

  const [appConfig, setAppConfig] = useState({
    appName: 'DownAir',
    appUrl: 'https://downair.net',
    appPort: 3001,
  });

  const testDatabase = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.testDb(dbConfig);
      if (res.success && res.data?.connected) {
        setDbConnected(true);
        setDbTested(true);
      } else {
        setDbConnected(false);
        setDbTested(true);
        setError('Connection failed. Check your credentials.');
      }
    } catch {
      setDbConnected(false);
      setDbTested(true);
      setError('Connection failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.completeSetup({
        ...appConfig,
        ...dbConfig,
        ...adminConfig,
      });
      if (res.success) {
        setStep('complete');
      } else {
        setError(res.error || 'Setup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const steps: { key: Step; label: string; icon: typeof Database }[] = [
    { key: 'welcome', label: 'Welcome', icon: Zap },
    { key: 'database', label: 'Database', icon: Database },
    { key: 'admin', label: 'Admin Account', icon: User },
    { key: 'app', label: 'Application', icon: Settings },
    { key: 'complete', label: 'Complete', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <>
      <Helmet><title>Setup Wizard - DownAir</title></Helmet>

      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">DownAir Setup</h1>
            <p className="text-slate-400 mt-2">Configure your downloader in a few simple steps</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i < currentStepIndex ? 'bg-cyan-500 text-white' :
                  i === currentStepIndex ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' :
                  'bg-slate-800 text-slate-500'
                }`}>
                  {i < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < currentStepIndex ? 'bg-cyan-500' : 'bg-slate-800'}`} />}
              </div>
            ))}
          </div>

          <Card className="p-8">
            {step === 'welcome' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Welcome to DownAir</h2>
                <p className="text-slate-400 mb-6">
                  This setup wizard will guide you through configuring your social media downloader.
                  You'll need:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <Database className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">PostgreSQL Database</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <Shield className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">Admin Credentials</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <Server className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">Server Settings</p>
                  </div>
                </div>
                <Button variant="cyan" size="lg" onClick={() => setStep('database')}>
                  Let's Begin <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 'database' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" /> Database Configuration
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Host</Label>
                    <Input value={dbConfig.dbHost} onChange={(e) => setDbConfig({ ...dbConfig, dbHost: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input type="number" value={dbConfig.dbPort} onChange={(e) => setDbConfig({ ...dbConfig, dbPort: parseInt(e.target.value) || 5432 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Database Name</Label>
                    <Input value={dbConfig.dbName} onChange={(e) => setDbConfig({ ...dbConfig, dbName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={dbConfig.dbUser} onChange={(e) => setDbConfig({ ...dbConfig, dbUser: e.target.value })} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={dbConfig.dbPassword} onChange={(e) => setDbConfig({ ...dbConfig, dbPassword: e.target.value })} placeholder="Database password" />
                  </div>
                </div>

                {dbTested && (
                  <div className={`flex items-center gap-2 mt-4 p-3 rounded-lg text-sm ${
                    dbConnected ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {dbConnected ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {dbConnected ? 'Connected successfully!' : 'Connection failed'}
                  </div>
                )}

                {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

                <div className="flex items-center justify-between mt-6">
                  <Button variant="ghost" onClick={() => setStep('welcome')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={testDatabase} disabled={loading}>
                      {loading ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="cyan" onClick={() => setStep('admin')} disabled={!dbConnected}>
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 'admin' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" /> Admin Account
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Admin Name</Label>
                    <Input value={adminConfig.adminName} onChange={(e) => setAdminConfig({ ...adminConfig, adminName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={adminConfig.adminEmail} onChange={(e) => setAdminConfig({ ...adminConfig, adminEmail: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={adminConfig.adminPassword} onChange={(e) => setAdminConfig({ ...adminConfig, adminPassword: e.target.value })} placeholder="Min 8 characters" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Button variant="ghost" onClick={() => setStep('database')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button variant="cyan" onClick={() => setStep('app')} disabled={!adminConfig.adminPassword || adminConfig.adminPassword.length < 8}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'app' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" /> Application Settings
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Application Name</Label>
                    <Input value={appConfig.appName} onChange={(e) => setAppConfig({ ...appConfig, appName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Application URL</Label>
                    <Input value={appConfig.appUrl} onChange={(e) => setAppConfig({ ...appConfig, appUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Server Port</Label>
                    <Input type="number" value={appConfig.appPort} onChange={(e) => setAppConfig({ ...appConfig, appPort: parseInt(e.target.value) || 3001 })} />
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

                <div className="flex items-center justify-between mt-6">
                  <Button variant="ghost" onClick={() => setStep('admin')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button variant="cyan" onClick={completeSetup} disabled={loading}>
                    {loading ? 'Configuring...' : 'Complete Setup'} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'complete' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Setup Complete!</h2>
                <p className="text-slate-400 mb-6">
                  Your DownAir instance has been configured successfully. 
                  Security keys have been generated and saved. Your admin account is ready.
                </p>
                <Button variant="cyan" size="lg" onClick={() => window.location.href = '/'}>
                  Launch DownAir <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
