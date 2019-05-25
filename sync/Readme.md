# soliCMS cli

You need first a valid soliCMS account to use this tool.

## Installation

`npm install -g solicms-cli`

### On Linux

install `notify-osd` or/and `libnotify-bin`

## Configuration

Create a file `.tokens.yml` in a folder and configure it :

```
name: "Olivier Bonnaure"
domains:
  <shortcut>:
    domain: whatever.solicms.com
    token: <here your private token>
```

## Launch it

`solicms <shortcut> -w`

## Create a new file

`solicms <shortcut> -c layout -f my-layout-name`

Objects available are :

- layout
- partial
- css
- js
- spa

