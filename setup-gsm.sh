#!/bin/bash
# Script d'installation et configuration GSM pour Unite Rapide
# Execute ce script APRES avoir branche le modem USB

set -e

echo "=== Detection du modem GSM ==="
echo ""
echo "Ports serie detectes:"
ls -la /dev/ttyUSB* /dev/ttyACM* 2>/dev/null || echo "  Aucun port GSM detecte"
echo ""

# Scanner les ports
for port in /dev/ttyUSB0 /dev/ttyUSB1 /dev/ttyUSB2 /dev/ttyACM0 /dev/ttyACM1; do
  if [ -e "$port" ]; then
    echo "Test de $port..."
    RESULT=$(echo "AT" | timeout 3 microcom -t 1000 "$port" 2>/dev/null || true)
    if echo "$RESULT" | grep -q "OK"; then
      echo "  ✅ MODEM TROUVE sur $port"
      MODEM_PORT="$port"
      break
    fi
  fi
done

if [ -z "$MODEM_PORT" ]; then
  echo ""
  echo "❌ Aucun modem GSM detecte."
  echo ""
  echo "Verifie :"
  echo "  1. Le modem est branche en USB"
  echo "  2. Le mode stockage est desactive (usb-modeswitch)"
  echo "  3. La SIM n'a pas de code PIN"
  echo ""
  echo "Pour forcer la detection :"
  echo "  sudo usb_modeswitch -v 12d1 -p 1f01 -M '55534243123456780000000000000...'"
  exit 1
fi

echo ""
echo "=== Configuration Gammu ==="

# Creer le fichier de config gammu
cat > /home/nundo/.gammurc << EOF
[gammu]
device = $MODEM_PORT
connection = at
synchronizetime = no
logfile = /var/log/gammu.log
logformat = textalldates
EOF

# Creer la config systeme
sudo tee /etc/gammu-smsdrc > /dev/null << EOF
[smsd]
PIN = 0000
device = $MODEM_PORT
connection = at
logfile = /var/log/gammu-smsd.log
Service = FILES
InboxPath = /var/spool/gammu/inbox/
OutboxPath = /var/spool/gammu/outbox/
SentSMSPath = /var/spool/gammu/sent/
ErrorSMSPath = /var/spool/gammu/error/
EOF

# Creer les dossiers
sudo mkdir -p /var/spool/gammu/{inbox,outbox,sent,error}
sudo chmod -R 777 /var/spool/gammu

echo ""
echo "=== Test de communication ==="
gammu identify 2>&1

echo ""
echo "=== Test USSD ==="
gammu getussd "#124#" 2>&1 || echo "  (le test USSD peut echouer selon l'operateur)"

echo ""
echo "=== Activation du service SMS ==="
sudo systemctl restart gammu-smsd
sudo systemctl enable gammu-smsd
sudo systemctl status gammu-smsd --no-pager | head -5

echo ""
echo "✅ Configuration GSM terminee !"
echo "Modem: $MODEM_PORT"
echo ""
echo "Pour envoyer un USSD depuis le dashboard :"
echo "  http://192.168.1.38/admin/ → onglet GSM Modem"
echo ""
echo "Pour tester en ligne de commande :"
echo "  gammu getussd \"#144#\""
echo "  gammu sendsms TEXT 0700000000 -text \"Message test\""
