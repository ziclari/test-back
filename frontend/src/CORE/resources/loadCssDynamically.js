export function loadCssDynamically(href) {
    const existing = document.querySelector(`link[data-dynamic-css="${href}"]`);
    if (existing) return;
  
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-dynamic-css", href);
  
    document.head.appendChild(link);
  
    return () => {
      const current = document.querySelector(`link[data-dynamic-css="${href}"]`);
      if (current) current.remove();
    };
  }
  