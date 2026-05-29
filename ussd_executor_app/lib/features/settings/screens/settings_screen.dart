import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:get_it/get_it.dart';
import '../../../config/app_config.dart';
import '../../../core/network/websocket_client.dart';
import '../../../core/services/ussd_executor.dart';
import '../../../theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _ussd = GetIt.instance<USSDExecutor>();

  void _deconnexion() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Deconnexion', style: TextStyle(color: Colors.white)),
        content: const Text('Voulez-vous vraiment vous deconnecter ?', style: TextStyle(color: AppTheme.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler', style: TextStyle(color: AppTheme.textSecondary))),
          TextButton(onPressed: () {
            Navigator.pop(ctx);
            GetIt.instance<WebSocketService>().disconnect();
            final config = GetIt.instance<AppConfig>();
            config.phoneToken = '';
            config.phoneName = '';
            Navigator.pushReplacementNamed(context, '/setup');
          }, child: const Text('Deconnecter', style: TextStyle(color: AppTheme.error))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                physics: const BouncingScrollPhysics(),
                children: [
                  const SizedBox(height: 8),
                  _buildSection('Connexion', [
                    _SettingTile(
                      icon: PhosphorIcons.plugs(PhosphorIconsStyle.bold),
                      iconColor: AppTheme.primary,
                      title: 'Serveur',
                      subtitle: '192.168.1.2:8080',
                      onTap: () {},
                    ),
                    _SettingTile(
                      icon: PhosphorIcons.key(PhosphorIconsStyle.bold),
                      iconColor: AppTheme.accent,
                      title: 'Token d\'authentification',
                      subtitle: '••••••••••••••••',
                      onTap: () {},
                    ),
                  ]),
                  const SizedBox(height: 12),
                  _buildSection('Téléphone', [
                    _SettingTile(
                      icon: PhosphorIcons.deviceMobile(PhosphorIconsStyle.bold),
                      iconColor: AppTheme.secondary,
                      title: 'Nom de l\'appareil',
                      subtitle: 'Samsung Galaxy A14',
                      onTap: () {},
                    ),
                    _SettingTile(
                      icon: PhosphorIcons.identificationBadge(PhosphorIconsStyle.bold),
                      iconColor: AppTheme.primary,
                      title: 'Opérateur',
                      subtitle: 'Orange CI',
                      onTap: () {},
                    ),
                  ]),
                  const SizedBox(height: 12),
                  _buildSection('Service', [
                    _SettingTile(
                      icon: PhosphorIcons.wheelchair(PhosphorIconsStyle.bold),
                      iconColor: AppTheme.success,
                      title: 'Accessibilité',
                      subtitle: 'Vérifier le statut',
                      trailing: Icon(PhosphorIcons.caretRight(PhosphorIconsStyle.bold),
                          color: AppTheme.textTertiary, size: 18),
                      onTap: () {
                        _ussd.openAccessibilitySettings();
                      },
                    ),
                    _SettingTile(
                      icon: PhosphorIcons.shieldCheck(PhosphorIconsStyle.bold),
                      iconColor: AppTheme.accent,
                      title: 'Vérifier l\'accessibilité',
                      subtitle: 'Tester la configuration',
                      onTap: () async {
                        final ok = await _ussd.checkAccessibility();
                        if (!context.mounted) return;
                        _showAccessibilityDialog(ok);
                      },
                    ),
                  ]),
                  const SizedBox(height: 12),
                  _buildSection('À propos', [
                    _SettingTile(
                      icon: PhosphorIcons.info(PhosphorIconsStyle.bold),
                      iconColor: AppTheme.textTertiary,
                      title: 'Version',
                      subtitle: '1.0.0',
                    ),
                    _SettingTile(
                      icon: PhosphorIcons.code(PhosphorIconsStyle.bold),
                      iconColor: AppTheme.textTertiary,
                      title: 'Framework',
                      subtitle: 'Flutter 3.2+',
                    ),
                  ]),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _deconnexion,
                      icon: Icon(PhosphorIcons.signOut(PhosphorIconsStyle.bold), size: 18),
                      label: const Text('Se deconnecter'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.error.withValues(alpha: 0.1),
                        foregroundColor: AppTheme.error,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _iconBox(
                PhosphorIcons.gearSix(PhosphorIconsStyle.bold),
                AppTheme.primaryGradient, 46,
              ),
              const SizedBox(width: 14),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Paramètres',
                      style: TextStyle(color: AppTheme.textPrimary, fontSize: 22, fontWeight: FontWeight.w700)),
                  SizedBox(height: 4),
                  Text('Configuration de l\'exécuteur',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(title.toUpperCase(),
              style: const TextStyle(
                  color: AppTheme.textTertiary, fontSize: 11,
                  fontWeight: FontWeight.w600, letterSpacing: 1.5)),
        ),
        Container(
          decoration: BoxDecoration(
            gradient: AppTheme.surfaceGradient,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border.withValues(alpha: 0.5)),
          ),
          child: Column(
            children: items.asMap().entries.map((e) {
              final idx = e.key;
              final item = e.value;
              return Column(
                children: [
                  if (idx > 0)
                    Divider(
                      height: 0, thickness: 0.5,
                      indent: 56,
                      color: AppTheme.border.withValues(alpha: 0.3),
                    ),
                  item,
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  void _showAccessibilityDialog(bool ok) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: AppTheme.textTertiary.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (ok ? AppTheme.success : AppTheme.error).withValues(alpha: 0.1),
              ),
              child: Icon(
                ok
                    ? PhosphorIcons.checkCircle(PhosphorIconsStyle.fill)
                    : PhosphorIcons.xCircle(PhosphorIconsStyle.fill),
                color: ok ? AppTheme.success : AppTheme.error,
                size: 56,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              ok ? 'Service actif' : 'Service inactif',
              style: const TextStyle(
                  color: AppTheme.textPrimary, fontSize: 20, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              ok
                  ? 'Le service d\'accessibilité est correctement configuré.\nL\'exécuteur peut recevoir des tâches.'
                  : 'Activez le service d\'accessibilité dans les paramètres Android\npour permettre l\'exécution des codes USSD.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: AppTheme.textSecondary.withValues(alpha: 0.8), fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: ok ? AppTheme.primary : AppTheme.error,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 0,
                ),
                child: Text('Fermer',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
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
    child: Icon(icon, color: Colors.white, size: size * 0.45),
  );
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _SettingTile({
    required this.icon, required this.iconColor,
    required this.title, required this.subtitle,
    this.trailing, this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            color: AppTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 2),
                    Text(subtitle,
                        style: TextStyle(
                            color: AppTheme.textSecondary.withValues(alpha: 0.7), fontSize: 12)),
                  ],
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
        ),
      ),
    );
  }
}
