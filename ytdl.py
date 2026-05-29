#!/usr/bin/env python3
"""
ytdl.py - YouTube Downloader
ใช้โหลดทั้ง mp3 และ mp4 แบบง่ายๆ
Requires: yt-dlp, ffmpeg
Install: pip install yt-dlp
         brew install ffmpeg  (macOS)
"""

import sys
import os
import subprocess

def check_deps():
    """Check required dependencies."""
    try:
        subprocess.run(["yt-dlp", "--version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("❌ ยังไม่ได้ติดตั้ง yt-dlp")
        print("   ติดตั้งด้วย: pip install yt-dlp")
        return False
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("⚠️  ยังไม่ได้ติดตั้ง ffmpeg (จำเป็นสำหรับ mp3)")
        print("   macOS: brew install ffmpeg")
        print("   Linux: sudo apt install ffmpeg")
        return False
    return True


def download_mp4(url, output="downloads"):
    """โหลดวิดีโอคุณภาพดีที่สุด (mp4)."""
    os.makedirs(output, exist_ok=True)
    cmd = [
        "yt-dlp",
        "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "-o", f"{output}/%(title)s.%(ext)s",
        "--embed-metadata",
        "--embed-thumbnail",
        url,
    ]
    print(f"📥 กำลังโหลด MP4...")
    subprocess.run(cmd)
    print("✅ โหลด MP4 เสร็จแล้ว!")


def download_mp3(url, output="downloads"):
    """โหลดแค่เสียงเป็น mp3 คุณภาพดี."""
    os.makedirs(output, exist_ok=True)
    cmd = [
        "yt-dlp",
        "-x",                          # extract audio
        "--audio-format", "mp3",
        "--audio-quality", "0",        # best quality (0=best, 9=worst)
        "-o", f"{output}/%(title)s.%(ext)s",
        "--embed-metadata",
        "--embed-thumbnail",
        "--add-metadata",
        url,
    ]
    print(f"🎵 กำลังโหลด MP3...")
    subprocess.run(cmd)
    print("✅ โหลด MP3 เสร็จแล้ว!")


def show_help():
    print("""
🎬 YouTube Downloader - มาแรง!

วิธีใช้:
  python ytdl.py <url>             # โหลด MP4 (วิดีโอ)
  python ytdl.py <url> --mp3       # โหลด MP3 (เสียงอย่างเดียว)
  python ytdl.py <url> -o โฟลเดอร์ # กำหนดที่เก็บไฟล์

ตัวอย่าง:
  python ytdl.py https://youtu.be/dQw4w9WgXcQ
  python ytdl.py https://youtu.be/dQw4w9WgXcQ --mp3
  python ytdl.py https://youtu.be/dQw4w9WgXcQ --mp3 -o "เพลงโปรด"
""")


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        show_help()
        return

    url = sys.argv[1]
    is_mp3 = "--mp3" in sys.argv or "-m" in sys.argv

    # หา output folder จาก -o
    output = "downloads"
    if "-o" in sys.argv:
        idx = sys.argv.index("-o")
        if idx + 1 < len(sys.argv):
            output = sys.argv[idx + 1]

    if not check_deps():
        return

    if is_mp3:
        download_mp3(url, output)
    else:
        download_mp4(url, output)


if __name__ == "__main__":
    main()
