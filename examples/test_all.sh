#!/usr/bin/env bash -e

examples="compiler smlnj-lib system"

for exa in $examples; do
	files=$(find "examples/$exa" -name "*.sml" -o -name "*.sig" -o -name "*.fun")
	echo $files | xargs npx tree-sitter parse -q
	echo "Successfully parsed $exa."
done
