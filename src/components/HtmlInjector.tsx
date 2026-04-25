import { useEffect, useRef } from 'react';

function injectHtmlWithScripts(target: HTMLElement, html: string): Element[] {
  target.innerHTML = '';
  const trimmed = html.trim();
  if (!trimmed) return [];

  const template = document.createElement('template');
  template.innerHTML = trimmed;

  const created: Element[] = [];
  const walk = (node: Node, parent: Element) => {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'SCRIPT') {
      const original = node as HTMLScriptElement;
      const script = document.createElement('script');
      for (const attr of Array.from(original.attributes)) {
        script.setAttribute(attr.name, attr.value);
      }
      script.text = original.text;
      parent.appendChild(script);
      created.push(script);
    } else {
      const clone = node.cloneNode(false);
      parent.appendChild(clone);
      if (clone.nodeType === Node.ELEMENT_NODE) {
        for (const child of Array.from(node.childNodes)) {
          walk(child, clone as Element);
        }
        created.push(clone as Element);
      }
    }
  };

  for (const child of Array.from(template.content.childNodes)) {
    walk(child, target);
  }
  return created;
}

export function InlineHtml({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    injectHtmlWithScripts(el, html);
    return () => {
      el.innerHTML = '';
    };
  }, [html]);
  return <div ref={ref} className={className} />;
}

export function HeadInjector({ html }: { html: string }) {
  useEffect(() => {
    if (!html.trim()) return;
    const container = document.createElement('div');
    const created = injectHtmlWithScripts(container, html);
    const moved: Element[] = [];
    for (const el of created) {
      if (el.parentElement === container) {
        document.head.appendChild(el);
        moved.push(el);
      }
    }
    return () => {
      for (const el of moved) {
        if (el.parentElement === document.head) document.head.removeChild(el);
      }
    };
  }, [html]);
  return null;
}

export function BodyInjector({ html }: { html: string }) {
  useEffect(() => {
    if (!html.trim()) return;
    const container = document.createElement('div');
    const created = injectHtmlWithScripts(container, html);
    const moved: Element[] = [];
    for (const el of created) {
      if (el.parentElement === container) {
        document.body.appendChild(el);
        moved.push(el);
      }
    }
    return () => {
      for (const el of moved) {
        if (el.parentElement === document.body) document.body.removeChild(el);
      }
    };
  }, [html]);
  return null;
}
