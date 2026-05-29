import 'dart:async';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:get_it/get_it.dart';
import '../../../config/app_config.dart';
import '../../../core/network/websocket_client.dart';
import '../../../core/services/ussd_executor.dart';
import '../../../core/services/phone_monitor.dart';
import '../../../core/services/task_queue_manager.dart';
import '../../../theme.dart';

class ExecutorDashboard extends StatefulWidget {
  const ExecutorDashboard({super.key});

  @override
  State<ExecutorDashboard> createState() => _ExecutorDashboardState();
}

class _ExecutorDashboardState extends State<ExecutorDashboard>
    with TickerProviderStateMixin {
  final _ws = GetIt.instance<WebSocketService>();
  final _ussd = GetIt.instance<USSDExecutor>();
  final _phone = GetIt.instance<PhoneMonitor>();
  final _queue = GetIt.instance<TaskQueueManager>();
  late AnimationController _pulseCtrl;
  StreamSubscription<Map<String, dynamic>>? _wsSubscription;

  bool _accessOk = false;
  bool _callPhoneOk = false;

  @override
  void initState() {
    super.initState();
    _phone.addListener(_onPhoneChange);
    _phone.startMonitoring();
    _queue.addListener(_onQueueChange);
    _wsSubscription = _ws.commands.listen(_onTask);
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
    _checkAllPermissions();
    _ws.connect();
  }

  @override
  void dispose() {
    _phone.removeListener(_onPhoneChange);
    _pulseCtrl.dispose();
    _phone.stopMonitoring();
    super.dispose();
  }

  Future<void> _checkAllPermissions() async {
    _accessOk = await _ussd.checkAccessibility();
    _callPhoneOk = await _ussd.hasCallPhonePermission();
    if (!_callPhoneOk) {
      await _ussd.requestCallPhonePermission();
      _callPhoneOk = await _ussd.hasCallPhonePermission();
    }
    if (mounted) setState(() {});
  }

  void _onPhoneChange() {
    if (mounted) setState(() {});
    _ws.sendPhoneStatus(_phone.getStatus());
  }

  void _onQueueChange() {
    if (mounted) setState(() {});
  }

  Future<void> _onTask(Map<String, dynamic> cmd) async {
    await _queue.enqueue(cmd);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                physics: const BouncingScrollPhysics(),
                children: [
                  const SizedBox(height: 8),
                  _buildStatsCard(),
                  const SizedBox(height: 16),
                  _buildStatusCards(),
                  const SizedBox(height: 16),
                  _buildQueueInfo(),
                  const SizedBox(height: 16),
                  _buildActivityLog(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final on = _ws.isConnected;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF15152A), AppTheme.background],
          begin: Alignment.topCenter, end: Alignment.bottomCenter,
        ),
        border: Border(bottom: BorderSide(color: AppTheme.border.withValues(alpha: 0.5))),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _iconBox(
                PhosphorIcons.deviceMobile(PhosphorIconsStyle.bold),
                AppTheme.primaryGradient, 46,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text('Samsung Galaxy A14',
                            style: TextStyle(color: AppTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis),
                        ),
                        Container(
                          width: 8, height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: on ? AppTheme.success : AppTheme.error,
                            boxShadow: [
                              BoxShadow(
                                color: (on ? AppTheme.success : AppTheme.error).withValues(alpha: 0.4),
                                blurRadius: 4, spreadRadius: 1,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: Row(
                        key: ValueKey(_queue.currentStatus),
                        children: [
                          Icon(
                            _queue.isProcessing ? PhosphorIcons.circleNotch(PhosphorIconsStyle.bold)
                                : _queue.currentStatus.contains('Succ') ? PhosphorIcons.checkCircle(PhosphorIconsStyle.fill)
                                : _queue.currentStatus.contains('Échec') || _queue.currentStatus.contains('Erreur')
                                    ? PhosphorIcons.xCircle(PhosphorIconsStyle.fill)
                                    : PhosphorIcons.clock(PhosphorIconsStyle.fill),
                            size: 12,
                            color: _queue.isProcessing ? AppTheme.primary
                                : _queue.currentStatus.contains('Succ') ? AppTheme.success
                                : _queue.currentStatus.contains('Échec') || _queue.currentStatus.contains('Erreur')
                                    ? AppTheme.error
                                    : AppTheme.textTertiary,
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(_queue.currentStatus,
                              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                              overflow: TextOverflow.ellipsis),
                          ),
                          if (_queue.queueLength > 0) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.accent.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text('+${_queue.queueLength}',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.accent)),
                            ),
                          ],
                          const Spacer(),
                          GestureDetector(
                            onTap: () {
                              GetIt.instance<WebSocketService>().disconnect();
                              final config = GetIt.instance<AppConfig>();
                              config.phoneToken = '';
                              config.phoneName = '';
                              Navigator.pushReplacementNamed(context, '/setup');
                            },
                            child: Icon(PhosphorIcons.signOut(PhosphorIconsStyle.bold),
                                color: AppTheme.error.withValues(alpha: 0.6), size: 14),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              AnimatedBuilder(
                animation: _pulseCtrl,
                builder: (_, __) => Container(
                  width: 12, height: 12,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _queue.isProcessing ? AppTheme.accent
                        : on ? AppTheme.success : AppTheme.error,
                    boxShadow: [
                      BoxShadow(
                        color: (_queue.isProcessing ? AppTheme.accent : on ? AppTheme.success : AppTheme.error)
                            .withValues(alpha: 0.5),
                        blurRadius: 8,
                        spreadRadius: _pulseCtrl.value * 3,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () => _ussd.openAccessibilitySettings(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                gradient: AppTheme.surfaceGradient,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: (_accessOk ? AppTheme.success : AppTheme.error).withValues(alpha: 0.15),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: (_accessOk ? AppTheme.success : AppTheme.error).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _accessOk ? PhosphorIcons.sealCheck(PhosphorIconsStyle.fill)
                          : PhosphorIcons.warningCircle(PhosphorIconsStyle.fill),
                      color: _accessOk ? AppTheme.success : AppTheme.error,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _accessOk ? 'Accessibilité activée' : 'Activer l\'accessibilité',
                      style: TextStyle(
                        color: _accessOk ? AppTheme.success : AppTheme.error,
                        fontSize: 13, fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Icon(PhosphorIcons.caretRight(PhosphorIconsStyle.bold),
                      color: AppTheme.textTertiary, size: 16),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              gradient: AppTheme.surfaceGradient,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: (_callPhoneOk ? AppTheme.success : AppTheme.warning).withValues(alpha: 0.15),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: (_callPhoneOk ? AppTheme.success : AppTheme.warning).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _callPhoneOk ? PhosphorIcons.sealCheck(PhosphorIconsStyle.fill)
                        : PhosphorIcons.warningCircle(PhosphorIconsStyle.fill),
                    color: _callPhoneOk ? AppTheme.success : AppTheme.warning,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _callPhoneOk ? 'Permission appel OK' : 'Permission appel requise',
                    style: TextStyle(
                      color: _callPhoneOk ? AppTheme.success : AppTheme.warning,
                      fontSize: 13, fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppTheme.surfaceGradient,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              _iconBox(PhosphorIcons.chartBar(PhosphorIconsStyle.bold),
                  AppTheme.surfaceGradient, 26),
              const SizedBox(width: 10),
              Text('ACTIVITÉ', style: TextStyle(
                  color: AppTheme.textTertiary, fontSize: 11,
                  fontWeight: FontWeight.w600, letterSpacing: 1.5)),
              const Spacer(),
              if (_queue.isProcessing)
                SizedBox(
                  width: 16, height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppTheme.primary.withValues(alpha: 0.8),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(child: _StatItem(
                label: 'Succès', value: _queue.successCount.toString(),
                color: AppTheme.success,
                icon: PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
                pulseCtrl: _pulseCtrl,
              )),
              Container(width: 1, height: 48,
                  color: AppTheme.border.withValues(alpha: 0.5)),
              Expanded(child: _StatItem(
                label: 'Échecs', value: _queue.failCount.toString(),
                color: AppTheme.error,
                icon: PhosphorIcons.xCircle(PhosphorIconsStyle.fill),
                pulseCtrl: _pulseCtrl,
              )),
              Container(width: 1, height: 48,
                  color: AppTheme.border.withValues(alpha: 0.5)),
              Expanded(child: _StatItem(
                label: 'Total', value: _queue.totalCount.toString(),
                color: AppTheme.primary,
                icon: PhosphorIcons.clock(PhosphorIconsStyle.fill),
                pulseCtrl: _pulseCtrl,
              )),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCards() {
    final lvl = _phone.batteryLevel.round();
    final batColor = lvl > 50 ? AppTheme.success
        : lvl > 20 ? AppTheme.warning : AppTheme.error;
    return Row(
      children: [
        Expanded(
          child: _MiniCard(
            icon: PhosphorIcons.batteryVerticalHigh(PhosphorIconsStyle.fill),
            iconColor: batColor,
            label: 'Batterie',
            value: '$lvl%',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _MiniCard(
            icon: _ws.isConnected
                ? PhosphorIcons.wifiHigh(PhosphorIconsStyle.fill)
                : PhosphorIcons.wifiX(PhosphorIconsStyle.fill),
            iconColor: _ws.isConnected ? AppTheme.success : AppTheme.error,
            label: 'WebSocket',
            value: _ws.isConnected ? 'Connecté' : 'Déconnecté',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _MiniCard(
            icon: _accessOk
                ? PhosphorIcons.sealCheck(PhosphorIconsStyle.fill)
                : PhosphorIcons.warning(PhosphorIconsStyle.fill),
            iconColor: _accessOk ? AppTheme.success : AppTheme.error,
            label: 'Accessibilité',
            value: _accessOk ? 'Active' : 'Inactive',
          ),
        ),
      ],
    );
  }

  Widget _buildQueueInfo() {
    if (_queue.queueLength == 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.surfaceGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.accent.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(PhosphorIcons.queue(PhosphorIconsStyle.fill),
              color: AppTheme.accent, size: 20),
          const SizedBox(width: 12),
          Text('${_queue.queueLength} tâche(s) en attente',
              style: TextStyle(color: AppTheme.textPrimary, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildActivityLog() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.surfaceGradient,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _iconBox(PhosphorIcons.listBullets(PhosphorIconsStyle.bold),
                  AppTheme.surfaceGradient, 26),
              const SizedBox(width: 10),
              Text('HISTORIQUE', style: TextStyle(
                  color: AppTheme.textTertiary, fontSize: 11,
                  fontWeight: FontWeight.w600, letterSpacing: 1.5)),
              const Spacer(),
              if (_queue.taskLogs.isNotEmpty)
                GestureDetector(
                  onTap: () => _queue.clearLogs(),
                  child: Text('Tout effacer', style: TextStyle(
                      color: AppTheme.primary.withValues(alpha: 0.7),
                      fontSize: 11, fontWeight: FontWeight.w500)),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (_queue.taskLogs.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 32),
              width: double.infinity,
              child: Column(
                children: [
                  Icon(PhosphorIcons.clockCountdown(PhosphorIconsStyle.light),
                      size: 40, color: AppTheme.textTertiary),
                  const SizedBox(height: 12),
                  Text('Aucune tâche pour le moment',
                      style: TextStyle(color: AppTheme.textTertiary, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text('Les tâches exécutées apparaîtront ici',
                      style: TextStyle(color: AppTheme.textTertiary.withValues(alpha: 0.6), fontSize: 11)),
                ],
              ),
            )
          else
            ..._queue.taskLogs.map((log) => Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: AppTheme.border.withValues(alpha: 0.3),
                    width: 0.5,
                  ),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: (log['success'] == true ? AppTheme.success : AppTheme.error)
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      log['success'] == true
                          ? PhosphorIcons.check(PhosphorIconsStyle.bold)
                          : PhosphorIcons.x(PhosphorIconsStyle.bold),
                      color: log['success'] == true ? AppTheme.success : AppTheme.error,
                      size: 14,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Tâche #${log['id']}',
                            style: const TextStyle(
                                color: AppTheme.textPrimary, fontSize: 13,
                                fontWeight: FontWeight.w500)),
                        const SizedBox(height: 2),
                        Text(log['message'] ?? '',
                            style: TextStyle(
                                color: AppTheme.textSecondary.withValues(alpha: 0.7), fontSize: 11),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  Text(_formatTime(log['timestamp']),
                      style: TextStyle(
                          color: AppTheme.textTertiary, fontSize: 11)),
                ],
              ),
            )),
        ],
      ),
    );
  }

  String _formatTime(String? timestamp) {
    if (timestamp == null) return '';
    try {
      final dt = DateTime.parse(timestamp);
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inSeconds < 60) return 'À l\'instant';
      if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes}min';
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }
}

Widget _iconBox(IconData icon, Gradient gradient, double size) {
  return Container(
    width: size, height: size,
    decoration: BoxDecoration(
      gradient: gradient,
      borderRadius: BorderRadius.circular(size * 0.3),
      boxShadow: [
        BoxShadow(
          color: AppTheme.primary.withValues(alpha: 0.3),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ],
    ),
    child: Icon(icon, color: Colors.white, size: size * 0.48),
  );
}

class _StatItem extends StatelessWidget {
  final String label, value;
  final Color color;
  final IconData icon;
  final Animation<double>? pulseCtrl;

  const _StatItem({
    required this.label, required this.value,
    required this.color, required this.icon, this.pulseCtrl,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 8),
        TweenAnimationBuilder<int>(
          tween: IntTween(begin: 0, end: int.tryParse(value) ?? 0),
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeOutCubic,
          builder: (_, v, __) => Text('$v',
              style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.w800)),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(
            color: AppTheme.textTertiary, fontSize: 11)),
      ],
    );
  }
}

class _MiniCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label, value;

  const _MiniCard({
    required this.icon, required this.iconColor,
    required this.label, required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.surfaceGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border.withValues(alpha: 0.5)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(height: 10),
          Text(value, style: TextStyle(
              color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(
              color: AppTheme.textTertiary, fontSize: 10)),
        ],
      ),
    );
  }
}
