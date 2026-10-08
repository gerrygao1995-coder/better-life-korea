// Optional build dependency: npm install --no-save sharp
// SHARP_MODULE_PATH may point to a locally provided sharp package entry.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sharp=(await import(process.env.SHARP_MODULE_PATH?pathToFileURL(process.env.SHARP_MODULE_PATH).href:'sharp')).default;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const texts=(lines,x,y,size,color='#183b34',weight=500,spacing=1.38)=>lines.map((s,i)=>`<text x="${x}" y="${y+i*size*spacing}" fill="${color}" font-size="${size}" font-weight="${weight}">${esc(s)}</text>`).join('');
const sheet=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style>text{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;letter-spacing:-1px}</style>${body}</svg>`;
const cards=[
 {kicker:'계약 전부터 계약 종료까지',title:['전세 계약 전,','보증금부터','확인하세요.'],rows:[['01 계약 전','집·권리관계·가격·세금 확인'],['02 계약 체결','상대방·대리권·계약 조건 확인'],['03 잔금과 입주','권리 변동·인도·신고 절차 확인'],['04 계약 종료','반환 일정·미반환 대응 확인']]},
 {kicker:'계약 전 / 상대와 서류',title:['서명하는 사람과','등기상 권리부터.'],rows:[['계약 상대','명의·대리권·신탁 관계 확인'],['집과 권리','등기부와 건축물대장 대조'],['앞선 부담','세금·선순위 보증금 자료 확인']],extra:['설명이 맞지 않거나 자료 확인이 어렵다면,','송금을 서두르지 말고 먼저 확인하세요.']},
 {kicker:'계약과 잔금 / 조건 다시 확인',title:['가입 조건은 미리.','잔금 전에는 다시.'],rows:[['보증기관에 확인','내 주택·보증금·계약의 가입 조건'],['예외도 확인','신탁·위반건축물 등 제한 여부'],['잔금 직전 확인','계약 이후 등기상 권리 변동']],extra:['가입 가능 안내와 최종 승인은 다릅니다.','반환보증이 모든 손해를 보장하지는 않습니다.']},
 {kicker:'입주와 계약 종료 / 마지막까지',title:['입주가 끝나도,','확인은 계속됩니다.'],rows:[['입주할 때','주택 인도·전입신고·확정일자 확인'],['권리가 생기는 때','신고와 법적 효력 발생 시점 구분'],['보증금을 못 받았다면','이사·전출 전 필요한 절차 상담']],extra:['보증금이 돌아오지 않은 상태에서 이사한다면,','권리를 지키는 절차를 먼저 확인하세요.']}
];
for(const [i,c] of cards.entries()){
 const dark=i===0;
 const titleY=238, titleSize=i===0?78:67;
 const rowStart=i===0?655:535;
 let body=`<rect width="1080" height="1350" fill="${dark?'#183b34':'#f4f3ed'}"/><rect x="64" y="62" width="46" height="8" rx="4" fill="${dark?'#d9ef98':'#28684f'}"/>`;
 body+=texts(['대한민국 생활 치트키'],64,117,27,dark?'#f4f3ed':'#183b34',800);
 body+=texts(['LIFE CHECKLIST / 01     '+String(i+1).padStart(2,'0')+' OF 04'],64,163,18,dark?'#bed2c4':'#63756b');
 body+=texts(c.title,64,titleY,titleSize,dark?'#d9ef98':'#183b34',800,1.32);
 body+=texts([c.kicker],67,titleY+c.title.length*titleSize*1.32+18,26,dark?'#dce7dc':'#627168');
 c.rows.forEach((r,n)=>{const y=rowStart+n*(i===0?102:126);body+=`<line x1="64" x2="1016" y1="${y-34}" y2="${y-34}" stroke="${dark?'#557469':'#ced8cd'}"/>`;body+=texts([r[0]],67,y,23,dark?'#d9ef98':'#28684f',700);body+=texts([r[1]],67,y+45,34,dark?'#f4f3ed':'#183b34',600);});
 if(c.extra)body+=texts(c.extra,67,1013,25,'#627168',500,1.7);
 body+=`<rect x="0" y="1156" width="1080" height="194" fill="${dark?'#d9ef98':'#e3eadc'}"/>`;
 body+=texts(['전체 10가지 확인과 공식 출처 →'],64,1207,29,'#183b34',800);
 body+=texts(['gerrygao1995-coder.github.io/better-life-korea/jeonse.html'],64,1248,21,'#183b34',500);
 body+=texts(['계약 안전·보증금 반환을 보장하지 않습니다.   자료 확인 2026.10.09'],64,1305,19,'#425e4e',500);
 await sharp(Buffer.from(sheet(1080,1350,body))).png().toFile(path.join(root,'jeonse-card-0'+(i+1)+'.png'));
}
let og='<rect width="1200" height="630" fill="#183b34"/><rect x="50" y="42" width="46" height="7" rx="3" fill="#d9ef98"/>';
og+=texts(['대한민국 생활 치트키  /  전세 체크리스트'],50,93,24,'#d3e1d5',700);
og+=texts(['전세 계약 전,','보증금부터 확인하세요.'],50,206,63,'#d9ef98',800,1.34);
og+=texts(['계약 전 → 계약 체결 → 잔금과 입주 → 계약 종료'],54,397,28,'#f4f3ed',500);
og+='<line x1="50" x2="1150" y1="456" y2="456" stroke="#557469"/>';
og+=texts(['10가지 확인 항목 · 공식 출처 · 무료 체크리스트'],54,511,30,'#f4f3ed',700);
og+=texts(['계약 안전·보증금 반환을 보장하지 않습니다.  |  2026.10.09'],54,568,21,'#bfd2c3');
await sharp(Buffer.from(sheet(1200,630,og))).png().toFile(path.join(root,'jeonse-preview.png'));
console.log('Built four 1080 × 1350 share cards and one 1200 × 630 preview.');
