#!/usr/bin/env bash -e

examples="cm compiler system MLRISC smlnj-lib ckit nlffi"

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
