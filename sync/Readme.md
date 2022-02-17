# fasty cli

## Installation

`npm install -g fasty-cli`

### On Linux

install `notify-osd` or/and `libnotify-bin`

## Configuration

Create a file `.tokens.yml` in a folder and configure it :

```
name: "Olivier Bonnaure"
domains:
  <shortcut>:
    domain: <https://fasty.ovh/_db/db_mydb/>
    token: <1234567890>
    project_name: <demo>
```

## Launch it

`fasty <shortcut> -w`

## Create a new file

`fasty <shortcut> -c layout -f my-layout-name`

Objects available are :

- layout
- partial
- component
- api
- aql
- helper

