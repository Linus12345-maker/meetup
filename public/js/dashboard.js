let rsvpCount = 0;
let hostingCount = 0;

function switchTab(tab, btn) {
    document.getElementById('attending-tab').classList.toggle('hidden', tab !== 'attending');
    document.getElementById('hosting-tab').classList.toggle('hidden', tab !== 'hosting');
    
    // reset both tabs style
    const btnAttending = document.getElementById('btn-attending');
    const textAttending = document.getElementById('text-attending');
    const iconAttending = document.getElementById('icon-attending');
    
    const btnHosting = document.getElementById('btn-hosting');
    const textHosting = document.getElementById('text-hosting');
    const iconHosting = document.getElementById('icon-hosting');

    // reset attending
    btnAttending.className = 'flex items-center gap-2 pb-4 -mb-4 border-b-2 border-transparent transition-colors group';
    textAttending.className = `text-lg font-medium font-['DM_Sans'] text-[#5A5C5B] group-hover:text-[#2D2F2E] transition-colors`;
    iconAttending.className = `ph-fill ph-calendar-check text-[#5A5C5B] group-hover:text-[#2D2F2E] transition-colors`;
    
    // reset hosting
    btnHosting.className = 'flex items-center gap-2 pb-4 -mb-4 border-b-2 border-transparent transition-colors group';
    textHosting.className = `text-lg font-medium font-['DM_Sans'] text-[#5A5C5B] group-hover:text-[#2D2F2E] transition-colors`;
    iconHosting.className = `ph-fill ph-ticket text-[#5A5C5B] group-hover:text-[#2D2F2E] transition-colors`;
    
    // set active tab style
    if (tab === 'attending') {
        btnAttending.className = 'flex items-center gap-2 pb-4 -mb-4 border-b-2 border-[#E8614A] transition-colors';
        textAttending.className = `text-lg font-bold font-['DM_Sans'] text-[#E8614A]`;
        iconAttending.className = `ph-fill ph-calendar-check text-[#E8614A]`;
    } else {
        btnHosting.className = 'flex items-center gap-2 pb-4 -mb-4 border-b-2 border-[#E8614A] transition-colors';
        textHosting.className = `text-lg font-bold font-['DM_Sans'] text-[#E8614A]`;
        iconHosting.className = `ph-fill ph-ticket text-[#E8614A]`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to complete
    const checkAuth = setInterval(async () => {
        // Clerk v5 uses .loaded, v4 often had .isReady
        const isClerkReady = window.Clerk && (window.Clerk.loaded || (typeof window.Clerk.isReady === 'function' && window.Clerk.isReady()));
        
        if (isClerkReady) {
            clearInterval(checkAuth);
            if (!window.Clerk.user) {
                window.location.href = '/';
                return;
            }
            // Set user greeting
            const greeting = document.getElementById('greeting-title');
            if (greeting) {
                greeting.textContent = `Hello, ${window.Clerk.user.firstName || window.Clerk.user.fullName || 'User'} 👋`;
            }
            loadDashboard();
        }
    }, 100);
});

