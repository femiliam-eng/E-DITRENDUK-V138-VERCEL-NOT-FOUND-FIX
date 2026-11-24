/* API client E-DITRENDUK. Tetap terpisah dari UI agar mudah diganti saat deployment/mobile app. */
const API = (() => {
    const isBackendOrigin = location.port === '3000';
    const base = (location.protocol==='http:' || location.protocol==='https:') && location.port !== '5500' && location.port !== '5501' ? '' : 'http://localhost:3000';

    async function request(path, options = {}) {
        window.dispatchEvent(new CustomEvent('editrenduk:request-start', { detail: { path } }));
        let response;
        try {
        response = await fetch(base + path, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options
        });
        } catch (networkError) {
            const err = new Error('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.');
            err.cause = networkError;
            throw err;
        } finally {
            window.dispatchEvent(new CustomEvent('editrenduk:request-end', { detail: { path } }));
        }
        const body = await response.json().catch(() => ({}));
        const requestId = response.headers.get('X-Request-Id') || body.requestId || '';
        if (!response.ok) {
            const err = new Error(body.message || `HTTP ${response.status}`); err.status=response.status; err.requestId=requestId;
            if(response.status===401 && !location.pathname.endsWith('/login.html')) setTimeout(()=>location.href='login.html?reason=session',0);
            throw err;
        }
        return body;
    }

    return {
        base,
        health: () => request('/api/health'),
        login: (username, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
        forgotPassword: identity => request('/api/auth/forgot-password', { method:'POST', body:JSON.stringify({identity}) }),
        logout: () => request('/api/auth/logout', { method: 'POST' }),
        me: () => request('/api/auth/me'),
        profileActivity: () => request('/api/profile/activity'),
        updateMyProfile: name => request('/api/profile', { method:'PATCH', body:JSON.stringify({name}) }),
        saveProfilePhoto: (mime,data) => request('/api/profile/photo',{method:'POST',body:JSON.stringify({mime,data})}),
        removeProfilePhoto: () => request('/api/profile/photo',{method:'DELETE'}),
        changePassword: (currentPassword,newPassword) => request('/api/auth/change-password', { method:'POST', body:JSON.stringify({currentPassword,newPassword}) }),
        bootstrap: () => request('/api/bootstrap'),
        list: resource => request(`/api/${resource}`),
        agendaAttachments: id => request(`/api/agenda/${encodeURIComponent(id)}/attachments`),
        addAgendaAttachment: (id,data) => request(`/api/agenda/${encodeURIComponent(id)}/attachments`,{method:'POST',body:JSON.stringify(data)}),
        deleteAgendaAttachment: (id,attachmentId) => request(`/api/agenda/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`,{method:'DELETE'}),
        create: (resource, data) => request(`/api/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
        update: (resource, id, data) => request(`/api/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
        remove: (resource, id) => request(`/api/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
        saveNotulen: data => request('/api/notulen', { method: 'POST', body: JSON.stringify(data) }),
        listNotulen: () => request('/api/notulen'),
        listNotulenSubmissions: () => request('/api/notulen-submissions'),
        submitNotulen: data => request('/api/notulen-submissions',{method:'POST',body:JSON.stringify(data)}),
        getNotulen: id => request(`/api/notulen/${encodeURIComponent(id)}`),
        accounts: () => request('/api/accounts'),
        createAccount: data => request('/api/accounts', { method:'POST', body:JSON.stringify(data) }),
        updateAccount: (id,data) => request(`/api/accounts/${encodeURIComponent(id)}`, { method:'PATCH', body:JSON.stringify(data) }),
        resetPassword: (id,password) => request(`/api/accounts/${encodeURIComponent(id)}/reset-password`, { method:'POST', body:JSON.stringify({password}) }),
        passwordResetRequests: () => request('/api/password-reset-requests'),
        resolvePasswordReset: (id,password) => request(`/api/password-reset-requests/${encodeURIComponent(id)}/resolve`, {method:'POST',body:JSON.stringify({password})}),
        audit: (params='') => request('/api/audit' + (params ? `?${params}` : '')),
        diagnostics: () => request('/api/admin/diagnostics'),
        storageStatus: () => request('/api/storage')
    };
})();

// Make the API client accessible to layout and dashboard modules.
window.API = API;
