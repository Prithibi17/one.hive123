(function () {
    const theme = localStorage.getItem('onhive-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    // Inject CSS immediately to prevent flash of both icons
    const style = document.createElement('style');
    style.textContent = theme === 'light'
        ? '.theme-sun { display: none !important; } .theme-moon { display: inline-block !important; }'
        : '.theme-moon { display: none !important; } .theme-sun { display: inline-block !important; }';
    document.head ? document.head.appendChild(style) : document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));

    window.toggleTheme = function () {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('onhive-theme', newTheme);
        // Update injected style & all icons
        style.textContent = newTheme === 'light'
            ? '.theme-sun { display: none !important; } .theme-moon { display: inline-block !important; }'
            : '.theme-moon { display: none !important; } .theme-sun { display: inline-block !important; }';
    }

    // MutationObserver not needed — CSS rules cover dynamically added icons automatically
})();
