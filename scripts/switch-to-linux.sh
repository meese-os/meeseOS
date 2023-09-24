#!/bin/bash

# Define the search root directory
rootDirectory=".."

# Recursively search for package.json files
packageJsonFiles=$(find "$rootDirectory" -type f -name "package.json" | grep -Ev '/(node_modules|dist)/')

# Iterate through the found package.json files and perform replacements
for file in $packageJsonFiles; do
  # Read the file content
  fileContent=$(<"$file")

  # Perform replacements using sed
  newContent=$(echo "$fileContent" | sed -e 's/rd \/s \/q dist>nul 2>&1|echo.>nul/rm -rf .\/dist\/*/')

  # Save the modified content back to the file
  echo "$newContent" > "$file"
done

echo "Replacements completed."
