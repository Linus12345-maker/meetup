document.addEventListener('DOMContentLoaded', () => {
    // Scroll to filters
    const exploreBtn = document.getElementById('explore-btn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            document.getElementById('category-filters').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Scroll to how it works
    const howItWorksBtn = document.getElementById('how-it-works-btn');
    if (howItWorksBtn) {
        howItWorksBtn.addEventListener('click', () => {
            const el = document.getElementById('how-it-works');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            fetchEvents(e.target.value);
        }, 500));
    }

    // Wait for Clerk to load to refresh events with Auth (to see private events)
    const checkClerk = setInterval(() => {
        const isClerkReady = window.Clerk && (window.Clerk.loaded || (typeof window.Clerk.isReady === 'function' && window.Clerk.isReady()));
        if (isClerkReady) {
            clearInterval(checkClerk);
            fetchEvents(searchInput?.value || '');
        }
    }, 100);

    // Initial fetch
    fetchEvents();
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function fetchEvents(query = '') {
    const grid = document.getElementById('events-grid');
    const emptyState = document.getElementById('empty-state');
    
    try {
        const headers = {};
        if (window.Clerk && window.Clerk.session) {
            const token = await window.Clerk.session.getToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/events${query ? '?search=' + encodeURIComponent(query) : ''}`, { headers });
        const data = await res.json();
        
        if (!data.length) {
            grid.innerHTML = '';
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            return;
        }

        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
        grid.classList.remove('hidden');
        
        grid.innerHTML = data.map(event => {
            const dateObj = new Date(event.dateTime);
            const formattedDateTime = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            return `
            <a href="/event.html?id=${event.id}" class="bg-white rounded-[24px] p-4 flex flex-col gap-6 shadow-[0_20px_40px_0_rgba(45,47,46,0.06)] hover:shadow-[0_20px_40px_0_rgba(45,47,46,0.1)] transition-all hover:-translate-y-1 block font-display">
                <div class="relative h-[224px] w-full rounded-2xl overflow-hidden shrink-0">
                    <img src="${event.coverImageUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80'}" alt="${event.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105">
                    <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[#a73220] text-[12px] font-bold tracking-[0.6px] uppercase">
                        ${event.category?.name || 'Event'}
                    </div>
                    <button class="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white text-textDark transition-colors shadow-sm" onclick="event.preventDefault();">
                        <i class="ph ph-heart text-[20px]"></i>
                    </button>
                </div>
                <div class="flex flex-col gap-4 flex-1">
                    <div class="flex flex-col gap-1">
                        <div class="text-[#a73220] font-bold text-[12px] truncate">
                            ${formattedDateTime}
                        </div>
                        <h3 class="text-[#2d2f2e] font-bold text-[20px] leading-[25px] line-clamp-2">${event.title}</h3>
                        <div class="flex items-center gap-1.5 text-[#5a5c5b] font-medium text-[14px] mt-1">
                            <i class="ph ph-map-pin"></i>
                            <span class="truncate">${event.locationName || 'San Francisco, CA'}</span>
                        </div>
                    </div>
                    
                    <div class="border-t border-[#f0f1ef] pt-[17px] mt-auto flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <img src="${event.host?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + event.hostId}" class="w-8 h-8 rounded-full object-cover">
                            <p class="text-[14px] text-[#5a5c5b]">
                                Hosted by <span class="font-semibold text-[#2d2f2e]">${event.host?.name || 'User'}</span>
                            </p>
                        </div>
                        <div class="bg-[#d996fe]/20 px-[8px] py-[4px] rounded-[6px]">
                            <span class="text-[#7d40a1] font-bold text-[12px]">${event.rsvps?.length || 0} going</span>
                        </div>
                    </div>
                </div>
            </a>
        `}).join('');
    } catch (error) {
        console.error('Error fetching events:', error);
        grid.innerHTML = '<div class="col-span-full text-center text-red-500 py-10">Failed to load events. Please try again later.</div>';
    }
}
