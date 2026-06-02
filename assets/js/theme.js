(function () {
    'use strict';

    function persistLightTheme() {
        try {
            localStorage.setItem('theme', 'light');
        } catch (error) {}
    }

    function applyLightTheme() {
        if (document.documentElement.getAttribute('data-theme') !== 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        if (document.body) {
            if (!document.body.classList.contains('light-theme')) {
                document.body.classList.add('light-theme');
            }
        }
        window.__currentTheme = 'light';
    }

    function keepLightTheme() {
        const htmlObserver = new MutationObserver(applyLightTheme);
        htmlObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        if (document.body) {
            const bodyObserver = new MutationObserver(applyLightTheme);
            bodyObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    window.__setTheme = function () {
        persistLightTheme();
        applyLightTheme();
        return 'light';
    };

    persistLightTheme();
    applyLightTheme();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            applyLightTheme();
            keepLightTheme();
        });
    } else {
        applyLightTheme();
        keepLightTheme();
    }

    window.addEventListener('load', applyLightTheme);
    window.addEventListener('pageshow', applyLightTheme);
})();
