#!/usr/bin/env bash
# Love & Flour — hero reel encode.
#
# Source: HEROREEL2.mov (3840x2160, 39s, 272MB) — the stabilised export of the
# original reel; identical duration, frame rate and frame count. Four shots:
#   A 0:00–0:20.5  hands shaping pan dulce on a sheet tray   <- primary
#   B 0:20.5–0:26  bagging at the counter                     (soft, unused)
#   C 0:26–0:31    agua fresca dispensers                     (brand labels, unused)
#   D 0:31–0:39    dough turning in the spiral mixer          <- second shot
#
# WHY TWO SHOTS: shot A never returns to its starting state — the camera drifts
# right and the tray fills with topped conchas as it runs. Measured against a
# noise floor of 8.2, the best possible hard cut in shot A still scores 23.7, so
# no seamless single-shot loop exists. Cutting to a second shot makes the loop
# point a deliberate edit instead of a glitch, and shot D's motion is cyclical so
# it carries the turnaround.
#
# NO GRADE IS BAKED IN. The hero is dimmed in CSS with a flat black layer
# (--hero-dim in Hero.astro), which is a linear multiply and keeps shadow detail.
# The previous curves-based grade crushed the blacks.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="HEROREEL2.mov"
OUT="public/video"
XF=1.0                    # dissolve length

# WHY THESE IN-POINTS: the baker strikes the dough twice, at t=1.13s and
# t=15.82s. Both are real impacts that jolt the camera — they spike identically
# in the ungraded original — and the stabiliser fights them, warping briefly as
# it tries to hold the frame (the t=15.82 spike is measurably worse after
# stabilisation than before). Shot A's window is placed to sit between them.
# Shot D starts at 31.9 rather than 31.5 to clear the cut from the previous shot,
# which lands at 31.67.
A_IN=4.0;  A_LEN=11.0     # shot A body: 4.0-15.0, clear of both impacts
D_IN=31.9; D_LEN=6.8      # shot D, clear of the incoming cut
H_IN=3.0                  # the 1s immediately before A_IN — the loop's tail

# Shot D is cooler than shot A; nudge it warm so the cut doesn't read as a
# white-balance jump.
DWARM="colorbalance=rm=.06:bm=-.05,eq=saturation=1.05"

mkdir -p "$OUT" tools/build

echo "==> building seamless 2-shot master"
# main A -> dissolve -> D -> dissolve -> the 1s that precedes main A.
# Ending on the frame just before the start is what makes the loop close.
ffmpeg -hide_banner -v warning -y \
  -ss "$A_IN" -t "$A_LEN" -i "$SRC" \
  -ss "$D_IN" -t "$D_LEN" -i "$SRC" \
  -ss "$H_IN" -t "$XF"    -i "$SRC" \
  -filter_complex "\
    [0:v]setpts=PTS-STARTPTS[a]; \
    [1:v]${DWARM},setpts=PTS-STARTPTS[d]; \
    [2:v]setpts=PTS-STARTPTS[h]; \
    [a][d]xfade=transition=fade:duration=${XF}:offset=$(echo "$A_LEN - $XF" | bc)[ad]; \
    [ad][h]xfade=transition=fade:duration=${XF}:offset=$(echo "$A_LEN - $XF + $D_LEN - $XF" | bc)[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p \
  tools/build/_master.mp4

# Denoise. Two jobs: the 4K source carries fine grain that VP9 would otherwise
# spend real bitrate on, and that same grain is what reads as "microjitter" in
# the hero — the camera is essentially locked off, so the shimmer is sensor
# noise, not shake.
#
# The weight sits on the SPATIAL terms (5:5) rather than the temporal ones (4:4)
# on purpose. hqdn3d's temporal pass averages across frames, which ghosts fast
# motion: at temporal strength 9 and above the baker's black glove visibly goes
# translucent against the counter. Spatial denoising cannot ghost. Measured on a
# static strip of frame, this cuts frame-to-frame noise ~14% with no visible
# softening of the dough and no more ghosting than a much weaker temporal setting.
DENOISE="hqdn3d=5:5:4:4"

encode () { # w h mp4_crf mp4_max vp9_crf name
  local w=$1 h=$2 crf=$3 maxr=$4 vcrf=$5 name=$6
  echo "==> ${name}: ${w}x${h}"
  ffmpeg -hide_banner -v warning -y -i tools/build/_master.mp4 \
    -vf "${DENOISE},scale=${w}:${h}:flags=lanczos" -an \
    -c:v libx264 -profile:v high -preset slow -crf "$crf" \
    -maxrate "$maxr" -bufsize "$((${maxr%k}*2))k" \
    -pix_fmt yuv420p -movflags +faststart -g 60 \
    "${OUT}/${name}.mp4"
  ffmpeg -hide_banner -v warning -y -i tools/build/_master.mp4 \
    -vf "${DENOISE},scale=${w}:${h}:flags=lanczos" -an \
    -c:v libvpx-vp9 -crf "$vcrf" -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
    "${OUT}/${name}.webm"
}

encode 1920 1080 29 1600k 40 hero-1080
encode 1280  720 29 1100k 43 hero-720

echo "==> poster (ungraded, same as frame 0 — CSS dims it identically)"
ffmpeg -hide_banner -v warning -y -i tools/build/_master.mp4 -frames:v 1 -update 1 \
  -vf "${DENOISE},scale=1920:1080:flags=lanczos" -q:v 3 tools/build/_poster.jpg
node -e "
const sharp=require('sharp');
const s=sharp('tools/build/_poster.jpg');
Promise.all([
  s.clone().webp({quality:72}).toFile('${OUT}/hero-poster.webp'),
  s.clone().jpeg({quality:76,mozjpeg:true}).toFile('${OUT}/hero-poster.jpg'),
]).then(()=>console.log('poster written'));
"

rm -f tools/build/_master.mp4 tools/build/_poster.jpg
ls -lh "$OUT"
