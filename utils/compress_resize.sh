#! /usr/bin/env bash

# print help
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  echo "Usage: $0 [DIRS...]"
  echo "Converts all png and jpg images in DIRS to webp format."
  exit 0
fi

image2webp() {
  file="$1"
  webp_file="${file%.*}.webp"
  # if the webp file exists and is newer than the file, skip it
  if [[ -f "$webp_file" && "$webp_file" -nt "$file" ]]; then
    echo "Skipping $file"
    return
  fi
  cwebp "$file" -o "$webp_file" -resize 0 500 -q 50
}

# for parallel
export -f image2webp

dirs=("$@")
extensions=(png jpg jpeg)

for dir in "${dirs[@]}"; do
  # remove trailing slash
  dir="${dir%/}"
  # check if the directory exists and is a directory
  if [[ ! -d "$dir" ]]; then
    echo "Error: $dir is not a directory" >&2
    continue
  fi
  for ext in "${extensions[@]}"; do
    find "$dir" -type f -name "*.$ext" | parallel -j "$(nproc)" image2webp
  done
done
