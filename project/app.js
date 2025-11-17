function launchApp() {
  window.open("popup.html", "_blank");
}

const proxy = "https://corsproxy.io/?";
const historyStack = [];
let historyIndex = -1;

async function loadBobURL(url = null, pushHistory = true) {
  if (!url) url = document.getElementById("url").value;
  if (!url) return alert("URLを入力してね");

  document.getElementById("spinner").style.display = "inline";

  try {
    const res = await fetch(proxy + encodeURIComponent(url));
    let html = await res.text();

    html = html.replace(/(src|href|srcset)=["'](http[^"']+)["']/g,
      (m, a, link) => `${a}="${proxy + encodeURIComponent(link)}"`);

    html = html.replace(/<script\s+src=["'](http[^"']+)["']/g,
      (m, link) => `<script src="${proxy + encodeURIComponent(link)}"`);

    html = html.replace(/<a\s+([^>]*?)href=["'](http[^"']+)["']/g,
      (m, attrs, link) =>
        `<a ${attrs} href="javascript:void(0)" onclick="parent.loadBobURLForLink('${link}')"`);

    html = html.replace(/<form\s+([^>]*?)action=["'](http[^"']+)["']/g,
      (m, attrs, link) =>
        `<form ${attrs} onsubmit="parent.loadBobURLForLink(this.action); return false;"`);

    const iframe = document.getElementById("viewer");
    iframe.srcdoc = html;

    iframe.onload = () => {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const observer = new MutationObserver(() => {
        const links = doc.querySelectorAll('a[href^="http"]');
        links.forEach(a => a.onclick = e => {
          e.preventDefault();
          loadBobURLForLink(a.href);
        });

        const forms = doc.querySelectorAll('form[action^="http"]');
        forms.forEach(f => f.onsubmit = e => {
          e.preventDefault();
          loadBobURLForLink(f.action);
        });
      });
      observer.observe(doc.body, { childList: true, subtree: true });
    };

    if (pushHistory) {
      historyStack.splice(historyIndex + 1);
      historyStack.push(url);
      historyIndex++;
    }

    document.getElementById("url").value = url;
  } catch (err) {
    alert("取得失敗: " + err);
  } finally {
    document.getElementById("spinner").style.display = "none";
  }
}

function loadBobURLForLink(url) { loadBobURL(url, true); }
function goBack() { if (historyIndex > 0) { historyIndex--; loadBobURL(historyStack[historyIndex], false); } }
function goForward() { if (historyIndex < historyStack.length - 1) { historyIndex++; loadBobURL(historyStack[historyIndex], false); } }
function reloadPage() { if (historyIndex >= 0) loadBobURL(historyStack[historyIndex], false); else loadBobURL(); }

document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url");
  if (urlInput) {
    urlInput.addEventListener("keypress", e => {
      if (e.key === "Enter") loadBobURL();
    });
  }
});
