import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/^\uFEFF/,'');
const write=(name,text)=>{const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text,'utf8');};
const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const items=JSON.parse(read('data/guide.json')).sort((a,b)=>a.chapter.localeCompare(b.chapter)||a.id.localeCompare(b.id,undefined,{numeric:true}));
const routes=JSON.parse(read('data/routes.json'));
const ids=new Set(),required=['id','chapter','title','priority','cost','time','action','benefit','conditions','evidence'];
for(const item of items){
  for(const key of required)if(typeof item[key]!=='string'||!item[key].trim())throw Error(item.id+': invalid '+key);
  if(!/^[A-Z]{1,3}\d{2}$/.test(item.id)||ids.has(item.id))throw Error('Invalid or duplicate ID '+item.id);
  if(!/^\d{2} /.test(item.chapter))throw Error('Invalid chapter '+item.chapter);
  if(!['먼저','해당할 때','꾸준히'].includes(item.priority))throw Error('Priority '+item.id);
  if(!Array.isArray(item.sources)||!item.sources.length)throw Error('Sources '+item.id);
  for(const source of item.sources){if(!source.title||!/^https?:\/\//.test(source.url)||!/^\d{4}-\d{2}-\d{2}$/.test(source.checked))throw Error('Invalid source '+item.id);}
  ids.add(item.id);
}
const routeKeys=new Set();
for(const route of routes){if(!route.key||routeKeys.has(route.key)||!route.title||!route.description||!Array.isArray(route.ids)||!route.ids.length)throw Error('Invalid route '+route.key);for(const id of route.ids)if(!ids.has(id))throw Error('Missing route item '+id);if(new Set(route.ids).size!==route.ids.length)throw Error('Duplicate in route '+route.key);routeKeys.add(route.key);}
const chapters=[...new Set(items.map(i=>i.chapter))].sort(),sourceUrls=[...new Set(items.flatMap(i=>i.sources.map(s=>s.url)))],byId=new Map(items.map(i=>[i.id,i]));
const slug=chapter=>'chapter-'+chapter.slice(0,2);
const evidenceType=item=>item.evidence.startsWith('실용')?'실용 판단':item.evidence.startsWith('제도')||item.evidence.startsWith('법령')?'제도·법령':'공식 지침';
function itemMarkdown(i){return '<a id="'+i.id.toLowerCase()+'"></a>\n\n### '+i.id+' '+i.title+'\n\n**실행 시점: '+i.priority+'**\n\n'+i.action+'\n\n- **비용:** '+i.cost+'\n- **예상 시간:** '+i.time+'\n- **기대효과:** '+i.benefit+'\n- **적용 조건:** '+i.conditions+'\n- **근거:** '+i.evidence+'\n\n**출처**\n\n'+i.sources.map(s=>'- ['+s.title+']('+s.url+') · 확인 '+s.checked).join('\n')+'\n';}
let guide=read('INTRO.ko.md')+'\n\n## 전체 목차\n\n'+chapters.map(c=>'- ['+c+'](#'+slug(c)+')').join('\n')+'\n\n';
for(const chapter of chapters){const body=items.filter(i=>i.chapter===chapter).map(itemMarkdown).join('\n\n');guide+='<a id="'+slug(chapter)+'"></a>\n\n## '+chapter+'\n\n'+body+'\n\n';write('book/'+slug(chapter)+'.md','# '+chapter+'\n\n[전체 안내](../README.md) · [상황별 길잡이](../PLAYBOOKS.ko.md) · [통합 본문](../GUIDE.ko.md)\n\n시간은 별도 설명이 없으면 편집상 추정치입니다. 자격·금액·기한은 신청 시 공식 안내를 확인하세요.\n\n'+body+'\n');}
guide+='\n[원작 출처 및 변경 내역](ATTRIBUTION.md) · [전체 출처 목록](SOURCES.md)\n';write('GUIDE.ko.md',guide);
let sources='# 항목별 공식 출처\n\n'+items.length+'개 항목 · '+sourceUrls.length+'개의 서로 다른 URL · 편집 기준 2026-10-09\n\n각 링크가 뒷받침하는 내용은 본문에서 설명합니다. 공식 서비스가 존재한다는 사실이 제안한 행동의 절감액·치료효과를 입증하는 것은 아닙니다. 확인일은 자료를 대조한 날짜이며 게시일·시행일과 다릅니다. 로그인·스크립트·접속 제한으로 외부 읽기가 제한되는 페이지는 신청 당일 해당 기관에서 다시 확인하세요.\n\n';
for(const i of items)sources+='## '+i.id+' '+i.title+'\n\n'+i.sources.map(s=>'- ['+s.title+']('+s.url+') · 확인 '+s.checked).join('\n')+'\n\n';write('SOURCES.md',sources);
let playbooks='# 상황이 생겼을 때, 이 순서로\n\n12가지 상황에서 관련 항목을 묶어 읽는 길잡이입니다. 순서는 편집상 제안이며, 상황에 따라 긴급한 안전·의료 대응과 신청기한 확인이 먼저입니다. 큰 위험이 있으면 112·119에 신고하고 현장 지시를 따르세요.\n\n[전체 가이드](README.md) · [온라인에서 선택하기](https://gerrygao1995-coder.github.io/better-life-korea/)\n\n';
for(const r of routes)playbooks+='## '+r.title+'\n\n'+r.description+'\n\n'+r.ids.map((id,n)=>{const i=byId.get(id);return(n+1)+'. ['+id+' '+i.title+'](book/'+slug(i.chapter)+'.md#'+id.toLowerCase()+')';}).join('\n')+'\n\n';write('PLAYBOOKS.ko.md',playbooks);
const field=(label,value)=>'<div class="field"><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>';
const cards=items.map(i=>'<article class="entry" id="'+i.id.toLowerCase()+'" data-id="'+i.id+'" data-evidence="'+evidenceType(i)+'"><div class="meta"><span>'+esc(i.chapter)+'</span><span class="pill'+(i.priority==='먼저'?' urgent':'')+'">'+i.priority+'</span><span class="pill">'+evidenceType(i)+'</span></div><h3><span class="id">'+i.id+'</span>'+esc(i.title)+'</h3><p class="action">'+esc(i.action)+'</p><dl class="costs">'+field('비용',i.cost)+field('예상 시간',i.time)+'</dl><dl>'+field('기대효과',i.benefit)+field('적용 조건',i.conditions)+'</dl><details class="entry-details"><summary>근거 · 공식 출처 확인하기</summary><dl>'+field('근거',i.evidence)+'</dl><ul class="sources">'+i.sources.map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' ↗</a><small>확인 '+s.checked+'</small></li>').join('')+'</ul></details><div class="entry-foot"><button data-save aria-pressed="false" aria-label="'+i.id+' 저장">☆ 저장</button><button data-done aria-pressed="false" aria-label="'+i.id+' 완료 표시">○ 완료 표시</button><button class="share" data-share aria-label="'+i.id+' 공유 링크 복사">링크 공유 ↗</button></div></article>').join('\n');
const routeCards=routes.map((r,n)=>'<article class="routecard"><span class="num">LIFE ROUTE / '+String(n+1).padStart(2,'0')+'</span><h3>'+esc(r.title)+'</h3><p>'+esc(r.description)+'</p><button data-route="'+esc(r.key)+'">'+r.ids.length+'가지 순서로 읽기 →</button><small>비용 · 조건 · 공식 출처를 함께 확인</small></article>').join('\n');
const inject={'__COUNT__':items.length,'__CHAPTER_COUNT__':chapters.length,'__SOURCE_COUNT__':sourceUrls.length,'__CHAPTER_OPTIONS__':chapters.map(c=>'<option>'+esc(c)+'</option>').join(''),'__CARDS__':cards,'__ROUTE_CARDS__':routeCards,'__DATA__':JSON.stringify(items).replace(/</g,'\\u003c'),'__ROUTES__':JSON.stringify(routes).replace(/</g,'\\u003c'),'__CHAPTER_TABLE__':chapters.map(c=>'| ['+c+'](book/'+slug(c)+'.md) | '+items.filter(i=>i.chapter===c).length+' |').join('\n')};
const render=source=>source.replace(/__[A-Z_]+__/g,key=>{if(!(key in inject))throw Error('Unknown template token '+key);return inject[key];});
const html=render(read('tools/reader.html'));write('index.html',html);write('README.md',render(read('tools/readme-template.md')));
write('robots.txt','User-agent: *\nAllow: /\nSitemap: https://gerrygao1995-coder.github.io/better-life-korea/sitemap.xml\n');
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['','jeonse.html','sources.html','feedback.html'].map(p=>'<url><loc>https://gerrygao1995-coder.github.io/better-life-korea/'+p+'</loc><lastmod>2026-10-09</lastmod></url>').join('')+'</urlset>\n');
await import('./build-jeonse.mjs');
await import('./build-sources.mjs');
console.log(JSON.stringify({items:items.length,chapters:chapters.length,uniqueSources:sourceUrls.length,routes:routes.length,htmlBytes:Buffer.byteLength(html)},null,2));
