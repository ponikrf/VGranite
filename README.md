
![Logo](./logo.png)

VGgranite
---------

Simple application for creating Socket -> Serial tunnels. The application has a web control interface.

Main features:

 - Adding Socket Servers
 - Adding Socket clients
 - Add serial ports
 - Create tunnels between ports

The application monitors the possibility of creating a server or opening a serial port. If, for example, a USB to serial converter has been reconnected, the application automatically re-opens the serial port.

**Required** nodejs > 16v or bun latest version

OS Support:
 
 - Windows
 - Mac OS
 - Linux 
 - Android (termux)

INSTALL
=======

First, download [latest release](https://github.com/ponikrf/VGranite/releases)

Unzip it preferably to `/opt/vgranite`.

```bash
cd /opt/vgranite
npm install --only=production
```

Unfortunately, even though this is a release, I can't put all `npm` dependencies in `node_modules` together with the release. This feature is related to the `serialport` package.

Run:

```bash
npm run start
```

By default, two WEB servers are used:

 - **http://host:4000** - Web interface - login data - Login:`admin` Password:`admin`
 - **http://host:3999** - API doc


The structure of the service and all settings can be seen in the file `./devices/vgranite/service.json`. It is intuitive there, the parameters that need to be changed to change ports and basic settings.

BUILD
=====

Для сборки, нам необходимо склонировать репозиторий:

```bash
cd /opt/
git clone https://github.com/ponikrf/VGranite.git
```

Добавляем зависимости:

```bash
npm install
```

Основное приложение будет готово. Но оно не будет иметь документации и веб интерфейса.

