# Guide complet : Transformer un PC Parrot OS en téléphone GSM (SMS, USSD, Double SIM, Box, Samsung)

## Table des matières
1. [Principe général](#principe-général)
2. [Option A – Utiliser une clé USB 4G (dongle)](#option-a--utiliser-une-clé-usb-4g-dongle)
3. [Option B – Utiliser un smartphone Samsung Double SIM comme modem permanent](#option-b--utiliser-un-smartphone-samsung-double-sim-avec-écran-verrouillé)
4. [Logiciels : installation et configuration de Gammu](#logiciels--installation-et-configuration-de-gammu)
5. [Commandes essentielles : SMS et USSD](#commandes-essentielles--sms-et-ussd)
6. [Automatisation : réception, transfert, déclenchement](#automatisation--réception-transfert-déclenchement)
7. [Option C – Passer par une box 4G (routeur)](#option-c--passer-par-une-box-4g-routeur)
8. [Dépannage rapide](#dépannage-rapide)

---

## Principe général
Un PC ne possède pas de modem cellulaire ni de slot SIM. On ajoute cette capacité via un *périphérique externe* (dongle USB, smartphone en mode modem, box 4G).  
Le logiciel *Gammu* (ou *ModemManager*) envoie des commandes AT au modem pour envoyer/recevoir des SMS, exécuter des codes USSD, etc.  
Sous Linux (Parrot), ces outils sont gratuits et très fiables.

---

## Option A – Utiliser une clé USB 4G (dongle)

### Matériel
- Clé 4G *débloquée* (non verrouillée opérateur) avec slot SIM.
- Exemples : Huawei E3372, E3531, Alcatel IK41, ZTE MF833.

### Mise en place
1. *Branche* la clé.
2. Vérifie la détection :
   ```bash
   lsusb
   sudo gammu-detect
   ```
   Si elle est en mode stockage (« CD virtuel »), usb-modeswitch la basculera automatiquement.
3. Passe directement à la section Logiciels pour installer Gammu et l'utiliser.

> *Avantage* : solution simple, discrète, pas de téléphone dédié.

---

## Option B – Utiliser un smartphone Samsung Double SIM avec écran verrouillé

Cette méthode transforme un Samsung en modem toujours allumé, même écran verrouillé.

### Prérequis importants
- *Câble USB* capable de données + alimentation continue (charge permanente).
- *Désactiver le code PIN* des deux cartes SIM (Paramètres → Verrouillage carte SIM → Désactiver).
- Activer le mode modem exposant les ports série (une seule fois).

### Étape 1 : Activation du mode DM + MODEM + ADB
1. Déverrouille l'écran.
2. Ouvre l'app Téléphone et tape **#0808#** (ou *#9090# selon modèle).
3. Dans le menu *USB Settings*, sélectionne :
   ```
   DM + MODEM + ADB
   ```
   Valide. Ce réglage persiste après redémarrage.
4. Si *#0808# ne marche pas, active d'abord **Débogage USB** (Options développeur) et recherche le code spécifique à ton modèle (par exemple *#7284#).

### Étape 2 : Branchement et vérification
- Connecte le Samsung à ton PC.
- Sous Parrot, ouvre un terminal et liste les ports série :
   ```bash
   ls /dev/ttyUSB*
   ```
   Tu obtiens des périphériques comme :
   ```
   /dev/ttyUSB0   # port diagnostic
   /dev/ttyUSB1   # modem SIM 1 (commandes AT)
   /dev/ttyUSB2   # modem SIM 2 (double SIM)
   ```
- Si tu n'as qu'un seul /dev/ttyUSB1, le modem gère les deux SIM via la même interface (on basculera par commande AT).

### Étape 3 : Paramètres de veille
Pour éviter que le Samsung coupe l'USB en sommeil, active (écran déverrouillé, une fois) :
- *Paramètres → Options développeur → Ne pas mettre en veille (lorsque l'appareil est en charge)*.
Une fois ce réglage fait, tu peux verrouiller l'écran, le modem reste accessible.

### Étape 4 : Tests
Depuis le PC, avec Gammu installé, teste la communication sur le port modem (par exemple /dev/ttyUSB1) :
```bash
gammu identify
gammu networkinfo
```
Pour la deuxième SIM, change le port vers /dev/ttyUSB2 ou utilise AT+CSIM pour sélectionner le slot.

---

## Logiciels : installation et configuration de Gammu

### Installation
```bash
sudo apt update
sudo apt install gammu gammu-smsd usb-modeswitch modemmanager
```

### Configuration
Lance l'outil de configuration interactif :
```bash
gammu-config
```
Renseigne :
- *Port* : /dev/ttyUSB1 (ou celui trouvé, ou /tmp/modem pour box)
- *Connection* : at
- Sauvegarde.

Teste la communication :
```bash
gammu identify
```

Tu dois voir le nom du modem et sa version.

### Configuration du démon SMS (optionnel)
Pour stocker et traiter les SMS automatiquement, crée le fichier /etc/gammu-smsdrc :
```ini
[smsd]
PIN = 0000
device = /dev/ttyUSB1
connection = at
logfile = /var/log/gammu-smsd
Service = FILES
InboxPath = /var/spool/gammu/inbox/
OutboxPath = /var/spool/gammu/outbox/
SentSMSPath = /var/spool/gammu/sent/
```

Démarre le service :
```bash
sudo systemctl restart gammu-smsd
```

---

## Commandes essentielles : SMS et USSD

### Envoyer un SMS
```bash
echo "Contenu du message" | gammu sendsms TEXT 0601020304
```

### Recevoir / lire les SMS
```bash
gammu getallsms
gammu getsms INBOX 1
```

### Envoyer un code USSD
```bash
gammu getussd "*124#"
```

Pour une réponse interactive (menu) :
```bash
gammu sendussd "1"
```

### Commandes AT directes (dépannage)
Se connecter au port série avec minicom ou screen :
```bash
screen /dev/ttyUSB1 115200
```
Envoyer une commande AT :
```
AT+CMGF=1
AT+CMGS="+336..."
> message tapé, puis Ctrl+Z pour envoyer
```

---

## Automatisation : réception, transfert, déclenchement

Avec gammu-smsd, chaque SMS reçu devient un fichier dans /var/spool/gammu/inbox/. Tu peux créer un script (Bash, Python) qui surveille ces fichiers et :
- Affiche une notification Bureau :
  ```bash
  notify-send "Nouveau SMS" "$(cat fichier.txt)"
  ```
- Transfère le message par Telegram (via bot API), email, ou XMPP.
- Déclenche une commande système.

---

## Option C – Passer par une box 4G (routeur)

### Ce qu'il faut vérifier
- La box doit avoir un slot SIM et ne pas être bridée par l'opérateur.
- Le modèle doit exposer les commandes AT via telnet/SSH ou une API.

### Procédure générique
1. Trouve l'IP de la box (ex. 192.168.1.1).
2. Teste un accès telnet :
   ```bash
   telnet 192.168.1.1
   ```
   Si tu obtiens un prompt, tape AT et vois si ça répond OK.
3. Si c'est un port spécifique (ex. Huawei utilisant le 5555) :
   ```bash
   echo "AT" | nc 192.168.1.1 5555
   ```
4. Si l'accès est possible, crée un pont réseau vers un pseudo-terminal pour Gammu :
   ```bash
   socat pty,link=/tmp/modem,raw tcp:192.168.1.1:23 &
   ```
   Puis configure Gammu sur le port /tmp/modem (connexion at).

---

## Dépannage rapide

| Problème | Solution |
|----------|----------|
| Gammu ne détecte pas le modem | Vérifie le port série (ls /dev/ttyUSB*). Essaie un autre port. Vérifie que le PIN SIM est désactivé. |
| Le modem ne répond qu'une fois puis plus rien | Le port peut être en mode diagnostic (/dev/ttyUSB0), essaie le port modem (ttyUSB1). |
| #0808# ne fonctionne pas sur le Samsung | Cherche sur internet [modèle] enable diag mode, essaie *#7284# ou utilise l'appli Phone INFO Samsung. |
| Écran verrouillé mais le port USB disparaît après quelques minutes | Active « Ne pas mettre en veille » dans les options développeur, et vérifie le câble / alimentation. |
| Deuxième SIM non visible | Si un seul /dev/ttyUSB1 est présent, il faut basculer la SIM active avec une commande AT spécifique. |
| Box : telnet refuse la connexion | Vérifie si la box a une option « autoriser l'accès aux commandes AT » dans l'interface web. |

---

## En résumé
- *Clé USB 4G débloquée* : le plus simple, plug-and-play.
- *Samsung Double SIM en mode DM+MODEM+ADB* : fonctionne écran verrouillé, code PIN désactivé, deux SIMs accessibles via Gammu. Idéal pour un serveur GSM permanent.
- *Box 4G* : uniquement si l'accès AT est déverrouillé ; utilise socat pour relier Gammu.

Avec Gammu, tu peux *envoyer/recevoir des SMS, exécuter des USSD* et même interagir avec des menus (Orange Money, MTN Mobile Money). Le tout automatisable depuis ton Parrot OS.
