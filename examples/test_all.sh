#!/usr/bin/env bash -e

examples="compiler smlnj-lib system"

for exa in $examples; do
	files=$(
		for file in $(find "examples/$exa" -name "*.sml" -o -name "*.sig" -o -name "*.fun"); do
			if ! grep -q $file examples/ignores.txt; then
				echo $file
			fi
		done
	)
	echo $files | xargs npx tree-sitter parse -q
	echo "Successfully parsed $exa."
done
