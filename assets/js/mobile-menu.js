/**
 * Denali Tech - Mobile Menu Toggle
 * Shared mobile menu functionality for all pages
 * Version: 1.0.0
 * Date: January 8, 2025
 */

(function() {
    'use strict';

    const MOBILE_MENU_BREAKPOINT = 1100;
    
    // Initialize mobile menu when DOM is ready
    function initMobileMenu() {
        // Enhanced Mobile Menu Toggle - MUST run first, before any early returns
        const menuToggle = document.getElementById('menuToggle') || document.getElementById('menu-toggle');
        const navLinks = document.getElementById('navLinks');
        const desktopThemeToggle = document.getElementById('theme-toggle-switch');

        function ensureMobileThemeToggle() {
            if (!navLinks || !desktopThemeToggle || navLinks.querySelector('.mobile-theme-toggle')) {
                return;
            }

            const themeItem = document.createElement('li');
            themeItem.className = 'mobile-theme-toggle';
            themeItem.innerHTML = `
                <button type="button" class="mobile-theme-toggle-btn" aria-label="Toggle theme">
                    <span class="mobile-theme-toggle-icon mobile-theme-toggle-icon-moon" aria-hidden="true">☾</span>
                    <span class="mobile-theme-toggle-switch" aria-hidden="true"></span>
                    <span class="mobile-theme-toggle-icon mobile-theme-toggle-icon-sun" aria-hidden="true">☀</span>
                </button>
            `;

            const callButton = navLinks.querySelector('.mobile-call-btn');
            if (callButton) {
                navLinks.insertBefore(themeItem, callButton);
            } else {
                navLinks.appendChild(themeItem);
            }

            const mobileThemeButton = themeItem.querySelector('button');
            const syncThemeState = () => {
                const isLight = document.body.classList.contains('light-theme') || document.documentElement.getAttribute('data-theme') === 'light';
                mobileThemeButton.setAttribute('aria-checked', isLight ? 'light' : 'dark');
            };

            mobileThemeButton.addEventListener('click', () => {
                desktopThemeToggle.click();
                syncThemeState();
            });

            syncThemeState();

            const observer = new MutationObserver(syncThemeState);
            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }

        ensureMobileThemeToggle();
        
        // Create backdrop overlay if it doesn't exist
        let backdrop = document.querySelector('.mobile-menu-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'mobile-menu-backdrop';
            document.body.appendChild(backdrop);
        }
        
        function openMenu() {
            if (navLinks) navLinks.classList.add('active');
            if (menuToggle) menuToggle.classList.add('active');
            backdrop.classList.add('active');
            document.body.classList.add('menu-open');
        }
        
        function closeMenu() {
            if (navLinks) navLinks.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
            backdrop.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
        
        // Only proceed if menu elements exist
        if (menuToggle && navLinks) {
            // Toggle menu on button click
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (navLinks.classList.contains('active')) {
                    closeMenu();
                } else {
                    openMenu();
                }
            });

            // Close menu when clicking backdrop
            backdrop.addEventListener('click', () => {
                closeMenu();
            });

            // Close menu when clicking a link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    closeMenu();
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (navLinks.classList.contains('active') && 
                    !navLinks.contains(e.target) && 
                    !menuToggle.contains(e.target) &&
                    !backdrop.contains(e.target)) {
                    closeMenu();
                }
            });
            
            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                    closeMenu();
                }
            });
            
            // Close menu on window resize (if resizing to desktop)
            window.addEventListener('resize', () => {
                if (window.innerWidth > MOBILE_MENU_BREAKPOINT && navLinks.classList.contains('active')) {
                    closeMenu();
                }
            });
        }
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        // DOM already loaded, run immediately
        initMobileMenu();
    }
})();
