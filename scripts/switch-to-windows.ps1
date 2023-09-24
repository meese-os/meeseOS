# Define the search root directory
$rootDirectory = ".."

# Recursively search for package.json files
$packageJsonFiles = Get-ChildItem -Path $rootDirectory -Recurse -File -Filter "package.json" | Where-Object {
	# Exclude directories named "node_modules" or "dist"
	$excludedDirs = $_.DirectoryName | Split-Path -Leaf
	-not ($excludedDirs -eq "node_modules" -or $excludedDirs -eq "dist")
}

# Iterate through the found package.json files and perform replacements
foreach ($file in $packageJsonFiles) {
	$fileContent = Get-Content -Path $file.FullName -Raw

	# Perform replacements using regex, command compliments of the following:
	# https://github.com/nodejs/help/issues/2200#issuecomment-534416007
	$newContent = $fileContent -replace 'rm\s+-rf\s+\./dist/\*', 'rd /s /q dist>nul 2>&1|echo.>nul' -replace 'rm\s+\./dist/\*', 'rd /s /q dist>nul 2>&1|echo.>nul'

	# Save the modified content back to the file without changing encoding or line endings
	[System.IO.File]::WriteAllText($file.FullName, $newContent)
}

Write-Host "Replacements completed."
