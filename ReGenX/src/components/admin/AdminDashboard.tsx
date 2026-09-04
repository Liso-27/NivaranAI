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
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
            🟢 Operational
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
            🟡 Warning / Config
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30">
            🔴 Unavailable
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 transition-colors duration-200">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#D97706] rounded-lg text-white">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] dark:text-white">
              System Admin & Developer Operations Hub
            </h2>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1 font-medium">
            Backend services health, 20-minute analytical scheduler telemetry, official authorizations, and audit trails.
          </p>
        </div>

        {/* Global Status Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-[#FFFFFF] dark:bg-slate-900 rounded-lg border border-[#D1D5DB] dark:border-slate-800 text-xs">
          <Server className="w-4 h-4 text-[#059669]" />
          <span className="text-[#475569] dark:text-slate-300">
            Cluster: <strong className="text-[#0F172A] dark:text-white">BMC-RISK-PROD-01</strong>
          </span>
        </div>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW & STATISTICS */}
      {activeTab === 'TELEMETRY' && (
        <div className="space-y-6">
          {/* Top Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D1D5DB] dark:border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 block">BMC Ward Coverage</span>
              <span className="text-2xl font-bold text-[#0F172A] dark:text-white">67 Wards</span>
              <span className="text-[10px] text-[#059669] block font-semibold">100% Geo-Centroids Calibrated</span>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D1D5DB] dark:border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 block">Covered Hazards</span>
              <span className="text-2xl font-bold text-[#D97706]">5 Hazards</span>
              <span className="text-[10px] text-[#475569] dark:text-slate-400 block font-medium">Rain, Flood, Waterlog, Lightning, Cyclone</span>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D1D5DB] dark:border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 block">Active Critical Zones</span>
              <span className="text-2xl font-bold text-[#DC2626]">
                {hazardZones.filter(z => z.severity === 'HIGH' || z.severity === 'EMERGENCY').length}
              </span>
              <span className="text-[10px] text-[#DC2626] block font-semibold">HIGH + EMERGENCY perimeters</span>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D1D5DB] dark:border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 block">Citizen Ground Reports</span>
              <span className="text-2xl font-bold text-[#0F172A] dark:text-white">{crowdReports.length}</span>
              <span className="text-[10px] text-[#475569] dark:text-slate-400 block font-medium">Separate from risk scores</span>
            </div>
          </div>

          {/* Quick System Health Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border border-[#D1D5DB] dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-[#059669]" />
                Backend Architecture Integrity
              </h3>
              <p className="text-xs text-[#475569] dark:text-slate-300 leading-normal">
                NivaranAI connects to the 10 Python backend modules. The analytical risk engine serves as the single source of truth for all risk calculations, radii, and severity classifications.
              </p>
              <div className="p-3 bg-[#F8F9FA] dark:bg-slate-950 rounded-md border border-[#D1D5DB] dark:border-slate-800 text-xs text-[#475569] dark:text-slate-400 space-y-1 font-medium">
                <div>• risk_engine.py: Source of Truth (Formula immutable on frontend)</div>
                <div>• map_zones.py: Radius & Coordinate serializer</div>
                <div>• scheduled_runner.py: Active (20-min cycle)</div>
              </div>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border border-[#D1D5DB] dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#D97706]" />
                Deterministic Notification Channels
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#F8F9FA] dark:bg-slate-950 rounded-md border border-[#D1D5DB] dark:border-slate-800">
                  <span className="text-[#0F172A] dark:text-slate-300 font-medium">Firebase Cloud Messaging (FCM Push)</span>
                  <span className="text-[#059669] font-semibold">CONNECTED</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#F8F9FA] dark:bg-slate-950 rounded-md border border-[#D1D5DB] dark:border-slate-800">
                  <span className="text-[#0F172A] dark:text-slate-300 font-medium">Twilio SMS Gateway</span>
                  <span className="text-[#059669] font-semibold">READY (HIGH/EMERGENCY)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#F8F9FA] dark:bg-slate-950 rounded-md border border-[#D1D5DB] dark:border-slate-800">
                  <span className="text-[#0F172A] dark:text-slate-300 font-medium">In-App Notification Bus</span>
                  <span className="text-[#059669] font-semibold">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULER MONITORING */}
      {activeTab === 'SCHEDULER' && telemetry && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border border-[#059669]/30 space-y-1">
              <span className="text-xs font-semibold text-[#059669]">Cron Scheduler Cadence</span>
              <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{telemetry.cron_expression}</h3>
              <p className="text-xs text-[#475569] dark:text-slate-300 font-medium">Every 20 Minutes (scheduled_runner.py)</p>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border border-[#D97706]/30 space-y-1">
              <span className="text-xs font-semibold text-[#D97706]">Next Scheduled Execution</span>
              <h3 className="text-xl font-bold text-[#D97706]">
                {formatSecondsToMMSS(secondsUntilNextRun)}
              </h3>
              <p className="text-xs text-[#475569] dark:text-slate-300 font-medium">Auto-evaluates all 67 BMC wards</p>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border border-[#D1D5DB] dark:border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-[#475569] dark:text-slate-400">Last Execution Duration</span>
              <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{telemetry.execution_duration_sec}s</h3>
              <p className="text-xs text-[#059669] font-semibold">Completed with 0 analytical failures</p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border border-[#D1D5DB] dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
              Last Execution Cycle Telemetry
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#F8F9FA] dark:bg-slate-950 rounded-md border border-[#D1D5DB] dark:border-slate-800">
                <span className="text-[#475569] dark:text-slate-400 block font-medium">Wards Evaluated</span>
                <strong className="text-[#0F172A] dark:text-white text-base">{telemetry.wards_evaluated} / 67</strong>
              </div>

              <div className="p-3 bg-[#F8F9FA] dark:bg-slate-950 rounded-md border border-[#D1D5DB] dark:border-slate-800">
                <span className="text-[#475569] dark:text-slate-400 block font-medium">Zones Status Shift</span>
                <strong className="text-[#D97706] text-base">{telemetry.zones_changed} Wards</strong>
              </div>

              <div className="p-3 bg-[#F8F9FA] dark:bg-slate-950 rounded-md border border-[#D1D5DB] dark:border-slate-800">
                <span className="text-[#475569] dark:text-slate-400 block font-medium">Alerts Dispatched</span>
                <strong className="text-[#DC2626] text-base">{telemetry.notifications_triggered} Triggers</strong>
              </div>

              <div className="p-3 bg-[#F8F9FA] dark:bg-slate-950 rounded-md border border-[#D1D5DB] dark:border-slate-800">
                <span className="text-[#475569] dark:text-slate-400 block font-medium">Daemon State</span>
                <strong className="text-[#059669] text-base">HEALTHY</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: API & SERVICE HEALTH MATRIX */}
      {activeTab === 'HEALTH_MATRIX' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
              External & Internal Service Connectivity Matrix
            </h3>
            <span className="text-xs text-[#475569] dark:text-slate-400 font-medium">Live Probing</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicesHealth.map(service => (
              <div
                key={service.name}
                className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border border-[#D1D5DB] dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{service.name}</h4>
                  {getStatusBadge(service.status)}
                </div>

                <p className="text-xs text-[#475569] dark:text-slate-300 leading-normal min-h-[36px]">
                  {service.details}
                </p>

                <div className="pt-2 border-t border-[#D1D5DB] dark:border-slate-800 flex items-center justify-between text-[11px] text-[#475569] dark:text-slate-400 font-medium">
                  <span>Latency: <strong className="text-[#0F172A] dark:text-slate-300">{service.latency_ms}ms</strong></span>
                  <span>Checked: Just now</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USERS & GOVERNMENT OFFICIAL MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
              User Directory & Official Account Approvals
            </h3>
            <span className="text-xs text-[#475569] dark:text-slate-400 font-medium">{usersList.length} Accounts Registered</span>
          </div>

          <div className="overflow-x-auto bg-[#FFFFFF] dark:bg-slate-900 rounded-lg border border-[#D1D5DB] dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D1D5DB] dark:border-slate-800 text-[#475569] dark:text-slate-400 font-semibold bg-[#F8F9FA] dark:bg-slate-950">
                  <th className="p-3.5">Name / Email</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Department & Title</th>
                  <th className="p-3.5">Approval Status</th>
                  <th className="p-3.5">SMS Alerts</th>
                  <th className="p-3.5 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1D5DB]/60 dark:divide-slate-800/80">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-[#F8F9FA] dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <strong className="text-[#0F172A] dark:text-white block font-semibold">{u.name}</strong>
                      <span className="text-[#475569] dark:text-slate-400 text-[11px] font-medium">{u.email}</span>
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
                    <td className="p-3.5 text-[#0F172A] dark:text-slate-300 font-medium">
                      {u.department ? `${u.department} (${u.designation || 'Officer'})` : 'Citizen Account'}
                    </td>
                    <td className="p-3.5">
                      {u.official_status ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          u.official_status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                            : u.official_status === 'PENDING_APPROVAL'
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                            : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                        }`}>
                          {u.official_status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[11px] font-semibold ${u.notification_sms_enabled ? 'text-[#059669]' : 'text-slate-400'}`}>
                        {u.notification_sms_enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {u.role === 'GOVERNMENT_OFFICIAL' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {u.official_status !== 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateApproval(u.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-[#059669] hover:bg-[#047857] text-white rounded-md text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3 h-3" /> Approve
                            </button>
                          )}
                          {u.official_status !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleUpdateApproval(u.id, 'SUSPENDED')}
                              className="px-2.5 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-md text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
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

      {/* TAB 5: SECURITY AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
                Immutable Operational Event Logs
              </h3>
              <p className="text-xs text-[#475569] dark:text-slate-400 font-medium">
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
                className="w-full bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#D97706]"
              />
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg border border-[#D1D5DB] dark:border-slate-800 overflow-hidden divide-y divide-[#D1D5DB]/60 dark:divide-slate-800/80">
            {auditLogs
              .filter(l => !searchAudit.trim() || l.details.toLowerCase().includes(searchAudit.toLowerCase()) || l.action_type.toLowerCase().includes(searchAudit.toLowerCase()))
              .map(log => (
                <div key={log.id} className="p-4 hover:bg-[#F8F9FA] dark:hover:bg-slate-800/40 transition flex items-start gap-3">
                  <div className="p-1.5 bg-[#F8F9FA] dark:bg-slate-800 text-[#0F172A] dark:text-slate-300 rounded border border-[#D1D5DB] dark:border-slate-700 shrink-0 text-[10px] font-semibold">
                    {log.target_type}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs font-semibold text-[#0F172A] dark:text-white">
                        {log.action_type}
                      </strong>
                      <span className="text-[11px] text-[#475569] dark:text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] dark:text-slate-300 leading-normal">
                      {log.details}
                    </p>
                    <div className="text-[10px] text-[#475569] dark:text-slate-400 flex items-center gap-2 font-medium">
                      <span>Actor: <strong className="text-[#0F172A] dark:text-slate-300">{log.actor_name}</strong> ({log.actor_role})</span>
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
