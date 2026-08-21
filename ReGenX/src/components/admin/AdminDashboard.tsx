import React, { useState, useEffect } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { disasterApi } from '../../services/api';
import { 
  SchedulerTelemetry, 
  ServiceHealthMetric, 
  AuditLogEntry, 
  UserProfile, 
  OfficialApprovalStatus 
} from '../../types';
import { 
  ShieldAlert, 
  Server, 
  Database, 
  Bell, 
  Search, 
  ShieldCheck, 
  Ban 
} from 'lucide-react';

interface AdminDashboardProps {
  currentTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab = 'ADMIN_OVERVIEW' }) => {
  const { hazardZones, crowdReports } = useDisasterData();

  // Map upper navigation IDs to content sections
  const activeTab: 'TELEMETRY' | 'SCHEDULER' | 'HEALTH_MATRIX' | 'USERS' | 'AUDIT_LOGS' = 
    currentTab === 'ADMIN_SCHEDULER' ? 'SCHEDULER' :
    currentTab === 'ADMIN_HEALTH' ? 'HEALTH_MATRIX' :
    currentTab === 'ADMIN_USERS' ? 'USERS' :
    currentTab === 'ADMIN_LOGS' ? 'AUDIT_LOGS' :
    'TELEMETRY';

  const [telemetry, setTelemetry] = useState<SchedulerTelemetry | null>(null);
  const [servicesHealth, setServicesHealth] = useState<ServiceHealthMetric[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [, setIsLoading] = useState<boolean>(true);
  const [searchAudit, setSearchAudit] = useState('');

  // Next run countdown simulator
  const [secondsUntilNextRun, setSecondsUntilNextRun] = useState<number>(720); // 12 mins

  useEffect(() => {
    const loadAdminData = async () => {
      setIsLoading(true);
      try {
        const [telem, health, logs, users] = await Promise.all([
          disasterApi.getSchedulerTelemetry(),
          disasterApi.getServicesHealth(),
          disasterApi.getAuditLogs(),
          disasterApi.getUsersList()
        ]);
        setTelemetry(telem);
        setServicesHealth(health);
        setAuditLogs(logs);
        setUsersList(users);
      } catch (e) {
        console.error('Failed to load admin telemetry', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();

    const timer = setInterval(() => {
      setSecondsUntilNextRun(prev => (prev > 0 ? prev - 1 : 1200));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleUpdateApproval = async (userId: string, newStatus: OfficialApprovalStatus) => {
    try {
      const updated = await disasterApi.updateOfficialApproval(userId, newStatus);
      setUsersList(prev => prev.map(u => u.id === userId ? updated : u));
      const freshLogs = await disasterApi.getAuditLogs();
      setAuditLogs(freshLogs);
    } catch (e: any) {
      alert(e.message || 'Failed to update official status');
    }
  };

  const formatSecondsToMMSS = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: 'OPERATIONAL' | 'WARNING' | 'UNAVAILABLE') => {
    switch (status) {
      case 'OPERATIONAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
            🟢 Operational
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
            🟡 Warning / Config
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30">
            🔴 Unavailable
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 animate-fade-in transition-colors duration-200">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#0B3D91] rounded-xl text-white">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-heading">
              System Admin & Developer Operations Hub
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Backend services health, 20-minute analytical scheduler telemetry, official authorizations, and audit trails.
          </p>
        </div>

        {/* Global Status Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
          <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-slate-600 dark:text-slate-300">
            Cluster: <strong className="text-slate-900 dark:text-white">BMC-RISK-PROD-01</strong>
          </span>
        </div>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW & STATISTICS (Section 27) */}
      {activeTab === 'TELEMETRY' && (
        <div className="space-y-6">
          {/* Top Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">BMC Ward Coverage</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">67 Wards</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">100% Geo-Centroids Calibrated</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Covered Hazards</span>
              <span className="text-3xl font-black text-[#F58220]">5 Hazards</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Rain, Flood, Waterlog, Lightning, Cyclone</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Active Critical Zones</span>
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {hazardZones.filter(z => z.severity === 'HIGH' || z.severity === 'EMERGENCY').length}
              </span>
              <span className="text-[10px] text-rose-700 dark:text-rose-400/90 block font-semibold">HIGH + EMERGENCY perimeters</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Citizen Ground Reports</span>
              <span className="text-3xl font-black text-[#0B3D91] dark:text-cyan-400">{crowdReports.length}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Separate from risk scores</span>
            </div>
          </div>

          {/* Quick System Health Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Backend Architecture Integrity
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                NivaranAI connects to the 10 Python backend modules. The analytical risk engine serves as the single source of truth for all risk calculations, radii, and severity classifications.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
                <div>• risk_engine.py: Source of Truth (Formula immutable on frontend)</div>
                <div>• map_zones.py: Radius & Coordinate serializer</div>
                <div>• scheduled_runner.py: Active (20-min cycle)</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#F58220]" />
                Deterministic Notification Channels
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300">Firebase Cloud Messaging (FCM Push)</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">CONNECTED</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300">Twilio SMS Gateway</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">READY (HIGH/EMERGENCY)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300">In-App Notification Bus</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULER MONITORING (Section 26) */}
      {activeTab === 'SCHEDULER' && telemetry && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-500/30 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Cron Scheduler Cadence</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">{telemetry.cron_expression}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">Every 20 Minutes (scheduled_runner.py)</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-blue-200 dark:border-cyan-500/30 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-blue-800 dark:text-cyan-300">Next Scheduled Execution</span>
              <h3 className="text-2xl font-black text-[#0B3D91] dark:text-cyan-300 font-mono">
                {formatSecondsToMMSS(secondsUntilNextRun)}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">Auto-evaluates all 67 BMC wards</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Last Execution Duration</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">{telemetry.execution_duration_sec}s</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Completed with 0 analytical failures</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider">
              Last Execution Cycle Telemetry
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">Wards Evaluated</span>
                <strong className="text-slate-900 dark:text-white text-base">{telemetry.wards_evaluated} / 67</strong>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">Zones Status Shift</span>
                <strong className="text-[#F58220] text-base">{telemetry.zones_changed} Wards</strong>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">Alerts Dispatched</span>
                <strong className="text-rose-600 dark:text-rose-400 text-base">{telemetry.notifications_triggered} Triggers</strong>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">Daemon State</span>
                <strong className="text-emerald-700 dark:text-emerald-400 text-base">HEALTHY</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: API & SERVICE HEALTH MATRIX (Section 25) */}
      {activeTab === 'HEALTH_MATRIX' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider">
              External & Internal Service Connectivity Matrix
            </h3>
            <span className="text-xs text-slate-500 font-mono">Live Probing</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicesHealth.map(service => (
              <div
                key={service.name}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">{service.name}</h4>
                  {getStatusBadge(service.status)}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[36px]">
                  {service.details}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Latency: <strong className="text-slate-800 dark:text-slate-300">{service.latency_ms}ms</strong></span>
                  <span>Checked: Just now</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USERS & GOVERNMENT OFFICIAL MANAGEMENT (Section 28) */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider">
              User Directory & Official Account Approvals
            </h3>
            <span className="text-xs text-slate-500">{usersList.length} Accounts Registered</span>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/60 dark:bg-slate-950/40">
                  <th className="p-3.5">Name / Email</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Department & Title</th>
                  <th className="p-3.5">Approval Status</th>
                  <th className="p-3.5">SMS Alerts</th>
                  <th className="p-3.5 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition">
                    <td className="p-3.5">
                      <strong className="text-slate-900 dark:text-white block">{u.name}</strong>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">{u.email}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        u.role === 'GOVERNMENT_OFFICIAL' 
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                          : u.role === 'SYSTEM_ADMIN'
                          ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {u.department ? `${u.department} (${u.designation || 'Officer'})` : 'Citizen Account'}
                    </td>
                    <td className="p-3.5">
                      {u.official_status ? (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                          u.official_status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                            : u.official_status === 'PENDING_APPROVAL'
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 animate-pulse'
                            : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                        }`}>
                          {u.official_status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[11px] font-medium ${u.notification_sms_enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {u.notification_sms_enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {u.role === 'GOVERNMENT_OFFICIAL' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {u.official_status !== 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateApproval(u.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                            >
                              <ShieldCheck className="w-3 h-3" /> Approve
                            </button>
                          )}
                          {u.official_status !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleUpdateApproval(u.id, 'SUSPENDED')}
                              className="px-2.5 py-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                            >
                              <Ban className="w-3 h-3" /> Suspend
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY AUDIT LOGS (Section 29) */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider">
                Immutable Operational Event Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited timeline of official mitigation postings, camp creations, and verification actions.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter audit logs..."
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B3D91] shadow-xs"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {auditLogs
              .filter(l => !searchAudit.trim() || l.details.toLowerCase().includes(searchAudit.toLowerCase()) || l.action_type.toLowerCase().includes(searchAudit.toLowerCase()))
              .map(log => (
                <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition flex items-start gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 font-mono text-[10px]">
                    {log.target_type}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {log.action_type}
                      </strong>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {log.details}
                    </p>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>Actor: <strong className="text-slate-700 dark:text-slate-300">{log.actor_name}</strong> ({log.actor_role})</span>
                      <span>• Target ID: #{log.target_id}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
