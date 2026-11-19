try { var t = localStorage.getItem('datahub-tema'); document.documentElement.dataset.theme = t === 'dark' ? 'dark' : 'light' } catch (e) { document.documentElement.dataset.theme = 'light' }
