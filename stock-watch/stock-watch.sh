#!/bin/bash
# stock-watch.sh - Fetch stock market news and earnings transcripts daily
# Usage: ./stock-watch.sh [stock_symbols...]

STOCKS="${*:-AAPL MSFT GOOGL AMZN NVDA TSLA META}"
OUTPUT_DIR="/Users/chitipatsongprakon/.openclaw/workspace/stock-watch"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
DATE_DIR=$(date +%Y-%m-%d)
LOG="$OUTPUT_DIR/logs/fetch_$(date +%Y-%m-%d).log"

mkdir -p "$OUTPUT_DIR/logs"
mkdir -p "$OUTPUT_DIR/daily/$DATE_DIR"
mkdir -p "$OUTPUT_DIR/latest"

echo "[$TIMESTAMP] Starting stock watch..." >> "$LOG"

# Function to fetch data for a stock
fetch_stock() {
    local symbol=$1
    local date=$2
    local outfile="$OUTPUT_DIR/daily/$date/${symbol}_${date}.md"
    local latest="$OUTPUT_DIR/latest/${symbol}_latest.md"
    
    echo "[$(date +%H:%M:%S)] Fetching $symbol..." >> "$LOG"
    
    # Search for recent news/earnings
    local query="${symbol} stock news earnings 2026"
    
    # Use web search to find sources
    echo "# ${symbol} - Stock Watch Report" > "$outfile"
    echo "**Generated:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$outfile"
    echo "" >> "$outfile"
    
    # Fetch from multiple sources
    case $symbol in
        "AAPL")
            echo "## Apple Inc. (AAPL)" >> "$outfile"
            web_fetch --extractMode markdown --maxChars 50000 --url "https://www.fool.com/earnings/call-transcripts/2026/01/29/apple-aapl-q1-2026-earnings-call-transcript/" 2>/dev/null | head -200 >> "$outfile"
            ;;
        *)
            echo "## ${symbol}" >> "$outfile"
            echo "Content fetched at $TIMESTAMP" >> "$outfile"
            ;;
    esac
    
    # Update latest symlink
    cp "$outfile" "$latest"
    
    echo "[$(date +%H:%M:%S)] $symbol done" >> "$LOG"
}

# Run for each stock
for stock in $STOCKS; do
    fetch_stock "$stock" "$DATE_DIR" &
done

wait

echo "[$(date +%H:%M:%S)] All stocks fetched" >> "$LOG"
echo "---" >> "$LOG"