(function () {
    'use strict';

    var videos = Array.prototype.slice.call(document.querySelectorAll('[data-service-video]'));
    if (!videos.length) return;

    var stories = Array.prototype.slice.call(document.querySelectorAll('.svc-story'));
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visibility = new Map();
    var activeStory = null;

    function loadVideo(video) {
        if (video.dataset.loaded === 'true') return;

        var source = video.querySelector('source[data-src]');
        if (!source) return;

        source.src = source.dataset.src;
        source.removeAttribute('data-src');
        video.dataset.loaded = 'true';
        video.load();
    }

    function stopVideo(video) {
        if (!video.paused) video.pause();
    }

    function playVideo(video) {
        if (reducedMotion || document.hidden) return;
        loadVideo(video);
        var playback = video.play();
        if (playback && typeof playback.catch === 'function') {
            playback.catch(function () {
                /* The poster remains visible if a browser blocks autoplay. */
            });
        }
    }

    function setActiveStory(nextStory) {
        if (activeStory === nextStory) return;

        activeStory = nextStory;
        stories.forEach(function (story) {
            var isActive = story === nextStory;
            var video = story.querySelector('[data-service-video]');
            story.classList.toggle('is-active', isActive);

            if (!video) return;
            if (isActive) playVideo(video);
            else stopVideo(video);
        });
    }

    function chooseActiveStory() {
        var bestStory = null;
        var bestRatio = 0;

        visibility.forEach(function (ratio, story) {
            if (ratio > bestRatio) {
                bestRatio = ratio;
                bestStory = story;
            }
        });

        setActiveStory(bestRatio >= 0.2 ? bestStory : null);
    }

    if ('IntersectionObserver' in window) {
        var preloadObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var video = entry.target.querySelector('[data-service-video]');
                if (video) loadVideo(video);
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '550px 0px' });

        var storyObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                visibility.set(entry.target, entry.intersectionRatio);
            });
            chooseActiveStory();
        }, { threshold: [0, 0.2, 0.35, 0.5, 0.7] });

        stories.forEach(function (story) {
            preloadObserver.observe(story);
            storyObserver.observe(story);
        });
    } else {
        videos.forEach(loadVideo);
        if (stories[0]) setActiveStory(stories[0]);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            videos.forEach(stopVideo);
        } else if (activeStory) {
            var activeVideo = activeStory.querySelector('[data-service-video]');
            if (activeVideo) playVideo(activeVideo);
        }
    });
})();
