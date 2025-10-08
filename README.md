
![Logo](./logo.png)

----------

Репозиторий [переехал](https://github.com/VRack2/VGranite). Теперь проект является частью системы [VRack2](https://github.com/VRack2/vrack2). Вы можете продолжать пользоваться этой версией, она легко ставится и уже прошла боевые тесты.

Имеет на данный момент 2 известные проблемы

1. **Permission denied: '/dev/ttyUSB0'** - Возможно, попробуйте использовать команду `sudo chmod a+rw /dev/ttyUSB0`
2. Иногда при добавлении соединения происходит ошибка и разлогинивание, но потом все работает хорошо. Пока не смог исправить причину - не могу ее воспроизвести.

----------

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

LAST UPDATE 1.1.0
=================
 - Add markers for all elements. See option `markers` in `./devices/vgranite/service.json`
 - Add setting **Except request** for serial. Except request from response
 - Add setting **Delay Data** for serial. Delay sending data after the first response while waiting for the rest of the response
 - Add setting **Delay Timeout** for serial. Response delay timeout 

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


AUTOSTART
==========

There is a service file for autorun in ubuntu. Copy it:

```bash
cp /opt/vgranite/vgranite.service /etc/systemd/system/
```

Naturally, at your own risk, since the service is launched from root.

Updating the services daemon:

```bash
systemctl daemon-reload
systemctl enable vgranite
systemctl start vgranite
```

TROUBLESHOOTING
===============

 - **Permission denied: '/dev/ttyUSB0'** - Mb try use command `sudo chmod a+rw /dev/ttyUSB0`

BUILD
=====

To build, we need to clone the repository:

```bash
cd /opt/
git clone https://github.com/ponikrf/VGranite.git
```

Installing dependencies:

```bash
npm install
```

The main application will be ready, but it will not have documentation and web interface.

To build the interface, take a look at the repository [VGranite-Web](https://github.com/ponikrf/VGranite-Web)


ApiDocs build:

```bash
npm install apidoc -g
```

```bash
cd /opt/vgranite/
apidoc apidoc -i devices -o apidoc
```