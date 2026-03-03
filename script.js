document.addEventListener('DOMContentLoaded', () => {
    const projects = document.querySelectorAll('.project-media');

    // Heuristic for mobile/metered network
    const isMetered = () => {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            // saveData is a good indicator, as is 'cellular' 2g/3g
            return conn.saveData || (conn.type === 'cellular' && (conn.effectiveType === '2g' || conn.effectiveType === '3g'));
        }
        // Fallback: If mobile-like touch support exists but no connection API,
        // or for older browsers, we can't reliably know, so default to carousel for safe-load.
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };

    const metered = isMetered();

    projects.forEach(media => {
        const detailUrl = media.dataset.detail;
        if (!detailUrl) return; // Static image only, no carousel logic

        const detailImg = media.querySelector('.project-detail-img');

        if (metered) {
            media.classList.add('carousel-mode');
            setupCarousel(media, detailImg, detailUrl);
        } else {
            // Standard lazy load
            lazyLoadImage(media, detailImg, detailUrl);
        }
    });

    function lazyLoadImage(container, img, url) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(container, img, url);
                    observer.unobserve(container);
                }
            });
        }, { rootMargin: '200px' });

        observer.observe(container);
    }

    function loadImage(container, img, url) {
        if (img.getAttribute('src')) return;

        container.classList.add('loading');
        img.src = url;
        img.onload = () => {
            container.classList.remove('loading');
            img.classList.add('loaded');
            container.classList.add('detail-active');
        };
    }

    function setupCarousel(container, img, url) {
        const nextBtn = container.querySelector('.carousel-btn.next');
        const prevBtn = container.querySelector('.carousel-btn.prev');
        let detailLoaded = false;

        const toggleDetail = () => {
            if (!detailLoaded) {
                loadImage(container, img, url);
                detailLoaded = true;
            } else {
                img.classList.toggle('loaded');
            }
        };

        // Click listeners
        [nextBtn, prevBtn].forEach(el => {
            if (el) el.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDetail();
            });
        });

        // Swipe detection
        let touchStartX = 0;
        let touchEndX = 0;

        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const threshold = 50;
            if (Math.abs(touchEndX - touchStartX) > threshold) {
                toggleDetail();
            }
        }
    }
});