async function loadDashboard() {
    try {
        if (!window.Clerk.session) throw new Error('No active session');
        const token = await window.Clerk.session.getToken();
        // Clear loading state
        const attendingGrid = document.getElementById('attending-grid');
        const hostingGrid = document.getElementById('hosting-grid');
        
        const res = await fetch(`/api/users/${window.Clerk.user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load dashboard data');
        const data = await res.json();
        
        const hostedEvents = data.hostedEvents || [];
        hostingCount = hostedEvents.length;
        document.getElementById('text-hosting').innerText = `Hosting (${hostingCount})`;
        
        const attendingEvents = (data.rsvps || []).map(r => r.event).filter(e => e); 
        rsvpCount = attendingEvents.length;
        document.getElementById('text-attending').innerText = `RSVPs (${rsvpCount})`;
        
        renderGrid('hosting-grid', hostedEvents, 'hosting');
        renderGrid('attending-grid', attendingEvents, 'attending');
    } catch (e) {
        console.error(e);
        document.getElementById('attending-grid').innerHTML = '<div class="col-span-full py-10 text-center text-red-500 bg-white rounded-2xl border border-red-100 font-medium">Failed to load dashboard. Please try refreshing the page.</div>';
    }
}

function renderGrid(containerId, events, type) {
    const container = document.getElementById(containerId);
    if (!events.length) {
        container.innerHTML = `
            <div class="col-span-full text-center py-24 bg-white rounded-2xl shadow-[0_4px_20px_rgba(45,47,46,0.04)] border border-[#EBEBEA] flex flex-col items-center justify-center">
                <div class="w-16 h-16 bg-[#F3F4ED] rounded-full flex items-center justify-center mb-6">
                    <i class="ph ph-calendar-blank text-3xl text-[#5A5C5B]"></i>
                </div>
                <h3 class="text-xl font-bold text-[#2D2F2E] mb-2">No ${type === 'hosting' ? 'events hosted' : 'RSVPs'} yet</h3>
                <p class="text-[#5A5C5B] mb-8 max-w-xs">Start by ${type === 'hosting' ? 'creating your own meetup' : 'exploring local events in San Francisco'}.</p>
                <a href="${type === 'hosting' ? '/create.html' : '/'}" class="bg-coral text-white font-bold px-8 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity">
                    ${type === 'hosting' ? 'Host an event' : 'Find events'}
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(event => {
        const d = new Date(event.dateTime);
        const month = d.toLocaleString('en-US', { month: 'short' });
        const day = d.getDate();
        const fullDateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        return `
        <div class="bg-white rounded-[24px] p-4 flex flex-col gap-5 shadow-[0_20px_40px_0_rgba(45,47,46,0.06)] hover:shadow-md transition-all hover:-translate-y-1 block h-full group">
            <a href="/event.html?id=${event.id}" class="relative h-[200px] w-full rounded-2xl overflow-hidden shrink-0 block">
                <img src="${event.coverImageUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80'}" class="absolute inset-0 w-full h-full object-cover">
                <div class="absolute top-4 left-4 bg-white/95 backdrop-blur-md w-12 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                    <span class="text-[10px] font-bold text-[#E8614A] leading-tight uppercase font-display">${month}</span>
                    <span class="text-xl font-extrabold text-[#2D2F2E] leading-tight font-display">${day}</span>
                </div>
            </a>
            <div class="flex flex-col gap-3 flex-1">
                <a href="/event.html?id=${event.id}" class="flex flex-col gap-1">
                    <div class="text-[#a73220] font-bold text-[12px]">${fullDateStr}</div>
                    <h3 class="text-[#2d2f2e] font-bold text-[18px] leading-[22px] line-clamp-2">${event.title}</h3>
                    <div class="flex items-center gap-1.5 text-[#5a5c5b] text-[13px] font-medium mt-1">
                        <i class="ph ph-map-pin"></i>
                        <span class="truncate">${event.locationName || 'Location Not Set'}</span>
                    </div>
                </a>
                
                <div class="border-t border-[#f0f1ef] pt-4 mt-auto flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 bg-coral/10 rounded-full flex items-center justify-center text-coral text-[10px] font-bold">
                                ${event.host?.name?.charAt(0) || 'H'}
                            </div>
                            <span class="text-[13px] font-medium text-[#5a5c5b]">by ${event.host?.name || 'You'}</span>
                        </div>
                        <div class="bg-[#d996fe]/10 px-2 py-1 rounded-md">
                            <span class="text-[#7d40a1] font-bold text-[11px]">${event.rsvps ? event.rsvps.length : 0} going</span>
                        </div>
                    </div>
                    
                    ${type === 'hosting' ? `
                        <div class="flex gap-2 mt-1">
                            <a href="/event.html?id=${event.id}" class="flex-1 bg-filterBg text-textDark text-center py-2 rounded-xl text-sm font-bold hover:bg-borderLight transition-colors">Details</a>
                            <button onclick="alert('Editing functionality coming soon!')" class="flex-1 bg-coral/10 text-coral py-2 rounded-xl text-sm font-bold hover:bg-coral/20 transition-colors">Edit</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
    }).join('');
}
