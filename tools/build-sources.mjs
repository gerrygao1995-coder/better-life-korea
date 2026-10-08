import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const items = JSON.parse(fs.readFileSync(path.join(root, 'data/guide.json'), 'utf8').replace(/^\uFEFF/, ''))
  .sort((a, b) => a.chapter.localeCompare(b.chapter) || a.id.localeCompare(b.id, undefined, { numeric: true }));
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const ids = new Set();
for (const item of items) {
  if (!/^[A-Z]{1,3}\d{2}$/.test(item.id) || ids.has(item.id)) throw new Error('Invalid or duplicate item ID: ' + item.id);
  ids.add(item.id);
  if (typeof item.chapter !== 'string' || !/^\d{2} /.test(item.chapter) || typeof item.title !== 'string' || typeof item.evidence !== 'string') throw new Error('Invalid item: ' + item.id);
  if (!Array.isArray(item.sources) || !item.sources.length) throw new Error('No sources: ' + item.id);
  for (const source of item.sources) {
    const url = new URL(source.url);
    if (!['https:', 'http:'].includes(url.protocol) || typeof source.title !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(source.checked)) throw new Error('Invalid source: ' + item.id);
  }
}
const chapters = [...new Set(items.map(item => item.chapter))];
const uniqueUrls = new Set(items.flatMap(item => item.sources.map(source => source.url)));
const checkedDates = [...new Set(items.flatMap(item => item.sources.map(source => source.checked)))].sort();
const dateLabel = checkedDates.length === 1 ? checkedDates[0] : checkedDates[0] + ' ~ ' + checkedDates.at(-1);
const category = item => item.evidence.startsWith('제도·법령') ? '제도·법령' : item.evidence.startsWith('실용 판단') ? '실용 판단' : item.evidence.startsWith('공식 지침') ? '공식 지침' : '근거 설명';
const cards = item => {
  const search = [item.id, item.chapter, item.title, item.evidence, ...item.sources.flatMap(source => [source.title, source.url, source.checked])].join(' ');
  return `<article class="source-card" id="source-${item.id.toLowerCase()}" data-item data-search="${escape(search)}">
    <div class="card-top"><span class="item-id">${escape(item.id)}</span><span class="badge">${escape(category(item))}</span><a class="back-item" href="index.html#${item.id.toLowerCase()}">실행 방법 읽기 <span aria-hidden="true">↗</span></a></div>
    <h3>${escape(item.title)}</h3>
    <p class="evidence">${escape(item.evidence)}</p>
    <ul class="source-list">${item.sources.map((source, index) => `<li>
      <span class="source-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <div class="source-body"><a data-source href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} <span aria-hidden="true">↗</span><span class="sr-only"> (새 탭)</span></a><div class="source-meta"><span>${escape(new URL(source.url).hostname)}</span><span>확인 <time datetime="${escape(source.checked)}">${escape(source.checked)}</time></span></div></div>
    </li>`).join('')}</ul>
  </article>`;
};
const sections = chapters.map(chapter => {
  const entries = items.filter(item => item.chapter === chapter);
  return `<section class="chapter" data-chapter="${escape(chapter)}" aria-labelledby="chapter-${chapter.slice(0, 2)}">
    <div class="chapter-heading"><span class="chapter-number">${chapter.slice(0, 2)}</span><h2 id="chapter-${chapter.slice(0, 2)}">${escape(chapter.slice(3))}</h2><span class="chapter-count">${entries.length}개 항목</span></div>
    ${entries.map(cards).join('\n')}
  </section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>공식 출처 | 대한민국 생활 치트키</title>
<meta name="description" content="${items.length}개 생활 항목의 근거와 공식 원문을 한곳에서 확인하세요. ${chapters.length}개 주제, ${uniqueUrls.size}개의 서로 다른 출처 URL. 항목 ID·키워드 검색과 주제별 탐색을 제공합니다.">
<link rel="canonical" href="https://gerrygao1995-coder.github.io/better-life-korea/sources.html">
<meta property="og:title" content="공식 출처 | 대한민국 생활 치트키">
<meta property="og:description" content="무엇을 근거로 썼는지, 직접 확인하세요. 항목별 공식 원문과 확인일을 함께 제공합니다.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://gerrygao1995-coder.github.io/better-life-korea/sources.html">
<meta property="og:image" content="https://gerrygao1995-coder.github.io/better-life-korea/social-preview.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#183b34">
<style>
:root{--paper:#f4f3ed;--white:#fff;--ink:#183b34;--green:#276b52;--muted:#62716a;--line:#d9e1d9;--soft:#e8eee3;--lime:#d9ef98}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:92px}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.75 "Pretendard","Malgun Gothic","Apple SD Gothic Neo",sans-serif;word-break:keep-all;overflow-wrap:anywhere}a{color:var(--green);text-underline-offset:4px}button,input,select{font:inherit}button{cursor:pointer}a,button,input,select{-webkit-tap-highlight-color:transparent}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #b76824;outline-offset:4px}[hidden]{display:none!important}.wrap{width:min(1120px,calc(100% - 48px));margin-inline:auto}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.skip{position:fixed;top:-100px;left:16px;z-index:30;background:white;padding:10px 16px}.skip:focus{top:10px}
.topbar{position:sticky;top:0;z-index:10;background:#f4f3edf5;backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.topbar .wrap{min-height:68px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{color:var(--ink);font-size:16px;font-weight:800;letter-spacing:-.04em;text-decoration:none}.topnav{display:flex;align-items:center;gap:20px;font-size:12px}.topnav a{text-decoration:none;min-height:42px;display:inline-flex;align-items:center}.topnav .back{padding:0 14px;border:1px solid var(--line);border-radius:6px}
.hero{background:var(--ink);color:white}.hero .wrap{padding-block:48px 40px}.eyebrow{font-size:10px;letter-spacing:.18em;color:#bed2c4;margin:0 0 11px}.hero h1{font-size:clamp(34px,5vw,52px);letter-spacing:-.065em;line-height:1.2;margin:0 0 20px}.hero h1 span{color:var(--lime)}.hero .intro{max-width:650px;font-size:15px;line-height:1.95;color:#e1e9df;margin:0}.hero .sub{font-size:11px;color:#c2d1c2;margin:15px 0 0}.hero-grid{display:grid;grid-template-columns:minmax(0,1fr) 255px;gap:50px;align-items:end}.hero-note{padding:20px 22px;border:1px solid #547062;border-radius:8px;font-size:12px;line-height:1.85;color:#d7e4d5}.hero-note strong{display:block;font-size:11px;color:var(--lime);margin-bottom:6px}
.stats{background:#e5ebde;border-bottom:1px solid #d2deca}.stats .wrap{display:flex;gap:40px;align-items:baseline;flex-wrap:wrap;padding-block:16px}.stat{font-size:11px;color:#526b5c}.stat b{font-size:23px;font-weight:800;color:var(--ink);letter-spacing:-.04em;margin-right:7px}.stat.date{margin-left:auto}.stat.date b{font-size:12px;font-weight:600;letter-spacing:0}
.workspace{display:grid;grid-template-columns:244px minmax(0,1fr);gap:34px;align-items:start;padding-top:38px;padding-bottom:50px}.sidebar{position:sticky;top:92px;min-width:0}.filter-title{margin:0 0 18px;font-size:17px;letter-spacing:-.03em}.filter-box{background:white;border:1px solid var(--line);border-radius:9px;padding:20px}.filter-box fieldset{min-width:0;border:0;padding:0;margin:0}.filter-box label{display:block;font-size:11px;font-weight:700;margin:0 0 7px}.filter-box input,.filter-box select{display:block;width:100%;min-width:0;max-width:100%;border:1px solid #a6b7aa;background:white;color:var(--ink);border-radius:6px;min-height:44px;padding:10px;font-size:13px}.filter-row+.filter-row{margin-top:17px}.reset{margin-top:16px;min-height:42px;padding:7px 12px;width:100%;background:var(--soft);border:1px solid var(--line);border-radius:6px;color:var(--green);font-size:12px;font-weight:600}.reset:hover{background:#dce8d5}.filter-hint{font-size:11px;line-height:1.8;color:var(--muted);margin:14px 0 0}.legend{padding:21px 2px 0}.legend h2{font-size:12px;margin:0 0 13px}.legend dl{margin:0}.legend dt{font-size:10px;font-weight:700;color:var(--green);margin-top:12px}.legend dd{font-size:11px;line-height:1.8;color:var(--muted);margin:4px 0 0}.download{display:block;margin-top:22px;padding-top:17px;border-top:1px solid var(--line);font-size:11px}.download a{display:inline-block;padding-block:5px}.noscript{padding:15px;background:#fff5d7;border:1px solid #e5d3a5;border-radius:6px;font-size:12px}
.results{min-width:0}.results-head{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:22px}.results-head p{margin:0;color:var(--muted);font-size:12px}.results-head .small{font-size:10px}.chapter{margin-bottom:34px;scroll-margin-top:94px}.chapter-heading{display:flex;align-items:center;gap:10px;margin:0 0 14px;min-width:0}.chapter-number{display:flex;align-items:center;justify-content:center;width:30px;height:30px;flex:0 0 auto;background:#dee8d7;border-radius:7px;color:var(--green);font-size:11px;font-weight:700}.chapter-heading h2{font-size:17px;letter-spacing:-.025em;margin:0;line-height:1.5}.chapter-count{margin-left:auto;flex:0 0 auto;font-size:10px;color:var(--muted)}.source-card{background:white;border:1px solid var(--line);border-radius:9px;padding:23px 25px;margin-bottom:13px;box-shadow:0 2px 4px #173a3203;scroll-margin-top:90px}.source-card:target{outline:3px solid #a5c987;outline-offset:2px}.card-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0}.item-id{font-size:10px;letter-spacing:.05em;color:var(--muted)}.badge{font-size:10px;padding:2px 7px;background:var(--soft);border-radius:4px;color:var(--green)}.back-item{margin-left:auto;font-size:10px;text-decoration:none;min-height:32px;display:inline-flex;gap:5px;align-items:center}.back-item:hover{text-decoration:underline}.source-card h3{font-size:19px;line-height:1.55;letter-spacing:-.035em;margin:10px 0 10px}.evidence{font-size:12px;line-height:1.9;color:var(--muted);margin:0 0 16px}.source-list{list-style:none;padding:0;margin:0;border-top:1px solid var(--line)}.source-list li{display:flex;gap:11px;padding:13px 0;border-bottom:1px solid #edf0e9}.source-list li:last-child{border-bottom:0;padding-bottom:0}.source-number{font-size:9px;color:#93a18f;line-height:2.6;flex:0 0 16px}.source-body{min-width:0;flex:1}.source-body>a{font-size:12px;font-weight:600;line-height:1.85;text-decoration:none;display:inline-block;padding-block:2px}.source-body>a:hover{text-decoration:underline}.source-meta{display:flex;justify-content:space-between;gap:8px 16px;flex-wrap:wrap;margin-top:3px;font-size:10px;line-height:1.7;color:var(--muted)}.source-meta span{min-width:0}.empty{padding:40px 24px;border:1px dashed #a9bba7;border-radius:9px;text-align:center}.empty h2{font-size:18px;margin:0 0 10px}.empty p{font-size:12px;color:var(--muted);margin:0}.empty button{width:auto;padding-inline:20px}.bottom-note{font-size:11px;color:var(--muted);border-top:1px solid var(--line);padding-top:20px;margin-top:10px}
footer{border-top:1px solid var(--line);padding:25px 0 32px;color:var(--muted);font-size:11px}footer .wrap{display:flex;justify-content:space-between;gap:25px;align-items:start}footer strong{display:block;color:var(--ink);font-size:13px;margin-bottom:5px}footer p{margin:0;max-width:670px}footer a{flex:0 0 auto}
@media(max-width:900px){.hero-grid{grid-template-columns:minmax(0,1fr) 225px;gap:28px}.workspace{grid-template-columns:215px minmax(0,1fr);gap:22px}.source-card{padding:21px}.stats .wrap{gap:24px}.stat.date{margin-left:0}}
@media(max-width:680px){html{scroll-padding-top:78px}.wrap{width:calc(100% - 32px)}.topbar .wrap{min-height:62px;gap:12px}.brand{font-size:14px}.topnav{gap:10px;font-size:11px}.topnav .back{padding-inline:10px}.topnav .github{display:none}.hero .wrap{padding-block:32px 28px}.hero-grid{display:block}.hero h1{font-size:38px;margin-bottom:17px}.hero .intro{font-size:13px}.hero-note{margin-top:22px;padding:15px 17px;font-size:11px}.stats .wrap{gap:5px 22px;padding-block:13px}.stat{font-size:10px}.stat b{font-size:21px}.stat.date{flex-basis:100%;margin-top:5px;font-size:10px}.workspace{display:block;padding-top:23px}.sidebar{position:static;margin-bottom:24px}.filter-title{font-size:16px;margin-bottom:13px}.filter-box{padding:16px}.filter-box fieldset{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}.filter-row+.filter-row{margin-top:0}.filter-row.search{grid-column:1/-1}.filter-box input,.filter-box select{font-size:16px}.reset{margin:0;height:44px;align-self:end}.filter-hint{margin-top:10px}.legend{display:none}.download{margin-top:12px;padding-top:10px;font-size:11px}.results-head{margin-bottom:17px;align-items:start}.results-head .small{max-width:130px;text-align:right}.chapter-heading h2{font-size:16px}.source-card{padding:18px 17px}.source-card h3{font-size:18px}.back-item{font-size:10px;min-height:36px}.source-list li{gap:7px}.source-body>a{font-size:12px;min-height:32px}.source-meta{display:block;font-size:10px}.source-meta span{display:block}.source-meta span+span{margin-top:2px}.evidence{font-size:11px}.chapter{margin-bottom:27px}footer .wrap{display:block}footer a{display:inline-block;margin-top:13px}.bottom-note{font-size:10px}}
@media print{html{scroll-behavior:auto}.topbar,.hero,.stats,.sidebar,.results-head,.back-item,footer,.bottom-note{display:none!important}.wrap{width:100%}.workspace{display:block;padding:0}body{background:white;color:black;font-size:10pt}.chapter-heading{break-after:avoid}.source-card{box-shadow:none;border:0;border-bottom:1px solid #aaa;border-radius:0;padding:12px 0;break-inside:avoid}.source-card h3{font-size:13pt}.source-body>a{color:black}a[data-source]::after{content:" (" attr(href) ")";font-weight:normal;font-size:8pt;overflow-wrap:anywhere}.source-meta{font-size:8pt}.source-number{display:none}.source-list li{padding:8px 0}}
</style>
</head>
<body>
<a class="skip" href="#sources">출처 목록으로 건너뛰기</a>
<header class="topbar"><div class="wrap"><a class="brand" href="index.html">대한민국 생활 치트키</a><nav class="topnav" aria-label="주요 메뉴"><a class="github" href="https://github.com/gerrygao1995-coder/better-life-korea">GitHub ↗</a><a class="back" href="index.html">가이드로 돌아가기 <span aria-hidden="true">↗</span></a></nav></div></header>
<section class="hero"><div class="wrap"><div class="hero-grid"><div><p class="eyebrow">THE SOURCES BEHIND THE GUIDE</p><h1>공식 <span>출처</span></h1><p class="intro">무엇을 근거로 썼는지, 직접 확인하세요.<br>각 생활 항목의 근거 설명과 공식 원문을 한곳에 모았습니다.</p><p class="sub">항목 ID · 제목 · 기관명으로 검색하고, 원문에서 적용 조건을 확인하세요.</p></div><aside class="hero-note"><strong>확인일을 읽는 방법</strong>확인일은 편집 과정에서 자료를 대조한 날짜입니다. 기관의 승인·추천이나 전문가의 심사를 뜻하지 않습니다.</aside></div></div></section>
<section class="stats" aria-label="출처 규모"><div class="wrap"><div class="stat"><b>${items.length}</b>항목별 출처 묶음</div><div class="stat"><b>${uniqueUrls.size}</b>서로 다른 URL</div><div class="stat"><b>${chapters.length}</b>생활 주제</div><div class="stat date">자료 확인 <b>${escape(dateLabel)}</b></div></div></section>
<main class="wrap workspace" id="sources">
<aside class="sidebar" aria-label="출처 검색과 안내"><h2 class="filter-title">궁금한 근거부터 찾아보세요.</h2><form class="filter-box" role="search" id="filter-form"><fieldset id="filter-controls" disabled><legend class="sr-only">출처 검색 조건</legend><div class="filter-row search"><label for="query">키워드 또는 항목 ID</label><input id="query" type="search" autocomplete="off" placeholder="예: 전세, R04, 질병관리청"></div><div class="filter-row"><label for="chapter-filter">생활 주제</label><select id="chapter-filter"><option value="">전체 ${chapters.length}개 주제</option>${chapters.map(chapter => `<option value="${escape(chapter)}">${escape(chapter)}</option>`).join('')}</select></div><button class="reset" id="reset" type="button">검색 조건 초기화</button></fieldset><p class="filter-hint">띄어 쓴 단어는 모두 포함된 항목을 찾습니다. 검색어를 저장하거나 전송하지 않습니다.</p></form><noscript><p class="noscript">검색에는 JavaScript가 필요합니다. 아래의 모든 출처는 그대로 읽고 열 수 있습니다.</p></noscript><div class="legend"><h2>근거는 이렇게 구분했습니다.</h2><dl><dt>공식 지침</dt><dd>공공기관 등의 행동·보건 안내입니다.</dd><dt>제도·법령</dt><dd>신청 요건, 절차, 권리를 설명합니다.</dd><dt>실용 판단</dt><dd>자료를 바탕으로 편집자가 제안한 실행 방법입니다.</dd></dl></div><div class="download"><a href="SOURCES.md" download="SOURCES.md">출처 목록 Markdown 내려받기 ↓</a><br><a href="index.html#reading-policy">가이드의 근거 기준 읽기 ↗</a></div></aside>
<div class="results"><div class="results-head"><p id="result-count" role="status" aria-live="polite">${items.length}개 항목 · ${chapters.length}개 주제</p><p class="small">공식 원문은 새 탭에서 열립니다.</p></div><div class="empty" id="empty" hidden><h2>조건에 맞는 출처가 없습니다.</h2><p>검색어를 줄이거나 전체 주제에서 다시 찾아보세요.</p><button class="reset" type="button" id="empty-reset">전체 출처 보기</button></div><div id="chapters">${sections}</div><p class="bottom-note">공식 자료에 서비스가 소개되어 있다는 사실이 개인의 가입 승인, 계약 안전, 치료효과나 절감액을 보장하지는 않습니다. 금액·자격·기한은 실제 이용일의 공식 안내를 확인하세요.</p></div>
</main>
<footer><div class="wrap"><div><strong>근거를 확인하고, 내 상황에 맞게.</strong><p>대한민국 생활 치트키의 독립 편집 자료입니다. 링크한 기관이 이 가이드를 검토하거나 승인했다는 뜻은 아닙니다.</p></div><a href="https://github.com/gerrygao1995-coder/better-life-korea/blob/main/CONTRIBUTING.md">오류·변경사항 제보 안내 ↗</a></div></footer>
<script>
'use strict';
const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase('ko');
const query = document.getElementById('query');
const chapterFilter = document.getElementById('chapter-filter');
const groups = Array.from(document.querySelectorAll('[data-chapter]')).map(element => ({
  element,
  chapter: element.dataset.chapter,
  cards: Array.from(element.querySelectorAll('[data-item]')).map(card => ({ element: card, search: normalize(card.dataset.search) }))
}));
function filter() {
  const terms = normalize(query.value).trim().split(/\\s+/).filter(Boolean);
  let count = 0;
  let chapterCount = 0;
  for (const group of groups) {
    let visible = 0;
    for (const card of group.cards) {
      const show = (!chapterFilter.value || chapterFilter.value === group.chapter) && terms.every(term => card.search.includes(term));
      card.element.hidden = !show;
      if (show) visible++;
    }
    group.element.hidden = visible === 0;
    group.element.querySelector('.chapter-count').textContent = visible + '개 항목';
    count += visible;
    if (visible) chapterCount++;
  }
  document.getElementById('result-count').textContent = count + ' / ${items.length}개 항목 · ' + chapterCount + '개 주제';
  document.getElementById('empty').hidden = count !== 0;
}
function reset() {
  query.value = '';
  chapterFilter.value = '';
  filter();
  query.focus();
}
document.getElementById('filter-controls').disabled = false;
document.getElementById('filter-form').addEventListener('submit', event => { event.preventDefault(); filter(); });
query.addEventListener('input', filter);
chapterFilter.addEventListener('change', filter);
document.getElementById('reset').addEventListener('click', reset);
document.getElementById('empty-reset').addEventListener('click', reset);
filter();
</script>
</body>
</html>`;
fs.writeFileSync(path.join(root, 'sources.html'), html, 'utf8');
console.log(JSON.stringify({ output: 'sources.html', items: items.length, chapters: chapters.length, uniqueSources: uniqueUrls.size, bytes: Buffer.byteLength(html) }, null, 2));
