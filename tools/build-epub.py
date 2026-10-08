"""Build a Korean EPUB 3 with the Python standard library; run from any directory."""
from pathlib import Path
from html import escape
import json
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
items = json.loads((ROOT / "data/guide.json").read_text(encoding="utf-8-sig"))
chapters = sorted({i["chapter"] for i in items})
TITLE = "대한민국 생활 치트키"
CSS = """body{font-family:sans-serif;line-height:1.7;margin:5%;word-break:normal}h1{font-size:1.8em}h2{font-size:1.25em;margin-top:2em}h3{font-size:1em}a{color:#276b52}dt{font-weight:bold;margin-top:1em}dd{margin-left:0}li{margin-bottom:.5em}.small{font-size:.8em;color:#555}.cover{width:100%;height:auto}"""

def doc(title, body):
    return ('<?xml version="1.0" encoding="UTF-8"?>'
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ko" xml:lang="ko">'
            '<head><title>' + escape(title) + '</title><link rel="stylesheet" type="text/css" href="style.css"/></head>'
            '<body>' + body + '</body></html>')

files = {"style.css": CSS}
files["title.xhtml"] = doc(TITLE, '<img class="cover" src="cover.png" alt="대한민국 생활 치트키"/><h1>'+TITLE+
    '</h1><p>몰라서 새는 돈, 미뤄서 생기는 손해. 한국에서 덜 쓰고 더 잘 사는 법.</p><p>'+
    str(len(chapters))+'개 주제 · '+str(len(items))+'개 실천 항목 · 편집 기준 2026-10-09</p>'+
    '<p>각 항목의 비용·시간은 설명된 조건에 따라 달라집니다. 별도 설명이 없는 시간은 편집상 예상입니다. 지원금·기한·자격은 신청일의 공식 안내로 확인하세요.</p>'+
    '<p>공식 지침은 기관 권고, 제도·법령은 자격과 절차, 실용 판단은 편집상 실행 제안입니다. 항목의 실행 시점은 과학적으로 계산한 효과 순위가 아닙니다.</p>'+
    '<p>응급상황에서는 비용 비교보다 112·119 신고와 현장 지시가 먼저입니다.</p>'+
    '<p><a href="https://gerrygao1995-coder.github.io/better-life-korea/">최신 온라인판</a> · '+
    '<a href="https://github.com/gerrygao1995-coder/better-life-korea">저장소</a></p>'+
    '<p>원작: <a href="https://github.com/eternity4719/HowToLiveBetter">eternity4719/HowToLiveBetter</a>. 비용·효과·근거의 형식을 참고해 한국의 제도·사례·출처로 재구성한 독립 현지화·확장판입니다. 원작 전체의 일대일 번역이나 원작자의 공식 승인을 뜻하지 않습니다.</p>'+
    '<p>본문 <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. 본문을 재사용하면 출처와 라이선스, 변경 사실을 표시하세요. 코드 MIT.</p>')
nav = '<h1>목차</h1><nav epub:type="toc" id="toc"><ol><li><a href="title.xhtml">읽기 전에</a></li>'
spine = ["title.xhtml", "nav.xhtml"]
for chapter in chapters:
    name = "chapter-" + chapter[:2] + ".xhtml"
    selected = [i for i in items if i["chapter"] == chapter]
    nav += '<li><a href="'+name+'">'+escape(chapter)+'</a><ol>'
    body = '<h1>'+escape(chapter)+'</h1>'
    for i in selected:
        anchor = i["id"].lower()
        nav += '<li><a href="'+name+'#'+anchor+'">'+escape(i["id"]+" "+i["title"])+'</a></li>'
        body += '<section id="'+anchor+'"><h2>'+escape(i["id"]+" "+i["title"])+'</h2><p class="small">실행 시점: '+escape(i["priority"])+'</p><p>'+escape(i["action"])+'</p><dl>'
        for label,key in [("비용","cost"),("예상 시간","time"),("기대효과","benefit"),("적용 조건","conditions"),("근거","evidence")]:
            body += '<dt>'+label+'</dt><dd>'+escape(i[key])+'</dd>'
        body += '</dl><h3>출처</h3><ul>'
        for s in i["sources"]:
            body += '<li><a href="'+escape(s["url"],quote=True)+'">'+escape(s["title"])+'</a> · 확인 '+escape(s["checked"])+'</li>'
        body += '</ul></section>'
    nav += '</ol></li>'
    files[name] = doc(chapter, body)
    spine.append(name)
nav += '</ol></nav>'
files["nav.xhtml"] = doc("목차", nav)
manifest = []
for n in files:
    mime = "text/css" if n.endswith(".css") else "application/xhtml+xml"
    props = ' properties="nav"' if n == "nav.xhtml" else ""
    manifest.append('<item id="'+n+'" href="'+n+'" media-type="'+mime+'"'+props+'/>')
manifest.append('<item id="cover-image" href="cover.png" media-type="image/png" properties="cover-image"/>')
opf = ('<?xml version="1.0" encoding="UTF-8"?>'
       '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
       '<dc:identifier id="bookid">https://github.com/gerrygao1995-coder/better-life-korea</dc:identifier>'
       '<dc:title>'+TITLE+'</dc:title><dc:language>ko</dc:language><dc:creator>Better Life Korea contributors</dc:creator>'
       '<dc:rights>CC BY 4.0. Original inspiration: eternity4719/HowToLiveBetter; independently localized and expanded.</dc:rights>'
       '<meta property="dcterms:modified">2026-10-09T00:00:00Z</meta></metadata><manifest>'+''.join(manifest)+'</manifest><spine>'+
       ''.join('<itemref idref="'+n+'"/>' for n in spine)+'</spine></package>')
container = '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'
for n,content in list(files.items())+[("package.opf",opf),("container.xml",container)]:
    if n.endswith((".xhtml",".opf",".xml")):
        ET.fromstring(content)
target = ROOT / "better-life-korea.epub"
with zipfile.ZipFile(target,"w") as z:
    z.writestr("mimetype","application/epub+zip",compress_type=zipfile.ZIP_STORED)
    z.writestr("META-INF/container.xml",container,compress_type=zipfile.ZIP_DEFLATED)
    z.writestr("EPUB/package.opf",opf,compress_type=zipfile.ZIP_DEFLATED)
    for name,content in files.items():
        z.writestr("EPUB/"+name,content,compress_type=zipfile.ZIP_DEFLATED)
    z.write(ROOT/"social-preview.png","EPUB/cover.png",compress_type=zipfile.ZIP_DEFLATED)
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
print(json.dumps({"epub":str(target),"chapters":len(chapters),"items":len(items),"bytes":target.stat().st_size},ensure_ascii=False))
