1. `nvm install $(Get-Content .nvmrc)`
2. `nvm use $(Get-Content .nvmrc)`

If you encounter the error `EADDRINUSE, Address already in use`, run the following command:

`taskkill /F /IM node.exe`
