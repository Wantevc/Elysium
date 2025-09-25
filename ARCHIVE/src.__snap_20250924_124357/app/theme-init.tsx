// src/app/theme-init.tsx
export default function ThemeInit() {
  const code = `(function(){
    try{
      var pref = localStorage.getItem('ui.theme') || 'system';
      function applyTheme(){
        var dark = (pref === 'dark') || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', !!dark);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      }
      applyTheme();
      if (pref === 'system') {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.addEventListener) mq.addEventListener('change', applyTheme);
        else if (mq.addListener) mq.addListener(applyTheme);
      }
    }catch(e){}
  })();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
