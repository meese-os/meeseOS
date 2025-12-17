#!/bin/bash

# Script to run npm-check-updates (ncu) on all packages in the Rush monorepo
#
# Usage:
#   bash ./scripts/update-dependencies.sh [ncu-options]
#
# Examples:
#   # Update all dependencies (default)
#   bash ./scripts/update-dependencies.sh
#
#   # Update only devDependencies
#   bash ./scripts/update-dependencies.sh --dep dev
#
#   # Update only production dependencies
#   bash ./scripts/update-dependencies.sh --dep prod
#
#   # Exclude specific packages (e.g., hyperapp)
#   bash ./scripts/update-dependencies.sh --reject hyperapp
#
#   # Include only specific packages (e.g., @babel/*)
#   bash ./scripts/update-dependencies.sh --filter "@babel/*"
#
#   # Combine filters (e.g., only @babel packages in devDependencies)
#   bash ./scripts/update-dependencies.sh --dep dev --filter "@babel/*"
#
#   # Target specific version ranges
#   bash ./scripts/update-dependencies.sh --target minor
#   bash ./scripts/update-dependencies.sh --target patch
#
# Common ncu options:
#   -u, --upgrade          Upgrade package.json (default if no args)
#   --dep prod|dev|peer    Filter by dependency type
#   --filter <pattern>      Include only packages matching pattern (regex)
#   --reject <pattern>      Exclude packages matching pattern (regex)
#   --target minor|patch    Target version range
#   --interactive          Interactive mode
#
# Note: After running this script, you MUST run:
#   1. rush update    (regenerates lockfile)
#   2. rush install   (installs dependencies)

set -e

# Default to -u if no arguments provided, otherwise add -u to existing args
if [ $# -eq 0 ]; then
    NCU_ARGS="-u"
else
    NCU_ARGS="-u $@"
fi

# Check if ncu is installed globally or in PATH
if ! command -v ncu &> /dev/null; then
	echo "npm-check-updates (ncu) not found. Installing globally..."
	npm install -g npm-check-updates
fi

# Get the root directory of the monorepo
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if ensureConsistentVersions is enabled in rush.json
RUSH_JSON="$REPO_ROOT/rush.json"
ENSURE_CONSISTENT_VERSIONS=$(grep -o '"ensureConsistentVersions"[[:space:]]*:[[:space:]]*\(true\|false\)' "$RUSH_JSON" | grep -o '\(true\|false\)' || echo "false")

# Find all package.json files (excluding node_modules, Rush temp/config dirs, and test mocks)
# Note: We include template files in development/cli/src/templates/ since they're used
# to generate new packages and should have up-to-date dependencies
PACKAGE_FILES=$(find "$REPO_ROOT" -name "package.json" \
	-not -path "*/node_modules/*" \
	-not -path "*/common/temp/*" \
	-not -path "*/common/config/*" \
	-not -path "*/__mocks__/*" \
	-type f)

# Count total packages
TOTAL=$(echo "$PACKAGE_FILES" | wc -l)
CURRENT=0

echo "Found $TOTAL package.json files to update"
echo "Running ncu with args: $NCU_ARGS"
echo ""

# Process each package.json
while IFS= read -r package_file; do
	CURRENT=$((CURRENT + 1))
	package_dir=$(dirname "$package_file")
	package_name=$(basename "$package_dir")

	echo "[$CURRENT/$TOTAL] Updating $package_name..."
	(cd "$package_dir" && ncu "$NCU_ARGS")

	if [ $? -eq 0 ]; then
		echo "✓ Updated $package_name"
	else
		echo "✗ Failed to update $package_name"
	fi
	echo ""
done <<< "$PACKAGE_FILES"

echo "Done! All packages have been processed."
echo ""

if [ "$ENSURE_CONSISTENT_VERSIONS" = "true" ]; then
    echo "⚠️  IMPORTANT: Your repo has 'ensureConsistentVersions: true' in rush.json"
    echo "   This means Rush will FAIL if packages have different versions of the same dependency."
    echo ""
    echo "Next steps (in order):"
    echo ""
    echo "1. Review the changes in each package.json"
    echo ""
    echo "2. Check for version mismatches:"
    echo "   rush check --verbose"
    echo ""
    echo "3. Resolve version conflicts by choosing ONE of these approaches:"
    echo ""
    echo "   Option A: Align versions manually"
    echo "   - Update all packages to use the same version for each dependency"
    echo "   - For example, if some use eslint ^9.37.0 and others use ^9.39.2,"
    echo "     update all to use the same version"
    echo ""
    echo "   Option B: Allow alternative versions (if versions must differ)"
    echo "   - Add entries to common/config/rush/common-versions.json:"
    echo "     \"allowedAlternativeVersions\": {"
    echo "       \"eslint\": [\"^9.37.0\"],"
    echo "       \"@babel/core\": [\"^7.28.4\"]"
    echo "     }"
    echo ""
    echo "4. After resolving conflicts, run:"
    echo "   rush update --full"
    echo ""
    echo "   This will regenerate the lockfile AND install dependencies."
    echo "   The --full flag forces recalculation after package.json changes."
    echo ""
    echo "5. Verify everything works:"
    echo "   rush build"
    echo "   rush test"
    echo ""
    echo "Note: 'rush update' will FAIL if there are version mismatches."
    echo "      You must resolve conflicts before dependencies will install."
else
    echo "Next steps:"
    echo ""
    echo "1. Review the changes in each package.json"
    echo ""
    echo "2. Run:"
    echo "   rush update --full"
    echo ""
    echo "   This will regenerate the lockfile AND install dependencies."
    echo "   The --full flag forces recalculation after package.json changes."
    echo ""
    echo "3. Verify everything works:"
    echo "   rush build"
    echo "   rush test"
fi
