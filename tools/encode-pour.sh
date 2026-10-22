#!/usr/bin/env bash
# Love & Flour — the coffee loop for the "ovens are on at 5 a.m." section.
#
# Source: GradedShots00850637.mov (2160x3840 portrait, 113s, 814MB), already graded.
#
# TWO SHOTS, HARD CUT, NO CROSSFADES:
#   steaming the milk at the machine   0:57.5–1:04
#   pouring it into the glass          1:26.5–1:31
#
# The IN and OUT points are chosen so the two shots do not look alike where they
# meet. An earlier cut ran the steam shot out while the gold pitcher still filled
# the left of frame, straight into a pour shot where the gold pitcher also filled
# the left of frame — same object, same place, slightly different size, which
# reads as a botched zoom rather than a cut. The steam shot now ends on the
# machine's chrome group heads with the pitcher dropped to the bottom edge, and
# the pour starts once the milk is visibly in the glass.
#
# A single shot cannot loop here — the cup fills as it pours, so the end never
# matches the start, and dissolving the tail back onto the head to hide that
# reads as a mushy fade. Cutting between two different shots makes every
# transition an edit instead, including the one where the loop restarts. Nothing
# in this clip is a fade.
#
# Chronological order on purpose: steam the milk, then pour it.
#
# (The rest of 1:13–1:35 is skipped deliberately: an espresso pour from a steel
# pitcher at 1:13–1:18, the barista turning away at 1:19–1:21, the first seconds
# of the milk pour where the framing is too close to the steam shot's, and the
# glass being lifted out of frame at 1:31.2.)
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="GradedShots00850637.mov"
OUT="public/video"

STEAM_IN=57.5;  STEAM_LEN=6.5
POUR_IN=86.5;   POUR_LEN=4.5   # ends before she lifts the glass out of frame at 1:31.2

# 4:5 out of the 9:16 source. The two shots are framed differently, so each gets
# its own vertical offset; the output size is identical so they concatenate.
STEAM_CROP="crop=2160:2700:0:400"
POUR_CROP="crop=2160:2700:0:502"

mkdir -p "$OUT" tools/build

echo "==> master: steam -> pour, hard cut"
ffmpeg -hide_banner -v warning -y \
  -ss "$STEAM_IN" -t "$STEAM_LEN" -i "$SRC" \
  -ss "$POUR_IN"  -t "$POUR_LEN"  -i "$SRC" \
  -filter_complex "[0:v]${STEAM_CROP},setpts=PTS-STARTPTS[a];\
                   [1:v]${POUR_CROP},setpts=PTS-STARTPTS[b];\
                   [a][b]concat=n=2:v=1:a=0[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p tools/build/_pour.mp4

# Same grain reasoning as the hero: a light denoise buys real bitrate back.
DENOISE="hqdn3d=4:4:4:4"

encode () { # w h mp4_crf mp4_max vp9_crf name
  local w=$1 h=$2 crf=$3 maxr=$4 vcrf=$5 name=$6
  echo "==> ${name}: ${w}x${h}"
  ffmpeg -hide_banner -v warning -y -i tools/build/_pour.mp4 \
    -vf "${DENOISE},scale=${w}:${h}:flags=lanczos" -an \
    -c:v libx264 -profile:v high -preset slow -crf "$crf" \
    -maxrate "$maxr" -bufsize "$((${maxr%k}*2))k" \
    -pix_fmt yuv420p -movflags +faststart -g 60 "${OUT}/${name}.mp4"
  ffmpeg -hide_banner -v warning -y -i tools/build/_pour.mp4 \
    -vf "${DENOISE},scale=${w}:${h}:flags=lanczos" -an \
    -c:v libvpx-vp9 -crf "$vcrf" -b:v 0 -row-mt 1 -deadline good -cpu-used 2 "${OUT}/${name}.webm"
}

encode  880 1100 29 1100k 40 pour-900
encode  616  770 31  600k 43 pour-620

# Poster is taken from the pour, not the steam — it is the stronger still and the
# one that shows a recognisable drink.
echo "==> poster"
ffmpeg -hide_banner -v warning -y -ss "$STEAM_LEN" -i tools/build/_pour.mp4 -frames:v 1 -update 1 \
  -vf "${DENOISE},scale=880:1100:flags=lanczos" -q:v 3 tools/build/_pourposter.jpg
node -e "
const sharp=require('sharp');
const s=sharp('tools/build/_pourposter.jpg');
Promise.all([
  s.clone().webp({quality:74}).toFile('${OUT}/pour-poster.webp'),
  s.clone().jpeg({quality:78,mozjpeg:true}).toFile('${OUT}/pour-poster.jpg'),
]).then(()=>console.log('poster written'));
"
rm -f tools/build/_pour.mp4 tools/build/_pourposter.jpg
ls -lh "$OUT" | grep pour
