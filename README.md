## fxa-local-dev
> An easy way to contribute to Firefox Accounts

[![Build Status](https://travis-ci.org/vladikoff/fxa-local-dev.svg?branch=master)](https://travis-ci.org/vladikoff/fxa-local-dev)

### Getting Started

- Install required system [dependencies](#dependencies)
- Clone this repository and run `npm install`. Here is the full command:
```
git clone https://github.com/vladikoff/fxa-local-dev.git && cd fxa-local-dev && npm i
``` 

After installation completes you can visit [127.0.0.1:3030](http://127.0.0.1:3030/) and use the [PM2 tool](https://github.com/Unitech/PM2#main-features) to start, stop and read server logs.  Most common commands are as follows:

- `./pm2 start servers.json` **- start all servers.** (WARNING: running this multiple times will spawn more of the same servers).
- `./pm2 kill` **- stop all servers.**
- `./pm2 status` - display running servers. 
- `./pm2 logs` - logs for all servers (note: this must be used to verify accounts).
- `./pm2 logs 1` - display logs for process `1`.
- More commands on the [PM2 Readme](https://github.com/Unitech/PM2#main-features).

### Updating projects to latest `master`

- Run `npm run update`.

### Dependencies

[Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git), [node.js](http://nodejs.org/), Redis, libgmp.

#### OSX (with [Brew](http://brew.sh/))

```
brew install gmp redis
```

(You might also need to run `xcode-select --install` to get OS X Command Line Tools)

#### Ubuntu

```
sudo apt-get install libgmp3-dev redis-server
```
