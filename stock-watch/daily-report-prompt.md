# Daily Stock Watch Report Generator

## Task
Generate a daily stock market research report for tracked companies. This task runs every day automatically.

## Tracked Stocks
AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META

## Steps

### 1. Search for Latest News
For each stock, search for:
- Recent earnings calls/transcripts
- Breaking news that day
- Analyst ratings and price targets

Use web_search with queries like:
- "[STOCK] earnings call transcript 2026"
- "[STOCK] stock news today"
- "[STOCK] analyst rating"

### 2. Fetch Content
- Fetch earnings transcripts from Motley Fool, Seeking Alpha
- Fetch news from Reuters, Bloomberg
- Use maxChars: 50000 for detailed content

### 3. Cross-Reference & Validate
For each fact found:
- Check against at least 2 sources before marking as verified
- Flag single-source claims as "UNVERIFIED - needs confirmation"
- Note any conflicting information between sources

### 4. Create Report File
Save to: `/Users/chitipatsongprakon/.openclaw/workspace/stock-watch/daily/YYYY-MM-DD/daily-report.md`

File format:
```markdown
# Stock Watch Daily Report
**Date:** YYYY-MM-DD
**Generated:** HH:MM:SS

## Market Summary
[Overall market conditions based on news]

## Stock Reports

### AAPL - Apple Inc.
**Latest News:**
- [source 1] - summary
- [source 2] - summary

**Earnings Status:**
- Next report: [date] or [Recent: date]
- Last EPS estimate: $X.XX

**Key Facts (Verified):**
- ✅ [fact from 2+ sources]
- ⚠️ [unverified claim]

### [Repeat for each stock...]

## Sources
- [List all sources used]

## Reliability Notes
- High confidence: [stocks with 3+ source verification]
- Medium confidence: [stocks with 2 source verification]  
- Low confidence: [stocks with only 1 source or conflicting info]
```

### 5. Update Latest Files
For each stock, also save:
- `/Users/chitipatsongprakon/.openclaw/workspace/stock-watch/latest/[STOCK]_latest.md`

### 6. Alert on Breaking News
If any stock has major breaking news (earnings surprise, acquisition, legal issues):
- Create alert file: `/Users/chitipatsongprakon/.openclaw/workspace/stock-watch/alerts/[STOCK]_YYYY-MM-DD_HHMM.md`
- Include: what happened, sources, potential impact

## Quality Standards
- Always verify facts against multiple sources
- Clearly label speculation vs confirmed information
- Note when data is stale (>1 week old)
- Include source URLs for fact-checking

## Output
Create all files and report back:
- List of files created
- Summary of findings
- Any breaking news alerts
- Reliability assessment