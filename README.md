# browser-wellness
A Firefox add-on to conditionally block websites to help with digital wellness, specific to my own needs

## Development
Either:
- open `about:debugging` and "Load temporary add-on".
- run `npx web-ext run` to use the add-on in a development profile/instance

## Signing
After installing dependencies, run:
```sh
./sign.sh
```

After several minutes, a signed XPI file will be downloaded to `dist/`.
