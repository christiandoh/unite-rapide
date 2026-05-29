import 'dart:async';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:get_it/get_it.dart';
import '../../core/services/ussd_executor.dart';
import '../../theme.dart';

class PermissionsScreen extends StatefulWidget {
  const PermissionsScreen({super.key});

  @override
  State<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends State<PermissionsScreen> with TickerProviderStateMixin {
  final _ussd = GetIt.instance<USSDExecutor>();
  bool _accessOk = false;
  bool _callPhoneOk = false;
  bool _notificationOk = false;
  late AnimationController _pulseCtrl;

  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
    _checkAll();
    _pollTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      if (!_accessOk) _checkAll();
    });
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkAll() async {
    _accessOk = await _ussd.checkAccessibility();
    _callPhoneOk = await _ussd.hasCallPhonePermission();
    _notificationOk = await _ussd.hasNotificationPermission();
    if (mounted) setState(() {});
  }

  Future<void> _requestCallPhone() async {
    _callPhoneOk = await _ussd.requestCallPhonePermission();
    if (mounted) setState(() {});
  }

  Future<void> _requestNotification() async {
    _notificationOk = await _ussd.requestNotificationPermission();
    if (mounted) setState(() {});
  }

  Future<void> _openAccessibility() async {
    await _ussd.openAccessibilitySettings();
  }

  Future<void> _verifyAccessibility() async {
    _accessOk = await _ussd.waitForAccessibility();
    if (!_accessOk) {
      _accessOk = await _ussd.checkAccessibility();
    }
    if (mounted) setState(() {});
  }

  void _continue() {
    if (mounted) Navigator.pushReplacementNamed(context, '/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    final allOk = _callPhoneOk && _accessOk;
    return Scaffold(
      body: Container(
        width: double.infinity, height: double.infinity,
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0.2, -0.3), radius: 2.0,
            colors: [Color(0xFF1A1A30), Color(0xFF0A0A15), Color(0xFF08080F)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 20),
                Container(
                  width: 72, height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppTheme.primaryGradient,
                    boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.4), blurRadius: 30, spreadRadius: 4)],
                  ),
                  child: Icon(PhosphorIcons.shieldCheck(PhosphorIconsStyle.fill), color: Colors.white, size: 34),
                ),
                const SizedBox(height: 20),
                const Text('Configuration requise', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 6),
                Text('Activez les permissions necessaires au fonctionnement',
                  style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
                  textAlign: TextAlign.center),
                const SizedBox(height: 32),

                _PermissionTile(
                  icon: PhosphorIcons.wheelchair(PhosphorIconsStyle.bold),
                  title: 'Service d\'accessibilite',
                  desc: 'Permet d\'executer les codes USSD automatiquement',
                  ok: _accessOk,
                  actionLabel: 'Configurer',
                  onAction: _openAccessibility,
                  onVerify: _verifyAccessibility,
                  pulse: _pulseCtrl,
                ),
                const SizedBox(height: 12),
                _PermissionTile(
                  icon: PhosphorIcons.phoneCall(PhosphorIconsStyle.bold),
                  title: 'Permission appel',
                  desc: 'Necessaire pour composer les codes USSD',
                  ok: _callPhoneOk,
                  actionLabel: 'Autoriser',
                  onAction: _requestCallPhone,
                  pulse: _pulseCtrl,
                ),
                const SizedBox(height: 12),
                _PermissionTile(
                  icon: PhosphorIcons.bell(PhosphorIconsStyle.bold),
                  title: 'Notifications',
                  desc: 'Pour suivre l\'etat des executions',
                  ok: _notificationOk,
                  actionLabel: 'Autoriser',
                  onAction: _requestNotification,
                  pulse: _pulseCtrl,
                ),

                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity, height: 52,
                  child: ElevatedButton(
                    onPressed: allOk ? _continue : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.white.withValues(alpha: 0.08),
                      disabledForegroundColor: AppTheme.textTertiary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(allOk ? PhosphorIcons.checkCircle(PhosphorIconsStyle.fill) : PhosphorIcons.lock(PhosphorIconsStyle.bold), size: 20),
                        const SizedBox(width: 10),
                        Text(allOk ? 'Acceder au tableau de bord' : 'Completez les etapes ci-dessus',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
                if (!allOk)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: TextButton(
                      onPressed: _continue,
                      child: Text('Passer pour le moment',
                        style: TextStyle(fontSize: 13, color: AppTheme.textTertiary, decoration: TextDecoration.underline)),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PermissionTile extends StatefulWidget {
  final IconData icon;
  final String title, desc;
  final bool ok;
  final String actionLabel;
  final VoidCallback onAction;
  final VoidCallback? onVerify;
  final Animation<double> pulse;

  const _PermissionTile({
    required this.icon, required this.title, required this.desc,
    required this.ok, required this.actionLabel, required this.onAction,
    this.onVerify, required this.pulse,
  });

  @override
  State<_PermissionTile> createState() => _PermissionTileState();
}

class _PermissionTileState extends State<_PermissionTile> {
  bool _verifying = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.surfaceGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: widget.ok
              ? AppTheme.success.withValues(alpha: 0.2)
              : AppTheme.border.withValues(alpha: 0.5),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: widget.ok
                  ? AppTheme.success.withValues(alpha: 0.12)
                  : Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              widget.ok ? PhosphorIcons.sealCheck(PhosphorIconsStyle.fill) : widget.icon,
              color: widget.ok ? AppTheme.success : AppTheme.textSecondary,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.title,
                  style: TextStyle(
                    color: widget.ok ? AppTheme.success : Colors.white,
                    fontSize: 15, fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(widget.desc,
                  style: TextStyle(fontSize: 12, color: AppTheme.textTertiary)),
              ],
            ),
          ),
          if (widget.ok)
            AnimatedBuilder(
              animation: widget.pulse,
              builder: (_, __) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.success.withValues(alpha: 0.1 + widget.pulse.value * 0.08),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('Actif', style: TextStyle(fontSize: 11, color: AppTheme.success, fontWeight: FontWeight.w600)),
              ),
            )
          else
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 34,
                  child: ElevatedButton(
                    onPressed: _verifying ? null : () async {
                      _verifying = true;
                      if (mounted) setState(() {});
                      widget.onAction();
                      if (widget.onVerify != null) {
                        await Future.delayed(const Duration(seconds: 2));
                        widget.onVerify!();
                      }
                      _verifying = false;
                      if (mounted) setState(() {});
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                    ),
                    child: _verifying
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(widget.actionLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
