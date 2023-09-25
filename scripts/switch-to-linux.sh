#!/bin/bash
#
# This script is used to replace the Windows commands in the package.json files
# with their Linux equivalents. This is done to allow the project to be built
# on Linux systems, such as the GitHub Actions runners.

# Define the search root directory
rootDirectory=".."

# Use find and sed to perform replacements directly in the files
find "$rootDirectory" -type f -name "package.json" ! -path "*/node_modules/*" ! -path "*/dist/*" -exec sed -i 's/rd \/s \/q dist>nul 2>&1|echo.>nul/rm -rf .\/dist\/*/g' {} +

echo "Replacements completed."
