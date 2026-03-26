document.addEventListener('DOMContentLoaded', () => {
    // Wait for Clerk
    setTimeout(() => {
        if (!window.Clerk?.user) {
            window.location.href = '/';
        }
    }, 1000);

    const uploadWidgetParams = {
        cloudName: 'dudh627hx',
        uploadPreset: 'ml_default',
        sources: ['local', 'camera', 'url'],
        multiple: false
    };

    const uploadWidgetBtn = document.getElementById('uploadWidget');
    if (uploadWidgetBtn && window.cloudinary) {
        const widget = cloudinary.createUploadWidget(uploadWidgetParams, (error, result) => {
            if (!error && result && result.event === "success") {
                document.getElementById('coverImageUrl').value = result.info.secure_url;
                const preview = document.getElementById('imagePreview');
                preview.src = result.info.secure_url;
                preview.classList.remove('hidden');
                uploadWidgetBtn.classList.add('hidden');
            }
        });
        uploadWidgetBtn.addEventListener('click', () => widget.open());
    }

    const form = document.getElementById('createForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Publishing...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Map capacity to maxAttendees as expected by backend
        if (data.capacity) {
            data.maxAttendees = parseInt(data.capacity);
            delete data.capacity;
        }

        // Checkbox value handling
        data.isPrivate = !!data.isPrivate;

        try {
            if (!window.Clerk.session) throw new Error('Not logged in');
            const token = await window.Clerk.session.getToken();
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Failed to create event');
            
            const event = await res.json();
            window.location.href = `/event.html?id=${event.id}`;
        } catch (error) {
            console.error(error);
            alert('Failed to create meetup.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Publish Meetup';
        }
    });
});
