#!/bin/bash

echo "don't forget to bump version"
echo "download signed APK from https://addons.mozilla.org/en-US/developers/addon/b143a9fc267448fda5d1/versions"

# TODO: rewrite myself b/c web-ext sign is v3 (deprecated) and has many deps. will still need JWT token lib
npx web-ext sign --id "{1b815122-9114-406b-8426-65960851cf09}" \
    --api-key `cat .jwt-issuer` \
    --api-secret `cat .jwt-secret` \
    --artifacts-dir dist/ \
    --ignore-files "**/*.sh"

# reference docs
# https://addons-server.readthedocs.io/en/latest/topics/api/signing.html
# https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign
