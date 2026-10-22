#!/usr/bin/env bash
# Love & Flour — portrait hero reel, for phones (and tablets held upright).
#
# The landscape hero (encode-hero.sh) cropped to a phone's tall screen keeps
# only a thin middle strip of the frame. This reel was shot vertically instead.
#
# Source: "reel for mobile hero.mp4" (2160x3840, 29.97fps, 46.4s) — three shots
# Maximilian picked out of the vertical cinematic reel. Hard cuts at 15.6s and
# 28.2s:
#   A 0:00–15.6  piping buttercream round a small cake
#   B 15.6–28.2  topping a chocolate-drizzle cake on the turntable
#   C 28.2–46.4  a barista pouring — coffee (silver jug), a turn away, then
#                milk from the gold jug
#
# THE TEXT ZONE: on a phone the hero's text covers the bottom ~43% of the screen
# (it starts at 57% of the height on a 390x844 screen, 42% on a small iPhone SE).
# So the action has to sit in the top half.
#   A  the cake sits at 50–80% of the frame, behind the text. Cropped 1.72x and
#      anchored low, the piping lands in the top half. Only 1.3–6.2s is used:
#      at ~7s a glove passes right in front of the lens.
#   B  already right: the hand and the cake top are in the top half, and the
#      drizzled sides sit behind the text. Used as is.
#   C  as is. A crop that lifts the pour above the text cuts her face off. The
#      gold-jug pour sits just above the text, and her black shirt is the
#      darkest backdrop in the reel for the white type. The turn away
#      (35–37.5s) is skipped.
#
# Order B -> A -> C (the Kit Kat cake opens: it's the poster too), 1s
# dissolves, then the 1s that precedes B's in-point, so the loop closes on a
# continuous move. That tail must not reach back across the cut at 15.6s, which
# is why B starts at 17.0 rather than right after it.
#
# NO GRADE IS BAKED IN — the reel is already graded, and the hero dims it in CSS.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="reel for mobile hero.mp4"
OUT="public/video"
XF=1.0

B_IN=17.0; B_LEN=9.3      # topping the cake with Kit Kats, 17.0–26.3
A_IN=1.3;  A_LEN=4.9      # piping, 1.3–6.2
C_IN=37.6; C_LEN=8.4      # gold-jug pour, 37.6–46.0
H_IN=16.0                 # the 1s before B_IN — the loop's tail

# Shot A's crop: 1253x2227 (9:16) out of 2160x3840, centred, sitting 1613px
# down — the cake's middle (65% of the frame) lands at ~40%.
ACROP="crop=1253:2227:453:1613"

mkdir -p "$OUT" tools/build

echo "==> building the 3-shot master"
ffmpeg -hide_banner -v warning -y \
  -ss "$B_IN" -t "$B_LEN" -i "$SRC" \
  -ss "$A_IN" -t "$A_LEN" -i "$SRC" \
  -ss "$C_IN" -t "$C_LEN" -i "$SRC" \
  -ss "$H_IN" -t "$XF"    -i "$SRC" \
  -filter_complex "\
    [0:v]scale=1080:1920:flags=lanczos,setsar=1,setpts=PTS-STARTPTS[b]; \
    [1:v]${ACROP},scale=1080:1920:flags=lanczos,setsar=1,setpts=PTS-STARTPTS[a]; \
    [2:v]scale=1080:1920:flags=lanczos,setsar=1,setpts=PTS-STARTPTS[c]; \
    [3:v]scale=1080:1920:flags=lanczos,setsar=1,setpts=PTS-STARTPTS[h]; \
    [b][a]xfade=transition=fade:duration=${XF}:offset=$(echo "$B_LEN - $XF" | bc)[ba]; \
    [ba][c]xfade=transition=fade:duration=${XF}:offset=$(echo "$B_LEN + $A_LEN - 2*$XF" | bc)[bac]; \
    [bac][h]xfade=transition=fade:duration=${XF}:offset=$(echo "$B_LEN + $A_LEN + $C_LEN - 3*$XF" | bc)[v]" \
  -map "[v]" -an -r 30000/1001 -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p \
  tools/build/_portrait_master.mp4

# Same reasoning as the landscape encode: spatial-weighted, so moving hands
# don't ghost.
DENOISE="hqdn3d=5:5:4:4"

encode () { # w h mp4_crf mp4_max vp9_crf name
  local w=$1 h=$2 crf=$3 maxr=$4 vcrf=$5 name=$6
  echo "==> ${name}: ${w}x${h}"
  ffmpeg -hide_banner -v warning -y -i tools/build/_portrait_master.mp4 \
    -vf "${DENOISE},scale=${w}:${h}:flags=lanczos" -an \
    -c:v libx264 -profile:v high -preset slow -crf "$crf" \
    -maxrate "$maxr" -bufsize "$((${maxr%k}*2))k" \
    -pix_fmt yuv420p -movflags +faststart -g 60 \
    "${OUT}/${name}.mp4"
  ffmpeg -hide_banner -v warning -y -i tools/build/_portrait_master.mp4 \
    -vf "${DENOISE},scale=${w}:${h}:flags=lanczos" -an \
    -c:v libvpx-vp9 -crf "$vcrf" -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
    "${OUT}/${name}.webm"
}

# One size: the same pixel count as the landscape 720p file phones got before.
encode 720 1280 29 1100k 43 hero-portrait-720

echo "==> poster (frame 0, the Kit Kat cake)"
ffmpeg -hide_banner -v warning -y -i tools/build/_portrait_master.mp4 -frames:v 1 -update 1 \
  -vf "${DENOISE},scale=720:1280:flags=lanczos" -q:v 3 tools/build/_portrait_poster.jpg
node -e "
const sharp=require('sharp');
const s=sharp('tools/build/_portrait_poster.jpg');
Promise.all([
  s.clone().webp({quality:72}).toFile('${OUT}/hero-portrait-poster.webp'),
  s.clone().jpeg({quality:76,mozjpeg:true}).toFile('${OUT}/hero-portrait-poster.jpg'),
]).then(()=>console.log('poster written'));
"

rm -f tools/build/_portrait_master.mp4 tools/build/_portrait_poster.jpg
ls -lh "$OUT"/hero-portrait*
