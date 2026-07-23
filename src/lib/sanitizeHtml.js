// Sanitizes untrusted HTML before rendering via dangerouslySetInnerHTML.
// Removes script-capable elements, event handler attributes, and javascript: URLs.

const BLOCKED_TAGS = new Set([
  "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "FORM",
  "LINK", "META", "BASE", "APPLET", "FRAME", "FRAMESET",
]);

const URL_ATTRS = new Set(["href", "src", "xlink:href", "formaction", "action"]);

export function sanitizeHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  const walk = (node) => {
    const children = Array.from(node.children);
    for (const el of children) {
      if (BLOCKED_TAGS.has(el.tagName)) {
        el.remove();
        continue;
      }
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
        } else if (URL_ATTRS.has(name)) {
          const val = attr.value.replace(/[\s\u0000-\u001f]/g, "").toLowerCase();
          if (val.startsWith("javascript:") || val.startsWith("vbscript:") || (val.startsWith("data:") && !val.startsWith("data:image/"))) {
            el.removeAttribute(attr.name);
          }
        }
      }
      walk(el);
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
}